import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, MapPin, Building2, Clock, Loader2 } from 'lucide-react';
import { useJobs } from '../contexts/JobContext';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { generateSlug } from '../utils/slugGenerator';
import { extractTags } from '../utils/skillExtractor';

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  matchScore: number;
}

const RecommendedJobs: React.FC = () => {
  const { jobs } = useJobs();
  const { savedJobIds } = useSavedJobs();
  const [recommended, setRecommended] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const savedJobs = jobs.filter(j => savedJobIds.has(j.id));

    if (savedJobs.length === 0) {
      setRecommended([]);
      setLoading(false);
      return;
    }

    // Extract skills from saved jobs
    const savedSkills = new Set<string>();
    const savedLocations = new Set<string>();
    const savedTypes = new Set<string>();

    savedJobs.forEach(job => {
      const tags = extractTags(job.title, job.description);
      tags.forEach(tag => savedSkills.add(tag.toLowerCase()));
      if (job.location) savedLocations.add(job.location.toLowerCase());
      if (job.type) savedTypes.add(job.type.toLowerCase());
    });

    // Score unsaved jobs based on similarity
    const scored: RecommendedJob[] = jobs
      .filter(job => !savedJobIds.has(job.id))
      .map(job => {
        let matchScore = 0;

        // Score based on matching skills
        const jobTags = extractTags(job.title, job.description);
        const matchingSkills = jobTags.filter(tag =>
          savedSkills.has(tag.toLowerCase())
        ).length;
        matchScore += matchingSkills * 15;

        // Score based on location match
        if (job.location && savedLocations.has(job.location.toLowerCase())) {
          matchScore += 25;
        }

        // Score based on job type match
        if (job.type && savedTypes.has(job.type.toLowerCase())) {
          matchScore += 15;
        }

        // Score based on recency
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
      .slice(0, 6);

    setRecommended(scored);
    setLoading(false);
  }, [jobs, savedJobIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (recommended.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-gradient-to-br from-primary-50 to-primary-50/50 dark:from-primary-900/20 dark:to-slate-900/20 rounded-3xl shadow-lg border border-primary-100/20 dark:border-primary-900/20 p-8">
      <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
        <Lightbulb className="h-6 w-6 text-primary-500" />
        Recommended For You
      </h3>
      <p className="text-secondary-600 dark:text-slate-400 mb-6">
        Based on jobs you've saved, we found {recommended.length} roles that match your interests
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommended.map(job => (
          <Link
            key={job.id}
            to={`/job/${generateSlug(job.title, job.company)}`}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-5 hover:shadow-card-hover transition-all hover:border-primary-200 dark:hover:border-primary-700 border border-gray-100 dark:border-slate-700"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors line-clamp-2">
                  {job.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mt-0.5">
                  {job.company}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                  {Math.min(job.matchScore, 99)}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.type && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {job.type}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedJobs;
