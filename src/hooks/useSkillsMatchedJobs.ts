import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Ray: "Needs skills match component. Takes keywords from resume/top
// skills and finds jobs with similar keywords/skills and parallel career
// paths within a 20-30 mile radius of user's location."
//
// Building blocks all already existed but were never wired together:
//   - candidates.skills / top_skills (resume parser output)
//   - nearby_job_ids() RPC + user_job_preferences.zip_lat/zip_lng/mile_radius
//     (mile-radius search, already used by BrowseJobs.tsx)
//   - career_path_cache (AI-generated parallel titles per job title,
//     populated by useCareerPaths/CareerGrowthPaths as candidates view jobs)
const DEFAULT_RADIUS_MILES = 25;
const MAX_SKILLS = 15;
const NEARBY_JOB_BATCH = 300;

export interface MatchedJob {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  posted_date: string | null;
  distanceMiles: number | null;
  matchingSkills: string[];
  score: number;
}

interface CandidateSignals {
  skills: string[];
  currentTitle: string | null;
  lat: number | null;
  lng: number | null;
  radiusMiles: number;
}

type JobRow = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  posted_date: string | null;
  description: string | null;
};

async function loadSignals(userId: string): Promise<CandidateSignals | null> {
  const [candRes, prefsRes] = await Promise.all([
    supabase
      .from('candidates')
      .select('skills, top_skills, current_title')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_job_preferences')
      .select('zip_lat, zip_lng, mile_radius')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  const cand = candRes.data as
    | { skills?: unknown; top_skills?: unknown; current_title?: string | null }
    | null;
  const prefs = prefsRes.data as
    | { zip_lat?: number | null; zip_lng?: number | null; mile_radius?: number | null }
    | null;

  const topSkills = Array.isArray(cand?.top_skills) ? (cand!.top_skills as string[]) : [];
  const skills = Array.isArray(cand?.skills) ? (cand!.skills as string[]) : [];
  const merged = Array.from(new Set([...topSkills, ...skills])).filter(Boolean).slice(0, MAX_SKILLS);

  if (merged.length === 0 && !cand?.current_title) return null;

  return {
    skills: merged,
    currentTitle: cand?.current_title ?? null,
    lat: prefs?.zip_lat ?? null,
    lng: prefs?.zip_lng ?? null,
    radiusMiles: prefs?.mile_radius && prefs.mile_radius > 0 ? prefs.mile_radius : DEFAULT_RADIUS_MILES,
  };
}

// Parallel career-path titles for the candidate's current title, read from
// the cache CareerGrowthPaths already populates as candidates browse jobs.
// Deliberately read-only here — this runs on every home dashboard load, so
// it must not trigger a fresh AI call for titles that aren't cached yet.
async function loadParallelTitles(title: string | null): Promise<string[]> {
  if (!title) return [];
  const { data } = await supabase
    .from('career_path_cache')
    .select('paths')
    .ilike('job_title', title.toLowerCase().trim())
    .maybeSingle();
  const paths = (data?.paths as Array<{ title?: string }> | undefined) ?? [];
  return paths.map((p) => p.title).filter((t): t is string => !!t);
}

function scoreJob(
  job: JobRow,
  signals: CandidateSignals,
  parallelTitles: string[],
): { score: number; matchingSkills: string[] } {
  const titleLc = (job.title || '').toLowerCase();
  const descLc = (job.description || '').toLowerCase();
  let score = 0;

  if (signals.currentTitle && titleLc.includes(signals.currentTitle.toLowerCase())) {
    score += 40;
  } else if (parallelTitles.some((t) => titleLc.includes(t.toLowerCase()))) {
    score += 25;
  }

  const matchingSkills: string[] = [];
  for (const skill of signals.skills) {
    const s = skill.toLowerCase();
    if (!s) continue;
    if (titleLc.includes(s)) {
      score += 8;
      matchingSkills.push(skill);
    } else if (descLc.includes(s)) {
      score += 3;
      matchingSkills.push(skill);
    }
  }

  return { score, matchingSkills: matchingSkills.slice(0, 6) };
}

export function useSkillsMatchedJobs(limit = 6) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState<number | null>(null);
  const [hasSignals, setHasSignals] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setJobs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const signals = await loadSignals(user.id);
      if (!signals) {
        if (!cancelled) {
          setHasSignals(false);
          setJobs([]);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setHasSignals(true);

      let candidateJobs: JobRow[] = [];
      const distanceById = new Map<string, number>();
      let appliedRadius: number | null = null;

      if (signals.lat != null && signals.lng != null) {
        const { data: nearby, error: nearbyError } = await supabase.rpc('nearby_job_ids', {
          p_lat: signals.lat,
          p_lng: signals.lng,
          p_miles: signals.radiusMiles,
        });
        if (!nearbyError && nearby && nearby.length > 0) {
          for (const r of nearby as Array<{ id: string; distance_miles: number }>) {
            distanceById.set(r.id, r.distance_miles);
          }
          const ids = (nearby as Array<{ id: string }>).map((r) => r.id).slice(0, NEARBY_JOB_BATCH);
          const { data } = await supabase
            .from('jobs')
            .select('id, title, company, location, posted_date, description')
            .in('id', ids);
          candidateJobs = (data ?? []) as JobRow[];
          appliedRadius = signals.radiusMiles;
        }
      }

      // No location set, or nothing came back in-radius — widen to a
      // recent batch so the section isn't empty, but don't claim a radius.
      if (candidateJobs.length === 0) {
        const { data } = await supabase
          .from('jobs')
          .select('id, title, company, location, posted_date, description')
          .order('posted_date', { ascending: false })
          .limit(200);
        candidateJobs = (data ?? []) as JobRow[];
        appliedRadius = null;
      }

      const parallelTitles = await loadParallelTitles(signals.currentTitle);

      const scored = candidateJobs
        .map((j) => {
          const { score, matchingSkills } = scoreJob(j, signals, parallelTitles);
          return {
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location,
            posted_date: j.posted_date,
            distanceMiles: distanceById.get(j.id) ?? null,
            matchingSkills,
            score,
          };
        })
        .filter((j) => j.score > 0)
        .sort((a, b) => b.score - a.score || (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999))
        .slice(0, limit);

      if (!cancelled) {
        setJobs(scored);
        setRadiusMiles(appliedRadius);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, limit]);

  return { jobs, loading, radiusMiles, hasSignals };
}
