// Edge Function: sitemap-pages
// Dynamic sitemap: static marketing pages + every public company,
// industry landing page, city/location landing page, and blog post.
// Job detail URLs live in sitemap-jobs (separate function).
// Deploy: supabase functions deploy sitemap-pages --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Strip any stray whitespace — operators have pasted the env var with a
// leading tab before, which rendered inside every <loc>.
const BASE_URL = (Deno.env.get('SITE_URL') || 'https://hirequadrant.com').trim();

const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/companies', priority: '0.8', changefreq: 'weekly' },
  { path: '/advanced-search', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { path: '/blog', priority: '0.7', changefreq: 'weekly' },
  { path: '/career', priority: '0.6', changefreq: 'weekly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/content-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies', priority: '0.3', changefreq: 'yearly' },
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

  // Debug counters rendered as an XML comment so we can tell in prod
  // why dynamic URLs aren't showing up without needing log access.
  const debug: Record<string, number | string> = {
    has_url: SUPABASE_URL ? 1 : 0,
    has_key: SUPABASE_KEY ? 1 : 0,
    companies: 0,
    industries: 0,
    locations: 0,
    blog_posts: 0,
  };

  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const industrySet = new Set<string>();
    const locationSet = new Set<string>();

    // Each query in its own try/catch so one bad column doesn't nuke the rest.
    try {
      const { data: companies, error } = await supabase
        .from('public_company_directory')
        .select('slug, industry, location');
      if (error) throw error;
      (companies ?? []).forEach(
        (c: { slug: string; industry: string | null; location: string | null }) => {
          if (c.slug) {
            items.push(urlTag(`${BASE_URL}/companies/${c.slug}`, 'weekly', '0.7'));
          }
          if (c.industry) industrySet.add(c.industry);
        },
      );
      debug.companies = companies?.length ?? 0;
    } catch (e) {
      debug.companies_err = String((e as Error).message ?? e).slice(0, 100);
    }

    try {
      const { data: jobLocations, error } = await supabase
        .from('jobs')
        .select('location')
        .not('location', 'is', null)
        .limit(5000);
      if (error) throw error;
      (jobLocations ?? []).forEach((j: { location: string | null }) => {
        if (j.location) locationSet.add(j.location);
      });
    } catch (e) {
      debug.locations_err = String((e as Error).message ?? e).slice(0, 100);
    }

    industrySet.forEach((industry) => {
      const slug = toSeoSlug(industry);
      if (slug) items.push(urlTag(`${BASE_URL}/companies/industry/${slug}`, 'weekly', '0.6'));
    });
    debug.industries = industrySet.size;

    locationSet.forEach((location) => {
      const slug = toSeoSlug(location);
      if (slug) items.push(urlTag(`${BASE_URL}/jobs/location/${slug}`, 'daily', '0.6'));
    });
    debug.locations = locationSet.size;

    try {
      // blog_posts was manually recreated on 2026-04-23 — column name
      // for "is this visible" has varied. Try published flag first,
      // fall back to a broad select if that column doesn't exist.
      let posts: Array<{ slug: string | null }> | null = null;
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('is_published', true);
      if (error) {
        const fallback = await supabase.from('blog_posts').select('slug');
        if (fallback.error) throw fallback.error;
        posts = fallback.data;
        debug.blog_posts_fallback = 1;
      } else {
        posts = data;
      }
      (posts ?? []).forEach((b) => {
        if (b.slug) items.push(urlTag(`${BASE_URL}/blog/${b.slug}`, 'monthly', '0.5'));
      });
      debug.blog_posts = posts?.length ?? 0;
    } catch (e) {
      debug.blog_posts_err = String((e as Error).message ?? e).slice(0, 100);
    }
  }

  const comment = `<!-- sitemap-pages debug: ${JSON.stringify(debug)} -->`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${comment}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
