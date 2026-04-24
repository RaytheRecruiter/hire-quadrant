import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Flag, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  reviewId: string;
  returnTo: string;
}

type Reason = 'spam' | 'abuse' | 'fake' | 'off_topic' | 'conflict_of_interest' | 'other';

const REASON_LABELS: Record<Reason, string> = {
  spam: 'Spam or promotional',
  abuse: 'Abusive or harassing',
  fake: 'Fake or fabricated',
  off_topic: 'Off-topic',
  conflict_of_interest: 'Conflict of interest',
  other: 'Other',
};

const ReportReviewButton: React.FC<Props> = ({ reviewId, returnTo }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>('spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    const { error } = await supabase.from('company_review_reports').insert({
      review_id: reviewId,
      reporter_id: user.id,
      reason,
      note: note.trim() || null,
      status: 'open',
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        toast('You already reported this review', { icon: '✅' });
        setReported(true);
        setOpen(false);
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success('Reported — our moderators will review it');
    setReported(true);
    setOpen(false);
  };

  if (reported) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
        <Flag className="h-3 w-3" />
        Reported
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        aria-label="Report this review"
      >
        <Flag className="h-3 w-3" />
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">
              Report this review
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="report-reason" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as Reason)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Object.entries(REASON_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-note" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
                  Note (optional)
                </label>
                <textarea
                  id="report-note"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any context that'll help our moderators"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportReviewButton;
