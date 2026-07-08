-- user_subscriptions: Razorpay billing metadata
-- Idempotent: safe to re-run

alter table public.user_subscriptions
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_plan_id text;

create index if not exists user_subscriptions_razorpay_subscription_id_idx
  on public.user_subscriptions (razorpay_subscription_id);

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on public.user_subscriptions to service_role;
