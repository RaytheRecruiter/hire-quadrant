import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { Target, Sparkles, Loader2, CheckCircle2, AlertTriangle, Clock, Shuffle } from 'lucide-react';
import HardLink from '../components/HardLink';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  role_target: string | null;
  question_type: 'behavioral' | 'technical' | 'system-design' | 'role-specific';
  question: string;
  answer: string;
  score: number | null;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  better_example: string | null;
  created_at: string;
}

const QUESTION_BANK: Record<string, string[]> = {
  behavioral: [
    'Tell me about a time you disagreed with a teammate. How did you resolve it?',
    'Describe a project you led end-to-end. What was the impact?',
    'Walk me through a failure. What did you learn?',
    'Tell me about a time you influenced a decision without authority.',
    'Describe the hardest feedback you have received. How did you respond?',
    'Tell me about a time you prioritized competing demands.',
  ],
  technical: [
    'Design a rate limiter. Walk me through your approach.',
    'How would you debug a production service with intermittent 5xx errors?',
    'Explain the tradeoffs between SQL and NoSQL for a high-write workload.',
    'Walk me through your approach to implementing OAuth 2.0.',
    'How would you scale a service from 1K to 1M requests per second?',
  ],
  'system-design': [
    'Design a URL shortener like bit.ly.',
    'Design a news feed like Twitter or LinkedIn.',
    'Design a ride-sharing service matcher like Uber.',
    'Design a distributed cache with eviction policies.',
    'Design a typeahead search system.',
  ],
  'role-specific': [
    'Why this role specifically, vs similar roles elsewhere?',
    'Where do you see yourself in 3 years?',
    'What would you accomplish in your first 90 days?',
    'What is your greatest professional weakness?',
    'Why are you leaving your current role?',
  ],
};

const ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer',
  'Engineering Manager', 'Product Manager', 'Data Scientist',
  'Data Engineer', 'DevOps / SRE', 'Designer', 'Sales',
  'Customer Success', 'Marketing',
];

const InterviewPractice: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [roleTarget, setRoleTarget] = useState('Software Engineer');
  const [questionType, setQuestionType] = useState<Session['question_type']>('behavioral');
  const [question, setQuestion] = useState(QUESTION_BANK.behavioral[0]);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Omit<Session, 'id' | 'created_at' | 'role_target' | 'question_type' | 'question' | 'answer'> | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('interview_practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory((data as Session[]) ?? []);
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const pickQuestion = () => {
    const bank = QUESTION_BANK[questionType];
    const current = question;
    let next = current;
    while (next === current && bank.length > 1) {
      next = bank[Math.floor(Math.random() * bank.length)];
    }
    setQuestion(next);
    setAnswer('');
    setResult(null);
  };

  const submit = async () => {
    if (!user?.id || answer.trim().length < 30) {
      setError('Answer must be at least 30 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-helpers/interview-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            authorization: `Bearer ${session?.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ question, answer, role: roleTarget, questionType }),
        },
      );
      if (!res.ok) throw new Error(`feedback failed: ${res.status}`);
      const feedback = await res.json();

      await supabase.from('interview_practice_sessions').insert({
        user_id: user.id,
        role_target: roleTarget,
        question_type: questionType,
        question,
        answer,
        score: feedback.score,
        summary: feedback.summary,
        strengths: feedback.strengths ?? [],
        improvements: feedback.improvements ?? [],
        better_example: feedback.better_example ?? null,
      });

      setResult(feedback);
      loadHistory();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/interview-practice" replace />;

  const tone = (n: number | null) => {
    if (n == null) return 'text-gray-500';
    if (n >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (n >= 65) return 'text-primary-600 dark:text-primary-400';
    if (n >= 45) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <>
      <Helmet>
        <title>Interview Practice · HireQuadrant</title>
        <meta
          name="description"
          content="Practice interview questions with AI feedback. Covers behavioral, technical, system design, and role-specific questions."
        />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbSchema
            className="mb-4"
            items={[{ name: 'Home', to: '/' }, { name: 'Interview Practice' }]}
          />

          <header className="mb-8 flex items-start gap-3">
            <Target className="h-7 w-7 text-primary-500 mt-1" />
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                Interview Practice
              </h1>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Type your answer. AI scores it and gives specific feedback. Your history is saved so you can track progress.
              </p>
            </div>
          </header>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Role you are interviewing for
                </label>
                <select
                  value={roleTarget}
                  onChange={(e) => setRoleTarget(e.target.value)}
                  className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Question type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => {
                    const t = e.target.value as Session['question_type'];
                    setQuestionType(t);
                    setQuestion(QUESTION_BANK[t][0]);
                    setAnswer('');
                    setResult(null);
                  }}
                  className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="behavioral">Behavioral</option>
                  <option value="technical">Technical</option>
                  <option value="system-design">System Design</option>
                  <option value="role-specific">Role-Specific</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4 mb-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                  Question
                </p>
                <button
                  type="button"
                  onClick={pickQuestion}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  title="New question"
                >
                  <Shuffle className="h-3 w-3" />
                  New
                </button>
              </div>
              <p className="text-sm text-secondary-900 dark:text-white">{question}</p>
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              placeholder="Type your answer. Aim for 2-4 paragraphs with specific examples."
              className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500 mb-2"
            />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                {answer.length} chars
              </span>
              {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || answer.trim().length < 30}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Get AI feedback
            </button>
          </section>

          {result && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`text-5xl font-bold ${tone(result.score)}`}>
                  {result.score}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Score</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{result.summary}</p>
                </div>
              </div>

              {result.strengths.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Strengths
                  </p>
                  <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-0.5">
                    {result.strengths.map((s) => <li key={s}>· {s}</li>)}
                  </ul>
                </div>
              )}

              {result.improvements.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    How to improve
                  </p>
                  <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-0.5">
                    {result.improvements.map((s) => <li key={s}>· {s}</li>)}
                  </ul>
                </div>
              )}

              {result.better_example && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                    Example of a stronger answer
                  </p>
                  <p className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                    {result.better_example}
                  </p>
                </div>
              )}
            </section>
          )}

          {history.length > 0 && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
                  Your recent sessions
                </h2>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {history.map((s) => (
                  <li key={s.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-secondary-900 dark:text-white truncate">
                        {s.question}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        {s.role_target} · {s.question_type} · {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`text-xl font-bold ${tone(s.score)} flex-shrink-0`}>
                      {s.score ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
              <HardLink
                to="/interview-prep/software-engineer"
                className="inline-block mt-4 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Study more interview questions →
              </HardLink>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default InterviewPractice;
