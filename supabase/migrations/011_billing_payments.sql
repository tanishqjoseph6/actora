-- Billing payment history + Razorpay payment/order IDs on subscriptions
-- Idempotent: safe to re-run

alter table public.user_subscriptions
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_order_id text;

create unique index if not exists user_subscriptions_razorpay_payment_id_idx
  on public.user_subscriptions (razorpay_payment_id)
  where razorpay_payment_id is not null;

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  plan_id text not null
    check (plan_id in ('starter', 'pro')),
  billing_interval text not null
    check (billing_interval in ('monthly', 'yearly')),
  amount integer not null,
  currency text not null check (currency in ('USD', 'INR')),
  razorpay_payment_id text unique,
  razorpay_order_id text,
  razorpay_subscription_id text,
  status text not null default 'paid'
    check (status in ('paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists billing_payments_user_id_created_at_idx
  on public.billing_payments (user_id, created_at desc);

alter table public.billing_payments enable row level security;

grant select, insert, update, delete on public.billing_payments to service_role;

drop policy if exists billing_payments_service_role_all on public.billing_payments;
create policy billing_payments_service_role_all
  on public.billing_payments
  for all
  to service_role
  using (true)
  with check (true);
