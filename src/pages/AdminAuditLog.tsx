import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface AuditRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_FILTERS = [
  { value: '', label: 'All actions' },
  { value: 'review_moderation', label: 'Review moderation' },
  { value: 'company_claim', label: 'Company claims' },
  { value: 'report_decision', label: 'Report decisions' },
  { value: 'company_merge', label: 'Company merges' },
];

const AdminAuditLog: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from('admin_audit_feed')
        .select('*')
        .limit(200)
        .order('created_at', { ascending: false });
      if (filter) q = q.eq('action', filter);
      const { data } = await q;
      if (!cancelled) {
        setRows((data as AuditRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, filter]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/admin/audit" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <>
      <Helmet>
        <title>Audit Log · HireQuadrant</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Audit log</h1>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Every moderation action, company claim, report decision, and merge — append-only.
              </p>
            </div>
          </header>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            <div className="mb-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
              >
                {ACTION_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary-500 mx-auto" />
            ) : rows.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                No audit entries match this filter.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {rows.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white">
                          <span className="text-primary-600">{r.actor_name ?? 'System'}</span>{' '}
                          <span className="text-gray-700 dark:text-slate-300">{r.action.replace(/_/g, ' ')}</span>
                          {r.target_type && (
                            <>
                              {' on '}
                              <span className="text-gray-700 dark:text-slate-300">
                                {r.target_type}
                                {r.target_id && ` #${r.target_id.slice(0, 8)}`}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </p>
                        {r.metadata && Object.keys(r.metadata).length > 0 && (
                          <pre className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 overflow-x-auto">
                            {JSON.stringify(r.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAuditLog;
