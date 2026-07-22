-- 019_ai_credit_topups.sql
-- Purchased AI credit balance + purchase history.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Purchased credit pool (consumed after monthly allotment)
-- ---------------------------------------------------------------------------
alter table public.user_usage
  add column if not exists purchased_credits_remaining integer not null default 0
    check (purchased_credits_remaining >= 0);

comment on column public.user_usage.purchased_credits_remaining is
  'Top-up AI credits remaining. Consumed only after monthly cycle credits are exhausted. Survives billing-cycle resets.';

-- ---------------------------------------------------------------------------
-- Purchase history
-- ---------------------------------------------------------------------------
create table if not exists public.ai_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  pack_id text not null,
  credits integer not null check (credits > 0),
  amount integer not null check (amount > 0),
  currency text not null check (currency in ('USD', 'INR')),
  razorpay_order_id text,
  razorpay_payment_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists ai_credit_purchases_user_created_idx
  on public.ai_credit_purchases (user_id, created_at desc);

create unique index if not exists ai_credit_purchases_order_id_idx
  on public.ai_credit_purchases (razorpay_order_id)
  where razorpay_order_id is not null;

alter table public.ai_credit_purchases enable row level security;

drop policy if exists "Users can read own credit purchases" on public.ai_credit_purchases;
create policy "Users can read own credit purchases"
  on public.ai_credit_purchases
  for select
  using (auth.jwt() ->> 'email' = user_id);

grant select, insert, update on public.ai_credit_purchases to service_role;
grant select on public.ai_credit_purchases to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic top-up credit grant
-- ---------------------------------------------------------------------------
create or replace function public.add_purchased_ai_credits(
  p_user_id text,
  p_credits integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_credits is null or p_credits < 1 then
    raise exception 'credits must be >= 1';
  end if;

  insert into public.user_usage as u (
    user_id,
    ai_actions_used,
    ai_replies_count,
    ai_credits_allotment,
    purchased_credits_remaining,
    period_start,
    updated_at
  )
  values (
    p_user_id,
    0,
    0,
    100,
    p_credits,
    date_trunc('month', now())::date,
    now()
  )
  on conflict (user_id) do update
  set
    purchased_credits_remaining = public.user_usage.purchased_credits_remaining + excluded.purchased_credits_remaining,
    updated_at = now()
  returning purchased_credits_remaining into v_balance;

  return v_balance;
end;
$$;

grant execute on function public.add_purchased_ai_credits(text, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Replace consume helper: monthly first, then purchased
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
  purchased_credits_remaining integer,
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
  v_monthly_remaining integer;
  v_from_monthly integer;
  v_from_purchased integer;
begin
  if p_credits is null or p_credits < 1 then
    raise exception 'credits must be >= 1';
  end if;

  insert into public.user_usage as u (
    user_id,
    ai_actions_used,
    ai_replies_count,
    ai_credits_allotment,
    purchased_credits_remaining,
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
    0,
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

  v_monthly_remaining := greatest(v_row.ai_credits_allotment - v_row.ai_actions_used, 0);

  if v_row.ai_credits_allotment >= 2147483647 then
    -- Unlimited monthly allotment
    update public.user_usage
    set
      ai_actions_used = ai_actions_used + p_credits,
      updated_at = now()
    where user_id = p_user_id
    returning
      user_usage.ai_actions_used,
      user_usage.ai_credits_allotment,
      user_usage.purchased_credits_remaining,
      user_usage.period_start,
      user_usage.period_end,
      user_usage.cycle_key
    into
      ai_actions_used,
      ai_credits_allotment,
      purchased_credits_remaining,
      period_start,
      period_end,
      cycle_key;
    return next;
    return;
  end if;

  if v_monthly_remaining + coalesce(v_row.purchased_credits_remaining, 0) < p_credits then
    return;
  end if;

  v_from_monthly := least(v_monthly_remaining, p_credits);
  v_from_purchased := p_credits - v_from_monthly;

  update public.user_usage
  set
    ai_actions_used = ai_actions_used + v_from_monthly,
    purchased_credits_remaining = purchased_credits_remaining - v_from_purchased,
    ai_credits_allotment = greatest(p_allotment, ai_credits_allotment),
    period_end = coalesce(p_period_end, period_end),
    updated_at = now()
  where user_id = p_user_id
  returning
    user_usage.ai_actions_used,
    user_usage.ai_credits_allotment,
    user_usage.purchased_credits_remaining,
    user_usage.period_start,
    user_usage.period_end,
    user_usage.cycle_key
  into
    ai_actions_used,
    ai_credits_allotment,
    purchased_credits_remaining,
    period_start,
    period_end,
    cycle_key;

  return next;
end;
$$;

grant execute on function public.consume_ai_credits(text, integer, integer, text, date, timestamptz)
  to service_role;
