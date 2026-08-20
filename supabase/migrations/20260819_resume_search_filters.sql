-- Per Ray's 2026-08-18 reply: "Add [salary, work authorization, education,
-- industry] to the candidate profile!!!!"
--
-- Turns out salary (desired_salary_min/max), work authorization
-- (work_authorization), remote preference (workplace_types), employment
-- type (work_types), and education (user_education table) were ALL
-- already collected via JobPreferencesSection.tsx / EducationSection.tsx
-- (20260424_profile_expansion.sql) for the candidate-facing "jobs near
-- me" experience — they just were never surfaced to employers in
-- ResumeSearch. Only "industry" was genuinely missing. Distance search
-- is also now possible for free: user_job_preferences.zip_lat/zip_lng
-- already exists (20260429_mile_radius_search.sql) and haversine_miles()
-- is already a general-purpose function.

-- 1. The only actually-missing field.
alter table user_job_preferences
  add column if not exists industries jsonb default '[]'::jsonb;

-- 2. search_candidates(): single RPC doing the cross-table join+filter so
--    ResumeSearch.tsx doesn't need N+1 client-side joins across
--    candidates / user_job_preferences / user_education. security definer
--    mirrors the existing unlock_candidate/unlocks_remaining pattern so it
--    isn't blocked by user_job_preferences' own "owner only" RLS (that
--    table only allows candidates to read their own row — companies were
--    never granted read access to it directly, which is why this data
--    never made it into search before).
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
  select
    c.user_id, up.name, c.email, c.location, c.headline, c.skills,
    c.years_experience, c.resume_url, c.current_title, c.certifications, c.resume_parsed_at,
    jp.desired_salary_min, jp.desired_salary_max, jp.work_authorization, jp.workplace_types, jp.work_types,
    case
      when p_lat is not null and p_lng is not null and jp.zip_lat is not null and jp.zip_lng is not null
      then haversine_miles(p_lat, p_lng, jp.zip_lat, jp.zip_lng)
      else null
    end as distance_miles
  from candidates c
  left join user_job_preferences jp on jp.user_id = c.user_id
  left join user_profiles up on up.id = c.user_id
  where c.open_to_work = true
    and exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.role in ('company', 'admin')
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
