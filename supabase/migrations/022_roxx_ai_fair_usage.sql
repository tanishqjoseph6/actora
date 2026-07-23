-- 022_roxx_ai_fair_usage.sql
-- Roxx AI continuous session limits, cooldowns, and admin-configurable plan caps.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Admin-configurable limits per plan (defaults seeded below)
-- continuous_limit_seconds NULL = unlimited continuous usage
-- ---------------------------------------------------------------------------
create table if not exists public.roxx_ai_fair_usage_config (
  plan_id text primary key,
  continuous_limit_seconds integer check (
    continuous_limit_seconds is null or continuous_limit_seconds > 0
  ),
  cooldown_seconds integer not null default 0 check (cooldown_seconds >= 0),
  inactivity_reset_seconds integer not null default 600 check (inactivity_reset_seconds > 0),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.roxx_ai_fair_usage_config (
  plan_id,
  continuous_limit_seconds,
  cooldown_seconds,
  inactivity_reset_seconds,
  enabled
)
values
  ('free', 900, 1200, 600, true),
  ('trial', 900, 1200, 600, true),
  ('pro', 2700, 600, 600, true),
  ('starter', null, 0, 600, true),
  ('enterprise', null, 0, 600, true)
on conflict (plan_id) do nothing;

-- ---------------------------------------------------------------------------
-- Live session state (one row per user — enforced server-side)
-- ---------------------------------------------------------------------------
create table if not exists public.roxx_ai_sessions (
  user_id text primary key,
  session_started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  cooldown_until timestamptz,
  message_count integer not null default 0 check (message_count >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  last_model text,
  plan_id text not null default 'free',
  updated_at timestamptz not null default now()
);

create index if not exists roxx_ai_sessions_cooldown_idx
  on public.roxx_ai_sessions (cooldown_until)
  where cooldown_until is not null;

-- ---------------------------------------------------------------------------
-- Completed session history
-- ---------------------------------------------------------------------------
create table if not exists public.roxx_ai_session_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_started_at timestamptz not null,
  session_ended_at timestamptz not null,
  end_reason text not null check (
    end_reason in ('limit_reached', 'inactivity_reset', 'cooldown_started')
  ),
  continuous_seconds_used integer not null default 0 check (continuous_seconds_used >= 0),
  message_count integer not null default 0 check (message_count >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  last_model text,
  plan_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists roxx_ai_session_history_user_created_idx
  on public.roxx_ai_session_history (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Cooldown audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.roxx_ai_cooldown_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  started_at timestamptz not null,
  ends_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds > 0),
  plan_id text not null,
  trigger_reason text not null default 'continuous_limit',
  session_message_count integer not null default 0 check (session_message_count >= 0),
  session_tokens integer not null default 0 check (session_tokens >= 0),
  last_model text,
  created_at timestamptz not null default now()
);

create index if not exists roxx_ai_cooldown_history_user_created_idx
  on public.roxx_ai_cooldown_history (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — service role writes; users may read own rows
-- ---------------------------------------------------------------------------
alter table public.roxx_ai_fair_usage_config enable row level security;
alter table public.roxx_ai_sessions enable row level security;
alter table public.roxx_ai_session_history enable row level security;
alter table public.roxx_ai_cooldown_history enable row level security;

drop policy if exists "Anyone can read fair usage config" on public.roxx_ai_fair_usage_config;
create policy "Anyone can read fair usage config"
  on public.roxx_ai_fair_usage_config
  for select
  using (true);

drop policy if exists "Users can read own roxx session" on public.roxx_ai_sessions;
create policy "Users can read own roxx session"
  on public.roxx_ai_sessions
  for select
  using (auth.jwt() ->> 'email' = user_id);

drop policy if exists "Users can read own roxx session history" on public.roxx_ai_session_history;
create policy "Users can read own roxx session history"
  on public.roxx_ai_session_history
  for select
  using (auth.jwt() ->> 'email' = user_id);

drop policy if exists "Users can read own roxx cooldown history" on public.roxx_ai_cooldown_history;
create policy "Users can read own roxx cooldown history"
  on public.roxx_ai_cooldown_history
  for select
  using (auth.jwt() ->> 'email' = user_id);

grant select on public.roxx_ai_fair_usage_config to authenticated, service_role;
grant select, insert, update, delete on public.roxx_ai_sessions to service_role;
grant select, insert on public.roxx_ai_session_history to service_role;
grant select, insert on public.roxx_ai_cooldown_history to service_role;
grant select on public.roxx_ai_sessions to authenticated;
grant select on public.roxx_ai_session_history to authenticated;
grant select on public.roxx_ai_cooldown_history to authenticated;
