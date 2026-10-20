import React, { useMemo, useState } from 'react';
import { User, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// QA04 (2026-10-20 tester retest): these ids used to be
// pending/reviewing/interview/offered/hired/rejected, which don't match
// job_applications_status_check (Applied/Screening/Interview/Offer/
// Rejected -- Hired didn't exist in the schema at all). Every drag
// attempted a status update the database constraint rejected outright,
// 100% of the time, silently (see handleDrop). Aligned to the real
// values; Hired added to the check constraint in the companion migration
// (20261020_fix_job_applications_status_values.sql).
const STAGES: Array<{ id: string; label: string; tone: string }> = [
  { id: 'Applied', label: 'New', tone: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' },
  { id: 'Screening', label: 'Reviewing', tone: 'border-blue-300 bg-blue-50 dark:bg-blue-900/10' },
  { id: 'Interview', label: 'Interview', tone: 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/10' },
  { id: 'Offer', label: 'Offered', tone: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' },
  { id: 'Hired', label: 'Hired', tone: 'border-green-400 bg-green-50 dark:bg-green-900/10' },
  { id: 'Rejected', label: 'Rejected', tone: 'border-rose-300 bg-rose-50 dark:bg-rose-900/10' },
];

interface Applicant {
  id: string;
  status: string;
  user_id: string;
  applied_at: string;
  user_name?: string | null;
  user_email?: string | null;
  job_id?: string;
}

interface Props {
  applications: Applicant[];
  jobs: Array<{ id: string; title: string }>;
  onStatusUpdate: (id: string, status: string) => void | Promise<void>;
  onOpen?: (app: Applicant) => void;
}

const ApplicantKanban: React.FC<Props> = ({ applications, jobs, onStatusUpdate, onOpen }) => {
  const [dragId, setDragId] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string>('all');

  const jobTitle = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach((j) => map.set(j.id, j.title));
    return map;
  }, [jobs]);

  const filtered = useMemo(() => {
    if (jobFilter === 'all') return applications;
    return applications.filter((a) => a.job_id === jobFilter);
  }, [applications, jobFilter]);

  const grouped = useMemo(() => {
    const acc: Record<string, Applicant[]> = {};
    STAGES.forEach((s) => {
      acc[s.id] = [];
    });
    filtered.forEach((a) => {
      const key = STAGES.some((s) => s.id === a.status) ? a.status : 'Applied';
      acc[key].push(a);
    });
    return acc;
  }, [filtered]);

  const moveApplicant = async (id: string, stage: string) => {
    const app = applications.find((a) => a.id === id);
    if (!app || app.status === stage) return;
    try {
      await onStatusUpdate(id, stage);
    } catch (err) {
      // QA04: onStatusUpdate used to be called without await/catch here,
      // so a rejected update (e.g. the status check-constraint mismatch
      // that caused this whole bug) was a silently swallowed promise
      // rejection -- the card just never moved, with no error shown.
      console.error('Failed to update applicant status:', err);
      toast.error('Failed to move applicant. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = dragId ?? e.dataTransfer.getData('text/plain');
    setDragId(null);
    if (!id) return;
    void moveApplicant(id, stage);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
          Applicant pipeline
        </h3>
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage.id)}
            className={`rounded-xl border-2 border-dashed ${stage.tone} p-2 min-h-[200px]`}
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                {stage.label}
              </p>
              <span className="text-[10px] text-gray-500 dark:text-slate-400">
                {grouped[stage.id].length}
              </span>
            </div>
            <ul className="space-y-2">
              {grouped[stage.id].map((a) => (
                <li
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(a.id);
                    e.dataTransfer.setData('text/plain', a.id);
                  }}
                  onClick={() => onOpen?.(a)}
                  className="group bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-2 cursor-grab active:cursor-grabbing hover:border-primary-300"
                >
                  <div className="flex items-start gap-1.5">
                    <GripVertical className="h-3 w-3 text-gray-300 dark:text-slate-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-secondary-900 dark:text-white truncate flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        {a.user_name ?? a.user_email ?? 'Applicant'}
                      </p>
                      {a.job_id && (
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                          {jobTitle.get(a.job_id) ?? 'Job'}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(a.applied_at), { addSuffix: true })}
                      </p>
                      {/* QA04: keyboard-accessible alternative to dragging -- a
                          native select is fully operable via Tab/arrows/Enter,
                          no drag gesture required. */}
                      <select
                        value={a.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          void moveApplicant(a.id, e.target.value);
                        }}
                        aria-label={`Move ${a.user_name ?? a.user_email ?? 'applicant'} to a different stage`}
                        className="mt-1.5 w-full text-[10px] rounded border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 py-0.5"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </li>
              ))}
              {grouped[stage.id].length === 0 && (
                <li className="text-[11px] text-gray-400 dark:text-slate-500 text-center py-4">
                  Drop here
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
        Drag cards between columns, or use the stage dropdown on each card, to update status.
      </p>
    </div>
  );
};

export default ApplicantKanban;
