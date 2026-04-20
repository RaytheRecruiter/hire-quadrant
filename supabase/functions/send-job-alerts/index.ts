// Supabase Edge Function: send-job-alerts
// Runs on a schedule (pg_cron or Supabase scheduled triggers)
// Iterates saved_searches, finds new matching jobs, emails digests via SendGrid

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'alerts@hirequadrant.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_term: string | null;
  location_filter: string | null;
  type_filter: string | null;
  min_salary: number | null;
  email_frequency: 'daily' | 'weekly' | 'never';
  last_sent_at: string | null;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: 'HireQuadrant' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid: ${res.status} ${await res.text()}`);
}

function buildJobsHtml(alertName: string, jobs: any[]): string {
  const rows = jobs
    .map(
      j => `
    <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin-bottom:12px;">
      <a href="https://hirequadrant.com/jobs/${j.id}" style="color:#4a9960;font-weight:600;text-decoration:none;font-size:16px;">${j.title}</a>
      <div style="color:#555;font-size:14px;margin-top:4px;">${j.company || ''} • ${j.location || ''}</div>
      ${j.salary ? `<div style="color:#4a9960;font-size:13px;margin-top:4px;font-weight:600;">${j.salary}</div>` : ''}
    </div>
  `
    )
    .join('');

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a3a2a;">New jobs for: ${alertName}</h2>
      <p style="color:#555;">We found ${jobs.length} new match${jobs.length === 1 ? '' : 'es'}.</p>
      ${rows}
      <p style="margin-top:24px;font-size:12px;color:#888;">
        <a href="https://hirequadrant.com/alerts" style="color:#4a9960;">Manage your alerts</a>
      </p>
    </div>
  `;
}

serve(async (req) => {
  try {
    // Auth: expect a shared secret in header (set by pg_cron call)
    const authHeader = req.headers.get('authorization') || '';
    const expected = `Bearer ${Deno.env.get('CRON_SECRET')}`;
    if (authHeader !== expected) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Load due alerts
    const { data: searches, error: searchError } = await supabase
      .from('saved_searches')
      .select('*, user:auth.users!user_id(email)')
      .neq('email_frequency', 'never');

    if (searchError) throw searchError;

    const now = new Date();
    const results: any[] = [];

    for (const s of (searches || []) as any[]) {
      const frequencyHours = s.email_frequency === 'daily' ? 24 : 24 * 7;
      const lastSent = s.last_sent_at ? new Date(s.last_sent_at) : new Date(0);
      const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSince < frequencyHours) continue;

      // Build the query to find new matching jobs posted since last send
      let q = supabase
        .from('jobs')
        .select('id, title, company, location, salary, posted_date')
        .gt('posted_date', lastSent.toISOString())
        .order('posted_date', { ascending: false })
        .limit(20);

      if (s.search_term) {
        q = q.or(`title.ilike.%${s.search_term}%,description.ilike.%${s.search_term}%`);
      }
      if (s.location_filter) q = q.ilike('location', `%${s.location_filter}%`);
      if (s.type_filter) q = q.eq('type', s.type_filter);
      if (s.min_salary) q = q.gte('min_salary', s.min_salary);

      const { data: jobs } = await q;
      if (!jobs || jobs.length === 0) continue;

      const userEmail = s.user?.email;
      if (!userEmail) continue;

      try {
        await sendEmail(
          userEmail,
          `${jobs.length} new job${jobs.length === 1 ? '' : 's'} for "${s.name}"`,
          buildJobsHtml(s.name, jobs),
        );
        await supabase
          .from('saved_searches')
          .update({ last_sent_at: now.toISOString() })
          .eq('id', s.id);
        results.push({ alert: s.name, sent: jobs.length });
      } catch (emailErr) {
        console.error('Email failed for', s.id, emailErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
