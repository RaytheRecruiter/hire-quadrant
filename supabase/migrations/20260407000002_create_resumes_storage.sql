/*
  # Create resumes storage bucket and policies

  Sets up Supabase Storage for candidate resume uploads.
  Referenced by ProfilePage.tsx for file upload/download.

  1. Storage Bucket
    - `resumes` bucket for PDF/DOCX resume files
    - 10MB max file size

  2. Security Policies
    - Candidates can upload to their own folder
    - Candidates can read their own files
    - Admins can read all files
*/

-- Create the resumes storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own resumes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read their own resumes
CREATE POLICY "Users can read own resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all resumes
CREATE POLICY "Admins can read all resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
