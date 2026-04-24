import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, MapPin, Building2, Loader2, TrendingUp } from 'lucide-react';
import HardLink from '../components/HardLink';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { supabase } from '../utils/supabaseClient';
import { prettyFromSlug, toSeoSlug } from '../utils/seoSlug';

const ORIGIN = 'https://hirequadrant.com';

const INDUSTRY_DESCRIPTIONS: Record<string, string> = {
  technology: 'Software, cloud, AI, and hardware companies building the tools people use daily.',
  healthcare: 'Hospitals, clinics, biotech, and medical device companies hiring across roles.',
  finance: 'Banks, fintech, asset managers, and insurance companies recruiting across the US.',
  manufacturing: 'Industrial, automotive, and consumer goods manufacturers.',
  retail: 'Retailers, ecommerce platforms, and brand operators hiring at scale.',
  government: 'Public sector, defense, and federal contracting opportunities.',
  education: 'Colleges, K–12 districts, and edtech employers.',
  'non-profit': 'Charities, NGOs, and mission-driven organizations.',
};

const IndustryGuidePage: React.FC = () => {
  const { industrySlug } = useParams<{ industrySlug: string }>();
  const industryName = prettyFromSlug(industrySlug ?? '');
  const lc = (industrySlug ?? '').toLowerCase();
  const description =
    INDUSTRY_DESCRIPTIONS[lc] ??
    `Companies in the ${industryName} industry hiring on HireQuadrant.`;

  const pageUrl = `${ORIGIN}/guide/${industrySlug}`;

  const [companies, setCompanies] = useState<Array<{ slug: string; name: string; location: string | null }>>([]);
  const [jobCount, setJobCount] = useState(0);
  const [topLocations, setTopLocations] = useState<Array<{ location: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [companiesRes, jobsRes] = await Promise.all([
        supabase
          .from('public_company_directory')
          .select('slug, name, location, industry')
          .ilike('industry', industryName)
          .limit(30),
        supabase
          .from('jobs')
          .select('location', { count: 'exact' })
          .ilike('company', `%${industryName}%`)
          .limit(2000),
      ]);
      if (cancelled) return;

      setCompanies(
        (companiesRes.data ?? []).map((c) => ({
          slug: c.slug,
          name: c.name,
          location: c.location,
        })),
      );

      setJobCount(jobsRes.count ?? 0);

      const locMap = new Map<string, number>();
      (jobsRes.data ?? []).forEach((j: { location: string | null }) => {
        if (j.location) locMap.set(j.location, (locMap.get(j.location) ?? 0) + 1);
      });
      setTopLocations(
        Array.from(locMap.entries())
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      );

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [industryName]);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${industryName} careers guide`,
    description,
    mainEntityOfPage: pageUrl,
    author: { '@type': 'Organization', name: 'HireQuadrant' },
    datePublished: '2026-04-24',
  };

  return (
    <>
      <Helmet>
        <title>{industryName} careers guide · HireQuadrant</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbSchema
            className="mb-4"
            items={[
              { name: 'Home', to: '/' },
              { name: 'Industry guides', to: '/guide' },
              { name: industryName },
            ]}
          />

          <header className="mb-8 flex items-start gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl">
              <Compass className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-1">
                {industryName} careers guide
              </h1>
              <p className="text-gray-600 dark:text-slate-400">{description}</p>
            </div>
          </header>

          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary-500" />
                  At a glance
                </h2>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                  <li>
                    <span className="font-semibold text-secondary-900 dark:text-white">
                      {companies.length}
                    </span>{' '}
                    companies listed
                  </li>
                  <li>
                    <span className="font-semibold text-secondary-900 dark:text-white">
                      {jobCount.toLocaleString()}
                    </span>{' '}
                    open roles
                  </li>
                </ul>
                <HardLink
                  to={`/companies/industry/${toSeoSlug(industryName)}`}
                  className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Browse all {industryName} companies →
                </HardLink>
              </section>

              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  Top locations hiring
                </h2>
                {topLocations.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                    No location data yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {topLocations.map((l) => (
                      <li key={l.location} className="flex justify-between">
                        <HardLink
                          to={`/jobs/location/${toSeoSlug(l.location)}`}
                          className="text-secondary-900 dark:text-white hover:text-primary-600"
                        >
                          {l.location}
                        </HardLink>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {l.count} {l.count === 1 ? 'role' : 'roles'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {companies.length > 0 && (
                <section className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                  <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary-500" />
                    Featured {industryName.toLowerCase()} companies
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {companies.map((c) => (
                      <HardLink
                        key={c.slug}
                        to={`/companies/${c.slug}`}
                        className="p-2 text-sm text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 rounded truncate"
                      >
                        {c.name}
                      </HardLink>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IndustryGuidePage;
