-- Finding #9: employers had no way to post jobs through the UI. The new
-- "+ New job" button in CompanyDashboard inserts directly into the jobs
-- table, but the existing RLS only allowed the service role + admins to write.
-- These policies let approved company users INSERT/UPDATE/DELETE jobs they
-- own (jobs.company_id matches user_profiles.company_id of the auth.uid()).
-- The "Allow public read access" SELECT policy already covers anonymous read.

-- Idempotent: drop first so re-running doesn't error.
drop policy if exists "Employers can insert their own jobs" on jobs;
drop policy if exists "Employers can update their own jobs" on jobs;
drop policy if exists "Employers can delete their own jobs" on jobs;

create policy "Employers can insert their own jobs"
  on jobs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.role = 'company'
        and up.is_approved = true
        and up.company_id = jobs.company_id
    )
  );

create policy "Employers can update their own jobs"
  on jobs
  for update
  to authenticated
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.role = 'company'
        and up.company_id = jobs.company_id
    )
  )
  with check (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.role = 'company'
        and up.company_id = jobs.company_id
    )
  );

create policy "Employers can delete their own jobs"
  on jobs
  for delete
  to authenticated
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.role = 'company'
        and up.company_id = jobs.company_id
    )
  );
