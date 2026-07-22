-- 020_workspaces.sql
-- Multi-workspace management: workspaces, members, roles, invitations, permissions, audit.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_url text,
  icon text not null default 'spark',
  owner_user_id text not null,
  plan_id text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists workspaces_slug_unique_idx
  on public.workspaces (slug)
  where deleted_at is null;

create index if not exists workspaces_owner_idx
  on public.workspaces (owner_user_id)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- workspace_roles (canonical role definitions)
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_roles (
  id text primary key,
  label text not null,
  description text not null default '',
  rank integer not null default 0
);

insert into public.workspace_roles (id, label, description, rank) values
  ('owner', 'Owner', 'Full access including billing, deletion, and ownership transfer', 100),
  ('admin', 'Admin', 'Manage members and all product surfaces except billing ownership', 80),
  ('member', 'Member', 'Full product access for assigned day-to-day work', 40),
  ('viewer', 'Viewer', 'Read-only access across the workspace', 10)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  rank = excluded.rank;

-- ---------------------------------------------------------------------------
-- workspace_permissions (permission keys)
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_permissions (
  id text primary key,
  label text not null,
  description text not null default ''
);

insert into public.workspace_permissions (id, label, description) values
  ('billing', 'Billing', 'Manage subscription, invoices, and credit packs'),
  ('analytics', 'Analytics', 'View workspace analytics'),
  ('crm', 'CRM', 'Access contacts, companies, deals, and pipeline'),
  ('inbox', 'Inbox', 'Access AI Inbox'),
  ('calendar', 'Calendar', 'Access calendar and meetings'),
  ('tasks', 'Tasks', 'Access tasks'),
  ('automations', 'Automations', 'Access and manage automations'),
  ('roxx_ai', 'Roxx AI', 'Use Roxx AI assistant'),
  ('settings', 'Settings', 'Manage workspace settings'),
  ('members', 'Members', 'Invite and manage members'),
  ('credits', 'AI Credits', 'View and purchase AI credits')
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description;

-- Role → permission grants
create table if not exists public.workspace_role_permissions (
  role_id text not null references public.workspace_roles(id) on delete cascade,
  permission_id text not null references public.workspace_permissions(id) on delete cascade,
  allowed boolean not null default true,
  primary key (role_id, permission_id)
);

-- Clear and reseed grants (idempotent seed)
delete from public.workspace_role_permissions;

-- Owner: everything
insert into public.workspace_role_permissions (role_id, permission_id, allowed)
select 'owner', id, true from public.workspace_permissions;

-- Admin: all except billing ownership (can view credits, manage members, all product)
insert into public.workspace_role_permissions (role_id, permission_id, allowed)
select 'admin', id, true from public.workspace_permissions
where id not in ('billing');

insert into public.workspace_role_permissions (role_id, permission_id, allowed)
values ('admin', 'billing', false)
on conflict do nothing;

-- Ensure admin has credits + members + settings + product
insert into public.workspace_role_permissions (role_id, permission_id, allowed) values
  ('admin', 'credits', true),
  ('admin', 'members', true),
  ('admin', 'settings', true),
  ('admin', 'analytics', true),
  ('admin', 'crm', true),
  ('admin', 'inbox', true),
  ('admin', 'calendar', true),
  ('admin', 'tasks', true),
  ('admin', 'automations', true),
  ('admin', 'roxx_ai', true)
on conflict (role_id, permission_id) do update set allowed = excluded.allowed;

-- Member: product surfaces + roxx, no billing/members/settings admin
insert into public.workspace_role_permissions (role_id, permission_id, allowed) values
  ('member', 'crm', true),
  ('member', 'inbox', true),
  ('member', 'calendar', true),
  ('member', 'tasks', true),
  ('member', 'automations', true),
  ('member', 'roxx_ai', true),
  ('member', 'analytics', true),
  ('member', 'settings', false),
  ('member', 'members', false),
  ('member', 'billing', false),
  ('member', 'credits', false)
on conflict (role_id, permission_id) do update set allowed = excluded.allowed;

