-- 021_writing_style_profiles.sql
-- Sound Like Me: store writing-style profiles server-side only.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists public.writing_style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  -- Optional multi-tenant / future brand voice hooks
  workspace_id uuid,
  scope text not null default 'personal'
    check (scope in ('personal', 'team', 'company', 'department')),
  enabled boolean not null default false,
  -- Opaque style model — never returned to clients
  profile jsonb not null default '{}'::jsonb,
  sample_count integer not null default 0 check (sample_count >= 0),
  last_learned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scope)
);

create index if not exists writing_style_profiles_user_idx
  on public.writing_style_profiles (user_id);

create index if not exists writing_style_profiles_workspace_idx
  on public.writing_style_profiles (workspace_id)
  where workspace_id is not null;

alter table public.writing_style_profiles enable row level security;

grant select, insert, update, delete on public.writing_style_profiles to service_role;

-- Clients must not read profile contents via RLS policies.
-- No authenticated SELECT policy on profile jsonb — only service_role access.
