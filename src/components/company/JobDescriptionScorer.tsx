import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface Score {
  overall_score: number;
  specificity: number;
  inclusivity: number;
  clarity: number;
  completeness: number;
  strengths: string[];
  improvements: string[];
  missing_sections: string[];
}

interface Props {
  title: string;
  description: string;
}

const JobDescriptionScorer: React.FC<Props> = ({ title, description }) => {
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!title.trim() || description.trim().length < 100) {
      setError('Need a title and at least 100 characters of description.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-helpers/jd-score`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            authorization: `Bearer ${session?.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ title, description }),
        },
      );
      if (!res.ok) throw new Error(`score failed: ${res.status}`);
      const result = (await res.json()) as Score;
      setScore(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const tone = (n: number) =>
    n >= 85
      ? 'text-emerald-600 dark:text-emerald-400'
      : n >= 65
      ? 'text-primary-600 dark:text-primary-400'
      : n >= 45
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Job description quality score
          </h3>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          {score ? 'Re-score' : 'Score this JD'}
        </button>
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">{error}</p>}

      {score && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className={`text-4xl font-bold ${tone(score.overall_score)}`}>
              {score.overall_score}
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Overall score</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {score.overall_score >= 85
                  ? 'Excellent — post as-is.'
                  : score.overall_score >= 65
                  ? 'Solid — address the improvements below before posting.'
                  : score.overall_score >= 45
                  ? 'Needs work — consider a rewrite with the suggestions below.'
                  : 'Weak — this JD will underperform. See suggestions.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {([
              ['Specificity', score.specificity],
              ['Inclusivity', score.inclusivity],
              ['Clarity', score.clarity],
              ['Completeness', score.completeness],
            ] as const).map(([label, n]) => (
              <div
                key={label}
                className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-2.5 text-center"
              >
                <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                <p className={`text-lg font-bold ${tone(n)}`}>{n}</p>
              </div>
            ))}
          </div>

          {score.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                What's working
              </p>
              <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-0.5">
                {score.strengths.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          )}

          {score.improvements.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                How to improve
              </p>
              <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-0.5">
                {score.improvements.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          )}

          {score.missing_sections.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">
                Missing sections
              </p>
              <p className="text-xs text-gray-700 dark:text-slate-300">
                {score.missing_sections.join(' · ')}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default JobDescriptionScorer;
