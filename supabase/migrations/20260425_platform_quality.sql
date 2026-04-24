-- PR X9 platform quality: cron_runs table for health dashboard,
-- events ingestion table, realtime publication wiring.
-- Idempotent.

-- 1. Cron run log -----------------------------------------------------------
create table if not exists cron_runs (
  id bigserial primary key,
  job_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','success','failure')),
  duration_ms int,
  error_message text,
  metadata jsonb default '{}'::jsonb
);

create index if not exists cron_runs_job_idx on cron_runs(job_name, started_at desc);

alter table cron_runs enable row level security;

drop policy if exists cron_runs_admin_read on cron_runs;
create policy cron_runs_admin_read
  on cron_runs for select
  using (
    exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Service role bypasses RLS; that's what writes these.

-- 2. Helper RPC so cron scripts can log completion from edge functions ------
create or replace function log_cron_run(
  p_job_name text,
  p_status text,
  p_duration_ms int,
  p_error_message text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void language sql security definer as $$
  insert into cron_runs(job_name, finished_at, status, duration_ms, error_message, metadata)
  values (p_job_name, now(), p_status, p_duration_ms, p_error_message, p_metadata);
$$;

-- 3. Events ingestion (server-side page_view, apply_click, etc.) -----------
-- Candidate_events already exists (X5) for per-user logs.
-- app_events is the global funnel table.
create table if not exists app_events (
  id bigserial primary key,
  user_id uuid,
  session_id text,
  event_type text not null,
  properties jsonb default '{}'::jsonb,
  url text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists app_events_type_idx on app_events(event_type, created_at desc);
create index if not exists app_events_user_idx on app_events(user_id, created_at desc) where user_id is not null;
create index if not exists app_events_session_idx on app_events(session_id, created_at desc) where session_id is not null;

alter table app_events enable row level security;

drop policy if exists app_events_insert on app_events;
create policy app_events_insert
  on app_events for insert
  with check (true); -- anyone (anon/authn) can log an event

drop policy if exists app_events_admin_read on app_events;
create policy app_events_admin_read
  on app_events for select
  using (
    exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 4. Add tables to the realtime publication so supabase realtime works -----
-- Wrapped in DO so re-runs don't fail when publication already contains the table.
do $$
begin
  begin
    alter publication supabase_realtime add table notifications;
  exception when duplicate_object then null; when others then null; end;
  begin
    alter publication supabase_realtime add table messages;
  exception when duplicate_object then null; when others then null; end;
  begin
    alter publication supabase_realtime add table conversations;
  exception when duplicate_object then null; when others then null; end;
end $$;
