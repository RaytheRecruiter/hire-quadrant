// Per Scott 2026-04-29 Phase 2 #4: Recruiter Activity Reports.
// Calls the recruiter_activity(company_id, since) RPC and renders a
// per-team-member productivity table. Gated on view_analytics_full —
// it's a manager-level report, not basic analytics.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Users,
  Briefcase,
  Eye,
  MessageSquare,
  Clock,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../utils/supabaseClient';
import { usePermissions } from '../../hooks/usePermissions';

interface Props {
  companyId: string;
}

interface ActivityRow {
  user_id: string;
  jobs_posted: number;
  applicants_reviewed: number;
  messages_sent: number;
  last_active: string | null;
  // Hydrated client-side from user_profiles
  name?: string | null;
  email?: string | null;
}

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const;

const RecruiterActivityPanel: React.FC<Props> = ({ companyId }) => {
  const { isOwner, isAdmin, can, member } = usePermissions();
  const noMember = !member;
  const canView = noMember || isOwner || isAdmin || can('view_analytics_full');

  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error: rpcError } = await supabase.rpc('recruiter_activity', {
        p_company_id: companyId,
        p_since: since,
      });
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message);
        setRows([]);
        setLoading(false);
        return;
      }
      const activity = (data || []) as ActivityRow[];
      // Hydrate names/emails from user_profiles.
      const userIds = activity.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
      if (cancelled) return;
      const profileMap = new Map(
        (profiles || []).map((p: { id: string; name: string | null; email: string | null }) => [
          p.id,
          { name: p.name, email: p.email },
        ]),
      );
      setRows(
        activity.map((r) => ({
          ...r,
          name: profileMap.get(r.user_id)?.name ?? null,
          email: profileMap.get(r.user_id)?.email ?? null,
        })),
      );
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [companyId, days, canView]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        jobs: acc.jobs + Number(r.jobs_posted),
        reviews: acc.reviews + Number(r.applicants_reviewed),
        messages: acc.messages + Number(r.messages_sent),
      }),
      { jobs: 0, reviews: 0, messages: 0 },
    );
  }, [rows]);

  if (!canView) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Recruiter activity reports restricted</p>
            <p className="text-sm text-amber-800 mt-1">
              Ask your Owner or Admin to grant the "View full analytics" permission.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Recruiter Activity</h2>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`px-3 py-1 text-xs rounded ${
                days === r.days
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard icon={Briefcase} label="Jobs posted" value={totals.jobs} accent="bg-primary-100 text-primary-700" />
        <SummaryCard icon={Eye} label="Applicants reviewed" value={totals.reviews} accent="bg-emerald-100 text-emerald-700" />
        <SummaryCard icon={MessageSquare} label="Messages sent" value={totals.messages} accent="bg-amber-100 text-amber-700" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Per-member table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 dark:text-slate-400">
            <Users className="h-8 w-8 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            No team activity in this window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/30 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Team Member</th>
                  <th className="px-4 py-3 text-right">Jobs</th>
                  <th className="px-4 py-3 text-right">Reviewed</th>
                  <th className="px-4 py-3 text-right">Messages</th>
                  <th className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" /> Last active
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {rows.map((r) => (
                  <tr key={r.user_id} className="hover:bg-gray-50 dark:hover:bg-slate-900/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-secondary-900 dark:text-white">
                        {r.name || '—'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{r.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.jobs_posted}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.applicants_reviewed}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.messages_sent}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400 text-xs">
                      {r.last_active
                        ? formatDistanceToNow(new Date(r.last_active), { addSuffix: true })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-slate-400">
        Counts are scoped to your company. "Reviewed" tracks unique applications opened
        via the Review modal. Pre-existing job postings without a recorded poster show
        as 0 jobs until they are re-saved.
      </p>
    </div>
  );
};

const SummaryCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}> = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="text-2xl font-bold text-secondary-900 dark:text-white tabular-nums">{value}</div>
    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</div>
  </div>
);

export default RecruiterActivityPanel;
