// Edge Function: sitemap-pages
// Static sitemap for all non-job pages
// Deploy: supabase functions deploy sitemap-pages

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const BASE_URL = Deno.env.get('SITE_URL') || 'https://hirequadrant.com';

const pages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/companies', priority: '0.8', changefreq: 'weekly' },
  { path: '/advanced-search', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { path: '/blog', priority: '0.7', changefreq: 'weekly' },
];

serve(() => {
  const items = pages
    .map((p) => `  <url>
    <loc>${BASE_URL}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});
