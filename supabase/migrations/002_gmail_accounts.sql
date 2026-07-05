-- Gmail account connections — Supabase migration
-- Run in Supabase Dashboard → SQL Editor
-- Idempotent: safe to re-run

create table if not exists public.gmail_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_sync_count integer not null default 0,
  constraint gmail_accounts_user_email_key unique (user_id, email)
);

create index if not exists gmail_accounts_user_id_idx
  on public.gmail_accounts (user_id);

create index if not exists gmail_accounts_email_idx
  on public.gmail_accounts (email);

alter table public.gmail_accounts enable row level security;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on public.gmail_accounts to service_role;
