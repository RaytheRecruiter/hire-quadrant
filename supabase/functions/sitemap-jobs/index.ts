// Edge Function: sitemap-jobs
// Public dynamic sitemap for all job pages — referenced from /sitemap.xml
// Deploy: supabase functions deploy sitemap-jobs

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Trim — operators have pasted SITE_URL with a leading tab in supabase secrets,
// which produced invalid <loc>\thttps://...</loc> entries (sitemap.org spec
// forbids whitespace in <loc>; sitemap-pages already does this).
const BASE_URL = (Deno.env.get('SITE_URL') || 'https://hirequadrant.com').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async () => {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, posted_date')
    .order('posted_date', { ascending: false })
    .limit(50000);

  if (error) {
    return new Response(`<?xml version="1.0"?><error>${error.message}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const items = (jobs || [])
    .map((j) => {
      const lastmod = j.posted_date ? new Date(j.posted_date).toISOString().slice(0, 10) : '';
      const id = String(j.id).trim();
      return `  <url>
    <loc>${BASE_URL}/jobs/${id}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
