import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyDashboardReviews } from '../../hooks/useCompanyDashboardReviews';
import type { CompanyReview } from '../../hooks/useCompanyReviews';
import RatingStars from '../companies/RatingStars';

interface Props {
  companyId: string;
}

const STATUS_STYLE: Record<CompanyReview['status'], { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: {
    label: 'Pending moderation',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    icon: XCircle,
  },
};

const ResponseEditor: React.FC<{
  review: CompanyReview;
  companyId: string;
  onSaved: () => void;
}> = ({ review, companyId, onSaved }) => {
  const { user } = useAuth();
  const [body, setBody] = useState(review.response?.body ?? '');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user?.id) return;
    if (body.trim().length < 5) {
      toast.error('Response should be at least 5 characters');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('company_review_responses')
      .upsert(
        {
          review_id: review.id,
          company_id: companyId,
          responder_id: user.id,
          body: body.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'review_id' },
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Response saved');
    setOpen(false);
    onSaved();
  };

  if (!open && !review.response) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-primary-700 dark:text-primary-300 hover:underline"
      >
        <MessageSquare className="h-4 w-4" />
        Respond to this review
      </button>
    );
  }

  if (!open && review.response) {
    return (
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
            Your response · {formatDistanceToNow(new Date(review.response.created_at), { addSuffix: true })}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-primary-700 dark:text-primary-300 hover:underline"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-secondary-900 dark:text-white whitespace-pre-line">
          {review.response.body}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        placeholder="Write a public response to this review"
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save response
        </button>
      </div>
    </div>
  );
};

const CompanyReviewsPanel: React.FC<Props> = ({ companyId }) => {
  const { reviews, loading, error, refresh } = useCompanyDashboardReviews(companyId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.pros ?? '').toLowerCase().includes(q) ||
        (r.cons ?? '').toLowerCase().includes(q) ||
        (r.job_title ?? '').toLowerCase().includes(q)
      );
    });
  }, [reviews, search, statusFilter]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-sm text-red-800 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
        <p className="text-gray-600 dark:text-slate-400">No reviews yet for your company.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search reviews — title, pros, cons, job title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          aria-label="Status filter"
          className="text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <p className="text-xs text-gray-500 dark:text-slate-400">
        Showing {filtered.length} of {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            No reviews match the current filters.
          </p>
        </div>
      ) : null}

      {filtered.map((r) => {
        const s = STATUS_STYLE[r.status];
        const StatusIcon = s.icon;
        return (
          <article
            key={r.id}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5"
          >
            <header className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${s.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {s.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                  {r.job_title && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">· {r.job_title}</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{r.title}</h3>
              </div>
              <RatingStars value={r.rating_overall} size="md" showValue />
            </header>

            {r.pros && (
              <div className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 mr-1">
                  <ThumbsUp className="h-3.5 w-3.5" /> Pros:
                </span>
                <span className="whitespace-pre-line">{r.pros}</span>
              </div>
            )}
            {r.cons && (
              <div className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400 mr-1">
                  <ThumbsDown className="h-3.5 w-3.5" /> Cons:
                </span>
                <span className="whitespace-pre-line">{r.cons}</span>
              </div>
            )}

            {r.rejected_reason && (
              <p className="text-xs text-rose-700 dark:text-rose-400 mb-3">
                Moderator note: {r.rejected_reason}
              </p>
            )}

            {r.status === 'approved' && (
              <div className="mt-3">
                <ResponseEditor review={r} companyId={companyId} onSaved={refresh} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default CompanyReviewsPanel;
