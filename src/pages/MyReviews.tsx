import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Star, Loader2, Clock, CheckCircle2, XCircle, MessageCircleWarning } from 'lucide-react';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import RatingStars from '../components/companies/RatingStars';

interface Row {
  id: string;
  rating_overall: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason: string | null;
  created_at: string;
  appeal_status?: 'none' | 'pending' | 'approved' | 'rejected';
  appeal_text?: string | null;
  appeal_submitted_at?: string | null;
  company?: { name: string; slug: string } | null;
}

const STATUS_STYLE: Record<Row['status'], { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-800', icon: XCircle },
};

const MyReviews: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('company_reviews')
      .select('id, rating_overall, title, status, rejected_reason, created_at, appeal_status, appeal_text, appeal_submitted_at, company:companies(name, slug)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [appealText, setAppealText] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const submitAppeal = async (reviewId: string) => {
    const text = appealText.trim();
    if (text.length < 20) {
      toast.error('Please provide at least 20 characters explaining your appeal');
      return;
    }
    setSubmittingAppeal(true);
    const { error } = await supabase
      .from('company_reviews')
      .update({
        appeal_text: text,
        appeal_submitted_at: new Date().toISOString(),
        appeal_status: 'pending',
      })
      .eq('id', reviewId);
    setSubmittingAppeal(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Appeal submitted — a moderator will review it');
    setAppealingId(null);
    setAppealText('');
    load();
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/my-reviews" replace />;

  return (
    <>
      <Helmet><title>My Reviews · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">My Reviews</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Reviews you've written for companies on HireQuadrant.
            </p>
          </header>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <Star className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400 mb-3">You haven't written any reviews yet.</p>
              <HardLink to="/companies" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Browse companies →
              </HardLink>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const s = STATUS_STYLE[r.status];
                const StatusIcon = s.icon;
                return (
                  <article key={r.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                    <header className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${s.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {s.label}
                          </span>
                          {r.company && (
                            <HardLink to={`/companies/${r.company.slug}`} className="text-xs font-medium text-primary-600 hover:underline">
                              {r.company.name}
                            </HardLink>
                          )}
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-secondary-900 dark:text-white">{r.title}</h3>
                      </div>
                      <RatingStars value={r.rating_overall} size="md" showValue />
                    </header>
                    {r.rejected_reason && (
                      <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                        Moderator note: {r.rejected_reason}
                      </p>
                    )}

                    {r.status === 'rejected' && r.appeal_status === 'none' && appealingId !== r.id && (
                      <button
                        type="button"
                        onClick={() => { setAppealingId(r.id); setAppealText(''); }}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-700 dark:text-primary-300 hover:underline"
                      >
                        <MessageCircleWarning className="h-3.5 w-3.5" />
                        Appeal this decision
                      </button>
                    )}
                    {r.status === 'rejected' && appealingId === r.id && (
                      <div className="mt-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                        <textarea
                          rows={3}
                          value={appealText}
                          onChange={(e) => setAppealText(e.target.value)}
                          placeholder="Explain why you think this review meets our content policy (min 20 chars)"
                          maxLength={1500}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setAppealingId(null)} className="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700">
                            Cancel
                          </button>
                          <button type="button" onClick={() => submitAppeal(r.id)} disabled={submittingAppeal} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
                            {submittingAppeal && <Loader2 className="h-3 w-3 animate-spin" />}
                            Submit appeal
                          </button>
                        </div>
                      </div>
                    )}
                    {r.appeal_status === 'pending' && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Appeal pending review
                      </p>
                    )}
                    {r.appeal_status === 'approved' && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Appeal granted
                      </p>
                    )}
                    {r.appeal_status === 'rejected' && (
                      <p className="text-xs text-rose-700 dark:text-rose-400 mt-2 inline-flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Appeal denied
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyReviews;
