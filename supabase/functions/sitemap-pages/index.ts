// Edge Function: sitemap-pages
// Dynamic sitemap: static marketing pages + every public company,
// industry landing page, city/location landing page, and blog post.
// Job detail URLs live in sitemap-jobs (separate function).
// Deploy: supabase functions deploy sitemap-pages

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BASE_URL = Deno.env.get('SITE_URL') || 'https://hirequadrant.com';

const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/companies', priority: '0.8', changefreq: 'weekly' },
  { path: '/advanced-search', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { path: '/blog', priority: '0.7', changefreq: 'weekly' },
  { path: '/career', priority: '0.6', changefreq: 'weekly' },
];

function toSeoSlug(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function urlTag(loc: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

serve(async () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_KEY =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const items: string[] = staticPages.map((p) =>
    urlTag(`${BASE_URL}${p.path}`, p.changefreq, p.priority),
  );

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      });

      // Every public company row (directory view filters to only companies
      // with jobs OR reviews, which is what we want indexed)
      const { data: companies } = await supabase
        .from('public_company_directory')
        .select('slug, industry, location');

      const industrySet = new Set<string>();
      const locationSet = new Set<string>();

      (companies ?? []).forEach((c: { slug: string; industry: string | null; location: string | null }) => {
        if (c.slug) {
          items.push(urlTag(`${BASE_URL}/companies/${c.slug}`, 'weekly', '0.7'));
        }
        if (c.industry) industrySet.add(c.industry);
      });

      // Every distinct jobs.location (covers locations without a company row)
      const { data: jobLocations } = await supabase
        .from('jobs')
        .select('location')
        .not('location', 'is', null)
        .limit(5000);
      (jobLocations ?? []).forEach((j: { location: string | null }) => {
        if (j.location) locationSet.add(j.location);
      });

      industrySet.forEach((industry) => {
        const slug = toSeoSlug(industry);
        if (slug) items.push(urlTag(`${BASE_URL}/companies/industry/${slug}`, 'weekly', '0.6'));
      });

      locationSet.forEach((location) => {
        const slug = toSeoSlug(location);
        if (slug) items.push(urlTag(`${BASE_URL}/jobs/location/${slug}`, 'daily', '0.6'));
      });

      // Blog posts
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('is_published', true);
      (blogPosts ?? []).forEach((b: { slug: string | null }) => {
        if (b.slug) items.push(urlTag(`${BASE_URL}/blog/${b.slug}`, 'monthly', '0.5'));
      });
    } catch (e) {
      // If Supabase lookups fail, fall through with just the static pages
      // so the sitemap is always served.
      console.error('sitemap-pages: dynamic URL fetch failed', e);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
