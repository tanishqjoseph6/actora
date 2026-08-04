-- Workspace-isolated private file storage, durable quota accounting, and audit hooks.
create table if not exists public.workspace_storage_usage (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  used_bytes bigint not null default 0 check (used_bytes >= 0),
  reserved_bytes bigint not null default 0 check (reserved_bytes >= 0),
  file_count integer not null default 0 check (file_count >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by text not null,
  name text not null check (char_length(trim(name)) between 1 and 255),
  path text not null unique,
  folder_path text not null default '/',
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes >= 0),
  checksum text,
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'failed', 'quarantined', 'deleted')),
  visibility text not null default 'private'
    check (visibility in ('private', 'shared')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists workspace_files_workspace_idx
  on public.workspace_files(workspace_id, created_at desc)
  where deleted_at is null;
create index if not exists workspace_files_folder_idx
  on public.workspace_files(workspace_id, folder_path)
  where deleted_at is null;

create table if not exists public.workspace_storage_audit (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  file_id uuid references public.workspace_files(id) on delete set null,
  actor_user_id text,
  action text not null,
  bytes bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists workspace_storage_audit_idx
  on public.workspace_storage_audit(workspace_id, created_at desc);

insert into public.workspace_permissions (id, label, description)
values ('files', 'Files', 'Upload, manage, and share workspace files')
on conflict (id) do update set label = excluded.label, description = excluded.description;

insert into public.workspace_role_permissions (role_id, permission_id, allowed)
values
  ('owner', 'files', true),
  ('admin', 'files', true),
  ('member', 'files', true),
  ('viewer', 'files', true)
on conflict (role_id, permission_id) do update set allowed = excluded.allowed;

insert into storage.buckets (id, name, public, file_size_limit)
values ('workspace-files', 'workspace-files', false, 524288000)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create or replace function public.reserve_workspace_storage(
  p_workspace_id uuid,
  p_bytes bigint,
  p_limit_bytes bigint
)
returns table(allowed boolean, used_bytes bigint, reserved_bytes bigint, total_bytes bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_used bigint;
  current_reserved bigint;
begin
  if p_bytes < 0 then
    raise exception 'Storage reservation cannot be negative';
  end if;
  insert into public.workspace_storage_usage(workspace_id)
  values (p_workspace_id)
  on conflict (workspace_id) do nothing;

  select used_bytes, reserved_bytes
    into current_used, current_reserved
    from public.workspace_storage_usage
   where workspace_id = p_workspace_id
   for update;

  if p_limit_bytes >= 0 and current_used + current_reserved + p_bytes > p_limit_bytes then
    return query select false, current_used, current_reserved, current_used + current_reserved;
    return;
  end if;

  update public.workspace_storage_usage
     set reserved_bytes = reserved_bytes + p_bytes, updated_at = now()
   where workspace_id = p_workspace_id
   returning used_bytes, reserved_bytes into current_used, current_reserved;
  return query select true, current_used, current_reserved, current_used + current_reserved;
end;
$$;

create or replace function public.finalize_workspace_storage(
  p_workspace_id uuid,
  p_reserved_bytes bigint,
  p_actual_bytes bigint,
  p_file_delta integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workspace_storage_usage
     set reserved_bytes = greatest(0, reserved_bytes - greatest(0, p_reserved_bytes)),
         used_bytes = greatest(0, used_bytes + p_actual_bytes),
         file_count = greatest(0, file_count + p_file_delta),
         updated_at = now()
   where workspace_id = p_workspace_id;
end;
$$;

create or replace function public.release_workspace_storage(
  p_workspace_id uuid,
  p_bytes bigint,
  p_file_delta integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workspace_storage_usage
     set used_bytes = greatest(0, used_bytes - greatest(0, p_bytes)),
         file_count = greatest(0, file_count - greatest(0, p_file_delta)),
         updated_at = now()
   where workspace_id = p_workspace_id;
end;
$$;

create or replace function public.release_workspace_storage_reservation(
  p_workspace_id uuid,
  p_bytes bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workspace_storage_usage
     set reserved_bytes = greatest(0, reserved_bytes - greatest(0, p_bytes)),
         updated_at = now()
   where workspace_id = p_workspace_id;
end;
$$;

alter table public.workspace_storage_usage enable row level security;
alter table public.workspace_files enable row level security;
alter table public.workspace_storage_audit enable row level security;

create policy workspace_files_member_read on public.workspace_files
  for select using (
    exists (
      select 1 from public.workspace_members m
       where m.workspace_id = workspace_files.workspace_id
         and m.user_id = auth.uid()::text
         and m.status = 'active'
    )
  );

create policy workspace_files_member_write on public.workspace_files
  for all using (
    exists (
      select 1 from public.workspace_members m
       where m.workspace_id = workspace_files.workspace_id
         and m.user_id = auth.uid()::text
         and m.status = 'active'
         and m.role_id in ('owner', 'admin', 'member')
    )
  );

create policy storage_objects_workspace_read on storage.objects
  for select using (
    bucket_id = 'workspace-files'
    and exists (
      select 1 from public.workspace_members m
       where m.workspace_id::text = (storage.foldername(name))[1]
         and m.user_id = auth.uid()::text
         and m.status = 'active'
    )
  );

create policy storage_objects_workspace_write on storage.objects
  for all using (
    bucket_id = 'workspace-files'
    and exists (
      select 1 from public.workspace_members m
       where m.workspace_id::text = (storage.foldername(name))[1]
         and m.user_id = auth.uid()::text
         and m.status = 'active'
         and m.role_id in ('owner', 'admin', 'member')
    )
  ) with check (
    bucket_id = 'workspace-files'
    and exists (
      select 1 from public.workspace_members m
       where m.workspace_id::text = (storage.foldername(name))[1]
         and m.user_id = auth.uid()::text
         and m.status = 'active'
         and m.role_id in ('owner', 'admin', 'member')
    )
  );

grant execute on function public.reserve_workspace_storage(uuid, bigint, bigint) to service_role;
grant execute on function public.finalize_workspace_storage(uuid, bigint, bigint, integer) to service_role;
grant execute on function public.release_workspace_storage(uuid, bigint, integer) to service_role;
grant execute on function public.release_workspace_storage_reservation(uuid, bigint) to service_role;
grant select, insert, update, delete on public.workspace_storage_usage, public.workspace_files, public.workspace_storage_audit to service_role;
