-- user_subscriptions — per-user plan and billing state
-- Idempotent: safe to re-run

create table if not exists public.user_subscriptions (
  user_id text primary key,
  plan_id text not null default 'free'
    check (plan_id in ('free', 'starter', 'pro', 'enterprise')),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'canceled', 'past_due')),
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly')),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_plan_id_idx on public.user_subscriptions (plan_id);

create or replace function public.set_user_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_subscriptions_set_updated_at on public.user_subscriptions;
create trigger user_subscriptions_set_updated_at
  before update on public.user_subscriptions
  for each row
  execute function public.set_user_subscriptions_updated_at();

alter table public.user_subscriptions enable row level security;

grant select, insert, update, delete on public.user_subscriptions to service_role;
