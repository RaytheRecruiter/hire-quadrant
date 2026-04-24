import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import RatingStars from '../components/companies/RatingStars';

interface PendingReview {
  id: string;
  company_id: string;
  rating_overall: number;
  title: string;
  pros: string | null;
  cons: string | null;
  employment_status: 'current' | 'former' | null;
  job_title: string | null;
  is_anonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  company?: { name: string; slug: string } | null;
}

const ReviewModeration: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('company_reviews')
      .select(
        'id, company_id, rating_overall, title, pros, cons, employment_status, job_title, is_anonymous, status, created_at, company:companies(name, slug)',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(error.message);
    } else {
      setReviews((data as any) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const decide = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setActingId(id);
    const { error } = await supabase
      .from('company_reviews')
      .update({ status, rejected_reason: status === 'rejected' ? reason ?? 'Did not meet guidelines' : null })
      .eq('id', id);
    setActingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === 'approved' ? 'Approved' : 'Rejected');
    setReviews((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <>
      <Helmet>
        <title>Review Moderation · Admin · HireQuadrant</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <HardLink to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </HardLink>

          <header className="mb-6 flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Review Moderation</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {loading ? 'Loading…' : `${reviews.length} pending ${reviews.length === 1 ? 'review' : 'reviews'}`}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <p className="text-gray-600 dark:text-slate-400">No pending reviews.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <article
                  key={r.id}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5"
                >
                  <header className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                        {r.company ? (
                          <HardLink
                            to={`/companies/${r.company.slug}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {r.company.name}
                          </HardLink>
                        ) : (
                          <span className="italic">Unknown company</span>
                        )}
                        {' · '}
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        {r.job_title ? ` · ${r.job_title}` : ''}
                        {r.employment_status ? ` · ${r.employment_status} employee` : ''}
                        {r.is_anonymous ? ' · anonymous' : ''}
                      </p>
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{r.title}</h3>
                    </div>
                    <RatingStars value={r.rating_overall} size="md" showValue />
                  </header>

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
                      onClick={() => decide(r.id, 'approved')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => {
                        const reason = window.prompt('Optional reason for rejection:') ?? undefined;
                        decide(r.id, 'rejected', reason);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Reject
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

export default ReviewModeration;
