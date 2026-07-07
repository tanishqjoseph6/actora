-- user_usage — AI actions & replies per billing period
-- Run in Supabase Dashboard → SQL Editor (after 001–003 if not yet applied)
-- Idempotent: safe to re-run

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- user_usage (keyed by NextAuth email / app user_id text)
-- ---------------------------------------------------------------------------
create table if not exists public.user_usage (
  user_id text primary key,
  ai_actions_used integer not null default 0 check (ai_actions_used >= 0),
  ai_replies_count integer not null default 0 check (ai_replies_count >= 0),
  period_start date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_user_usage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_usage_set_updated_at on public.user_usage;
create trigger user_usage_set_updated_at
  before update on public.user_usage
  for each row
  execute function public.set_user_usage_updated_at();

-- ---------------------------------------------------------------------------
-- PostgREST / API access (service role bypasses RLS)
-- ---------------------------------------------------------------------------
alter table public.user_usage enable row level security;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on public.user_usage to service_role;
