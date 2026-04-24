import React, { useEffect, useState } from 'react';
import { Bookmark, Briefcase, Bell, MessageSquare, Sparkles, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import HardLink from './HardLink';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useProfileCompleteness } from '../hooks/useProfileCompleteness';
import { formatDistanceToNow } from 'date-fns';

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  job?: { id: string; title: string; company: string | null };
}

interface JobRow {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  posted_date: string | null;
}

const CandidateHomeDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const inputs = useProfileCompleteness();
  const [savedCount, setSavedCount] = useState(0);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<JobRow[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [savedRes, appsRes, notifsRes, msgsRes, jobsRes] = await Promise.all([
        supabase
          .from('saved_jobs')
          .select('job_id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('job_applications')
          .select('id, status, applied_at, job:jobs(id, title, company)')
          .eq('user_id', user.id)
          .order('applied_at', { ascending: false })
          .limit(5),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('read_at', null),
        supabase
          .from('conversations')
          .select('id, last_message_at, messages(id, read_at, sender_id)')
          .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
          .order('last_message_at', { ascending: false })
          .limit(20),
        supabase
          .from('jobs')
          .select('id, title, company, location, posted_date')
          .order('posted_date', { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;
      setSavedCount(savedRes.count ?? 0);
      setApplications((appsRes.data as ApplicationRow[]) ?? []);
      setUnreadNotifs(notifsRes.count ?? 0);
      setRecommendedJobs((jobsRes.data as JobRow[]) ?? []);

      const unread = (msgsRes.data ?? []).reduce((acc: number, convo: { messages?: Array<{ read_at: string | null; sender_id: string }> }) => {
        const msgs = convo.messages ?? [];
        return acc + msgs.filter((m) => !m.read_at && m.sender_id !== user.id).length;
      }, 0);
      setUnreadMsgs(unread);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!isAuthenticated || !user) return null;

  const completenessScore = (() => {
    const weights: Record<string, number> = {
      hasName: 5, hasHeadline: 10, hasAvatar: 10, hasResume: 20,
      hasExperience: 20, hasEducation: 10, hasSkills: 15, hasPreferences: 10,
    };
    let earned = 0;
    for (const [key, w] of Object.entries(weights)) {
      if (inputs[key as keyof typeof inputs]) earned += w;
    }
    return earned;
  })();

  return (
    <section className="bg-gradient-to-br from-primary-50/60 via-white to-white dark:from-primary-900/20 dark:via-slate-950 dark:to-slate-950 border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Welcome back, {user.name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Your job search at a glance.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Applied"
            value={applications.length}
            icon={<Briefcase className="h-4 w-4" />}
            href="/my-jobs"
            tone="text-primary-600 dark:text-primary-400"
          />
          <StatCard
            label="Saved"
            value={savedCount}
            icon={<Bookmark className="h-4 w-4" />}
            href="/my-jobs"
            tone="text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            label="Messages"
            value={unreadMsgs}
            icon={<MessageSquare className="h-4 w-4" />}
            href="/messages"
            tone="text-emerald-600 dark:text-emerald-400"
            badge={unreadMsgs > 0}
          />
          <StatCard
            label="Notifications"
            value={unreadNotifs}
            icon={<Bell className="h-4 w-4" />}
            href="/notifications"
            tone="text-amber-600 dark:text-amber-400"
            badge={unreadNotifs > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile strength */}
          <aside className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                Profile strength
              </h3>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-secondary-900 dark:text-white">
                {completenessScore}%
              </span>
              {completenessScore < 100 && (
                <span className="text-xs text-gray-500 dark:text-slate-400">complete</span>
              )}
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all ${
                  completenessScore >= 90
                    ? 'bg-emerald-500'
                    : completenessScore >= 60
                    ? 'bg-primary-500'
                    : completenessScore >= 30
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            <HardLink
              to="/profile"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {completenessScore === 100 ? 'View profile' : 'Finish your profile'}
              <ArrowRight className="h-3 w-3" />
            </HardLink>
          </aside>

          {/* Recent applications */}
          <aside className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary-500" />
                <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                  Recent applications
                </h3>
              </div>
              <HardLink
                to="/my-jobs"
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View all →
              </HardLink>
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : applications.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                No applications yet.{' '}
                <HardLink to="/jobs" className="text-primary-600 hover:text-primary-700 font-medium">
                  Browse jobs →
                </HardLink>
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {applications.map((a) => (
                  <li key={a.id} className="py-2">
                    <HardLink
                      to={a.job?.id ? `/jobs/${a.job.id}` : '/my-jobs'}
                      className="flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-1 rounded"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                          {a.job?.title ?? 'Job'}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {a.job?.company} ·{' '}
                          {formatDistanceToNow(new Date(a.applied_at), { addSuffix: true })}
                        </p>
                      </div>
                      <StatusPill status={a.status} />
                    </HardLink>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {/* Jobs matching */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                Fresh jobs you might like
              </h3>
            </div>
            <HardLink
              to="/jobs"
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Browse all →
            </HardLink>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : recommendedJobs.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              No fresh jobs right now.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {recommendedJobs.map((j) => (
                <HardLink
                  key={j.id}
                  to={`/jobs/${j.id}`}
                  className="block p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                    {j.title}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                    {j.company} {j.location && `· ${j.location}`}
                  </p>
                  {j.posted_date && (
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                      {formatDistanceToNow(new Date(j.posted_date), { addSuffix: true })}
                    </p>
                  )}
                </HardLink>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  tone: string;
  badge?: boolean;
}> = ({ label, value, icon, href, tone, badge }) => (
  <HardLink
    to={href}
    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 hover:border-primary-300 dark:hover:border-primary-500 transition-colors relative"
  >
    <div className={`flex items-center gap-1.5 mb-1 ${tone}`}>
      {icon}
      <span className="text-[11px] uppercase tracking-wide font-semibold">{label}</span>
    </div>
    <p className="text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
    {badge && (
      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />
    )}
  </HardLink>
);

const STATUS_TONES: Record<string, string> = {
  Applied: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  pending: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  Screening: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  reviewing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Interview: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  interview: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  Offer: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  offered: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  Rejected: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  rejected: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  hired: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0 ${
      STATUS_TONES[status] ?? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
    }`}
  >
    {status}
  </span>
);

export default CandidateHomeDashboard;
