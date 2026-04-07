CREATE POLICY "Company users can update application status"
  ON job_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN companies c ON up.company_id = c.id
      WHERE up.user_id = auth.uid() AND up.role = 'company'
      AND (job_applications.source_company = c.name OR job_applications.source_company = c.display_name)
    )
  );
