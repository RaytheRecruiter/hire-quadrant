import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { HelpCircle, Loader2, Check, Edit2, X } from 'lucide-react';
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
}

const CompanyQAPanel: React.FC<Props> = ({ companyId }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_questions')
      .select('*')
      .eq('company_id', companyId)
      .order('answered_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true });
    setRows((data as Question[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (q: Question) => {
    setEditing(q.id);
    setDraft(q.answer_body ?? '');
  };

  const saveAnswer = async (q: Question) => {
    if (!user?.id) return;
    const body = draft.trim();
    if (body.length < 5) {
      toast.error('Answer should be at least 5 characters');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('company_questions')
      .update({
        answer_body: body,
        answerer_id: user.id,
        answered_at: q.answer_body ? q.answered_at : new Date().toISOString(),
      })
      .eq('id', q.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(q.answer_body ? 'Answer updated' : 'Answer posted');
    setEditing(null);
    setDraft('');
    load();
  };

  const unanswered = rows.filter((r) => !r.answer_body);
  const answered = rows.filter((r) => r.answer_body);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
      </div>
    );
  }

  const QuestionRow: React.FC<{ q: Question }> = ({ q }) => (
    <article className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
        {q.is_anonymous ? 'Anonymous candidate' : 'A candidate'} · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
      </p>
      <p className="text-secondary-900 dark:text-white font-medium whitespace-pre-line mb-3">{q.body}</p>

      {editing === q.id ? (
        <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
          <textarea
            rows={3}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a clear, public answer"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button type="button" onClick={() => saveAnswer(q)} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {q.answer_body ? 'Save' : 'Post answer'}
            </button>
          </div>
        </div>
      ) : q.answer_body ? (
        <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-400 rounded-r-lg p-3">
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <p className="text-xs font-semibold text-primary-800 dark:text-primary-200">
              Your answer · {q.answered_at && formatDistanceToNow(new Date(q.answered_at), { addSuffix: true })}
            </p>
            <button type="button" onClick={() => openEdit(q)} className="inline-flex items-center gap-1 text-xs text-primary-700 dark:text-primary-300 hover:underline">
              <Edit2 className="h-3 w-3" /> Edit
            </button>
          </div>
          <p className="text-sm text-secondary-900 dark:text-white whitespace-pre-line">{q.answer_body}</p>
        </div>
      ) : (
        <button type="button" onClick={() => openEdit(q)} className="inline-flex items-center gap-1.5 text-sm text-primary-700 dark:text-primary-300 hover:underline">
          <HelpCircle className="h-4 w-4" /> Answer this question
        </button>
      )}
    </article>
  );

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
          Unanswered ({unanswered.length})
        </h3>
        {unanswered.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No pending questions.</p>
        ) : (
          <div className="space-y-3">
            {unanswered.map((q) => <QuestionRow key={q.id} q={q} />)}
          </div>
        )}
      </section>

      {answered.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
            Answered ({answered.length})
          </h3>
          <div className="space-y-3">
            {answered.map((q) => <QuestionRow key={q.id} q={q} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default CompanyQAPanel;
