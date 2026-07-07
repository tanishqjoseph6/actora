-- tasks (per-user task records)
-- Idempotent: safe to re-run

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  description text not null default '',
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  due_date timestamptz not null default now(),
  assignee text not null default '',
  company_name text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_status_idx on public.tasks (status);

create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute function public.set_tasks_updated_at();

alter table public.tasks enable row level security;

grant select, insert, update, delete on public.tasks to service_role;
