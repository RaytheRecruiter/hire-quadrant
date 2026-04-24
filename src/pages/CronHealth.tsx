import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { Activity, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface RunRow {
  id: number;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'failure';
  duration_ms: number | null;
  error_message: string | null;
}

interface JobSummary {
  job_name: string;
  last_run: RunRow | null;
  success_count_24h: number;
  failure_count_24h: number;
}

const CronHealth: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [summaries, setSummaries] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('cron_runs')
        .select('*')
        .gte('started_at', dayAgo)
        .order('started_at', { ascending: false })
        .limit(500);
      if (cancelled) return;

      const map = new Map<string, JobSummary>();
      (data ?? []).forEach((r: RunRow) => {
        const name = r.job_name;
        const cur = map.get(name) ?? {
          job_name: name,
          last_run: null,
          success_count_24h: 0,
          failure_count_24h: 0,
        };
        if (!cur.last_run || cur.last_run.started_at < r.started_at) {
          cur.last_run = r;
        }
        if (r.status === 'success') cur.success_count_24h += 1;
        if (r.status === 'failure') cur.failure_count_24h += 1;
        map.set(name, cur);
      });
      setSummaries(Array.from(map.values()).sort((a, b) => a.job_name.localeCompare(b.job_name)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/admin/cron" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <>
      <Helmet>
        <title>Cron Health · HireQuadrant</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Cron health</h1>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Last 24 hours of scheduled job runs, from `cron_runs`.
              </p>
            </div>
          </header>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary-500 mx-auto" />
            ) : summaries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                No cron runs logged in the last 24 hours.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {summaries.map((s) => {
                  const ok = s.last_run?.status === 'success';
                  const failed = s.last_run?.status === 'failure';
                  return (
                    <li key={s.job_name} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {ok ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : failed ? (
                            <XCircle className="h-4 w-4 text-rose-500" />
                          ) : (
                            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                          )}
                          <p className="text-sm font-medium text-secondary-900 dark:text-white">
                            {s.job_name}
                          </p>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                          {s.last_run
                            ? `Last run ${formatDistanceToNow(new Date(s.last_run.started_at), {
                                addSuffix: true,
                              })}`
                            : 'No runs yet'}
                          {s.last_run?.duration_ms != null &&
                            ` · ${(s.last_run.duration_ms / 1000).toFixed(1)}s`}
                        </p>
                        {s.last_run?.error_message && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                            {s.last_run.error_message}
                          </p>
                        )}
                      </div>
                      <div className="text-[11px] text-right flex flex-col items-end">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {s.success_count_24h} ok
                        </span>
                        <span className="text-rose-600 dark:text-rose-400">
                          {s.failure_count_24h} fail
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CronHealth;
