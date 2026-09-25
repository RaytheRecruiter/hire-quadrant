// Safe wrapper for rendering a job's relative "posted X ago" time.
//
// Added 2026-09-25 as an emergency fix: jobs.posted_date (snake_case, the
// tracked column) is what the DB actually returns, but JobCard.tsx and
// JobDetails.tsx were still reading the legacy camelCase `postedDate` field,
// which was dropped from the schema in
// supabase/migrations/20260921_consolidate_job_source_columns.sql. That left
// `new Date(undefined)` (an Invalid Date) being passed straight into
// date-fns' formatDistanceToNow, which throws `RangeError: Invalid time
// value` instead of returning a fallback string -- crashing the whole page
// via the top-level ErrorBoundary on every job detail view.
import { formatDistanceToNow } from 'date-fns';

export function formatPostedDate(job: { posted_date?: string | null; postedDate?: string | null }): string {
  const raw = job.posted_date || job.postedDate;
  if (!raw) return 'recently';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return 'recently';
  return formatDistanceToNow(date, { addSuffix: true });
}
