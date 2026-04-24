import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircleWarning, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import RatingStars from '../components/companies/RatingStars';

interface AppealRow {
  id: string;
  title: string;
  pros: string | null;
  cons: string | null;
  rating_overall: number;
  rejected_reason: string | null;
  appeal_text: string;
  appeal_submitted_at: string;
  company?: { name: string; slug: string } | null;
}

const ReviewAppeals: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AppealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('company_reviews')
      .select(
        'id, title, pros, cons, rating_overall, rejected_reason, appeal_text, appeal_submitted_at, company:companies(name, slug)',
      )
      .eq('appeal_status', 'pending')
      .order('appeal_submitted_at', { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const decide = async (r: AppealRow, approve: boolean) => {
    setActingId(r.id);
    const updates: Record<string, unknown> = approve
      ? { appeal_status: 'approved', status: 'approved', rejected_reason: null }
      : { appeal_status: 'rejected' };
    const { error } = await supabase.from('company_reviews').update(updates).eq('id', r.id);
    setActingId(null);
    if (error) return toast.error(error.message);
    toast.success(approve ? 'Appeal granted, review reinstated' : 'Appeal denied');
    setRows((rs) => rs.filter((x) => x.id !== r.id));
  };

  return (
    <>
      <Helmet><title>Review Appeals · Admin · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <HardLink to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Admin
          </HardLink>

          <header className="mb-6 flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
              <MessageCircleWarning className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Review Appeals</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {loading ? 'Loading…' : `${rows.length} pending ${rows.length === 1 ? 'appeal' : 'appeals'}`}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <p className="text-gray-600 dark:text-slate-400">No pending appeals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((r) => (
                <article key={r.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                  <header className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {r.company && (
                          <HardLink to={`/companies/${r.company.slug}`} className="text-xs font-medium text-primary-600 hover:underline">
                            {r.company.name}
                          </HardLink>
                        )}
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          Appealed {formatDistanceToNow(new Date(r.appeal_submitted_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{r.title}</h3>
                    </div>
                    <RatingStars value={r.rating_overall} size="md" showValue />
                  </header>

                  {r.rejected_reason && (
                    <p className="text-xs text-rose-700 dark:text-rose-400 mb-3">
                      Original rejection reason: {r.rejected_reason}
                    </p>
                  )}

                  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-lg px-3 py-2 mb-3">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-0.5">Author's appeal</p>
                    <p className="text-sm text-secondary-900 dark:text-white whitespace-pre-line">{r.appeal_text}</p>
                  </div>

                  {r.pros && (
                    <div className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Pros: </span>
                      <span className="whitespace-pre-line">{r.pros}</span>
                    </div>
                  )}
                  {r.cons && (
                    <div className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                      <span className="font-semibold text-rose-700 dark:text-rose-400">Cons: </span>
                      <span className="whitespace-pre-line">{r.cons}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => decide(r, true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" /> Grant (reinstate review)
                    </button>
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => decide(r, false)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> Deny
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReviewAppeals;
