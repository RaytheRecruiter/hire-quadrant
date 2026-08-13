-- Ray: "My Jobs should have the option to be open or closed. We don't want
-- to delete the job, this is a history feature for the company."
--
-- Adds an open/closed status to jobs instead of relying on delete. Existing
-- rows default to 'open' so nothing currently live disappears from public
-- listings. Idempotent.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('open', 'closed'));

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
