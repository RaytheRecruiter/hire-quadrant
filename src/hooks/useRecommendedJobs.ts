import { useEffect, useState } from 'react';
import { useJobs } from '../contexts/JobContext';
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

export const useRecommendedJobs = (limit = 6) => {
  const { jobs } = useJobs();
  const { savedJobIds } = useSavedJobs();
  const { recentJobs } = useRecentlyViewed();
  const { skippedJobIds } = useSkippedJobs();
  const [recommended, setRecommended] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // If user has no saved or viewed jobs, can't make recommendations
    if (savedJobIds.size === 0 && recentJobs.length === 0) {
      setRecommended([]);
      setLoading(false);
      return;
    }

    // Build preference profiles from saved jobs
    const savedSkills = new Set<string>();
    const savedLocations = new Set<string>();
    const savedTypes = new Set<string>();

    jobs.forEach(job => {
      if (savedJobIds.has(job.id)) {
        const tags = extractTags(job.title, job.description);
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
      .filter(job => !savedJobIds.has(job.id) && !skippedJobIds.has(job.id))
      .map(job => {
        let matchScore = 0;

        // === SAVED JOB SIGNALS (highest weight) ===
        const jobTags = extractTags(job.title, job.description);

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
          (Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysOld < 7) matchScore += 20;
        else if (daysOld < 14) matchScore += 10;

        return {
          id: job.id,
          title: job.title,
          company: job.company || 'Unknown',
          location: job.location || 'Remote',
          type: job.type || 'Full Time',
          description: job.description,
          matchScore,
        };
      })
      .filter(job => job.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    setRecommended(scored);
    setLoading(false);
  }, [jobs, savedJobIds, recentJobs, skippedJobIds, limit]);

  return { recommended, loading };
};
