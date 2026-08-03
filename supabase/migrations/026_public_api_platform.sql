-- Public API platform: workspace-scoped API keys, delivery endpoints, and observability.
create extension if not exists "pgcrypto";

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by text not null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  key_prefix text not null,
  secret_hash text not null unique,
  permissions text[] not null default '{}',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_workspace_idx on public.api_keys(workspace_id, created_at desc);
create index if not exists api_keys_hash_active_idx on public.api_keys(secret_hash) where revoked_at is null;

create table if not exists public.api_webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by text not null,
  url text not null check (url ~ '^https://'),
  events text[] not null,
  secret_hash text not null,
  secret_hint text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists api_webhooks_workspace_idx on public.api_webhooks(workspace_id, active);

create table if not exists public.api_request_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  workspace_id uuid references public.workspaces(id) on delete set null,
  api_key_id uuid references public.api_keys(id) on delete set null,
  method text not null,
  path text not null,
  status integer not null,
  latency_ms integer not null,
  created_at timestamptz not null default now()
);
create index if not exists api_request_logs_workspace_created_idx on public.api_request_logs(workspace_id, created_at desc);

create table if not exists public.api_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.api_webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  attempt integer not null default 0,
  status text not null default 'pending' check (status in ('pending','delivered','failed')),
  response_status integer,
  response_body text,
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists api_webhook_deliveries_pending_idx on public.api_webhook_deliveries(status, next_attempt_at);

alter table public.api_keys enable row level security;
alter table public.api_webhooks enable row level security;
alter table public.api_request_logs enable row level security;
alter table public.api_webhook_deliveries enable row level security;
grant select, insert, update, delete on public.api_keys, public.api_webhooks, public.api_request_logs, public.api_webhook_deliveries to service_role;
notify pgrst, 'reload schema';
