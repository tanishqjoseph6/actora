-- Billing waitlist email collection (pre-launch)
-- Idempotent: safe to re-run

create table if not exists public.waitlist_notifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id text,
  feature text not null default 'Billing',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_notifications_email_feature_idx
  on public.waitlist_notifications (lower(email), feature);

create index if not exists waitlist_notifications_feature_created_at_idx
  on public.waitlist_notifications (feature, created_at desc);

alter table public.waitlist_notifications enable row level security;

grant select, insert, update, delete on public.waitlist_notifications to service_role;

drop policy if exists waitlist_notifications_service_role_all on public.waitlist_notifications;
create policy waitlist_notifications_service_role_all
  on public.waitlist_notifications
  for all
  to service_role
  using (true)
  with check (true);
