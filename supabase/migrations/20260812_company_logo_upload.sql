-- Ray: "In the Company Profile, you need to be able to edit the logo
-- that is displayed for the company." There was previously no UI path to
-- set companies.logo at all — only whatever a seed script wrote.
--
-- Public bucket (so <img src=...> works without signed URLs, same pattern
-- as 20260424_user_avatars.sql), scoped by company_id folder so only
-- members of that company can write to it.

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone reads company logos" ON storage.objects;
CREATE POLICY "Anyone reads company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Company members upload own logo" ON storage.objects;
CREATE POLICY "Company members upload own logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.company_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Company members update own logo" ON storage.objects;
CREATE POLICY "Company members update own logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.company_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Company members delete own logo" ON storage.objects;
CREATE POLICY "Company members delete own logo"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.company_id::text = (storage.foldername(name))[1]
    )
  );
