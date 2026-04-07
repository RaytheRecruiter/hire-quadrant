import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, Users, Briefcase, Eye, TrendingUp, Calendar, Building2, RotateCcw, Download, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useAdminData } from '../hooks/useAdminData';
import CandidateHub from '../components/CandidateHub';
import { TrackingService } from '../utils/trackingService';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const { jobs, applications, userProfiles, loading, error, updateApplicationStatus, refreshData } = useAdminData();
  const [activeTab, setActiveTab] = useState('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-300 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-700 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalJobs = jobs.length;
  const totalApplications = applications.length;
  const totalViews = jobs.reduce((sum, job) => sum + (job.views || 0), 0);
  const averageApplicationsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : 0;

  // Get top performing jobs (by applications count)
  const topJobs = [...jobs]
    .sort((a, b) => (b.applications || 0) - (a.applications || 0))
    .slice(0, 5);

  // Get jobs with highest conversion rates (applications/views)
  const topConversionJobs = [...jobs]
    .filter(job => (job.views || 0) > 0)
    .sort((a, b) => ((b.applications || 0) / (b.views || 1)) - ((a.applications || 0) / (a.views || 1)))
    .slice(0, 5);

  // Get recent applications (already ordered by applied_at desc from the hook)
  const recentApplications = applications.slice(0, 10);

  // Build a lookup of user profiles by user_id for enriching applications
  const profilesByUserId: Record<string, { name: string; email: string }> = {};
  userProfiles.forEach(p => {
    profilesByUserId[p.user_id] = { name: p.name, email: p.email || '' };
  });

  // Helper to get user name for an application
  const getUserName = (app: typeof applications[0]) => {
    return app.user_name || profilesByUserId[app.user_id]?.name || 'Unknown';
  };

  // Helper to get user email for an application
  const getUserEmail = (app: typeof applications[0]) => {
    return app.user_email || profilesByUserId[app.user_id]?.email || '';
  };

  // Get unique candidates from applications
  const candidatesFromApps = applications.reduce((acc, app) => {
    const email = getUserEmail(app);
    const existingCandidate = acc.find(c => c.email === email);
    if (existingCandidate) {
      existingCandidate.applications.push(app);
      existingCandidate.totalApplications++;
      if (new Date(app.applied_at) > new Date(existingCandidate.lastActivity)) {
        existingCandidate.lastActivity = app.applied_at;
      }
    } else {
      acc.push({
        id: app.user_id,
        name: getUserName(app),
        email: email,
        applications: [app],
        totalApplications: 1,
        lastActivity: app.applied_at,
        status: app.status
      });
    }
    return acc;
  }, [] as Array<{
    id: string;
    name: string;
    email: string;
    applications: typeof applications;
    totalApplications: number;
    lastActivity: string;
    status: string;
  }>);

  // Sort candidates by last activity
  const sortedCandidates = candidatesFromApps.sort((a, b) =>
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  // Candidate statistics
  const totalCandidates = candidatesFromApps.length;
  const activeCandidates = candidatesFromApps.filter(c =>
    new Date(c.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const candidatesWithMultipleApps = candidatesFromApps.filter(c => c.totalApplications > 1).length;

  // Application status distribution
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Source company statistics
  const sourceStats = jobs.reduce((acc, job) => {
    const source = job.source_company || 'Direct';
    if (!acc[source]) {
      acc[source] = { jobs: 0, views: 0, applications: 0 };
    }
    acc[source].jobs += 1;
    acc[source].views += (job.views || 0);
    acc[source].applications += (job.applications || 0);
    return acc;
  }, {} as Record<string, { jobs: number; views: number; applications: number }>);

  // Job type distribution
  const jobTypeStats = jobs.reduce((acc, job) => {
    const type = job.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get tracking summary
  const trackingSummary = TrackingService.getSummary();

  const handleResetStats = () => {
    TrackingService.resetAllStats();
    setShowResetConfirm(false);
  };

  const exportTrackingData = () => {
    const data = TrackingService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `job-tracking-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const importTrackingData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (TrackingService.importData(content)) {
        const messageBox = document.createElement('div');
        messageBox.innerHTML = `
          <div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background-color:white; padding:2rem; border-radius:0.5rem; box-shadow:0 4px 6px rgba(0,0,0,0.1); z-index:100;">
            <p>Tracking data imported successfully!</p>
            <button onclick="document.body.removeChild(this.parentNode.parentNode); window.location.reload();" style="margin-top:1rem; padding:0.5rem 1rem; background-color:blue; color:white; border-radius:0.25rem;">OK</button>
          </div>
        `;
        document.body.appendChild(messageBox);
      } else {
        const messageBox = document.createElement('div');
        messageBox.innerHTML = `
          <div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background-color:white; padding:2rem; border-radius:0.5rem; box-shadow:0 4px 6px rgba(0,0,0,0.1); z-index:100;">
            <p>Failed to import tracking data. Please check the file format.</p>
            <button onclick="document.body.removeChild(this.parentNode.parentNode);" style="margin-top:1rem; padding:0.5rem 1rem; background-color:red; color:white; border-radius:0.25rem;">OK</button>
          </div>
        `;
        document.body.appendChild(messageBox);
      }
    };
    reader.readAsText(file);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
    } catch (err) {
      console.error('Failed to update application status:', err);
    }
  };

  // Build candidates data for CandidateHub component
  // CandidateHub expects: candidates, applications, jobs
  // candidates shape: { id, name, email, applications: JobApplication[], totalApplications, lastActivity: Date, status }
  const candidateHubCandidates = candidatesFromApps.map(c => ({
    ...c,
    lastActivity: new Date(c.lastActivity),
  }));

  // Map applications to the shape CandidateHub expects (JobApplication from JobContext)
  const candidateHubApplications = applications.map(app => ({
    id: app.id,
    job_id: app.job_id,
    user_id: app.user_id,
    status: app.status as 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected',
    applied_at: app.applied_at,
    source_company: app.source_company,
  }));

  // Map jobs to the shape CandidateHub expects (Job from JobContext)
  const candidateHubJobs = jobs.map(j => ({
    id: j.id,
    title: j.title,
    description: j.description || '',
    externalJobId: j.external_job_id || '',
    externalUrl: j.external_url,
    postedDate: j.posted_date || '',
    sourceCompany: j.source_company || '',
    sourceXmlFile: j.source_xml_file,
    company: j.company,
    location: j.location,
    type: j.type,
    salary: j.salary,
  }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor job board performance and manage applications</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportTrackingData}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            <label className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={importTrackingData}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Stats
            </button>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset All Statistics</h3>
              <p className="text-gray-600 mb-6">
                This will reset all job views, applications, and tracking data. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleResetStats}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
                >
                  Reset All Stats
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Eye className="h-6 w-6 text-secondary-900" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg Applications/Job</p>
                <p className="text-2xl font-bold text-gray-900">{averageApplicationsPerJob}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Jobs Tracked</p>
              <p className="font-bold text-gray-900">{trackingSummary.jobCount}</p>
            </div>
            <div>
              <p className="text-gray-600">Avg Views/Job</p>
              <p className="font-bold text-gray-900">{trackingSummary.averageViewsPerJob}</p>
            </div>
            <div>
              <p className="text-gray-600">Conversion Rate</p>
              <p className="font-bold text-gray-900">{trackingSummary.conversionRate}%</p>
            </div>
            <div>
              <p className="text-gray-600">Last Reset</p>
              <p className="font-bold text-gray-900">{format(trackingSummary.lastReset, 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-300 text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-primary-300 text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Job Performance
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sources'
                  ? 'border-primary-300 text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Source Performance
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-primary-300 text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'candidates'
                  ? 'border-primary-300 text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Candidates
            </button>
            <button
              onClick={() => setActiveTab('candidate-hub')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'candidate-hub'
                  ? 'border-primary-300 text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Candidate Hub
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Type Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Type Distribution</h3>
              <div className="space-y-3">
                {Object.entries(jobTypeStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize text-gray-600">{type.replace('-', ' ')}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-primary-300 h-2 rounded-full"
                          style={{ width: `${(count / totalJobs) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Distribution</h3>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize text-gray-600">{status}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-primary-300 h-2 rounded-full"
                          style={{ width: `${(count / totalApplications) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentApplications.slice(0, 5).map((application) => (
                  <div key={application.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{getUserName(application)}</p>
                      <p className="text-xs text-gray-500">
                        Applied to {jobs.find(j => j.id === application.job_id)?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {format(new Date(application.applied_at), 'MMM d, yyyy')}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === 'pending' || application.status === 'Applied' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'reviewed' || application.status === 'Screening' ? 'bg-blue-100 text-blue-800' :
                        application.status === 'accepted' || application.status === 'Offer' ? 'bg-primary-100 text-primary-800' :
                        application.status === 'Interview' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Job Performance Analytics</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Jobs by Applications */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Most Applied Jobs</h4>
                  <div className="space-y-3">
                    {topJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                          <div className="text-xs text-gray-500">{job.company}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-600">{job.applications || 0}</div>
                          <div className="text-xs text-gray-500">applications</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Jobs by Conversion Rate */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Best Conversion Rates</h4>
                  <div className="space-y-3">
                    {topConversionJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                          <div className="text-xs text-gray-500">{job.company}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-secondary-600">
                            {(((job.applications || 0) / (job.views || 1)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">conversion</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h4 className="text-md font-semibold text-gray-800 mb-4">All Jobs Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {job.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {job.source_company || 'Direct'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {job.views || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {job.applications || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(job.views || 0) > 0 ? (((job.applications || 0) / (job.views || 1)) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Company Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Jobs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Conversion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(sourceStats).map(([source, stats]) => (
                      <tr key={source} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-primary-100 rounded-lg mr-3">
                              <Building2 className="h-4 w-4 text-primary-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{source}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats.jobs}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats.views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats.applications}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats.views > 0 ? ((stats.applications / stats.views) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{getUserName(application)}</div>
                          <div className="text-sm text-gray-500">{getUserEmail(application)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {jobs.find(j => j.id === application.job_id)?.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {jobs.find(j => j.id === application.job_id)?.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {jobs.find(j => j.id === application.job_id)?.source_company || 'Direct'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(application.applied_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusChange(application.id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer ${
                              application.status === 'pending' || application.status === 'Applied' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'reviewed' || application.status === 'Screening' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'accepted' || application.status === 'Offer' ? 'bg-green-100 text-green-800' :
                              application.status === 'Interview' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Screening">Screening</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-8">
            {/* Candidate Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Candidates</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCandidates}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active (30 days)</p>
                    <p className="text-2xl font-bold text-gray-900">{activeCandidates}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Multiple Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{candidatesWithMultipleApps}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Applications
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {candidate.totalApplications}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(candidate.lastActivity), 'MMM d, yyyy h:mm a')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidate-hub' && (
          <CandidateHub
            candidates={candidateHubCandidates}
            applications={candidateHubApplications}
            jobs={candidateHubJobs}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
