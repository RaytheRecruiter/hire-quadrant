-- Migration: Add 2FA, user preferences, email logs, and application tracking tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: user_2fa (Two-Factor Authentication)
CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[] DEFAULT NULL,
  enabled_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: user_preferences (Notification & Privacy Settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  job_recommendations BOOLEAN DEFAULT TRUE,
  application_updates BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  newsletter_subscribed BOOLEAN DEFAULT TRUE,
  dark_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: email_logs (Track all sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, bounced, opened, clicked
  provider TEXT DEFAULT 'sendgrid', -- sendgrid, mailgun, postmark
  provider_id TEXT DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  sent_at TIMESTAMPTZ DEFAULT NULL,
  opened_at TIMESTAMPTZ DEFAULT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: application_status_history (Track status changes)
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_status TEXT DEFAULT NULL,
  new_status TEXT NOT NULL,
  notes TEXT DEFAULT NULL,
  created_by TEXT DEFAULT 'system', -- system, employer, candidate
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: user_notifications (In-app notification inbox)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- application_update, job_recommendation, message, system
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT DEFAULT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: job_alerts (User-created job search alerts)
CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  search_query JSONB NOT NULL, -- {title, location, keywords, salary_min, job_type}
  frequency TEXT DEFAULT 'weekly', -- immediate, daily, weekly
  enabled BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: saved_jobs (User bookmarks)
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Table: job_views (Track job detail page views for analytics)
CREATE TABLE IF NOT EXISTS job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  time_spent_seconds INTEGER DEFAULT 0
);

-- Table: application_ratings (Candidate feedback on job/company)
CREATE TABLE IF NOT EXISTS application_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_rating INTEGER, -- 1-5
  company_notes TEXT,
  interview_experience INTEGER, -- 1-5
  interview_notes TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_application_ratings_application_id ON application_ratings(application_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user_2fa (only user can see their own)
CREATE POLICY "Users can see own 2FA settings" ON user_2fa
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies: user_preferences (only user can modify)
CREATE POLICY "Users can see own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies: user_notifications (only user can see)
CREATE POLICY "Users can see own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: job_alerts (only user can manage)
CREATE POLICY "Users can see own alerts" ON job_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alerts" ON job_alerts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: saved_jobs
CREATE POLICY "Users can see own saved jobs" ON saved_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save jobs" ON saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave jobs" ON saved_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_2fa_updated_at
  BEFORE UPDATE ON user_2fa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_job_alerts_updated_at
  BEFORE UPDATE ON job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
