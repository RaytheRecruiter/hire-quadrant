import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Flag, Check, X, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import RatingStars from '../components/companies/RatingStars';

interface ReportRow {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  note: string | null;
  status: 'open' | 'actioned' | 'dismissed';
  created_at: string;
  review?: {
    id: string;
    title: string;
    pros: string | null;
    cons: string | null;
    rating_overall: number;
    status: 'pending' | 'approved' | 'rejected';
    company?: { name: string; slug: string } | null;
  } | null;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  abuse: 'Abuse',
  fake: 'Fake',
  off_topic: 'Off-topic',
  conflict_of_interest: 'Conflict of interest',
  other: 'Other',
};

const ReviewReports: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('company_review_reports')
      .select(
        `id, review_id, reporter_id, reason, note, status, created_at,
         review:company_reviews(
           id, title, pros, cons, rating_overall, status,
           company:companies(name, slug)
         )`,
      )
      .eq('status', 'open')
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(error.message);
    } else {
      setReports((data as any) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const decide = async (
    report: ReportRow,
    action: 'actioned_approve' | 'actioned_reject' | 'dismissed',
  ) => {
    setActingId(report.id);
    try {
      if (action === 'actioned_reject' && report.review?.id) {
        await supabase
          .from('company_reviews')
          .update({ status: 'rejected', rejected_reason: 'Removed after user report' })
          .eq('id', report.review.id);
      }
      const { error } = await supabase
        .from('company_review_reports')
        .update({
          status: action === 'dismissed' ? 'dismissed' : 'actioned',
          decided_at: new Date().toISOString(),
        })
        .eq('id', report.id);
      if (error) throw error;
      toast.success(action === 'dismissed' ? 'Dismissed' : 'Actioned');
      setReports((rs) => rs.filter((r) => r.id !== report.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Review Reports · Admin · HireQuadrant</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <HardLink to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </HardLink>

          <header className="mb-6 flex items-center gap-3">
            <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-xl">
              <Flag className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Review Reports</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {loading ? 'Loading…' : `${reports.length} open ${reports.length === 1 ? 'report' : 'reports'}`}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <p className="text-gray-600 dark:text-slate-400">No open reports.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <article
                  key={r.id}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5"
                >
                  <header className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200">
                          <AlertTriangle className="h-3 w-3" />
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          Reported {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </span>
                        {r.review?.company && (
                          <HardLink
                            to={`/companies/${r.review.company.slug}`}
                            className="text-xs font-medium text-primary-600 hover:underline"
                          >
                            {r.review.company.name}
                          </HardLink>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                        {r.review?.title ?? '(review deleted)'}
                      </h3>
                      {r.note && (
                        <p className="text-sm text-gray-700 dark:text-slate-300 mt-1 italic">
                          "{r.note}"
                        </p>
                      )}
                    </div>
                    {r.review && (
                      <RatingStars value={r.review.rating_overall} size="md" showValue />
                    )}
                  </header>

                  {r.review?.pros && (
                    <div className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Pros: </span>
                      <span className="whitespace-pre-line">{r.review.pros}</span>
                    </div>
                  )}
                  {r.review?.cons && (
                    <div className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                      <span className="font-semibold text-rose-700 dark:text-rose-400">Cons: </span>
                      <span className="whitespace-pre-line">{r.review.cons}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => decide(r, 'actioned_reject')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Remove review
                    </button>
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => decide(r, 'dismissed')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      Dismiss report
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

export default ReviewReports;
