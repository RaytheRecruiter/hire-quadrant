import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import HardLink from '../components/HardLink';
import JobCard from '../components/JobCard';
import { supabase } from '../utils/supabaseClient';
import type { Job } from '../contexts/JobContext';
import { prettyFromSlug, toSeoSlug } from '../utils/seoSlug';

const SITE_ORIGIN = 'https://hirequadrant.com';

const LocationPage: React.FC = () => {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pretty = prettyFromSlug(locationSlug ?? '');

  useEffect(() => {
    if (!locationSlug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Pull a reasonable upper bound, then filter by slug in-memory.
        // Locations in jobs are free text ("VA - Tysons", "Washington, DC")
        // so server-side regex would be brittle.
        const { data, error: err } = await supabase
          .from('jobs')
          .select('*')
          .not('location', 'is', null)
          .order('posted_date', { ascending: false })
          .limit(1000);
        if (err) throw err;
        const matched = ((data ?? []) as Job[]).filter(
          (j) => toSeoSlug(j.location) === locationSlug,
        );
        if (!cancelled) setJobs(matched);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationSlug]);

  const pageUrl = `${SITE_ORIGIN}/jobs/location/${locationSlug}`;
  const metaTitle = `Jobs in ${pretty} — HireQuadrant`;
  const metaDesc = `${jobs.length > 0 ? `${jobs.length} open roles` : 'Open roles'} in ${pretty}. Browse the latest positions from companies actively hiring on HireQuadrant.`;

  const itemListLd = useMemo(() => {
    if (jobs.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Jobs in ${pretty}`,
      itemListElement: jobs.slice(0, 20).map((j, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_ORIGIN}/jobs/${j.id}`,
        name: j.title,
      })),
    };
  }, [jobs, pretty]);

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={pageUrl} />
        {itemListLd && <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>}
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            <HardLink to="/" className="hover:text-primary-600">Jobs</HardLink>
            <span className="mx-2">/</span>
            <span className="text-secondary-900 dark:text-white">{pretty}</span>
          </nav>

          <header className="mb-8 flex items-start gap-4">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl flex-shrink-0">
              <MapPin className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-2">
                Jobs in {pretty}
              </h1>
              <p className="text-lg text-gray-600 dark:text-slate-400">
                {loading
                  ? 'Loading…'
                  : `${jobs.length} open ${jobs.length === 1 ? 'role' : 'roles'}`}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-10 w-10 text-primary-500 mx-auto animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400 mb-3">
                No open roles in {pretty} right now.
              </p>
              <HardLink to="/" className="text-primary-600 hover:text-primary-700 font-medium">
                Browse all jobs →
              </HardLink>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LocationPage;
