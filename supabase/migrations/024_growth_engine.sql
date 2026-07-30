-- Growth Engine: referrals, achievements, preferences, onboarding emails
-- Idempotent: safe to re-run

-- Referral profiles (one per user)
create table if not exists public.referral_profiles (
  user_id text primary key,
  code text not null unique,
  successful_count integer not null default 0,
  pending_count integer not null default 0,
  reward_days_earned integer not null default 0,
  reward_tier_5_claimed boolean not null default false,
  reward_tier_50_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists referral_profiles_code_idx
  on public.referral_profiles (code);

-- Individual referral attributions
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id text not null references public.referral_profiles(user_id) on delete cascade,
  referred_user_id text,
  referred_email text,
  status text not null default 'pending'
    check (status in ('pending', 'signed_up', 'activated', 'rewarded', 'expired')),
  code text not null,
  signed_up_at timestamptz,
  activated_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists referrals_referred_user_id_unique
  on public.referrals (referred_user_id)
  where referred_user_id is not null;

create index if not exists referrals_referrer_status_idx
  on public.referrals (referrer_user_id, status);

create index if not exists referrals_code_idx
  on public.referrals (code);

-- Achievements / engagement
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, achievement_id)
);

create index if not exists user_achievements_user_id_idx
  on public.user_achievements (user_id, unlocked_at desc);

-- Usage streaks
create table if not exists public.user_streaks (
  user_id text primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  total_active_days integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Growth / notification / email preferences
create table if not exists public.user_growth_preferences (
  user_id text primary key,
  email_onboarding boolean not null default true,
  email_product_updates boolean not null default true,
  email_weekly_digest boolean not null default true,
  email_referral_rewards boolean not null default true,
  notify_referrals boolean not null default true,
  notify_invites boolean not null default true,
  notify_automations boolean not null default true,
  notify_ai_summary boolean not null default true,
  notify_product_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Product onboarding email drip log
create table if not exists public.onboarding_email_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  step text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, step)
);

create index if not exists onboarding_email_log_user_idx
  on public.onboarding_email_log (user_id);

-- Growth event counters for usage analytics (lightweight daily rollups)
create table if not exists public.growth_daily_metrics (
  user_id text not null,
  day date not null,
  tasks_completed integer not null default 0,
  meetings_summarized integer not null default 0,
  ai_prompts integer not null default 0,
  crm_updates integer not null default 0,
  documents_created integer not null default 0,
  automation_runs integer not null default 0,
  primary key (user_id, day)
);

create index if not exists growth_daily_metrics_day_idx
  on public.growth_daily_metrics (day desc);

-- RLS / grants
alter table public.referral_profiles enable row level security;
alter table public.referrals enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_growth_preferences enable row level security;
alter table public.onboarding_email_log enable row level security;
alter table public.growth_daily_metrics enable row level security;

grant select, insert, update, delete on public.referral_profiles to service_role;
grant select, insert, update, delete on public.referrals to service_role;
grant select, insert, update, delete on public.user_achievements to service_role;
grant select, insert, update, delete on public.user_streaks to service_role;
grant select, insert, update, delete on public.user_growth_preferences to service_role;
grant select, insert, update, delete on public.onboarding_email_log to service_role;
grant select, insert, update, delete on public.growth_daily_metrics to service_role;

drop policy if exists referral_profiles_service_role_all on public.referral_profiles;
create policy referral_profiles_service_role_all
  on public.referral_profiles for all to service_role using (true) with check (true);

drop policy if exists referrals_service_role_all on public.referrals;
create policy referrals_service_role_all
  on public.referrals for all to service_role using (true) with check (true);

drop policy if exists user_achievements_service_role_all on public.user_achievements;
create policy user_achievements_service_role_all
  on public.user_achievements for all to service_role using (true) with check (true);

drop policy if exists user_streaks_service_role_all on public.user_streaks;
create policy user_streaks_service_role_all
  on public.user_streaks for all to service_role using (true) with check (true);

drop policy if exists user_growth_preferences_service_role_all on public.user_growth_preferences;
create policy user_growth_preferences_service_role_all
  on public.user_growth_preferences for all to service_role using (true) with check (true);

drop policy if exists onboarding_email_log_service_role_all on public.onboarding_email_log;
create policy onboarding_email_log_service_role_all
  on public.onboarding_email_log for all to service_role using (true) with check (true);

drop policy if exists growth_daily_metrics_service_role_all on public.growth_daily_metrics;
create policy growth_daily_metrics_service_role_all
  on public.growth_daily_metrics for all to service_role using (true) with check (true);
