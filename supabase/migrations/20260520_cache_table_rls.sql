-- Per Supabase Advisor 2026-05-20: replaces broken "Service role can ..."
-- always-true policies on three cache tables. The policies were named
-- as if service_role would do the writes, but in practice writes come
-- from the frontend (authenticated client). The policies' lack of role
-- restriction meant anon could also INSERT/UPDATE arbitrary rows —
-- e.g. an unauthenticated user could pollute `job_match_scores` with
-- fake match scores or spam `career_path_cache` with garbage.
--
-- Verified before changes:
--   - useJobMatchScore.ts:62  → supabase.from('job_match_scores').upsert(...)
--   - useCareerPaths.ts:60    → supabase.from('career_path_cache').upsert(...)
--   - handle_new_user trigger is SECURITY DEFINER, runs as postgres
--     (RLS bypass), so user_profiles signup row still works regardless
--     of the dropped policy.
--   - PR #105 already grants "Users can insert own profile" for
--     authenticated client-side inserts on user_profiles.


-- ─── job_match_scores: scope writes to row owner ────────────────────────
-- The table has a user_id column, so each user writes only their own
-- match scores. The hook upserts, so we need both INSERT and UPDATE.

drop policy if exists "Service role can insert match scores" on job_match_scores;

drop policy if exists "Users insert own match scores" on job_match_scores;
create policy "Users insert own match scores"
  on job_match_scores for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update own match scores" on job_match_scores;
create policy "Users update own match scores"
  on job_match_scores for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─── career_path_cache: scope writes to authenticated ───────────────────
-- This is a shared cache keyed on job_title (no user_id), so we can't
-- restrict by row ownership. The minimum hardening is dropping the
-- no-role-restriction policies and recreating them scoped to
-- `authenticated` — anon can no longer pollute the cache. Reads stay
-- open for authenticated via the existing "Anyone can read..." policy.

drop policy if exists "Service role can insert career paths" on career_path_cache;
drop policy if exists "Service role can update career paths" on career_path_cache;
drop policy if exists "Service role can insert/update career paths" on career_path_cache;

drop policy if exists "Authenticated users populate career paths" on career_path_cache;
create policy "Authenticated users populate career paths"
  on career_path_cache for insert to authenticated
  with check (
    job_title is not null
    and char_length(job_title) between 1 and 200
    and jsonb_typeof(paths) = 'array'
  );

drop policy if exists "Authenticated users refresh career paths" on career_path_cache;
create policy "Authenticated users refresh career paths"
  on career_path_cache for update to authenticated
  using (true)
  with check (
    jsonb_typeof(paths) = 'array'
  );


-- ─── user_profiles: drop redundant always-true INSERT policy ────────────
-- "Service role can create profiles" with WITH CHECK (true) and no role
-- restriction meant anon could insert arbitrary profile rows. handle_new_user
-- (the SECURITY DEFINER trigger on auth.users) bypasses RLS as postgres, so
-- the signup flow doesn't need this policy. PR #105's "Users can insert
-- own profile" covers authenticated client-side inserts.

drop policy if exists "Service role can create profiles" on user_profiles;
