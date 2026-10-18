-- CRITICAL, found continuing N19 QA (2026-10-18, candidate side):
-- export_my_data() -- "Download your data" on Settings -- has the exact
-- same wrong-column bug already found and fixed today in delete_my_data()
-- (20261018_fix_delete_my_data.sql): company_reviews' real column is
-- author_id, not user_id (confirmed via that earlier table's own CREATE
-- TABLE statement, 20260423_phase5_company_pages.sql). The whole function
-- builds its result as a single jsonb_build_object() expression, so a
-- column-does-not-exist error on the reviews subquery fails the entire
-- call -- "Download your data" has never worked for anyone, confirmed by
-- the same root cause as the account-deletion bug.

CREATE OR REPLACE FUNCTION export_my_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  result := result || jsonb_build_object(
    'profile',     (SELECT to_jsonb(p) FROM user_profiles p WHERE p.id = uid),
    'candidate',   (SELECT to_jsonb(c) FROM candidates c WHERE c.user_id = uid),
    'experience',  COALESCE((SELECT jsonb_agg(to_jsonb(e)) FROM user_experience e WHERE e.user_id = uid), '[]'::jsonb),
    'education',   COALESCE((SELECT jsonb_agg(to_jsonb(ed)) FROM user_education ed WHERE ed.user_id = uid), '[]'::jsonb),
    'preferences', (SELECT to_jsonb(jp) FROM user_job_preferences jp WHERE jp.user_id = uid),
    'applications', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM job_applications a WHERE a.user_id = uid), '[]'::jsonb),
    'saved_jobs',  COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM saved_jobs s WHERE s.user_id = uid), '[]'::jsonb),
    'reviews',     COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM company_reviews r WHERE r.author_id = uid), '[]'::jsonb),
    'notifications', COALESCE((SELECT jsonb_agg(to_jsonb(n)) FROM notifications n WHERE n.user_id = uid), '[]'::jsonb),
    'notification_preferences', (SELECT to_jsonb(np) FROM notification_preferences np WHERE np.user_id = uid),
    'saved_searches', COALESCE((SELECT jsonb_agg(to_jsonb(ss)) FROM saved_searches ss WHERE ss.user_id = uid), '[]'::jsonb),
    'demographics', (SELECT to_jsonb(d) FROM user_demographics d WHERE d.user_id = uid),
    'exported_at', now()
  );

  RETURN result;
END;
$$;
