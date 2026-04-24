import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { HelpCircle, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Question {
  id: string;
  body: string;
  is_anonymous: boolean;
  answer_body: string | null;
  answered_at: string | null;
  created_at: string;
}

interface Props {
  companyId: string;
  companySlug: string;
  companyName: string;
}

const CompanyQASection: React.FC<Props> = ({ companyId, companySlug, companyName }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_questions')
      .select('id, body, is_anonymous, answer_body, answered_at, created_at')
      .eq('company_id', companyId)
      .order('answered_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    setRows((data as Question[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const handleAsk = () => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/companies/${companySlug}`);
      return;
    }
    setAsking(true);
  };

  const submit = async () => {
    if (!user?.id) return;
    const body = questionText.trim();
    if (body.length < 10) {
      toast.error('Question should be at least 10 characters');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('company_questions').insert({
      company_id: companyId,
      asker_id: user.id,
      body,
      is_anonymous: anon,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success('Question posted');
    setQuestionText('');
    setAnon(false);
    setAsking(false);
    load();
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary-600" />
          Questions & Answers
        </h2>
        {!asking && (
          <button
            type="button"
            onClick={handleAsk}
            className="inline-flex items-center gap-1 text-sm text-primary-700 dark:text-primary-300 font-medium hover:underline"
          >
            <Plus className="h-4 w-4" /> Ask a question
          </button>
        )}
      </div>

      {asking && (
        <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4 space-y-3">
          <textarea
            rows={3}
            maxLength={1000}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={`Ask ${companyName} a question — interview process, benefits, culture, anything`}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
            />
            Ask anonymously
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAsking(false)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post question
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          No questions yet. Be the first to ask {companyName}.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((q) => (
            <article key={q.id} className="border-l-2 border-gray-200 dark:border-slate-700 pl-4">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {q.is_anonymous ? 'Anonymous' : 'A candidate'} asked ·{' '}
                {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
              </p>
              <p className="text-secondary-900 dark:text-white font-medium whitespace-pre-line">{q.body}</p>

              {q.answer_body ? (
                <div className="mt-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-800 dark:text-primary-200 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Answered by {companyName}
                    {q.answered_at && (
                      <span className="font-normal text-primary-700 dark:text-primary-300">
                        · {formatDistanceToNow(new Date(q.answered_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary-900 dark:text-white whitespace-pre-line">{q.answer_body}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-400 dark:text-slate-500 italic">Awaiting employer response</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default CompanyQASection;
