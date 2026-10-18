-- CRITICAL, found continuing N19 QA (2026-10-18): the same dead-table bug
-- just fixed on get_company_dashboard_stats (20261018_fix_dashboard_rpc_
-- authorization.sql) turns out to gate FIVE more tables. `company_admins`
-- was created 2026-04-23 with a one-time backfill for whoever was an
-- employer that day; company_members (2026-04-29) superseded it as the
-- real team/permissions table going forward, but nothing was ever updated
-- to keep company_admins in sync -- every employer account created or
-- promoted since 2026-04-29 has zero rows in company_admins and silently
-- fails every one of these policies. claim_company (ClaimBanner.tsx) still
-- writes to company_admins too, but it also sets user_profiles.company_id
-- directly with no company_members row, so claimants are unaffected by
-- this fix -- they already match the "legacy direct link" branch below,
-- same as every other fix shipped today.
--
-- Confirmed broken for every current employer account:
--   - company_reviews: "Company admins read their company reviews" (SELECT)
--     -> Reviews tab can't show a company's own reviews past the ones the
--        logged-in user personally authored.
--   - company_review_responses: "...manage responses..." (ALL)
--     -> Responding to a review (CompanyReviewsPanel's ResponseEditor)
--        fails with a real RLS-violation error on the WITH CHECK (INSERT
--        path), not a silent no-op.
--   - company_page_views: "Company admins read their page views" (SELECT)
--     -> Narrower effect since get_company_dashboard_stats (already fixed)
--        and useCompanyAnalyticsTimeseries read this table themselves;
--        fixed for consistency/defense in depth.
--   - company_content_blocks: "...manage content blocks..." (ALL)
--     -> WhyJoinUsPanel: adding a block throws a real RLS error (INSERT
--        WITH CHECK fails outright); editing/reordering/deleting an
--        existing block silently no-ops (UPDATE/DELETE USING clause just
--        matches zero rows, no error) while the UI still reports success.
--   - company_questions: "Company admins answer" (UPDATE)
--     -> CompanyQAPanel: posting/editing an answer silently no-ops (same
--        UPDATE/USING shape) while toast.success fires anyway -- the exact
--        false-success pattern already fixed once today in
--        BulkMessageComposer.
--   - company_updates: "Company admins manage updates" (ALL)
--     -> CompanyUpdatesEditor: same INSERT-throws / UPDATE-DELETE-silently-
--        no-ops split as content blocks.
--
-- Fixed all six with the same company_members/legacy-user_profiles
-- membership check already used by every other fix shipped today.

DROP POLICY IF EXISTS "Company admins read their company reviews" ON company_reviews;
CREATE POLICY "Company members read their company reviews"
  ON company_reviews FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_reviews.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = company_reviews.company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );

DROP POLICY IF EXISTS "Company admins manage responses for their company" ON company_review_responses;
CREATE POLICY "Company members manage responses for their company"
  ON company_review_responses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_review_responses.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = company_review_responses.company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  )
  WITH CHECK (
    responder_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = company_review_responses.company_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() AND up.company_id = company_review_responses.company_id AND up.role = 'company'
          AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
      )
    )
  );

DROP POLICY IF EXISTS "Company admins read their page views" ON company_page_views;
CREATE POLICY "Company members read their page views"
  ON company_page_views FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_page_views.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = company_page_views.company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );

DROP POLICY IF EXISTS "Company admins manage content blocks" ON company_content_blocks;
CREATE POLICY "Company members manage content blocks"
  ON company_content_blocks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_content_blocks.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = company_content_blocks.company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_content_blocks.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = company_content_blocks.company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );

DROP POLICY IF EXISTS "Company admins answer" ON company_questions;
CREATE POLICY "Company members answer"
  ON company_questions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_questions.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = company_questions.company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  )
  WITH CHECK (
    answerer_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = company_questions.company_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() AND up.company_id = company_questions.company_id AND up.role = 'company'
          AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
      )
    )
  );

DROP POLICY IF EXISTS "Company admins manage updates" ON company_updates;
CREATE POLICY "Company members manage updates"
  ON company_updates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_updates.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = company_updates.company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM company_members cm
        WHERE cm.company_id = company_updates.company_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() AND up.company_id = company_updates.company_id AND up.role = 'company'
          AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
      )
    )
  );
