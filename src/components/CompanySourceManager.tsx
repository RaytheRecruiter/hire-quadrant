import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface SourceRow {
  source_company: string | null;
  source_xml_file: string | null;
  jobCount: number;
  unlinkedCount: number;
  latestPosted: string | null;
}

// Reads distinct source_company values out of the jobs table and shows
// what's actually been ingested. Replaces the prior hardcoded demo UI
// that listed three static XML paths regardless of database state
// (Ray QA 2026-05-20).
const CompanySourceManager: React.FC = () => {
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      // PostgREST doesn't support GROUP BY directly; pull a wide-enough
      // page and aggregate client-side. There are ~hundreds of jobs in
      // prod, well under the 10k limit.
      const { data, error: err } = await supabase
        .from('jobs')
        .select('company, company_id, source_company, source_xml_file, posted_date')
        .limit(10000);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const byKey = new Map<string, SourceRow>();
      for (const j of (data ?? []) as Array<{
        company: string | null;
        company_id: string | null;
        source_company: string | null;
        source_xml_file: string | null;
        posted_date: string | null;
      }>) {
        // Group by source_company; fall back to company name for
        // ingested rows that pre-date source attribution.
        const key = (j.source_company || j.company || '(unknown)').trim();
        const xmlFile = j.source_xml_file || null;
        const compositeKey = `${key}|${xmlFile ?? ''}`;
        const row = byKey.get(compositeKey) ?? {
          source_company: key,
          source_xml_file: xmlFile,
          jobCount: 0,
          unlinkedCount: 0,
          latestPosted: null,
        };
        row.jobCount += 1;
        if (!j.company_id) row.unlinkedCount += 1;
        if (j.posted_date && (!row.latestPosted || j.posted_date > row.latestPosted)) {
          row.latestPosted = j.posted_date;
        }
        byKey.set(compositeKey, row);
      }
      const sorted = Array.from(byKey.values()).sort((a, b) => b.jobCount - a.jobCount);
      setRows(sorted);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const totals = useMemo(() => {
    const totalJobs = rows.reduce((acc, r) => acc + r.jobCount, 0);
    const totalUnlinked = rows.reduce((acc, r) => acc + r.unlinkedCount, 0);
    return { totalJobs, totalUnlinked };
  }, [rows]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Company Source Manager</h1>
          <p className="text-gray-600 dark:text-slate-400">
            Inbound XML feeds & ingested job counts. Pulled live from <code>jobs.source_company</code>.
          </p>
        </div>
        <button
          onClick={() => setRefreshTick((t) => t + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {totals.totalUnlinked > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm flex gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <strong>{totals.totalUnlinked}</strong> of {totals.totalJobs} ingested jobs are missing a{' '}
            <code>company_id</code> link to the companies table. These jobs are visible on Browse Jobs
            (name match) but won't count toward Browse Companies totals. Run the company_id backfill
            migration to fix historical rows.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-xl text-sm">
          Could not load sources: {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">XML File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Jobs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Unlinked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Latest Post</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                    <Loader2 className="inline h-5 w-5 animate-spin" /> Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                    No sources found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.source_company}|${r.source_xml_file ?? ''}`} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-lg mr-3">
                          <Building2 className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {r.source_company || '(unknown)'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                      {r.source_xml_file ? (
                        <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{r.source_xml_file}</code>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {r.jobCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                      {r.unlinkedCount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {r.unlinkedCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                      {r.latestPosted ? new Date(r.latestPosted).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How ingestion works</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>1.</strong> External feeds (e.g., JobDiva) are fetched by <code>scripts/migrateJobs.ts</code> running with the service-role key.</p>
          <p><strong>2.</strong> Parsed jobs are upserted into <code>jobs</code> with <code>source_company</code> and <code>source_xml_file</code> set from the feed name.</p>
          <p><strong>3.</strong> To count toward Browse Companies, each job needs a <code>company_id</code> FK linking it to a row in the <code>companies</code> table. Run the backfill migration if you see entries in the <em>Unlinked</em> column.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySourceManager;
