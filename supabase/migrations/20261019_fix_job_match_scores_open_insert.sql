-- CRITICAL, found auditing the AI job-matching scorer (2026-10-19):
-- job_match_scores had an INSERT policy named "Service role can insert
-- match scores" that was actually granted TO public (every role,
-- including anon -- no login at all) with WITH CHECK (true), completely
-- unrestricted. Confirmed live via pg_policies.
--
-- The name is misleading: the service role bypasses RLS entirely and
-- never evaluates policies in the first place, so this policy was
-- always actually gating normal client writes -- it just never
-- restricted them. The only real writer is the browser client in
-- useJobMatchScore.ts, which upserts the logged-in user's own row.
--
-- Net effect before this fix: any anonymous caller on the internet could
-- insert arbitrary rows into job_match_scores for any user_id, poisoning
-- another candidate's cached AI match score/skills for any job.
--
-- Fix: scope to the authenticated role and require user_id = auth.uid(),
-- matching the existing SELECT policy's pattern.

drop policy if exists "Service role can insert match scores" on job_match_scores;

create policy "Users can insert own match scores"
  on job_match_scores for insert to authenticated
  with check (auth.uid() = user_id);

-- The upsert in useJobMatchScore.ts also needs UPDATE permission on
-- conflict (onConflict is implicit via the (user_id, job_id) upsert
-- target) -- add it scoped the same way rather than leave updates to
-- silently no-op.
drop policy if exists "Users can update own match scores" on job_match_scores;

create policy "Users can update own match scores"
  on job_match_scores for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
