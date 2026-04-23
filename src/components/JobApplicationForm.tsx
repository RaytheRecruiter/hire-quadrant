import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import type { ScreeningQuestion, ScreeningAnswer } from '../types/screening';

export interface SubmittedApplicationDetails {
  name: string;
  email: string;
  phone?: string;
  coverLetter?: string;
}

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  company?: string;
  screeningQuestions: ScreeningQuestion[];
  applied: boolean;
  onSubmit: (answers: ScreeningAnswer[], details: SubmittedApplicationDetails) => Promise<boolean>;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  jobId,
  jobTitle,
  company,
  screeningQuestions,
  applied,
  onSubmit,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('candidates')
        .select('phone_number')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.phone_number) setPhone(data.phone_number);
      setProfileLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChangeScreening = (qId: string, value: string) => {
    setScreeningAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to apply.');
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    const requiredUnanswered = screeningQuestions.filter(
      (q) => q.required && !(screeningAnswers[q.id || q.prompt]?.trim())
    );
    if (requiredUnanswered.length > 0) {
      toast.error('Please answer all required screening questions.');
      return;
    }

    const answers: ScreeningAnswer[] = screeningQuestions.map((q) => ({
      question_id: q.id || q.prompt,
      question: q.prompt,
      answer: (screeningAnswers[q.id || q.prompt] || '').trim(),
    }));

    setSubmitting(true);
    try {
      const ok = await onSubmit(answers, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        coverLetter: coverLetter.trim() || undefined,
      });
      if (ok) {
        toast.success('Application submitted!');
      } else {
        toast.error('Could not submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="apply-form"
      className="mt-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-soft scroll-mt-24"
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-secondary-900 dark:text-white">
          Apply for this role
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          {company ? `Submit your application to ${company}.` : 'Submit your application below.'}
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-5 text-sm text-primary-900 dark:text-primary-100">
          <p className="font-semibold mb-1">Sign in to apply</p>
          <p className="mb-3">
            You need an account to submit an application for <span className="font-semibold">{jobTitle}</span>.
          </p>
          <a
            href={`/login?returnTo=${encodeURIComponent(`/jobs/${jobId}#apply-form`)}`}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Sign in to continue
          </a>
        </div>
      ) : applied ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-5 text-emerald-900 dark:text-emerald-100">
          <CheckCircle className="h-6 w-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-semibold">Application submitted</p>
            <p className="text-sm">You'll be notified when the employer reviews your application.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
            />
            {!profileLoaded && (
              <p className="text-xs text-gray-500 mt-1">Loading your saved profile…</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
              Cover letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Tell the employer why you'd be a great fit."
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
            />
          </div>

          {screeningQuestions.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-5 space-y-4">
              <p className="text-sm font-semibold text-secondary-800 dark:text-slate-200">
                Screening questions
              </p>
              {screeningQuestions.map((q) => {
                const key = q.id || q.prompt;
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-secondary-800 dark:text-slate-200 mb-1">
                      {q.prompt}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={screeningAnswers[key] || ''}
                      onChange={(e) => handleChangeScreening(key, e.target.value)}
                      rows={3}
                      required={q.required}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-slate-500">
            Your resume on file will be included with this application. Update it from your{' '}
            <a href="/profile" className="text-primary-600 hover:underline font-medium">
              profile
            </a>{' '}
            before submitting.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit application
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
};

export default JobApplicationForm;
