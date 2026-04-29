-- Per Scott 2026-04-29 (#6): mile-radius job search.
-- Candidate sets ZIP + radius preference; we geocode their ZIP via Mapbox
-- (browser-side, public token) and store the lat/lng. Jobs are geocoded on
-- insert (also browser-side). The nearby_jobs() function filters by
-- Haversine distance.
--
-- We deliberately don't require PostGIS — a numeric Haversine works fine
-- at the scales we care about (US national, <10s ms per query).

-- ─── user_job_preferences: lat/lng + mile_radius ──────────────────────────
alter table user_job_preferences
  add column if not exists zip_lat double precision,
  add column if not exists zip_lng double precision,
  -- 0 = disabled (no radius filter); positive integer = miles. Cap at 250
  -- to keep the UI from offering a useless "anywhere within 5,000 miles"
  -- option.
  add column if not exists mile_radius integer default 0
    check (mile_radius >= 0 and mile_radius <= 250);

-- ─── jobs: lat/lng for filtering ──────────────────────────────────────────
alter table jobs
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create index if not exists idx_jobs_geo on jobs(lat, lng) where lat is not null and lng is not null;

-- ─── Haversine helper ─────────────────────────────────────────────────────
-- Returns the great-circle distance between two points in miles.
create or replace function haversine_miles(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select 3958.8 * 2 * asin(sqrt(
    pow(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
    * pow(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ─── nearby_jobs(): filter wrapper ────────────────────────────────────────
-- Convenience function — returns job ids within radius. UI calls this and
-- joins back into jobs for the full row data. Keeps the row payload small
-- when the candidate is browsing 1000+ jobs.
create or replace function nearby_job_ids(
  p_lat double precision,
  p_lng double precision,
  p_miles double precision
)
returns table (id text, distance_miles double precision)
language sql
stable
parallel safe
as $$
  select j.id, haversine_miles(p_lat, p_lng, j.lat, j.lng) as distance_miles
  from jobs j
  where j.lat is not null
    and j.lng is not null
    and haversine_miles(p_lat, p_lng, j.lat, j.lng) <= p_miles
  order by distance_miles asc;
$$;
