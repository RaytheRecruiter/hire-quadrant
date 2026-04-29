import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Users, Download, Filter, Star, Bookmark, Eye, LayoutGrid, List, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import ApplicantDetailModal from './ApplicantDetailModal';
import ApplicantKanban from './ApplicantKanban';
import BulkMessageComposer from './BulkMessageComposer';
import { usePermissions } from '../../hooks/usePermissions';

interface CompanyApplicantsProps {
  applications: any[];
  jobs: any[];
  onStatusUpdate: (id: string, status: string) => void;
}

const STATUS_OPTIONS = ['pending', 'reviewing', 'interview', 'offered', 'hired', 'rejected'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  interview: 'bg-purple-100 text-purple-800',
  offered: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const CompanyApplicants: React.FC<CompanyApplicantsProps> = ({
  applications,
  jobs,
  onStatusUpdate,
}) => {
  const { isOwner, isAdmin, can, member } = usePermissions();
  // No member row → legacy single-tenant flow → grant everything (the
  // backfill migration covers established companies; this is a safety net
  // for users who haven't been mapped yet).
  const noMember = !member;
  const canViewApplicants = noMember || isOwner || isAdmin || can('view_applicants');
  const canMessage = noMember || isOwner || isAdmin || can('message_applicants');
  const canViewContact = noMember || isOwner || isAdmin || can('view_resume_contact');
  const canDownloadResumes = noMember || isOwner || isAdmin || can('download_resumes');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [candidateInfo, setCandidateInfo] = useState<Record<string, any>>({});
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);
  const [detailApp, setDetailApp] = useState<any | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [showBulk, setShowBulk] = useState(false);

  // Fetch candidate info for resume URLs
  useEffect(() => {
    const fetchCandidates = async () => {
      const userIds = [...new Set(applications.map((a) => a.user_id).filter(Boolean))];
      if (userIds.length === 0) return;

      const { data, error } = await supabase
        .from('candidates')
        .select('user_id, name, email, resume_url')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching candidates:', error);
        return;
      }

      const map: Record<string, any> = {};
      (data || []).forEach((c: any) => {
        map[c.user_id] = c;
      });
      setCandidateInfo(map);
    };

    fetchCandidates();
  }, [applications]);

  const handleResumeDownload = async (userId: string, appId: string) => {
    if (!canDownloadResumes) {
      toast.error("You don't have permission to download resumes. Ask your Owner.");
      return;
    }
    const candidate = candidateInfo[userId];
    if (!candidate?.resume_url) {
      toast.error('No resume available for this candidate.');
      return;
    }

    // Record the view so the candidate can see their application was reviewed
    supabase.rpc('record_application_view', { app_id: appId }).then(({ error }) => {
      if (error) console.error('Failed to record application view:', error);
    });

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(candidate.resume_url, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        toast.error('Failed to generate resume download link.');
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error downloading resume:', err);
    }
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    return job?.title || 'Unknown Job';
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (jobFilter !== 'all' && app.job_id !== jobFilter) return false;
    if (showShortlistedOnly && !app.is_shortlisted) return false;
    return true;
  });

  if (!canViewApplicants) {
    return (
      <div className="text-center py-16">
        <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">Applicants are restricted</h3>
        <p className="text-gray-500 dark:text-slate-400">Ask your company Owner or Admin to grant you the "View applicants" permission.</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">No Applicants Yet</h3>
        <p className="text-gray-500 dark:text-slate-400">Applicants for your jobs will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* View toggle + bulk */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 p-0.5">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded ${
              view === 'list'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded ${
              view === 'kanban'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Pipeline
          </button>
        </div>
        {canMessage && (
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Bulk message
          </button>
        )}
      </div>

      {view === 'kanban' ? (
        <ApplicantKanban
          applications={filteredApplications.map((a) => ({
            id: a.id,
            status: a.status,
            user_id: a.user_id,
            applied_at: a.applied_at,
            user_name: a.user_name ?? candidateInfo[a.user_id]?.name ?? null,
            user_email: a.user_email ?? candidateInfo[a.user_id]?.email ?? null,
            job_id: a.job_id,
          }))}
          jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
          onStatusUpdate={(id, status) => onStatusUpdate(id, status)}
          onOpen={(a) => setDetailApp(applications.find((app) => app.id === a.id) ?? null)}
        />
      ) : (
      <>
      {/* Filters */}
      {/* Status filter removed per Scott 2026-04-28: HQ is not a CRM. */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="all">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showShortlistedOnly}
            onChange={(e) => setShowShortlistedOnly(e.target.checked)}
            className="rounded text-primary-500 focus:ring-primary-400"
          />
          <Bookmark className={`h-4 w-4 ${showShortlistedOnly ? 'fill-primary-500 text-primary-500' : 'text-gray-400 dark:text-slate-500'}`} />
          <span className="text-sm text-gray-700 dark:text-slate-300">Shortlisted only</span>
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Resume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {filteredApplications.map((app) => {
              const candidate = candidateInfo[app.user_id];
              return (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {candidate?.name || app.candidate_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">
                        {canViewContact
                          ? (candidate?.email || app.candidate_email || '')
                          : <span className="italic text-gray-400 dark:text-slate-500">Contact info hidden</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    {getJobTitle(app.job_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    {app.created_at
                      ? new Date(app.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      {app.employer_rating ? (
                        <>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className={`h-3.5 w-3.5 ${n <= app.employer_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </>
                      ) : (
                        <span className="text-gray-300 text-xs">Not rated</span>
                      )}
                      {app.is_shortlisted && <Bookmark className="h-3.5 w-3.5 fill-primary-500 text-primary-500 ml-1" />}
                    </div>
                    {app.employer_tags && app.employer_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.employer_tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  {/* Status badge column removed per Scott 2026-04-28: not a CRM. */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canDownloadResumes ? (
                      <button
                        onClick={() => handleResumeDownload(app.user_id, app.id)}
                        className="text-primary-500 hover:text-primary-700 transition-colors"
                        title="Download Resume"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-gray-300 dark:text-slate-600 text-xs italic" title="Restricted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        supabase.rpc('record_application_view', { app_id: app.id });
                        setDetailApp(app);
                      }}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          No applicants match the selected filters.
        </div>
      )}
      </>
      )}

      <ApplicantDetailModal
        open={!!detailApp}
        application={detailApp}
        candidate={detailApp ? candidateInfo[detailApp.user_id] : null}
        job={detailApp ? jobs.find(j => j.id === detailApp.job_id) : null}
        onClose={() => setDetailApp(null)}
        onSaved={() => setRefreshTick(t => t + 1)}
      />

      {showBulk && (
        <BulkMessageComposer
          applicants={filteredApplications.map((a) => ({
            id: a.id,
            user_id: a.user_id,
            user_name: a.user_name ?? candidateInfo[a.user_id]?.name ?? null,
            user_email: a.user_email ?? candidateInfo[a.user_id]?.email ?? null,
            status: a.status,
          }))}
          onClose={() => setShowBulk(false)}
        />
      )}
    </div>
  );
};

export default CompanyApplicants;
