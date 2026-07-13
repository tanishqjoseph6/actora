-- 14-day free trial support for user_subscriptions
-- Idempotent: safe to re-run

-- Allow plan_id = 'trial'
alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_plan_id_check;

alter table public.user_subscriptions
  add constraint user_subscriptions_plan_id_check
  check (plan_id in ('free', 'trial', 'starter', 'pro', 'enterprise'));

-- Trial columns
alter table public.user_subscriptions
  add column if not exists is_trial boolean not null default false;

alter table public.user_subscriptions
  add column if not exists trial_started_at timestamptz;

alter table public.user_subscriptions
  add column if not exists trial_ends_at timestamptz;

alter table public.user_subscriptions
  add column if not exists trial_expired boolean not null default false;

create index if not exists user_subscriptions_trial_ends_at_idx
  on public.user_subscriptions (trial_ends_at)
  where is_trial = true and trial_expired = false;

-- Track which trial lifecycle emails have been sent (one row per user)
create table if not exists public.trial_email_log (
  user_id text not null,
  email_type text not null
    check (email_type in ('day_0', 'day_7', 'day_12', 'day_14')),
  sent_at timestamptz not null default now(),
  primary key (user_id, email_type)
);

alter table public.trial_email_log enable row level security;

grant select, insert, update, delete on public.trial_email_log to service_role;

drop policy if exists trial_email_log_service_role_all on public.trial_email_log;
create policy trial_email_log_service_role_all
  on public.trial_email_log
  for all
  to service_role
  using (true)
  with check (true);
