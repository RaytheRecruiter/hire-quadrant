-- Atomic increment function for job views.
-- Called from the frontend via supabase.rpc('increment_job_views', { row_id: '<job_id>' })
CREATE OR REPLACE FUNCTION increment_job_views(row_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE jobs SET views = views + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
