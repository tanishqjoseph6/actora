-- Durable public API monthly usage and distributed rate-limit windows.
create table if not exists public.api_usage_monthly (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  month_start date not null,
  calls_count integer not null default 0 check (calls_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, api_key_id, month_start)
);

create table if not exists public.api_rate_limit_windows (
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  window_start timestamptz not null,
  requests_count integer not null default 0 check (requests_count >= 0),
  primary key (api_key_id, window_start)
);

create index if not exists api_usage_monthly_workspace_idx
  on public.api_usage_monthly(workspace_id, month_start desc);
create index if not exists api_rate_limit_windows_key_idx
  on public.api_rate_limit_windows(api_key_id, window_start desc);

create or replace function public.consume_public_api_call(
  p_workspace_id uuid,
  p_api_key_id uuid,
  p_month_start date,
  p_monthly_limit integer
)
returns table(allowed boolean, calls_used integer, calls_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.api_usage_monthly(workspace_id, api_key_id, month_start, calls_count)
  values (p_workspace_id, p_api_key_id, p_month_start, 1)
  on conflict (workspace_id, api_key_id, month_start) do update
    set calls_count = api_usage_monthly.calls_count + 1,
        updated_at = now()
  returning api_usage_monthly.calls_count into current_count;

  return query select
    (p_monthly_limit < 0 or current_count <= p_monthly_limit),
    current_count,
    case when p_monthly_limit < 0 then -1 else greatest(0, p_monthly_limit - current_count) end;
end;
$$;

create or replace function public.consume_public_api_rate_limit(
  p_api_key_id uuid,
  p_window_start timestamptz,
  p_limit integer
)
returns table(allowed boolean, requests_used integer, requests_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.api_rate_limit_windows(api_key_id, window_start, requests_count)
  values (p_api_key_id, p_window_start, 1)
  on conflict (api_key_id, window_start) do update
    set requests_count = api_rate_limit_windows.requests_count + 1
  returning api_rate_limit_windows.requests_count into current_count;

  return query select
    current_count <= p_limit,
    current_count,
    greatest(0, p_limit - current_count);
end;
$$;

grant execute on function public.consume_public_api_call(uuid, uuid, date, integer) to service_role;
grant execute on function public.consume_public_api_rate_limit(uuid, timestamptz, integer) to service_role;
grant select, insert, update, delete on public.api_usage_monthly, public.api_rate_limit_windows to service_role;
alter table public.api_usage_monthly enable row level security;
alter table public.api_rate_limit_windows enable row level security;
notify pgrst, 'reload schema';
