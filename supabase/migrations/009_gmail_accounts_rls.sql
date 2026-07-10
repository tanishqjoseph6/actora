-- gmail_accounts: RLS policies for service_role writes
-- Idempotent: safe to re-run

grant usage on schema public to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on public.gmail_accounts to service_role;

drop policy if exists gmail_accounts_service_role_all on public.gmail_accounts;
create policy gmail_accounts_service_role_all
  on public.gmail_accounts
  for all
  to service_role
  using (true)
  with check (true);
