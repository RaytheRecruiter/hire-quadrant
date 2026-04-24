-- PR X10 remaining autonomous: experiments (A/B), client error logs,
-- saved-search runner helper. Idempotent.

-- 1. A/B experiments --------------------------------------------------------
create table if not exists experiments (
  key text primary key,
  description text,
  variants jsonb not null default '["control","treatment"]'::jsonb,
  traffic_percent int not null default 100 check (traffic_percent between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table experiments enable row level security;

drop policy if exists experiments_public_read on experiments;
create policy experiments_public_read on experiments for select using (active = true);

drop policy if exists experiments_admin_write on experiments;
create policy experiments_admin_write on experiments for all
  using (exists (select 1 from user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Per-user variant assignment (sticky).
create table if not exists experiment_assignments (
  experiment_key text not null references experiments(key) on delete cascade,
  subject_id text not null, -- user_id or anonymous session id
  variant text not null,
  assigned_at timestamptz not null default now(),
  primary key (experiment_key, subject_id)
);

create index if not exists experiment_assignments_subject_idx
  on experiment_assignments(subject_id);

alter table experiment_assignments enable row level security;

drop policy if exists experiment_assignments_read on experiment_assignments;
create policy experiment_assignments_read on experiment_assignments for select using (true);

drop policy if exists experiment_assignments_insert on experiment_assignments;
create policy experiment_assignments_insert on experiment_assignments for insert with check (true);

-- 2. Client error log -------------------------------------------------------
create table if not exists client_errors (
  id bigserial primary key,
  user_id uuid,
  session_id text,
  message text not null,
  stack text,
  url text,
  user_agent text,
  severity text not null default 'error' check (severity in ('error','warning','info')),
  created_at timestamptz not null default now()
);

create index if not exists client_errors_created_idx on client_errors(created_at desc);
create index if not exists client_errors_severity_idx
  on client_errors(severity, created_at desc) where severity = 'error';

alter table client_errors enable row level security;

drop policy if exists client_errors_insert on client_errors;
create policy client_errors_insert on client_errors for insert with check (true);

drop policy if exists client_errors_admin_read on client_errors;
create policy client_errors_admin_read on client_errors for select
  using (exists (select 1 from user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 3. Saved-search runner RPC ------------------------------------------------
-- Evaluates one saved search and writes matching-jobs notification. Called
-- from a daily edge function / pg_cron schedule.
create or replace function run_saved_search(p_search_id uuid)
returns int language plpgsql security definer as $$
declare
  s saved_searches%rowtype;
  match_count int := 0;
  q text;
  loc text;
begin
  select * into s from saved_searches where id = p_search_id;
  if not found then return 0; end if;
  if s.alert_frequency = 'off' then return 0; end if;

  q := coalesce(s.query->>'q', '');
  loc := coalesce(s.query->>'loc', '');

  -- Count new jobs matching the saved filters since last_run_at
  select count(*) into match_count
    from jobs j
   where j.posted_date > coalesce(s.last_run_at, now() - interval '7 days')
     and (q = '' or j.title ilike '%' || q || '%' or j.description ilike '%' || q || '%')
     and (loc = '' or j.location ilike '%' || loc || '%');

  if match_count > 0 then
    insert into notifications(user_id, kind, title, body, url)
    values (
      s.user_id,
      'saved_search_match',
      format('%s new %s matching "%s"', match_count, case when match_count=1 then 'job' else 'jobs' end, coalesce(s.name, 'your saved search')),
      'Tap to view matching roles.',
      '/jobs?q=' || coalesce(q,'') || '&loc=' || coalesce(loc,'')
    );
  end if;

  update saved_searches set last_run_at = now() where id = p_search_id;
  return match_count;
end;
$$;

grant execute on function run_saved_search(uuid) to authenticated;

-- Helper to run all due saved searches (called daily from edge function cron).
create or replace function run_due_saved_searches()
returns int language plpgsql security definer as $$
declare
  rec record;
  total int := 0;
  n int;
begin
  for rec in
    select id from saved_searches
     where alert_frequency in ('daily','weekly')
       and (last_run_at is null
            or (alert_frequency = 'daily' and last_run_at < now() - interval '23 hours')
            or (alert_frequency = 'weekly' and last_run_at < now() - interval '6 days'))
     limit 500
  loop
    n := run_saved_search(rec.id);
    total := total + n;
  end loop;
  return total;
end;
$$;

grant execute on function run_due_saved_searches() to service_role;
