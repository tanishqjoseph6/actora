-- 018_ai_credits.sql
-- AI Credits allotment, billing-cycle tracking, and usage ledger.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Extend user_usage with credit / cycle fields
-- ai_actions_used remains the consumed-credit counter (1 credit per AI call by default).
-- ---------------------------------------------------------------------------
alter table public.user_usage
  add column if not exists ai_credits_allotment integer not null default 100
    check (ai_credits_allotment >= 0);

alter table public.user_usage
  add column if not exists period_end timestamptz;

alter table public.user_usage
  add column if not exists cycle_key text;

comment on column public.user_usage.ai_actions_used is
  'AI credits consumed in the current billing cycle';
comment on column public.user_usage.ai_credits_allotment is
  'Credit allotment for the current billing cycle (snapshot of plan limit)';
comment on column public.user_usage.cycle_key is
  'Stable key for the current cycle (e.g. trial:ISO or sub:periodEnd) used to detect resets';

-- ---------------------------------------------------------------------------
-- AI credit ledger — immutable usage history
-- ---------------------------------------------------------------------------
create table if not exists public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  feature text not null,
  credits integer not null check (credits > 0),
  balance_after integer not null check (balance_after >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_credit_ledger_user_created_idx
  on public.ai_credit_ledger (user_id, created_at desc);

create index if not exists ai_credit_ledger_feature_idx
  on public.ai_credit_ledger (feature);

alter table public.ai_credit_ledger enable row level security;

drop policy if exists "Users can read own ai credit ledger" on public.ai_credit_ledger;
create policy "Users can read own ai credit ledger"
  on public.ai_credit_ledger
  for select
  using (auth.jwt() ->> 'email' = user_id);

grant select, insert on public.ai_credit_ledger to service_role;
grant select on public.ai_credit_ledger to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic consume helper (service role)
-- Returns rows affected; application retries / checks remaining.
-- ---------------------------------------------------------------------------
create or replace function public.consume_ai_credits(
  p_user_id text,
  p_credits integer,
  p_allotment integer,
  p_cycle_key text,
  p_period_start date,
  p_period_end timestamptz
)
returns table (
  ai_actions_used integer,
  ai_credits_allotment integer,
  period_start date,
  period_end timestamptz,
  cycle_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_usage%rowtype;
begin
  if p_credits is null or p_credits < 1 then
    raise exception 'credits must be >= 1';
  end if;

  insert into public.user_usage as u (
    user_id,
    ai_actions_used,
    ai_replies_count,
    ai_credits_allotment,
    period_start,
    period_end,
    cycle_key,
    updated_at
  )
  values (
    p_user_id,
    0,
    0,
    greatest(p_allotment, 0),
    p_period_start,
    p_period_end,
    p_cycle_key,
    now()
  )
  on conflict (user_id) do nothing;

  select * into v_row
  from public.user_usage
  where user_id = p_user_id
  for update;

  -- Reset if billing cycle changed
  if v_row.cycle_key is distinct from p_cycle_key then
    update public.user_usage
    set
      ai_actions_used = 0,
      ai_replies_count = 0,
      ai_credits_allotment = greatest(p_allotment, 0),
      period_start = p_period_start,
      period_end = p_period_end,
      cycle_key = p_cycle_key,
      updated_at = now()
    where user_id = p_user_id
    returning * into v_row;
  end if;

  if v_row.ai_actions_used + p_credits > v_row.ai_credits_allotment
     and v_row.ai_credits_allotment < 2147483647 then
    -- Not enough credits
    return;
  end if;

  update public.user_usage
  set
    ai_actions_used = ai_actions_used + p_credits,
    ai_credits_allotment = greatest(p_allotment, ai_credits_allotment),
    period_end = coalesce(p_period_end, period_end),
    updated_at = now()
  where user_id = p_user_id
  returning
    user_usage.ai_actions_used,
    user_usage.ai_credits_allotment,
    user_usage.period_start,
    user_usage.period_end,
    user_usage.cycle_key
  into
    ai_actions_used,
    ai_credits_allotment,
    period_start,
    period_end,
    cycle_key;

  return next;
end;
$$;

grant execute on function public.consume_ai_credits(text, integer, integer, text, date, timestamptz)
  to service_role;
