-- Full CRM schema: contacts, companies, deals, notes, activities, email links
-- Idempotent: safe to re-run on fresh and existing databases
-- Order: tables → indexes → functions/triggers → RLS → grants → policies

-- =============================================================================
-- 1. TABLES (create first — no policies/indexes until tables exist)
-- =============================================================================

-- Companies (no FK dependencies)
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

-- Contacts (may already exist from 003_dashboard_data; IF NOT EXISTS skips recreate)
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  email text,
  company_name text,
  company_id uuid references public.crm_companies (id) on delete set null,
  phone text not null default '',
  title text not null default '',
  owner text not null default '',
  status text not null default 'active'
    check (status in ('active', 'lead', 'inactive')),
  ai_lead_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extend existing crm_contacts (from older migrations) with new columns
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

-- Deals
create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  company_id uuid references public.crm_companies (id) on delete set null,
  contact_id uuid references public.crm_contacts (id) on delete set null,
  stage text not null default 'lead'
    check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  value numeric not null default 0,
  probability integer not null default 0,
  close_date date,
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  owner text not null default '',
  ai_score integer not null default 0,
  labels text[] not null default '{}',
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Notes
create table if not exists public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  deal_id uuid references public.crm_deals (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Activity timeline
create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  deal_id uuid references public.crm_deals (id) on delete set null,
  activity_type text not null default 'note'
    check (activity_type in ('email', 'note', 'meeting', 'deal_stage', 'call', 'task', 'deal_created')),
  title text not null default '',
  body text not null default '',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Gmail ↔ CRM links
create table if not exists public.crm_email_links (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  gmail_message_id text not null,
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  deal_id uuid references public.crm_deals (id) on delete set null,
  subject text not null default '',
  sender_email text not null default '',
  sender_name text not null default '',
  snippet text not null default '',
  linked_at timestamptz not null default now()
);

-- =============================================================================
-- 2. INDEXES (after all tables exist)
-- =============================================================================

create index if not exists crm_companies_user_id_idx
  on public.crm_companies (user_id, created_at desc);

create index if not exists crm_contacts_user_id_idx
  on public.crm_contacts (user_id);

create index if not exists crm_contacts_company_id_idx
  on public.crm_contacts (company_id);

create index if not exists crm_deals_user_id_stage_idx
  on public.crm_deals (user_id, stage);

create index if not exists crm_deals_contact_id_idx
  on public.crm_deals (contact_id);

create index if not exists crm_deals_company_id_idx
  on public.crm_deals (company_id);

create index if not exists crm_notes_contact_id_idx
  on public.crm_notes (contact_id, created_at desc);

create index if not exists crm_notes_deal_id_idx
  on public.crm_notes (deal_id);

create index if not exists crm_activities_contact_id_idx
  on public.crm_activities (contact_id, created_at desc);

create index if not exists crm_activities_deal_id_idx
  on public.crm_activities (deal_id, created_at desc);

create unique index if not exists crm_email_links_user_message_idx
  on public.crm_email_links (user_id, gmail_message_id);

create index if not exists crm_email_links_contact_id_idx
  on public.crm_email_links (contact_id, linked_at desc);

-- =============================================================================
-- 3. FUNCTIONS + TRIGGERS (idempotent)
-- =============================================================================

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

-- =============================================================================
-- 4. ROW LEVEL SECURITY (enable only after tables exist)
-- =============================================================================

alter table public.crm_contacts enable row level security;
alter table public.crm_companies enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_notes enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_email_links enable row level security;

-- =============================================================================
-- 5. GRANTS
-- =============================================================================

grant select, insert, update, delete on public.crm_contacts to service_role;
grant select, insert, update, delete on public.crm_companies to service_role;
grant select, insert, update, delete on public.crm_deals to service_role;
grant select, insert, update, delete on public.crm_notes to service_role;
grant select, insert, update, delete on public.crm_activities to service_role;
grant select, insert, update, delete on public.crm_email_links to service_role;

-- =============================================================================
-- 6. POLICIES (after tables + RLS; DROP IF EXISTS for idempotency)
-- =============================================================================

drop policy if exists crm_contacts_service_role_all on public.crm_contacts;
create policy crm_contacts_service_role_all
  on public.crm_contacts for all to service_role
  using (true) with check (true);

drop policy if exists crm_companies_service_role_all on public.crm_companies;
create policy crm_companies_service_role_all
  on public.crm_companies for all to service_role
  using (true) with check (true);

drop policy if exists crm_deals_service_role_all on public.crm_deals;
create policy crm_deals_service_role_all
  on public.crm_deals for all to service_role
  using (true) with check (true);

drop policy if exists crm_notes_service_role_all on public.crm_notes;
create policy crm_notes_service_role_all
  on public.crm_notes for all to service_role
  using (true) with check (true);

drop policy if exists crm_activities_service_role_all on public.crm_activities;
create policy crm_activities_service_role_all
  on public.crm_activities for all to service_role
  using (true) with check (true);

drop policy if exists crm_email_links_service_role_all on public.crm_email_links;
create policy crm_email_links_service_role_all
  on public.crm_email_links for all to service_role
  using (true) with check (true);
