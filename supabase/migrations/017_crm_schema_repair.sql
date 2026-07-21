-- Repair CRM schema on databases that only ran 003_dashboard_data.sql
-- Idempotent: safe to re-run

-- Companies (required before crm_contacts.company_id FK)
create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  industry text not null default '',
  size text not null default 'smb'
    check (size in ('startup', 'smb', 'enterprise')),
  status text not null default 'active'
    check (status in ('active', 'prospect', 'churned')),
  website text not null default '',
  address text not null default '',
  notes text not null default '',
  revenue bigint not null default 0,
  employee_count integer not null default 0,
  owner text not null default '',
  ai_score integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.crm_contacts
  add column if not exists company_id uuid references public.crm_companies (id) on delete set null;

alter table public.crm_contacts
  add column if not exists phone text not null default '';

alter table public.crm_contacts
  add column if not exists title text not null default '';

alter table public.crm_contacts
  add column if not exists owner text not null default '';

alter table public.crm_contacts
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_crm_contacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists crm_contacts_set_updated_at on public.crm_contacts;
create trigger crm_contacts_set_updated_at
  before update on public.crm_contacts
  for each row
  execute function public.set_crm_contacts_updated_at();

alter table public.crm_contacts enable row level security;

grant select, insert, update, delete on public.crm_contacts to service_role;
grant select, insert, update, delete on public.crm_companies to service_role;

drop policy if exists crm_contacts_service_role_all on public.crm_contacts;
create policy crm_contacts_service_role_all
  on public.crm_contacts for all to service_role
  using (true) with check (true);

drop policy if exists crm_companies_service_role_all on public.crm_companies;
create policy crm_companies_service_role_all
  on public.crm_companies for all to service_role
  using (true) with check (true);
