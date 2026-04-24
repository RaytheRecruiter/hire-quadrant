import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bookmark, Inbox, Briefcase, CalendarClock, Archive, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

type Tab = 'saved' | 'invitations' | 'applied' | 'interviews' | 'archived';

interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  posted_date?: string | null;
  application_id?: string | null; // populated when viewing the Applied tab
}

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'invitations', label: 'Invitations', icon: Inbox },
  { id: 'applied', label: 'Applied', icon: Briefcase },
  { id: 'interviews', label: 'Interviews', icon: CalendarClock },
  { id: 'archived', label: 'Archived', icon: Archive },
];

const MyJobs: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [active, setActive] = useState<Tab>('saved');
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setJobs([]);

    try {
      if (active === 'saved') {
        const { data } = await supabase
          .from('saved_jobs')
          .select('job:jobs(id, title, company, location, posted_date)')
          .eq('user_id', user.id);
        setJobs(((data ?? []).map((r: any) => r.job).filter(Boolean)) as JobRow[]);
      } else if (active === 'applied') {
        const { data } = await supabase
          .from('applications')
          .select('id, job:jobs(id, title, company, location, posted_date)')
          .eq('user_id', user.id);
        setJobs(
          ((data ?? [])
            .filter((r: any) => r.job)
            .map((r: any) => ({ ...r.job, application_id: r.id }))) as JobRow[],
        );
      } else if (active === 'archived') {
        const { data } = await supabase
          .from('job_skips')
          .select('job:jobs(id, title, company, location, posted_date)')
          .eq('user_id', user.id);
        setJobs(((data ?? []).map((r: any) => r.job).filter(Boolean)) as JobRow[]);
      } else {
        // invitations & interviews — not yet implemented
        setJobs([]);
      }
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [active, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const withdraw = async (applicationId: string) => {
    if (!window.confirm('Withdraw this application?')) return;
    const { error } = await supabase.from('applications').delete().eq('id', applicationId);
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
        <title>My Jobs · HireQuadrant</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">My Jobs</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Everything you've saved, applied to, and archived in one place.
            </p>
          </header>

          <div className="border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
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
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {stubCopy[active] || `You have no ${activeLabel.toLowerCase()} jobs yet.`}
                </p>
                {(active === 'saved' || active === 'applied') && (
                  <HardLink
                    to="/"
                    className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Browse jobs →
                  </HardLink>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {jobs.map((j) => (
                  <li key={`${j.id}-${j.application_id ?? 'x'}`} className="py-3">
                    <div className="flex items-start justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 -mx-3 px-3 py-2 rounded-lg">
                      <HardLink to={`/jobs/${j.id}`} className="min-w-0 flex-1">
                        <p className="font-medium text-secondary-900 dark:text-white truncate">{j.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {j.company}
                          {j.location ? ` · ${j.location}` : ''}
                        </p>
                      </HardLink>
                      {active === 'applied' && j.application_id && (
                        <button
                          type="button"
                          onClick={() => withdraw(j.application_id!)}
                          title="Withdraw application"
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                          Withdraw
                        </button>
                      )}
                      {active === 'saved' && (
                        <HardLink
                          to={`/jobs/${j.id}#apply-form`}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 flex-shrink-0"
                        >
                          Apply
                        </HardLink>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyJobs;
