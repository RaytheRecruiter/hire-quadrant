import React, { useMemo, useState } from 'react';
import { User, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STAGES: Array<{ id: string; label: string; tone: string }> = [
  { id: 'pending', label: 'New', tone: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' },
  { id: 'reviewing', label: 'Reviewing', tone: 'border-blue-300 bg-blue-50 dark:bg-blue-900/10' },
  { id: 'interview', label: 'Interview', tone: 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/10' },
  { id: 'offered', label: 'Offered', tone: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' },
  { id: 'hired', label: 'Hired', tone: 'border-green-400 bg-green-50 dark:bg-green-900/10' },
  { id: 'rejected', label: 'Rejected', tone: 'border-rose-300 bg-rose-50 dark:bg-rose-900/10' },
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
      const key = STAGES.some((s) => s.id === a.status) ? a.status : 'pending';
      acc[key].push(a);
    });
    return acc;
  }, [filtered]);

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = dragId ?? e.dataTransfer.getData('text/plain');
    if (!id) return;
    const app = applications.find((a) => a.id === id);
    if (app && app.status !== stage) {
      onStatusUpdate(id, stage);
    }
    setDragId(null);
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
        Drag cards between columns to update status.
      </p>
    </div>
  );
};

export default ApplicantKanban;
