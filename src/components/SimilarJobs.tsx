import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HardLink from './HardLink';
import { Sparkles, MapPin, Building2, Clock } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { generateSlug } from '../utils/slugGenerator';

interface Props {
  jobId: string;
}

interface SimilarJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  similarity_score: number;
}

const SimilarJobs: React.FC<Props> = ({ jobId }) => {
  const [jobs, setJobs] = useState<SimilarJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      setLoading(true);
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Similar jobs request timed out')), 10_000)
        );
        const fetchPromise = supabase.rpc('find_similar_jobs', {
          source_job_id: jobId,
          result_limit: 5,
        });
        const { data, error } = await Promise.race([
          fetchPromise,
          timeoutPromise,
        ]);
        if (!error && data) setJobs(data as SimilarJob[]);
      } catch (err: any) {
        console.error('Error fetching similar jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [jobId]);

  if (loading || jobs.length === 0) return null;

  return (
    <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6">
      <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary-500" />
        Similar Jobs You Might Like
      </h3>
      <div className="space-y-3">
        {jobs.map(j => (
          <HardLink
            key={j.id}
            to={`/job/${generateSlug(j.title, j.company, j.id)}`}
            className="block p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-secondary-900 truncate">{j.title}</h4>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{j.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{j.type}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {j.similarity_score > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold whitespace-nowrap">
                    {Math.round(j.similarity_score)}% similar
                  </span>
                )}
                {j.salary && (
                  <span className="text-sm font-semibold text-primary-600">{j.salary}</span>
                )}
              </div>
            </div>
          </HardLink>
        ))}
      </div>
    </div>
  );
};

export default SimilarJobs;
