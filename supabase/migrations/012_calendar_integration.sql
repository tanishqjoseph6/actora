-- Google Calendar + multi-provider calendar foundation
-- Idempotent: safe to re-run on fresh or existing databases.
-- Compatible with Gmail (user_id is text, same as gmail_accounts / crm_contacts).
-- Note: user_id is intentionally text (NextAuth email), not a FK to auth.users.

-- ---------------------------------------------------------------------------
-- calendar_accounts (provider-agnostic connection registry)
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null default 'google'
    check (provider in ('google', 'outlook', 'apple', 'zoom')),
  account_email text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_sync_count integer not null default 0,
  status text not null default 'connected'
    check (status in ('connected', 'error', 'disconnected')),
  metadata jsonb not null default '{}'::jsonb,
  constraint calendar_accounts_user_provider_email_key
    unique (user_id, provider, account_email)
);

create index if not exists calendar_accounts_user_id_idx
  on public.calendar_accounts (user_id);

alter table public.calendar_accounts enable row level security;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on public.calendar_accounts to service_role;

drop policy if exists calendar_accounts_service_role_all on public.calendar_accounts;
create policy calendar_accounts_service_role_all
  on public.calendar_accounts
  for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- meetings (create full table if missing; extend if it already exists)
-- ---------------------------------------------------------------------------
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  -- Calendar / sync fields (present on fresh installs)
  description text,
  location text,
  meeting_link text,
  attendees jsonb not null default '[]'::jsonb,
  provider text,
  external_id text,
  source text not null default 'manual',
  contact_email text,
  all_day boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Extend legacy meetings tables that only had the base columns
do $$
begin
  if to_regclass('public.meetings') is not null then
    alter table public.meetings
      add column if not exists description text,
      add column if not exists location text,
      add column if not exists meeting_link text,
      add column if not exists attendees jsonb,
      add column if not exists provider text,
      add column if not exists external_id text,
      add column if not exists source text,
      add column if not exists contact_email text,
      add column if not exists all_day boolean,
      add column if not exists updated_at timestamptz;
  end if;
end $$;

-- Backfill defaults for any newly added nullable columns on legacy tables
update public.meetings
set attendees = '[]'::jsonb
where attendees is null;

update public.meetings
set source = 'manual'
where source is null;

update public.meetings
set all_day = false
where all_day is null;

update public.meetings
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.meetings
  alter column attendees set default '[]'::jsonb,
  alter column source set default 'manual',
  alter column all_day set default false,
  alter column updated_at set default now();

-- Enforce NOT NULL after backfill (idempotent)
do $$
begin
  alter table public.meetings alter column attendees set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.meetings alter column source set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.meetings alter column all_day set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.meetings alter column updated_at set not null;
exception
  when others then null;
end $$;

-- Status check (legacy tables from 003 already have this inline)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meetings_status_check'
      and conrelid = 'public.meetings'::regclass
  ) then
    alter table public.meetings
      add constraint meetings_status_check
      check (status in ('scheduled', 'completed', 'cancelled'));
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meetings_source_check'
      and conrelid = 'public.meetings'::regclass
  ) then
    alter table public.meetings
      add constraint meetings_source_check
      check (source in ('manual', 'google', 'ai', 'task', 'follow_up', 'outlook', 'apple'));
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meetings_user_provider_external_key'
      and conrelid = 'public.meetings'::regclass
  ) then
    alter table public.meetings
      add constraint meetings_user_provider_external_key
      unique (user_id, provider, external_id);
  end if;
exception
  when duplicate_object then null;
end $$;

create index if not exists meetings_user_id_idx
  on public.meetings (user_id);

create index if not exists meetings_starts_at_idx
  on public.meetings (starts_at);

create index if not exists meetings_contact_email_idx
  on public.meetings (user_id, contact_email)
  where contact_email is not null;

create index if not exists meetings_provider_external_id_idx
  on public.meetings (provider, external_id)
  where external_id is not null;

alter table public.meetings enable row level security;

grant select, insert, update, delete on public.meetings to service_role;

drop policy if exists meetings_service_role_all on public.meetings;
create policy meetings_service_role_all
  on public.meetings
  for all
  to service_role
  using (true)
  with check (true);
