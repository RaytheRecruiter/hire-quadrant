import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  posted_date: string | null;
  score: number;
}

interface CandidateSignal {
  skills: string[];
  location: string | null;
  title: string | null;
}

async function loadCandidateSignals(userId: string): Promise<CandidateSignal | null> {
  const [candRes, prefsRes] = await Promise.all([
    supabase.from('candidates').select('skills, title, location').eq('user_id', userId).maybeSingle(),
    supabase
      .from('user_job_preferences')
      .select('desired_titles, desired_locations')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  const cand = candRes.data as { skills?: unknown; title?: string | null; location?: string | null } | null;
  const prefs = prefsRes.data as {
    desired_titles?: string[] | null;
    desired_locations?: string[] | null;
  } | null;
  if (!cand && !prefs) return null;
  const skills = Array.isArray(cand?.skills) ? (cand!.skills as string[]).slice(0, 10) : [];
  return {
    skills,
    location: prefs?.desired_locations?.[0] ?? cand?.location ?? null,
    title: prefs?.desired_titles?.[0] ?? cand?.title ?? null,
  };
}

function scoreJob(
  job: { title: string; location: string | null; description: string | null },
  signals: CandidateSignal,
): number {
  let score = 0;
  const titleLc = (job.title || '').toLowerCase();
  const locLc = (job.location || '').toLowerCase();
  const descLc = (job.description || '').toLowerCase();
  if (signals.title && titleLc.includes(signals.title.toLowerCase())) score += 40;
  if (signals.location && locLc.includes(signals.location.toLowerCase())) score += 20;
  for (const skill of signals.skills) {
    if (!skill) continue;
    const s = skill.toLowerCase();
    if (titleLc.includes(s)) score += 6;
    else if (descLc.includes(s)) score += 3;
  }
  return score;
}

export function useJobRecommendations(limit = 8) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setJobs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const signals = await loadCandidateSignals(user.id);
      if (!signals) {
        if (!cancelled) {
          setJobs([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from('jobs')
        .select('id, title, company, location, posted_date, description')
        .order('posted_date', { ascending: false })
        .limit(150);
      if (cancelled) return;
      const scored = (data ?? [])
        .map((j) => ({ ...j, score: scoreJob(j as { title: string; location: string | null; description: string | null }, signals) }))
        .filter((j) => j.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ description: _, ...rest }) => rest);
      setJobs(scored as RecommendedJob[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, limit]);

  return { jobs, loading };
}
