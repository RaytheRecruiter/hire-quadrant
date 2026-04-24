import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface Summary {
  summary: string;
  pros_themes: string[];
  cons_themes: string[];
  recommended_for: string[];
  based_on_count: number;
  generated_at: string;
}

interface Props {
  companyId: string;
  companyName: string;
  minReviews?: number;
}

const MIN_REVIEWS_DEFAULT = 3;
const REFRESH_AFTER_DAYS = 30;

const AIReviewSummary: React.FC<Props> = ({ companyId, companyName, minReviews = MIN_REVIEWS_DEFAULT }) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tryGenerate = useCallback(async () => {
    setError(null);
    const { data: reviews } = await supabase
      .from('company_reviews')
      .select('title, pros, cons, rating')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .limit(40);

    if (!reviews || reviews.length < minReviews) {
      setLoading(false);
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-helpers/review-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            authorization: `Bearer ${session?.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ companyName, reviews }),
        },
      );
      if (!res.ok) throw new Error(`summary failed: ${res.status}`);
      const result = await res.json();
      await supabase.from('company_review_summaries').upsert(
        {
          company_id: companyId,
          summary: result.summary,
          pros_themes: result.pros_themes ?? [],
          cons_themes: result.cons_themes ?? [],
          recommended_for: result.recommended_for ?? [],
          based_on_count: result.based_on_count ?? reviews.length,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id' },
      );
      setSummary({ ...result, generated_at: new Date().toISOString() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId, companyName, minReviews]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: cached } = await supabase
        .from('company_review_summaries')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (cancelled) return;

      const fresh = cached && new Date(cached.generated_at).getTime() > Date.now() - REFRESH_AFTER_DAYS * 86_400_000;
      if (fresh) {
        setSummary(cached as Summary);
        setLoading(false);
      } else {
        tryGenerate();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, tryGenerate]);

  if (loading) {
    return (
      <section className="bg-primary-50/40 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/30 p-5 mb-5">
        <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300">
          <Sparkles className="h-4 w-4" />
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Summarizing employee reviews…</span>
        </div>
      </section>
    );
  }

  if (!summary) return null;

  return (
    <section className="bg-primary-50/40 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/30 p-5 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
          What people say about {companyName}
        </h3>
        <span className="text-[10px] uppercase tracking-wide bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded">
          AI
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">{summary.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summary.pros_themes?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              Common praise
            </p>
            <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-0.5">
              {summary.pros_themes.slice(0, 4).map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </div>
        )}
        {summary.cons_themes?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
              <ThumbsDown className="h-3 w-3" />
              Common concerns
            </p>
            <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-0.5">
              {summary.cons_themes.slice(0, 4).map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </div>
        )}
        {summary.recommended_for?.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Recommended for
            </p>
            <p className="text-xs text-gray-700 dark:text-slate-300">
              {summary.recommended_for.slice(0, 3).join(' · ')}
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-3">
        Synthesized from {summary.based_on_count} approved reviews · regenerated every 30 days
      </p>
      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">{error}</p>
      )}
    </section>
  );
};

export default AIReviewSummary;
