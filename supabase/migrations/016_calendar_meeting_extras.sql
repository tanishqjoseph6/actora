-- Calendar meeting extras: notes, reminders
-- Idempotent: safe on fresh and existing databases
-- Order: alter tables → indexes → (no RLS changes needed; meetings already secured)

alter table public.meetings
  add column if not exists notes text not null default '';

alter table public.meetings
  add column if not exists reminder_minutes integer not null default 30;

alter table public.meetings
  add column if not exists reminder_sent_at timestamptz;

create index if not exists meetings_reminder_due_idx
  on public.meetings (user_id, starts_at)
  where status = 'scheduled' and reminder_sent_at is null;
