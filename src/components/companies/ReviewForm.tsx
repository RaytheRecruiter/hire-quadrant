import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { CompanyReview } from '../../hooks/useCompanyReviews';

interface Props {
  companyId: string;
  companySlug: string;
  existing: CompanyReview | null;
  onSaved: () => void;
}

interface FormState {
  rating_overall: number;
  rating_work_life: number;
  rating_compensation: number;
  rating_management: number;
  rating_culture: number;
  rating_career_growth: number;
  title: string;
  pros: string;
  cons: string;
  employment_status: 'current' | 'former' | '';
  job_title: string;
  is_anonymous: boolean;
}

const DIMENSIONS: Array<{ key: keyof Omit<FormState, 'title' | 'pros' | 'cons' | 'employment_status' | 'job_title' | 'is_anonymous'>; label: string }> = [
  { key: 'rating_overall', label: 'Overall rating' },
  { key: 'rating_work_life', label: 'Work-life balance' },
  { key: 'rating_compensation', label: 'Compensation' },
  { key: 'rating_management', label: 'Management' },
  { key: 'rating_culture', label: 'Culture' },
  { key: 'rating_career_growth', label: 'Career growth' },
];

const emptyForm: FormState = {
  rating_overall: 0,
  rating_work_life: 0,
  rating_compensation: 0,
  rating_management: 0,
  rating_culture: 0,
  rating_career_growth: 0,
  title: '',
  pros: '',
  cons: '',
  employment_status: '',
  job_title: '',
  is_anonymous: false,
};

const ReviewForm: React.FC<Props> = ({ companyId, companySlug, existing, onSaved }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          rating_overall: existing.rating_overall,
          rating_work_life: existing.rating_work_life ?? 0,
          rating_compensation: existing.rating_compensation ?? 0,
          rating_management: existing.rating_management ?? 0,
          rating_culture: existing.rating_culture ?? 0,
          rating_career_growth: existing.rating_career_growth ?? 0,
          title: existing.title,
          pros: existing.pros ?? '',
          cons: existing.cons ?? '',
          employment_status: existing.employment_status ?? '',
          job_title: existing.job_title ?? '',
          is_anonymous: existing.is_anonymous,
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(!!existing);

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/login?returnTo=/companies/${companySlug}`)}
        className="w-full text-left bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
      >
        <p className="font-medium text-primary-900 dark:text-primary-200">Sign in to write a review</p>
        <p className="text-sm text-primary-700 dark:text-primary-300 mt-0.5">
          Share your experience and help others
        </p>
      </button>
    );
  }

  if (!expanded && !existing) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl px-4 py-3 transition-colors"
      >
        Write a review
      </button>
    );
  }

  if (existing && existing.status === 'pending') {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <Loader2 className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Your review is awaiting approval
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
            "{existing.title}" — we'll publish it once a moderator approves.
          </p>
        </div>
      </div>
    );
  }

  if (existing && existing.status === 'approved' && !expanded) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-emerald-900 dark:text-emerald-200">Your review is live</p>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5 underline"
          >
            Edit it
          </button>
        </div>
      </div>
    );
  }

  const setRating = (key: keyof FormState, value: number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (form.rating_overall < 1) {
      toast.error('Please give an overall rating');
      return;
    }
    if (form.title.trim().length < 5) {
      toast.error('Title should be at least 5 characters');
      return;
    }

    setSaving(true);
    try {
      // Rate-limit pre-check (skip for edits — we're only capping new reviews)
      if (!existing) {
        const { data: gate, error: gateErr } = await supabase.rpc('can_submit_review');
        if (!gateErr && gate && gate.allowed === false) {
          if (gate.reason === 'rate_limited') {
            toast.error(
              `You've submitted ${gate.recent_count}/${gate.cap} reviews in the last 24 hours. Try again later.`,
              { duration: 6000 },
            );
          } else {
            toast.error('Unable to submit right now.');
          }
          setSaving(false);
          return;
        }
      }

      const payload = {
        company_id: companyId,
        author_id: user.id,
        rating_overall: form.rating_overall,
        rating_work_life: form.rating_work_life || null,
        rating_compensation: form.rating_compensation || null,
        rating_management: form.rating_management || null,
        rating_culture: form.rating_culture || null,
        rating_career_growth: form.rating_career_growth || null,
        title: form.title.trim(),
        pros: form.pros.trim() || null,
        cons: form.cons.trim() || null,
        employment_status: form.employment_status || null,
        job_title: form.job_title.trim() || null,
        is_anonymous: form.is_anonymous,
        status: 'pending' as const,
      };

      let err;
      if (existing) {
        const { error } = await supabase
          .from('company_reviews')
          .update(payload)
          .eq('id', existing.id);
        err = error;
      } else {
        const { error } = await supabase.from('company_reviews').insert(payload);
        err = error;
      }
      if (err) throw err;
      toast.success(
        existing ? 'Review updated — pending re-approval' : 'Review submitted for approval',
      );
      setExpanded(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4"
    >
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
        {existing ? 'Edit your review' : 'Write a review'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DIMENSIONS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
              {label}
              {key === 'rating_overall' && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (form[key] as number) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(key, n)}
                    aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        active ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-600 hover:text-amber-300'
                      }`}
                    />
                  </button>
                );
              })}
              {(form[key] as number) > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(key, 0)}
                  className="ml-2 text-xs text-gray-500 dark:text-slate-400 hover:underline"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="review-title"
          type="text"
          required
          minLength={5}
          maxLength={120}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Summarize your experience in one line"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="review-pros" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
            Pros
          </label>
          <textarea
            id="review-pros"
            rows={4}
            maxLength={2000}
            value={form.pros}
            onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
            placeholder="What did you like?"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="review-cons" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
            Cons
          </label>
          <textarea
            id="review-cons"
            rows={4}
            maxLength={2000}
            value={form.cons}
            onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
            placeholder="What didn't work?"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="review-status" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
            Employment status
          </label>
          <select
            id="review-status"
            value={form.employment_status}
            onChange={(e) =>
              setForm((f) => ({ ...f, employment_status: e.target.value as FormState['employment_status'] }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Prefer not to say</option>
            <option value="current">Current employee</option>
            <option value="former">Former employee</option>
          </select>
        </div>
        <div>
          <label htmlFor="review-job" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">
            Job title
          </label>
          <input
            id="review-job"
            type="text"
            maxLength={100}
            value={form.job_title}
            onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
            placeholder="e.g. Software Engineer"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary-900 dark:text-white">
        <input
          type="checkbox"
          checked={form.is_anonymous}
          onChange={(e) => setForm((f) => ({ ...f, is_anonymous: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
        />
        Post anonymously
      </label>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Reviews are held for moderation before publishing.
        </p>
        <div className="flex gap-2">
          {expanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {existing ? 'Save changes' : 'Submit review'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ReviewForm;
