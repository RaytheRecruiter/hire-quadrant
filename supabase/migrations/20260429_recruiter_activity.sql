-- Per Scott 2026-04-29 Phase 2 #4: Recruiter Activity Reports.
-- Adds the tracking columns + an event table needed to aggregate
-- per-team-member productivity (jobs posted, applicants reviewed,
-- messages sent, last active).
--
-- Philosophy: minimal new state. We extend `record_application_view` to
-- also log a row into `application_reviews` so we can attribute reviews
-- to specific recruiters going forward — backfill is impossible since
-- the existing employer_views jsonb only stored timestamps.

-- ─── jobs.posted_by ───────────────────────────────────────────────────────
alter table jobs
  add column if not exists posted_by uuid references auth.users(id) on delete set null;

create index if not exists idx_jobs_posted_by on jobs(posted_by);

-- ─── application_reviews event table ──────────────────────────────────────
create table if not exists application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id text not null references job_applications(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewed_at timestamptz not null default now()
);

create index if not exists idx_application_reviews_reviewer
  on application_reviews(reviewer_id, reviewed_at desc);
create index if not exists idx_application_reviews_application
  on application_reviews(application_id);

-- RLS: a reviewer can see their own rows; company Owners/Admins can see
-- all reviews against applications belonging to their company. We keep
-- this loose enough that the recruiter_activity RPC (security definer)
-- can still aggregate cross-user.
alter table application_reviews enable row level security;

drop policy if exists "ar_self_select" on application_reviews;
create policy "ar_self_select"
  on application_reviews for select
  to authenticated
  using (reviewer_id = auth.uid());

drop policy if exists "ar_company_select" on application_reviews;
create policy "ar_company_select"
  on application_reviews for select
  to authenticated
  using (
    exists (
      select 1 from job_applications ja
      join jobs j on j.id = ja.job_id
      join company_members cm
        on cm.company_id = j.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.role in ('owner', 'admin')
      where ja.id = application_reviews.application_id
    )
  );

drop policy if exists "ar_self_insert" on application_reviews;
create policy "ar_self_insert"
  on application_reviews for insert
  to authenticated
  with check (reviewer_id = auth.uid());

-- ─── record_application_view: also log the reviewer ──────────────────────
-- The original signature returns void and writes employer_views jsonb on
-- job_applications. We preserve that and additionally append a row to
-- application_reviews so we know which recruiter looked at the row.
create or replace function record_application_view(app_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Preserve existing behavior: append a timestamp to the jsonb array.
  update job_applications
    set employer_views = coalesce(employer_views, '[]'::jsonb)
                         || jsonb_build_array(jsonb_build_object('at', now(), 'by', v_user_id))
    where id = app_id;

  -- New: log a typed row so we can do per-user aggregation.
  if v_user_id is not null then
    insert into application_reviews (application_id, reviewer_id)
    values (app_id, v_user_id);
  end if;
end;
$$;

grant execute on function record_application_view(text) to authenticated;

-- ─── recruiter_activity aggregate function ───────────────────────────────
-- Returns one row per active member of the company with rolled-up counts
-- since p_since. The function is security definer so the panel can
-- aggregate across the full team without per-row RLS checks.
create or replace function recruiter_activity(
  p_company_id uuid,
  p_since timestamptz
)
returns table (
  user_id uuid,
  jobs_posted bigint,
  applicants_reviewed bigint,
  messages_sent bigint,
  last_active timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with members as (
    select user_id
    from company_members
    where company_id = p_company_id and status = 'active'
  ),
  jobs_count as (
    select posted_by as user_id, count(*)::bigint as n, max(created_at) as last_at
    from jobs
    where company_id = p_company_id
      and posted_by is not null
      and created_at >= p_since
    group by posted_by
  ),
  reviews_count as (
    select ar.reviewer_id as user_id,
           count(distinct ar.application_id)::bigint as n,
           max(ar.reviewed_at) as last_at
    from application_reviews ar
    join job_applications ja on ja.id = ar.application_id
    join jobs j on j.id = ja.job_id
    where j.company_id = p_company_id
      and ar.reviewed_at >= p_since
    group by ar.reviewer_id
  ),
  messages_count as (
    select sender_id as user_id,
           count(*)::bigint as n,
           max(created_at) as last_at
    from messages
    where sender_id in (select user_id from members)
      and created_at >= p_since
    group by sender_id
  )
  select
    m.user_id,
    coalesce(jc.n, 0) as jobs_posted,
    coalesce(rc.n, 0) as applicants_reviewed,
    coalesce(mc.n, 0) as messages_sent,
    greatest(jc.last_at, rc.last_at, mc.last_at) as last_active
  from members m
  left join jobs_count jc on jc.user_id = m.user_id
  left join reviews_count rc on rc.user_id = m.user_id
  left join messages_count mc on mc.user_id = m.user_id;
$$;

grant execute on function recruiter_activity(uuid, timestamptz) to authenticated;
