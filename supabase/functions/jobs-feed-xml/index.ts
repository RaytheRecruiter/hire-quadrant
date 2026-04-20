// Supabase Edge Function: jobs-feed-xml
// Public XML feed for aggregators (Indeed, Glassdoor, Jooble, Adzuna, SimplyHired).
// No auth required — this is meant to be publicly crawled.
// Use URL: https://<project>.functions.supabase.co/jobs-feed-xml

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BASE_URL = Deno.env.get('SITE_URL') || 'https://hirequadrant.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(str: string | null | undefined): string {
  if (!str) return '';
  return `<![CDATA[${String(str).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

serve(async () => {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, description, company, location, type, salary, min_salary, max_salary, posted_date, application_deadline, external_url')
    .order('posted_date', { ascending: false })
    .limit(2000);

  if (error) {
    return new Response(`<?xml version="1.0"?><error>${escapeXml(error.message)}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const items = (jobs || [])
    .map((j) => {
      const jobUrl = `${BASE_URL}/jobs/${j.id}`;
      return `  <job>
    <referencenumber>${escapeXml(j.id)}</referencenumber>
    <title>${cdata(j.title)}</title>
    <date>${escapeXml(new Date(j.posted_date).toUTCString())}</date>
    <url>${escapeXml(jobUrl)}</url>
    <company>${cdata(j.company || '')}</company>
    <city>${cdata(j.location || '')}</city>
    <country>US</country>
    <description>${cdata(j.description || '')}</description>
    <jobtype>${escapeXml(j.type || 'full-time')}</jobtype>
    ${j.salary ? `<salary>${cdata(j.salary)}</salary>` : ''}
    ${j.application_deadline ? `<expirationdate>${escapeXml(new Date(j.application_deadline).toUTCString())}</expirationdate>` : ''}
  </job>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>HireQuadrant</publisher>
  <publisherurl>${BASE_URL}</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</source>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
