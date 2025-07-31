-- Create jobs table for storing job listings
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  salary TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]',
  benefits JSONB NOT NULL DEFAULT '[]',
  posted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  application_deadline TIMESTAMPTZ NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  applications INTEGER NOT NULL DEFAULT 0,
  source_company TEXT,
  source_xml_file TEXT,
  external_job_id TEXT,
  external_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX IF NOT EXISTS idx_jobs_source_company ON jobs(source_company);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access" ON jobs
  FOR SELECT USING (true);

-- Create a policy to allow authenticated users to insert/update (adjust as needed)
CREATE POLICY "Allow authenticated insert/update" ON jobs
  FOR ALL USING (auth.role() = 'authenticated');