-- Viewer: read-only (product read permissions; no write implied in app layer)
insert into public.workspace_role_permissions (role_id, permission_id, allowed) values
  ('viewer', 'crm', true),
  ('viewer', 'inbox', true),
  ('viewer', 'calendar', true),
  ('viewer', 'tasks', true),
  ('viewer', 'automations', true),
  ('viewer', 'analytics', true),
  ('viewer', 'roxx_ai', false),
  ('viewer', 'settings', false),
  ('viewer', 'members', false),
  ('viewer', 'billing', false),
  ('viewer', 'credits', false)
on conflict (role_id, permission_id) do update set allowed = excluded.allowed;

-- ---------------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id text not null,
  role_id text not null references public.workspace_roles(id),
  status text not null default 'active'
    check (status in ('active', 'removed')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id)
  where status = 'active';

create index if not exists workspace_members_workspace_idx
  on public.workspace_members (workspace_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- workspace_invitations
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role_id text not null references public.workspace_roles(id),
  invited_by text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_user_id text
);

create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations (workspace_id, status);

create index if not exists workspace_invitations_email_idx
  on public.workspace_invitations (lower(email), status);

-- ---------------------------------------------------------------------------
-- workspace_activity_logs (audit)
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id text,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspace_activity_logs_workspace_created_idx
  on public.workspace_activity_logs (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Link usage / purchases / subscriptions to workspace (nullable for back-compat)
--
-- ai_credit_purchases is created in 019_ai_credit_topups.sql. If 020 is applied
-- without 019 (or against a DB that skipped it), CREATE TABLE IF NOT EXISTS
-- ensures the relation exists BEFORE any ALTER / INDEX / FK / RLS / GRANT.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  pack_id text not null,
  credits integer not null check (credits > 0),
  amount integer not null check (amount > 0),
  currency text not null check (currency in ('USD', 'INR')),
  razorpay_order_id text,
  razorpay_payment_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists ai_credit_purchases_user_created_idx
  on public.ai_credit_purchases (user_id, created_at desc);

create unique index if not exists ai_credit_purchases_order_id_idx
  on public.ai_credit_purchases (razorpay_order_id)
  where razorpay_order_id is not null;

alter table public.ai_credit_purchases enable row level security;

drop policy if exists "Users can read own credit purchases" on public.ai_credit_purchases;
create policy "Users can read own credit purchases"
  on public.ai_credit_purchases
  for select
  using (auth.jwt() ->> 'email' = user_id);

grant select, insert, update on public.ai_credit_purchases to service_role;
grant select on public.ai_credit_purchases to authenticated;

-- Now safe: table is guaranteed to exist
alter table public.user_usage
  add column if not exists workspace_id uuid references public.workspaces(id);

alter table public.ai_credit_purchases
  add column if not exists workspace_id uuid references public.workspaces(id);

alter table public.user_subscriptions
  add column if not exists workspace_id uuid references public.workspaces(id);

create index if not exists user_usage_workspace_idx
  on public.user_usage (workspace_id)
  where workspace_id is not null;

create index if not exists ai_credit_purchases_workspace_idx
  on public.ai_credit_purchases (workspace_id)
  where workspace_id is not null;

create index if not exists user_subscriptions_workspace_idx
  on public.user_subscriptions (workspace_id)
  where workspace_id is not null;

-- ---------------------------------------------------------------------------
-- RLS (service role bypasses; authenticated read own memberships)
-- ---------------------------------------------------------------------------
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.workspace_activity_logs enable row level security;
alter table public.workspace_roles enable row level security;
alter table public.workspace_permissions enable row level security;
alter table public.workspace_role_permissions enable row level security;

grant select, insert, update, delete on public.workspaces to service_role;
grant select, insert, update, delete on public.workspace_members to service_role;
grant select, insert, update, delete on public.workspace_invitations to service_role;
grant select, insert on public.workspace_activity_logs to service_role;
grant select on public.workspace_roles to service_role, authenticated;
grant select on public.workspace_permissions to service_role, authenticated;
grant select on public.workspace_role_permissions to service_role, authenticated;

drop policy if exists "Roles are readable" on public.workspace_roles;
create policy "Roles are readable" on public.workspace_roles for select using (true);

drop policy if exists "Permissions are readable" on public.workspace_permissions;
create policy "Permissions are readable" on public.workspace_permissions for select using (true);

drop policy if exists "Role permissions are readable" on public.workspace_role_permissions;
create policy "Role permissions are readable" on public.workspace_role_permissions for select using (true);
