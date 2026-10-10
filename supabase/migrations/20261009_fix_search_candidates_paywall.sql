-- CRITICAL, confirmed-live fix: search_candidates() has returned every
-- matching candidate's real name, email, and resume_url to ANY company-role
-- account regardless of unlock/subscription status since it was created
-- (20260819_resume_search_filters.sql). The entire paid Resume Database
-- unlock mechanic (candidate_unlocks, unlock_candidate()) only ever gated
-- the frontend's "Unlock" button cosmetically -- the full data was already
-- present in the initial search response the whole time, visible to any
-- employer via the Network tab or React state regardless of whether they'd
-- ever paid for or clicked "unlock." Confirmed independently 2026-10-09 via
-- a live test call using a real, zero-unlock test employer account: it
-- returned every candidate's resume_url and phone_number from a direct
-- `candidates` table read, and a direct call to search_candidates() the
-- same way returns name/email/resume_url with no unlock check anywhere in
-- the query. Separately, candidates RLS itself (20260416000001) also grants
-- unconditional full-row SELECT to any company-role user with no unlock
-- check -- that's the subject of a companion migration; this one fixes the
-- actual search path every employer uses.
--
-- Frontend already treats email/resume_url as the two gated fields (see
-- ResumeSearch.tsx: `{isUnlocked && c.email && ...}` and the resume
-- download button's `isUnlocked ? ... : <Unlock button>`) -- name, skills,
-- location, salary range, work authorization, and certifications were
-- always intended as free/visible preview fields for search and filtering.
-- This fix makes the server match that intent instead of trusting the
-- client to withhold data it already has.

create or replace function search_candidates(
  p_query text default null,
  p_location text default null,
  p_min_years int default null,
  p_title text default null,
  p_updated_since timestamptz default null,
  p_min_salary int default null,
  p_max_salary int default null,
  p_work_authorization text default null,
  p_workplace_types text[] default null,
  p_work_types text[] default null,
  p_industries text[] default null,
  p_degree text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_miles double precision default null
)
returns table (
  user_id uuid,
  name text,
  email text,
  location text,
  headline text,
  skills text[],
  years_experience int,
  resume_url text,
  current_title text,
  certifications text[],
  resume_parsed_at timestamptz,
  desired_salary_min int,
  desired_salary_max int,
  work_authorization text,
  workplace_types jsonb,
  work_types jsonb,
  distance_miles double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with caller_company as (
    select cm.company_id
    from company_members cm
    where cm.user_id = auth.uid()
    limit 1
  ),
  caller_period as (
    select
      coalesce(
        (select s.current_period_start
         from subscriptions s
         where s.company_id = (select company_id from caller_company)
           and s.status in ('active', 'trialing')
         order by s.updated_at desc
         limit 1),
        date_trunc('month', now())
      ) as period_start
  )
  select
    c.user_id,
    up.name,
    case when cu.id is not null then c.email else null end as email,
    c.location, c.headline, c.skills,
    c.years_experience,
    case when cu.id is not null then c.resume_url else null end as resume_url,
    c.current_title, c.certifications, c.resume_parsed_at,
    jp.desired_salary_min, jp.desired_salary_max, jp.work_authorization, jp.workplace_types, jp.work_types,
    case
      when p_lat is not null and p_lng is not null and jp.zip_lat is not null and jp.zip_lng is not null
      then haversine_miles(p_lat, p_lng, jp.zip_lat, jp.zip_lng)
      else null
    end as distance_miles
  from candidates c
  left join user_job_preferences jp on jp.user_id = c.user_id
  left join user_profiles up on up.id = c.user_id
  left join candidate_unlocks cu
    on cu.company_id = (select company_id from caller_company)
    and cu.candidate_user_id = c.user_id
    and cu.period_start >= (select period_start from caller_period)
  where c.open_to_work = true
    and exists (
      select 1 from user_profiles up2
      where up2.id = auth.uid() and up2.role in ('company', 'admin')
    )
    and (p_query is null or c.headline ilike '%' || p_query || '%'
         or c.resume_text ilike '%' || p_query || '%'
         or up.name ilike '%' || p_query || '%'
         or c.current_title ilike '%' || p_query || '%')
    and (p_location is null or c.location ilike '%' || p_location || '%')
    and (p_min_years is null or c.years_experience >= p_min_years)
    and (p_title is null or c.current_title ilike '%' || p_title || '%')
    and (p_updated_since is null or c.resume_parsed_at >= p_updated_since)
    and (p_min_salary is null or jp.desired_salary_max is null or jp.desired_salary_max >= p_min_salary)
    and (p_max_salary is null or jp.desired_salary_min is null or jp.desired_salary_min <= p_max_salary)
    and (p_work_authorization is null or jp.work_authorization = p_work_authorization)
    and (p_workplace_types is null or jp.workplace_types ?| p_workplace_types)
    and (p_work_types is null or jp.work_types ?| p_work_types)
    and (p_industries is null or jp.industries ?| p_industries)
    and (p_degree is null or exists (
      select 1 from user_education ue
      where ue.user_id = c.user_id and ue.degree ilike '%' || p_degree || '%'
    ))
    and (
      p_lat is null or p_lng is null or p_miles is null
      or (jp.zip_lat is not null and jp.zip_lng is not null
          and haversine_miles(p_lat, p_lng, jp.zip_lat, jp.zip_lng) <= p_miles)
    )
  order by c.years_experience desc nulls last
  limit 50;
$$;

grant execute on function search_candidates(
  text, text, int, text, timestamptz, int, int, text, text[], text[], text[], text, double precision, double precision, double precision
) to authenticated;
