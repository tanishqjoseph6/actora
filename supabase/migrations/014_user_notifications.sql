-- In-app user notifications (dashboard notification center)
-- Idempotent: safe to re-run

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  category text not null,
  title text not null,
  body text not null default '',
  href text not null default '/dashboard',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_id_created_at_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_user_id_unread_idx
  on public.user_notifications (user_id, read)
  where read = false;

alter table public.user_notifications enable row level security;

grant select, insert, update, delete on public.user_notifications to service_role;

drop policy if exists user_notifications_service_role_all on public.user_notifications;
create policy user_notifications_service_role_all
  on public.user_notifications
  for all
  to service_role
  using (true)
  with check (true);
