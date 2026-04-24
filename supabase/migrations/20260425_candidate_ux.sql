-- PR X5 candidate UX layer: notification prefs, saved searches,
-- application status history, advanced filter columns on jobs.
-- Idempotent: safe to re-run in the Supabase SQL editor.

-- 1. Notification preferences ------------------------------------------------
create table if not exists notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_job_alerts boolean not null default true,
  email_application_updates boolean not null default true,
  email_messages boolean not null default true,
  email_review_responses boolean not null default true,
  email_marketing boolean not null default false,
  push_enabled boolean not null default false,
  digest_frequency text not null default 'daily' check (digest_frequency in ('off','daily','weekly')),
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

drop policy if exists notif_prefs_self_read on notification_preferences;
create policy notif_prefs_self_read
  on notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists notif_prefs_self_write on notification_preferences;
create policy notif_prefs_self_write
  on notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Saved searches (no email drip yet — table only) -------------------------
create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  query jsonb not null default '{}'::jsonb,
  alert_frequency text not null default 'off' check (alert_frequency in ('off','daily','weekly')),
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists saved_searches_user_idx on saved_searches(user_id);

alter table saved_searches enable row level security;

drop policy if exists saved_searches_self on saved_searches;
create policy saved_searches_self
  on saved_searches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Application status history ---------------------------------------------
create table if not exists application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists app_status_history_app_idx
  on application_status_history(application_id, created_at desc);

alter table application_status_history enable row level security;

drop policy if exists app_status_history_read on application_status_history;
create policy app_status_history_read
  on application_status_history for select
  using (
    exists (
      select 1 from applications a
      where a.id = application_id
        and (a.user_id = auth.uid()
             or exists (select 1 from user_profiles p where p.id = auth.uid() and p.role in ('admin','company')))
    )
  );

-- Trigger: on status change, append a history row.
create or replace function fn_record_application_status()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    insert into application_status_history(application_id, from_status, to_status, changed_by)
    values (new.id, null, coalesce(new.status, 'Applied'), new.user_id);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into application_status_history(application_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_application_status on applications;
create trigger trg_record_application_status
  after insert or update of status on applications
  for each row execute function fn_record_application_status();

-- 4. Advanced filter columns on jobs ----------------------------------------
alter table jobs add column if not exists experience_level text;
alter table jobs add column if not exists workplace_type text; -- remote / hybrid / onsite
alter table jobs add column if not exists visa_sponsor boolean default false;
alter table jobs add column if not exists security_clearance text;
alter table jobs add column if not exists sponsored boolean default false;
alter table jobs add column if not exists sponsored_until timestamptz;

create index if not exists jobs_experience_idx on jobs(experience_level);
create index if not exists jobs_workplace_idx on jobs(workplace_type);
create index if not exists jobs_sponsored_idx on jobs(sponsored) where sponsored = true;
create index if not exists jobs_posted_idx on jobs(posted_date desc);

-- 5. Candidate events pipeline (lightweight) --------------------------------
create table if not exists candidate_events (
  id bigserial primary key,
  user_id uuid,
  event_type text not null,
  target_id text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists candidate_events_user_idx on candidate_events(user_id, created_at desc);
create index if not exists candidate_events_type_idx on candidate_events(event_type, created_at desc);

alter table candidate_events enable row level security;

drop policy if exists candidate_events_insert on candidate_events;
create policy candidate_events_insert
  on candidate_events for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists candidate_events_self_read on candidate_events;
create policy candidate_events_self_read
  on candidate_events for select
  using (auth.uid() = user_id);
