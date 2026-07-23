-- 023_ai_credit_usage_notifications.sql
-- Milestone tracking for AI credit usage alerts (in-app + email deduplication).
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists public.ai_credit_usage_milestones (
  user_id text not null,
  cycle_key text not null,
  milestone integer not null check (milestone in (25, 50, 75, 90, 100)),
  percent_used integer not null check (percent_used >= 0 and percent_used <= 100),
  monthly_used integer not null default 0 check (monthly_used >= 0),
  monthly_allotment integer not null default 0 check (monthly_allotment >= 0),
  in_app_sent_at timestamptz,
  email_sent_at timestamptz,
  ui_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, cycle_key, milestone)
);

create index if not exists ai_credit_usage_milestones_user_created_idx
  on public.ai_credit_usage_milestones (user_id, created_at desc);

alter table public.ai_credit_usage_milestones enable row level security;

drop policy if exists "Users can read own credit milestones" on public.ai_credit_usage_milestones;
create policy "Users can read own credit milestones"
  on public.ai_credit_usage_milestones
  for select
  using (auth.jwt() ->> 'email' = user_id);

grant select, insert, update on public.ai_credit_usage_milestones to service_role;
grant select on public.ai_credit_usage_milestones to authenticated;
