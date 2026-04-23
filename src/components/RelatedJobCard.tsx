import React from 'react';
import { MapPin, Building2, Clock, DollarSign } from 'lucide-react';
import HardLink from './HardLink';
import { generateSlug } from '../utils/slugGenerator';

export interface RelatedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  similarity_score?: number;
  min_salary?: number | null;
  max_salary?: number | null;
  posted_date?: string;
}

interface Props {
  job: RelatedJob;
  /** Which field to emphasize on the right — matches the section context. */
  emphasis?: 'similarity' | 'location' | 'salary';
}

const RelatedJobCard: React.FC<Props> = ({ job, emphasis = 'similarity' }) => {
  const showScore = emphasis === 'similarity' && job.similarity_score && job.similarity_score > 0;
  return (
    <HardLink
      to={`/job/${generateSlug(job.title, job.company)}`}
      className="block p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-secondary-900 dark:text-white truncate">{job.title}</h4>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {job.company}
            </span>
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
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {showScore && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold whitespace-nowrap">
              {Math.round(job.similarity_score!)}% similar
            </span>
          )}
          {job.salary && (
            <span className="text-sm font-semibold text-primary-600 flex items-center gap-0.5">
              {emphasis === 'salary' && <DollarSign className="h-3 w-3" />}
              {job.salary}
            </span>
          )}
        </div>
      </div>
    </HardLink>
  );
};

export default RelatedJobCard;
