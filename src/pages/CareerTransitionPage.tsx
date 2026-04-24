import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Sparkles, Briefcase, Loader2, MapPin } from 'lucide-react';
import HardLink from '../components/HardLink';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { supabase } from '../utils/supabaseClient';
import { prettyFromSlug } from '../utils/seoSlug';
import { formatDistanceToNow } from 'date-fns';

const ORIGIN = 'https://hirequadrant.com';

interface JobRow {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  posted_date: string | null;
}

// Shared-skill heuristic: starter words that often bridge roles.
// The landing page's main value is SEO + inspiration — the job list
// is a bonus, driven by "to" title keyword match.
const CareerTransitionPage: React.FC = () => {
  const { fromSlug, toSlug } = useParams<{ fromSlug: string; toSlug: string }>();
  const fromRole = prettyFromSlug(fromSlug ?? '');
  const toRole = prettyFromSlug(toSlug ?? '');

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!toRole) return;
      setLoading(true);
      const { data } = await supabase
        .from('jobs')
        .select('id, title, company, location, posted_date')
        .ilike('title', `%${toRole}%`)
        .order('posted_date', { ascending: false })
        .limit(8);
      if (!cancelled) {
        setJobs((data as JobRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toRole]);

  const pageUrl = `${ORIGIN}/career/from/${fromSlug}/to/${toSlug}`;
  const metaTitle = `${fromRole} to ${toRole}: career transition guide · HireQuadrant`;
  const metaDesc = `How to transition from a ${fromRole} role to ${toRole}. Skills gap, common pivots, and open roles hiring now.`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${fromRole} to ${toRole} career transition`,
    mainEntityOfPage: pageUrl,
    author: { '@type': 'Organization', name: 'HireQuadrant' },
    datePublished: '2026-04-24',
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbSchema
            className="mb-4"
            items={[
              { name: 'Home', to: '/' },
              { name: 'Career paths', to: '/career' },
              { name: `${fromRole} → ${toRole}` },
            ]}
          />

          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-1">
              <span>{fromRole}</span>
              <ArrowRight className="h-4 w-4" />
              <span>{toRole}</span>
            </div>
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-1">
              From {fromRole} to {toRole}
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              A practical path to pivot, with real roles hiring right now.
            </p>
          </header>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary-500" />
              Why this transition works
            </h2>
            <p className="text-sm text-gray-700 dark:text-slate-300">
              Moving from <strong>{fromRole}</strong> to <strong>{toRole}</strong> is
              increasingly common because many underlying skills transfer — communication,
              stakeholder management, and the ability to ship tangible outcomes. What changes
              is the day-to-day focus and tooling.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
              90-day plan
            </h2>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-slate-300 list-decimal list-inside">
              <li>
                <span className="font-semibold">Weeks 1–2:</span> Shadow 3 people currently doing{' '}
                {toRole.toLowerCase()} work. Ask for their job descriptions and weekly calendars.
              </li>
              <li>
                <span className="font-semibold">Weeks 3–6:</span> Do a portfolio project that
                demonstrates {toRole.toLowerCase()} skills. Ship it publicly.
              </li>
              <li>
                <span className="font-semibold">Weeks 7–10:</span> Rewrite your resume bullets to
                lead with {toRole.toLowerCase()} outcomes. Even from a {fromRole.toLowerCase()}{' '}
                role, you have relevant stories — frame them correctly.
              </li>
              <li>
                <span className="font-semibold">Weeks 11–13:</span> Apply. Lean on warm intros
                over cold apps 4:1. Expect the first offers in month 3–4.
              </li>
            </ol>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-primary-500" />
              {toRole} roles hiring now
            </h2>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            ) : jobs.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                No {toRole} roles match right now — check back soon.
              </p>
            ) : (
              <ul className="space-y-2">
                {jobs.map((j) => (
                  <li key={j.id}>
                    <HardLink
                      to={`/jobs/${j.id}`}
                      className="block p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-primary-300"
                    >
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">
                        {j.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{j.company}</span>
                        {j.location && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {j.location}
                            </span>
                          </>
                        )}
                        {j.posted_date && (
                          <>
                            <span>·</span>
                            <span>
                              {formatDistanceToNow(new Date(j.posted_date), { addSuffix: true })}
                            </span>
                          </>
                        )}
                      </p>
                    </HardLink>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex items-center justify-between text-sm">
            <HardLink
              to={`/interview-prep/${toSlug}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Prep for {toRole} interviews →
            </HardLink>
            <HardLink
              to={`/salaries/${toSlug}`}
              className="text-gray-500 hover:text-primary-600"
            >
              See {toRole} salaries →
            </HardLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default CareerTransitionPage;
