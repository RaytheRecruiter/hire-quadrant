import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useSavedJobs } from './useSavedJobs';
import { useRecentlyViewed } from './useRecentlyViewed';
import { useSkippedJobs } from './useSkippedJobs';
import { extractTags } from '../utils/skillExtractor';

export interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  matchScore: number;
}

interface PoolJob {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  type: string | null;
  description: string | null;
  posted_date: string | null;
  postedDate?: string;
}

// Scored against the 100 newest IT jobs, not the 10 on the current page of the
// shared job list (which made "Recommended" a re-shuffle of the jobs listed
// right below it). Fetched once per session, and only for users with history.
let poolPromise: Promise<PoolJob[]> | null = null;
const loadPool = (): Promise<PoolJob[]> => {
  if (!poolPromise) {
    poolPromise = Promise.resolve(
      supabase
        .from('jobs')
        .select('id, title, company, location, type, description, posted_date')
        .eq('is_it_role', true)
        .neq('status', 'closed')
        .order('posted_date', { ascending: false, nullsFirst: false })
        .limit(100)
    ).then(({ data, error }) => {
      if (error) { poolPromise = null; return []; }
      return (data ?? []) as PoolJob[];
    });
  }
  return poolPromise;
};

export const useRecommendedJobs = (limit = 6, excludeIds: string[] = []) => {
  const [jobs, setJobs] = useState<PoolJob[]>([]);
  const { savedJobIds } = useSavedJobs();
  const { recentJobs } = useRecentlyViewed();
  const { skippedJobIds } = useSkippedJobs();
  const [recommended, setRecommended] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const hasHistory = savedJobIds.size > 0 || recentJobs.length > 0;
  const excludeKey = excludeIds.join('|');

  useEffect(() => {
    if (!hasHistory) return;
    let alive = true;
    loadPool().then(pool => { if (alive) setJobs(pool); });
    return () => { alive = false; };
  }, [hasHistory]);

  useEffect(() => {
    setLoading(true);

    // If user has no saved or viewed jobs, can't make recommendations
    if (!hasHistory) {
      setRecommended([]);
      setLoading(false);
      return;
    }
    const excluded = new Set(excludeKey ? excludeKey.split('|') : []);

    // Build preference profiles from saved jobs
    const savedSkills = new Set<string>();
    const savedLocations = new Set<string>();
    const savedTypes = new Set<string>();

    jobs.forEach(job => {
      if (savedJobIds.has(job.id)) {
        const tags = extractTags(job.title, job.description ?? undefined);
        tags.forEach(tag => savedSkills.add(tag.toLowerCase()));
        if (job.location) savedLocations.add(job.location.toLowerCase());
        if (job.type) savedTypes.add(job.type.toLowerCase());
      }
    });

    // Build preference profiles from viewed jobs (lower weight than saved)
    const viewedSkills = new Set<string>();
    const viewedLocations = new Set<string>();
    const viewedTypes = new Set<string>();

    recentJobs.forEach(job => {
      const tags = extractTags(job.title, job.description);
      tags.forEach(tag => viewedSkills.add(tag.toLowerCase()));
      if (job.location) viewedLocations.add(job.location.toLowerCase());
      if (job.type) viewedTypes.add(job.type.toLowerCase());
    });

    // Score all jobs that are NOT saved, NOT skipped
    const scored: RecommendedJob[] = jobs
      .filter(job => !savedJobIds.has(job.id) && !skippedJobIds.has(job.id) && !excluded.has(job.id))
      .map(job => {
        let matchScore = 0;

        // === SAVED JOB SIGNALS (highest weight) ===
        const jobTags = extractTags(job.title, job.description ?? undefined);

        // Saved job skill tags: +15 per matching tag
        const matchingSavedSkills = jobTags.filter(tag =>
          savedSkills.has(tag.toLowerCase())
        ).length;
        matchScore += matchingSavedSkills * 15;

        // Saved job location match: +25
        if (job.location && savedLocations.has(job.location.toLowerCase())) {
          matchScore += 25;
        }

        // Saved job type match: +15
        if (job.type && savedTypes.has(job.type.toLowerCase())) {
          matchScore += 15;
        }

        // === VIEWED JOB SIGNALS (medium weight) ===
        // Viewed job skill tags: +8 per matching tag
        const matchingViewedSkills = jobTags.filter(tag =>
          viewedSkills.has(tag.toLowerCase())
        ).length;
        matchScore += matchingViewedSkills * 8;

        // Viewed job location match: +10
        if (job.location && viewedLocations.has(job.location.toLowerCase())) {
          matchScore += 10;
        }

        // Viewed job type match: +8
        if (job.type && viewedTypes.has(job.type.toLowerCase())) {
          matchScore += 8;
        }

        // === RECENCY BONUS ===
        const daysOld = Math.floor(
          (Date.now() - new Date(job.posted_date || job.postedDate || 0).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysOld < 7) matchScore += 20;
        else if (daysOld < 14) matchScore += 10;

        return {
          id: job.id,
          title: job.title,
          company: job.company || 'Unknown',
          location: job.location || 'Remote',
          type: job.type || 'Full Time',
          description: job.description || '',
          matchScore,
        };
      })
      .filter(job => job.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    setRecommended(scored);
    setLoading(false);
  }, [jobs, savedJobIds, recentJobs, skippedJobIds, limit, hasHistory, excludeKey]);

  return { recommended, loading };
};
