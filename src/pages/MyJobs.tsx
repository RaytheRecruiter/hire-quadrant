import React, { useCallback, useEffect, useState } from 'react';
import { useConfirm } from '../components/ConfirmDialog';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bookmark, Inbox, Briefcase, CalendarClock, Archive, Loader2, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import ApplicationStatusTimeline from '../components/ApplicationStatusTimeline';

type Tab = 'saved' | 'invitations' | 'applied' | 'interviews' | 'archived';

interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  posted_date?: string | null;
  application_id?: string | null; // populated when viewing the Applied tab
  // Populated when viewing the Interviews tab.
  interview_at?: string | null;
  interview_location?: string | null;
  interview_meeting_url?: string | null;
}

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'invitations', label: 'Invitations', icon: Inbox },
  { id: 'applied', label: 'Applied', icon: Briefcase },
  { id: 'interviews', label: 'Interviews', icon: CalendarClock },
  { id: 'archived', label: 'Archived', icon: Archive },
];

const MyJobs: React.FC = () => {
  const confirmAction = useConfirm();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [active, setActive] = useState<Tab>('saved');
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setJobs([]);

    try {
      if (active === 'saved') {
        const { data, error } = await supabase
          .from('saved_jobs')
          .select('job:jobs(id, title, company, location, posted_date)')
          .eq('user_id', user.id);
        if (error) console.error('Error loading saved jobs:', error);
        setJobs(((data ?? []).map((r: any) => r.job).filter(Boolean)) as JobRow[]);
      } else if (active === 'applied') {
        const { data, error } = await supabase
          .from('job_applications')
          .select('id, job:jobs(id, title, company, location, posted_date)')
          .eq('user_id', user.id);
        // QA02: this embed silently errored on every call until the
        // missing job_applications -> jobs FK was added
        // (20261020_fix_job_applications_missing_fk.sql) -- the error was
        // never surfaced before, so the tab just looked empty.
        if (error) console.error('Error loading applied jobs:', error);
        setJobs(
          ((data ?? [])
            .filter((r: any) => r.job)
            .map((r: any) => ({ ...r.job, application_id: r.id }))) as JobRow[],
        );
      } else if (active === 'archived') {
        const { data, error } = await supabase
          .from('job_skips')
          .select('job:jobs(id, title, company, location, posted_date)')
          .eq('user_id', user.id);
        if (error) console.error('Error loading archived jobs:', error);
        setJobs(((data ?? []).map((r: any) => r.job).filter(Boolean)) as JobRow[]);
      } else if (active === 'interviews') {
        // Ray QA (2026-11-03): this tab was a permanent stub -- scheduling
        // an interview (ScheduleInterviewModal) never read from here, so it
        // always rendered empty regardless of what employers scheduled.
        // Two-step fetch (this user's application ids, then interviews for
        // those ids) to match the rest of this file's style rather than a
        // nested-embed filter, which isn't used anywhere else in this repo.
        const { data: apps, error: appsErr } = await supabase
          .from('job_applications')
          .select('id, job:jobs(id, title, company, location, posted_date)')
          .eq('user_id', user.id);
        if (appsErr) console.error('Error loading applications for interviews tab:', appsErr);
        const appById = new Map(
          (apps ?? []).filter((r: any) => r.job).map((r: any) => [r.id, r.job]),
        );
        const appIds = Array.from(appById.keys());
        if (appIds.length === 0) {
          setJobs([]);
        } else {
          const { data: interviews, error: interviewsErr } = await supabase
            .from('scheduled_interviews')
            .select('application_id, scheduled_for, location, meeting_url, status')
            .in('application_id', appIds)
            .neq('status', 'cancelled')
            .order('scheduled_for', { ascending: true });
          if (interviewsErr) console.error('Error loading interviews:', interviewsErr);
          setJobs(
            ((interviews ?? [])
              .map((iv: any) => {
                const job = appById.get(iv.application_id);
                if (!job) return null;
                return {
                  ...job,
                  application_id: iv.application_id,
                  interview_at: iv.scheduled_for,
                  interview_location: iv.location,
                  interview_meeting_url: iv.meeting_url,
                };
              })
              .filter(Boolean)) as JobRow[],
          );
        }
      } else {
        // invitations — not yet implemented
        setJobs([]);
      }
    } catch (err) {
      console.error('Unexpected error loading my-jobs tab:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [active, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const withdraw = async (applicationId: string) => {
    if (!(await confirmAction({ title: 'Withdraw this application?', message: "The employer will no longer see it. You can apply again later if the job is still open.", confirmLabel: 'Withdraw', destructive: true }))) return;
    const { error } = await supabase.from('job_applications').delete().eq('id', applicationId);
    if (error) { toast.error(error.message); return; }
    toast.success('Application withdrawn');
    load();
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/my-jobs" replace />;

  const activeLabel = TABS.find((t) => t.id === active)?.label ?? '';
  const stubCopy: Record<Tab, string> = {
    saved: '',
    applied: '',
    archived: '',
    invitations: 'No invitations yet. Employers you follow will be able to reach out here.',
    interviews: 'No scheduled interviews. Once an employer schedules one, it will show up here.',
  };

  return (
    <>
      <Helmet>
        <title>My Jobs · Nexegin</title>
      </Helmet>
      <div className="min-h-dvh bg-secondary-50 dark:bg-slate-950 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">My Jobs</h1>
            <p className="text-secondary-600 dark:text-slate-400">
              Everything you've saved, applied to, and archived in one place.
            </p>
          </header>

          <div className="border-b border-secondary-200 dark:border-slate-700 mb-6 overflow-x-auto">
            <nav className="flex gap-6" aria-label="My jobs tabs">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = active === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActive(t.id)}
                    className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-secondary-100 dark:border-slate-700 p-5">
            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="h-6 w-6 text-primary-500 dark:text-primary-400 animate-spin mx-auto" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-secondary-500 dark:text-slate-400">
                  {stubCopy[active] || `You have no ${activeLabel.toLowerCase()} jobs yet.`}
                </p>
                {(active === 'saved' || active === 'applied') && (
                  <HardLink
                    to="/"
                    className="inline-block mt-3 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    Browse jobs →
                  </HardLink>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                {jobs.map((j) => {
                  const appId = j.application_id ?? null;
                  const isOpen = appId && expandedAppId === appId;
                  return (
                    <li key={`${j.id}-${appId ?? 'x'}`} className="py-3">
                      <div className="flex items-start justify-between gap-3 hover:bg-secondary-50 dark:hover:bg-slate-700/50 -mx-3 px-3 py-2 rounded-lg">
                        <HardLink to={`/jobs/${j.id}`} className="min-w-0 flex-1">
                          <p className="font-medium text-secondary-900 dark:text-white truncate">{j.title}</p>
                          <p className="text-xs text-secondary-500 dark:text-slate-400 truncate">
                            {j.company}
                            {j.location ? ` · ${j.location}` : ''}
                          </p>
                          {active === 'interviews' && j.interview_at && (
                            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                              {new Date(j.interview_at).toLocaleString()}
                              {j.interview_location ? ` · ${j.interview_location}` : ''}
                              {j.interview_meeting_url ? (
                                <>
                                  {' · '}
                                  <a
                                    href={j.interview_meeting_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="underline hover:text-primary-700"
                                  >
                                    Join link
                                  </a>
                                </>
                              ) : ''}
                            </p>
                          )}
                        </HardLink>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {active === 'applied' && appId && (
                            <>
                              <button
                                type="button"
                                onClick={() => setExpandedAppId(isOpen ? null : appId)}
                                title="View status timeline"
                                className="inline-flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-800 px-2 py-1 rounded hover:bg-secondary-100 dark:hover:bg-slate-700"
                              >
                                {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                Status
                              </button>
                              <button
                                type="button"
                                onClick={() => withdraw(appId)}
                                title="Withdraw application"
                                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              >
                                <X className="h-3.5 w-3.5" />
                                Withdraw
                              </button>
                            </>
                          )}
                          {active === 'saved' && (
                            <HardLink
                              to={`/jobs/${j.id}#apply-form`}
                              className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            >
                              Apply
                            </HardLink>
                          )}
                          {active === 'archived' && (
                            <HardLink
                              to={`/jobs/${j.id}#apply-form`}
                              className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Apply again
                            </HardLink>
                          )}
                        </div>
                      </div>
                      {isOpen && appId && (
                        <div className="ml-2 mt-2 pl-4 border-l-2 border-primary-100 dark:border-primary-900/40">
                          <ApplicationStatusTimeline applicationId={appId} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyJobs;
