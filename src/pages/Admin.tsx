import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { TrackingService } from '../utils/trackingService';
import { Navigate } from 'react-router-dom';
import { BarChart3, Users, Briefcase, Eye, TrendingUp, Calendar, Building2, RotateCcw, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import CandidateHub from '../components/CandidateHub';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const { jobs, applications, resetAllStats } = useJobs();
  const [activeTab, setActiveTab] = useState('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Calculate statistics
  const totalJobs = jobs.length;
  const totalApplications = applications.length;
  const totalViews = jobs.reduce((sum, job) => sum + job.views, 0);
  const averageApplicationsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : 0;

  // Get top performing jobs (by applications)
  const topJobs = [...jobs]
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5);

  // Get jobs with highest conversion rates (applications/views)
  const topConversionJobs = [...jobs]
    .filter(job => job.views > 0)
    .sort((a, b) => (b.applications / b.views) - (a.applications / a.views))
    .slice(0, 5);

  // Get recent applications
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 10);

  // Get unique candidates from applications
  const candidates = applications.reduce((acc, app) => {
    const existingCandidate = acc.find(c => c.email === app.userEmail);
    if (existingCandidate) {
      existingCandidate.applications.push(app);
      existingCandidate.totalApplications++;
      if (new Date(app.appliedAt) > new Date(existingCandidate.lastActivity)) {
        existingCandidate.lastActivity = app.appliedAt;
      }
    } else {
      acc.push({
        id: app.userId,
        name: app.userName,
        email: app.userEmail,
        applications: [app],
        totalApplications: 1,
        lastActivity: app.appliedAt,
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
    lastActivity: Date;
    status: string;
  }>);

  // Sort candidates by last activity
  const sortedCandidates = candidates.sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  // Candidate statistics
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter(c => 
    new Date(c.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const candidatesWithMultipleApps = candidates.filter(c => c.totalApplications > 1).length;

  // Application status distribution
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Source company statistics
  const sourceStats = jobs.reduce((acc, job) => {
    const source = job.sourceCompany || 'Direct';
    if (!acc[source]) {
      acc[source] = { jobs: 0, views: 0, applications: 0 };
    }
    acc[source].jobs += 1;
    acc[source].views += job.views;
    acc[source].applications += job.applications;
    return acc;
  }, {} as Record<string, { jobs: number; views: number; applications: number }>);

  // Job type distribution
  const jobTypeStats = jobs.reduce((acc, job) => {
    acc[job.type] = (acc[job.type] || 0) + 1;
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
        alert('Tracking data imported successfully!');
        window.location.reload(); // Refresh to show updated data
      } else {
        alert('Failed to import tracking data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="min-h-screen bg-gray-50">
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
                      <p className="text-sm font-medium text-gray-900">{application.userName}</p>
                      <p className="text-xs text-gray-500">
                        Applied to {jobs.find(j => j.id === application.jobId)?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {format(new Date(application.appliedAt), 'MMM d, yyyy')}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                        application.status === 'accepted' ? 'bg-primary-100 text-primary-800' :
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
                    {topJobs.map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                          <div className="text-xs text-gray-500">{job.company}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-600">{job.applications}</div>
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
                    {topConversionJobs.map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                          <div className="text-xs text-gray-500">{job.company}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-secondary-600">
                            {((job.applications / job.views) * 100).toFixed(1)}%
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
                          {job.sourceCompany || 'Direct'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {job.views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {job.applications}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {job.views > 0 ? ((job.applications / job.views) * 100).toFixed(1) : 0}%
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
                          <div className="text-sm font-medium text-gray-900">{application.userName}</div>
                          <div className="text-sm text-gray-500">{application.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {jobs.find(j => j.id === application.jobId)?.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {jobs.find(j => j.id === application.jobId)?.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {jobs.find(j => j.id === application.jobId)?.sourceCompany || 'Direct'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(application.appliedAt), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'accepted' ? 'bg-primary-100 text-primary-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status}
                          </span>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Candidates</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applications
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Latest Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary-600">
                                    {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                <div className="text-sm text-gray-500">{candidate.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{candidate.totalApplications} applications</div>
                            <div className="text-sm text-gray-500">
                              {candidate.applications.map(app => 
                                jobs.find(j => j.id === app.jobId)?.title
                              ).filter(Boolean).slice(0, 2).join(', ')}
                              {candidate.totalApplications > 2 && ` +${candidate.totalApplications - 2} more`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(candidate.lastActivity), 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              candidate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              candidate.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                              candidate.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {candidate.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900 mr-3">
                              View Details
                            </button>
                            <button className="text-blue-600 hover:text-blue-900">
                              Contact
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Candidate Application History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Candidate Activity</h3>
                <div className="space-y-4">
                  {recentApplications.slice(0, 10).map((application) => {
                    const candidate = candidates.find(c => c.id === application.userId);
                    const job = jobs.find(j => j.id === application.jobId);
                    return (
                      <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-600">
                                {application.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {application.userName} applied to {job?.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {job?.company} • {format(new Date(application.appliedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status}
                          </span>
                          {candidate && candidate.totalApplications > 1 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {candidate.totalApplications} apps
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidate-hub' && (
          <CandidateHub 
            candidates={sortedCandidates}
            applications={applications}
            jobs={jobs}
          />
        )}
      </div>

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
    </div>
  );
};

export default Admin;