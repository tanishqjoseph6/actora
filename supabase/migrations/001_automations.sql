-- Actora Automation Engine — Supabase migration
-- Run in Supabase Dashboard → SQL Editor (new project)
-- Idempotent: safe to re-run

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- workflows
-- ---------------------------------------------------------------------------
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null default 'Untitled Automation',
  description text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused')),
  nodes jsonb not null default '[]'::jsonb,
  connections jsonb not null default '[]'::jsonb,
  trigger_block_id text,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists workflows_user_id_idx on public.workflows (user_id);
create index if not exists workflows_status_idx on public.workflows (status);
create index if not exists workflows_updated_at_idx on public.workflows (updated_at desc);

-- ---------------------------------------------------------------------------
-- workflow_versions (version history)
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  version integer not null,
  name text not null,
  description text not null default '',
  status text not null,
  nodes jsonb not null default '[]'::jsonb,
  connections jsonb not null default '[]'::jsonb,
  trigger_block_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null,
  change_note text,
  created_at timestamptz not null default now(),
  constraint workflow_versions_workflow_id_version_key unique (workflow_id, version)
);

create index if not exists workflow_versions_workflow_id_idx
  on public.workflow_versions (workflow_id);

create index if not exists workflow_versions_created_at_idx
  on public.workflow_versions (created_at desc);

-- ---------------------------------------------------------------------------
-- workflow_runs (execution history)
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  user_id text not null,
  workflow_name text not null,
  status text not null
    check (status in ('running', 'success', 'failed', 'skipped')),
  trigger_label text not null default '',
  is_test boolean not null default false,
  duration_ms integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists workflow_runs_workflow_id_idx on public.workflow_runs (workflow_id);
create index if not exists workflow_runs_user_id_idx on public.workflow_runs (user_id);
create index if not exists workflow_runs_started_at_idx on public.workflow_runs (started_at desc);
create index if not exists workflow_runs_is_test_idx on public.workflow_runs (is_test);

-- ---------------------------------------------------------------------------
-- workflow_run_logs (per-step execution logs)
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_run_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs (id) on delete cascade,
  step_index integer not null,
  node_id text not null,
  block_id text not null,
  label text not null,
  status text not null
    check (status in ('success', 'failed', 'skipped')),
  message text not null default '',
  output jsonb not null default '{}'::jsonb,
  duration_ms integer not null default 0,
  logged_at timestamptz not null default now()
);

create index if not exists workflow_run_logs_run_id_idx on public.workflow_run_logs (run_id);
create index if not exists workflow_run_logs_step_index_idx on public.workflow_run_logs (run_id, step_index);

-- ---------------------------------------------------------------------------
-- updated_at trigger for workflows
-- ---------------------------------------------------------------------------
create or replace function public.set_workflows_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row
  execute function public.set_workflows_updated_at();

-- ---------------------------------------------------------------------------
-- PostgREST / API access (service role bypasses RLS; anon uses policies)
-- ---------------------------------------------------------------------------
alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_run_logs enable row level security;

-- Service role key used by Next.js API bypasses RLS.
-- Optional: no policies for anon/authenticated until direct client access is needed.

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
