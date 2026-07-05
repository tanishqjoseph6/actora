-- Dashboard stats: usage, CRM contacts, meetings
-- Idempotent: safe to re-run

-- ---------------------------------------------------------------------------
-- user_usage (AI actions & replies per billing period)
-- ---------------------------------------------------------------------------
create table if not exists public.user_usage (
  user_id text primary key,
  ai_actions_used integer not null default 0,
  ai_replies_count integer not null default 0,
  period_start date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- crm_contacts (per-user contact records for dashboard + CRM)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  email text,
  company_name text,
  status text not null default 'active'
    check (status in ('active', 'lead', 'inactive')),
  ai_lead_score integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists crm_contacts_user_id_idx on public.crm_contacts (user_id);

-- ---------------------------------------------------------------------------
-- meetings (per-user calendar events)
-- ---------------------------------------------------------------------------
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists meetings_user_id_idx on public.meetings (user_id);
create index if not exists meetings_starts_at_idx on public.meetings (starts_at);

alter table public.user_usage enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.meetings enable row level security;

grant select, insert, update, delete on public.user_usage to service_role;
grant select, insert, update, delete on public.crm_contacts to service_role;
grant select, insert, update, delete on public.meetings to service_role;
