import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { SortableTable, Column } from './SortableTable';
import HardLink from '../HardLink';

// Ray/Scott QA (2026-10-27): the is_it_role classifier (N07,
// 20261018_it_job_eligibility.sql) deliberately leaves ambiguous titles
// at NULL -- "quarantine for review" per the original handoff. Nothing
// ever built the review half of that: 1,736 of 2,551 jobs platform-wide
// sit unclassified, invisible on every public surface (Browse Jobs, the
// homepage, company pages all filter to is_it_role = true), with no way
// for an admin to see or act on the backlog. This is that screen.
//
// Takes the already-loaded `jobs` array from useAdminData (no separate
// fetch -- it's already paginated to the full table) and writes directly
// to jobs.is_it_role on approve/reject. Resolved rows disappear from the
// list immediately (optimistic), matching the pattern PendingApprovals.tsx
// already uses for company approvals.

interface MinimalJob {
  id: string;
  title: string;
  company: string;
  source_company?: string;
  posted_date?: string;
  is_it_role?: boolean | null;
}

interface Props {
  jobs: MinimalJob[];
}

const JobClassificationReview: React.FC<Props> = ({ jobs }) => {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const unclassified = useMemo(
    () => jobs.filter((j) => j.is_it_role === null && !resolvedIds.has(j.id)),
    [jobs, resolvedIds],
  );

  const classify = async (job: MinimalJob, isItRole: boolean) => {
    setBusyId(job.id);
    const { error } = await supabase.from('jobs').update({ is_it_role: isItRole }).eq('id', job.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResolvedIds((prev) => new Set(prev).add(job.id));
    toast.success(isItRole ? `Marked "${job.title}" as IT/technical` : `Marked "${job.title}" as not IT/technical`);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">IT Classification Review</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {unclassified.length} unreviewed
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Jobs the title classifier couldn&rsquo;t confidently place as IT/technical or not. They&rsquo;re invisible
          on every public surface (Browse Jobs, homepage, company pages) until reviewed here &mdash; this isn&rsquo;t
          a bug, it&rsquo;s the classifier correctly declining to guess. Approve marks a job as IT/technical
          (publicly visible); Reject keeps it hidden from public search without deleting it.
        </p>
        {unclassified.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">Nothing left to review.</p>
          </div>
        ) : (
          <SortableTable
            columns={[
              {
                key: 'title', label: 'Job Title',
                render: (job) => (
                  <HardLink to={`/jobs/${job.id}`} className="text-sm font-medium text-primary-700 hover:underline">
                    {job.title}
                  </HardLink>
                ),
                getValue: (job) => job.title,
              },
              { key: 'company', label: 'Company', getValue: (job) => job.company || '' },
              {
                key: 'source_company', label: 'Source',
                getValue: (job) => job.source_company || job.company || 'Direct',
                render: (job) => <>{job.source_company || job.company || 'Direct'}</>,
              },
              {
                key: 'posted_date', label: 'Posted',
                getValue: (job) => job.posted_date || '',
                render: (job) => <>{job.posted_date ? new Date(job.posted_date).toLocaleDateString() : '—'}</>,
              },
              {
                key: 'actions', label: 'Actions', sortable: false, filterable: false,
                render: (job) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === job.id}
                      onClick={() => classify(job, true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                    >
                      {busyId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      IT role
                    </button>
                    <button
                      type="button"
                      disabled={busyId === job.id}
                      onClick={() => classify(job, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-md disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      Not IT
                    </button>
                  </div>
                ),
              },
            ] as Column<MinimalJob>[]}
            data={unclassified}
            rowKey={(job) => job.id}
          />
        )}
      </div>
    </div>
  );
};

export default JobClassificationReview;
