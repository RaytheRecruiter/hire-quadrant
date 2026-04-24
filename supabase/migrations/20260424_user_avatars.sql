-- ============================================================
-- User avatars: new column + storage bucket + RLS
-- Also restores over-written "admin"/"candidate"/"company" names
-- that the April 23 seed script set when upserting role rows.
-- ============================================================

-- 1. Column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Restore real names that the seed clobbered. For any user_profile
--    whose name currently equals a role enum value, fall back to the
--    auth metadata name or the email local-part.
UPDATE user_profiles up
SET name = COALESCE(
  NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
  NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
  SPLIT_PART(au.email, '@', 1)
)
FROM auth.users au
WHERE up.id = au.id
  AND up.name IN ('admin', 'candidate', 'company');

-- 3. Public storage bucket for avatars. Public so <img src=...> works
--    without signed URLs; storage policies below still enforce that
--    users can only write to their own folder.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage RLS: each authenticated user can manage objects under
--    their own uid folder: avatars/<user_id>/<filename>
DROP POLICY IF EXISTS "Anyone reads avatars" ON storage.objects;
CREATE POLICY "Anyone reads avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
