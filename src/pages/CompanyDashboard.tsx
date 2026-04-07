import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompanyDashboard } from '../hooks/useCompanyDashboard';
import CompanyJobsList from '../components/company/CompanyJobsList';
import CompanyApplicants from '../components/company/CompanyApplicants';
import CompanyProfileEditor from '../components/company/CompanyProfileEditor';
import PendingApprovalBanner from '../components/company/PendingApprovalBanner';
import { Briefcase, Users, Building2, CreditCard, Loader2 } from 'lucide-react';

const TABS = [
  { id: 'jobs', label: 'My Jobs', icon: Briefcase },
  { id: 'applicants', label: 'Applicants', icon: Users },
  { id: 'profile', label: 'Company Profile', icon: Building2 },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CompanyDashboard: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const {
    company,
    jobs,
    applications,
    loading,
    error,
    updateCompanyProfile,
    updateApplicationStatus,
  } = useCompanyDashboard(user);
  const [activeTab, setActiveTab] = useState<TabId>('jobs');

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'company') {
    return <Navigate to="/" replace />;
  }

  const isApproved = user?.isApproved !== false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Company Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your jobs, applicants, and company profile.
          </p>
        </div>

        {/* Pending Approval Banner */}
        {!isApproved && (
          <div className="mb-6">
            <PendingApprovalBanner />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={!isApproved && tab.id !== 'profile'}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!isApproved && tab.id !== 'profile' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <span className="ml-3 text-gray-600">Loading dashboard data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-gray-500 mt-2">Please try refreshing the page.</p>
            </div>
          ) : (
            <>
              {activeTab === 'jobs' && <CompanyJobsList jobs={jobs} />}
              {activeTab === 'applicants' && (
                <CompanyApplicants
                  applications={applications}
                  jobs={jobs}
                  onStatusUpdate={updateApplicationStatus}
                />
              )}
              {activeTab === 'profile' && (
                <CompanyProfileEditor
                  company={company}
                  onSave={updateCompanyProfile}
                />
              )}
              {activeTab === 'subscription' && (
                <div className="text-center py-16">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Subscription Management</h3>
                  <p className="text-gray-500">Coming soon. Subscription plans and billing will be available here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
