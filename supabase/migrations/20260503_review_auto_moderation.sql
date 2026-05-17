-- Per Ray 2026-05-03: reviews are now auto-moderated by Claude Haiku 4.5
-- (see ai-helpers /moderate-review). The client calls the moderator first
-- and inserts with status='approved' on a clean pass, or 'pending' if the
-- moderator is unreachable. Existing RLS only allowed status='pending' on
-- insert, and the touch trigger force-reset status to 'pending' on every
-- author edit — both of those need to relax.

-- ─── INSERT: allow approved + pending ─────────────────────────────────────
drop policy if exists "Authenticated users insert their own review" on company_reviews;
create policy "Authenticated users insert their own review"
  on company_reviews for insert to authenticated
  with check (author_id = auth.uid() and status in ('pending', 'approved'));

-- ─── UPDATE: same relaxation for author re-edits ──────────────────────────
drop policy if exists "Authors update their own review" on company_reviews;
create policy "Authors update their own review"
  on company_reviews for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and status in ('pending', 'approved'));

-- ─── Trigger: stop force-resetting status on content edits ────────────────
-- The original trigger flipped status back to 'pending' when an author
-- edited their already-approved review, so a human moderator would
-- re-review. With AI moderation that gate is now on the client side, so
-- we just bump updated_at and trust the moderator's verdict.
create or replace function touch_company_review()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
