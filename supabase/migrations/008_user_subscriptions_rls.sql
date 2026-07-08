-- user_subscriptions: RLS policies + schema hardening
-- Idempotent: safe to re-run

-- Ensure Razorpay columns exist (re-apply 007 defensively)
alter table public.user_subscriptions
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_plan_id text;

-- Legacy installs may have used "plan" instead of "plan_id"
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_subscriptions'
      and column_name = 'plan'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_subscriptions'
      and column_name = 'plan_id'
  ) then
    alter table public.user_subscriptions rename column plan to plan_id;
  end if;
end $$;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on public.user_subscriptions to service_role;

-- service_role bypasses RLS in Supabase; policies below are for authenticated reads if ever needed.
drop policy if exists user_subscriptions_select_own on public.user_subscriptions;
create policy user_subscriptions_select_own
  on public.user_subscriptions
  for select
  to authenticated
  using (user_id = lower(auth.jwt() ->> 'email'));

drop policy if exists user_subscriptions_service_role_all on public.user_subscriptions;
create policy user_subscriptions_service_role_all
  on public.user_subscriptions
  for all
  to service_role
  using (true)
  with check (true);
