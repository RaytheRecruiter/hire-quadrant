import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Users, Download, Filter } from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [candidateInfo, setCandidateInfo] = useState<Record<string, any>>({});

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

  const handleResumeDownload = async (userId: string) => {
    const candidate = candidateInfo[userId];
    if (!candidate?.resume_url) {
      alert('No resume available for this candidate.');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(candidate.resume_url, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        alert('Failed to generate resume download link.');
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
    return true;
  });

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Applicants Yet</h3>
        <p className="text-gray-500">Applicants for your jobs will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="all">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApplications.map((app) => {
              const candidate = candidateInfo[app.user_id];
              return (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {candidate?.name || app.candidate_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {candidate?.email || app.candidate_email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getJobTitle(app.job_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {app.created_at
                      ? new Date(app.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[app.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {app.status
                        ? app.status.charAt(0).toUpperCase() + app.status.slice(1)
                        : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleResumeDownload(app.user_id)}
                      className="text-primary-500 hover:text-primary-700 transition-colors"
                      title="Download Resume"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={app.status || 'pending'}
                      onChange={(e) => onStatusUpdate(app.id, e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No applicants match the selected filters.
        </div>
      )}
    </div>
  );
};

export default CompanyApplicants;
