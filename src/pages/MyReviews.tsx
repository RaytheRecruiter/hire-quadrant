import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { formatDistanceToNow } from 'date-fns';
import { Star, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
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

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('company_reviews')
        .select('id, rating_overall, title, status, rejected_reason, created_at, company:companies(name, slug)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, [user?.id]);

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
