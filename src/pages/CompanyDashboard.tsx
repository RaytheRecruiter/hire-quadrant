import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompanyDashboard } from '../hooks/useCompanyDashboard';
import CompanyJobsList from '../components/company/CompanyJobsList';
import CompanyApplicants from '../components/company/CompanyApplicants';
import CompanyProfileEditor from '../components/company/CompanyProfileEditor';
import CompanyUpdatesEditor from '../components/company/CompanyUpdatesEditor';
import CompanyReviewsPanel from '../components/company/CompanyReviewsPanel';
import CompanyAnalyticsPanel from '../components/company/CompanyAnalyticsPanel';
import CompanyBillingPanel from '../components/company/CompanyBillingPanel';
import RecruiterActivityPanel from '../components/company/RecruiterActivityPanel';
import EmployerBenchmarkPanel from '../components/company/EmployerBenchmarkPanel';
import CompanyQAPanel from '../components/company/CompanyQAPanel';
import WhyJoinUsPanel from '../components/company/WhyJoinUsPanel';
import PendingApprovalBanner from '../components/company/PendingApprovalBanner';
import AIJobDescriptionGenerator from '../components/AIJobDescriptionGenerator';
import { Briefcase, Users, Building2, CreditCard, Loader2, Sparkles, Megaphone, BarChart3, Star, HelpCircle, Heart, Shield, Activity, Search } from 'lucide-react';
import HardLink from '../components/HardLink';

const TABS = [
  { id: 'jobs', label: 'My Jobs', icon: Briefcase },
  { id: 'applicants', label: 'Applicants', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'recruiter-activity', label: 'Recruiter Activity', icon: Activity },
  { id: 'benchmarks', label: 'Benchmarks', icon: BarChart3 },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'updates', label: 'Updates', icon: Megaphone },
  { id: 'qa', label: 'Q&A', icon: HelpCircle },
  { id: 'why-join', label: 'Why Join Us', icon: Heart },
  { id: 'ai-tools', label: 'AI Assistant', icon: Sparkles },
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
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500 dark:text-primary-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?returnTo=/company-dashboard" replace />;
  }
  if (user?.role !== 'company') {
    return <Navigate to="/" replace />;
  }

  const isApproved = user?.isApproved !== false;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-secondary-50 via-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Company Dashboard
            </h1>
            <p className="mt-2 text-secondary-600 dark:text-slate-400">
              Manage your jobs, applicants, and company profile.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HardLink
              to="/talent-search"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition font-medium"
            >
              <Search className="h-4 w-4" />
              Search Resumes
            </HardLink>
            <HardLink
              to="/company-dashboard/team"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-800 dark:text-slate-200 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              <Shield className="h-4 w-4" />
              Team Members
            </HardLink>
          </div>
        </div>

        {/* Pending Approval Banner */}
        {!isApproved && (
          <div className="mb-6">
            <PendingApprovalBanner />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-secondary-200 dark:border-slate-700 mb-6">
          {/* 12 tabs don't fit a mobile viewport; without overflow-x-auto here
              the nav stretched the whole page horizontally (confirmed live,
              2026-10-21 manual mobile pass: 1445px content in a 360px
              viewport) instead of scrolling within itself. */}
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={!isApproved && tab.id !== 'profile'}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-secondary-500 dark:text-slate-400 hover:text-secondary-700 dark:hover:text-slate-200 hover:border-secondary-300 dark:hover:border-slate-600'
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:bg-slate-800/90 dark:border-slate-700 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500 dark:text-primary-400" />
              <span className="ml-3 text-secondary-600 dark:text-slate-400">Loading dashboard data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-secondary-500 dark:text-slate-400 mt-2">Please try refreshing the page.</p>
            </div>
          ) : (
            <>
              {activeTab === 'jobs' && (
                <CompanyJobsList
                  jobs={jobs}
                  applications={applications}
                  companyName={company?.displayName || company?.name || 'Your Company'}
                />
              )}
              {activeTab === 'applicants' && (
                <CompanyApplicants
                  applications={applications}
                  jobs={jobs}
                  onStatusUpdate={updateApplicationStatus}
                  companyId={company?.id}
                />
              )}
              {activeTab === 'analytics' && company?.id && (
                <CompanyAnalyticsPanel companyId={company.id} />
              )}
              {activeTab === 'recruiter-activity' && company?.id && (
                <RecruiterActivityPanel companyId={company.id} />
              )}
              {activeTab === 'benchmarks' && company?.id && (
                <EmployerBenchmarkPanel companyId={company.id} />
              )}
              {activeTab === 'reviews' && company?.id && (
                <CompanyReviewsPanel companyId={company.id} />
              )}
              {activeTab === 'updates' && company?.id && (
                <CompanyUpdatesEditor companyId={company.id} />
              )}
              {activeTab === 'qa' && company?.id && (
                <CompanyQAPanel companyId={company.id} />
              )}
              {activeTab === 'why-join' && company?.id && (
                <WhyJoinUsPanel companyId={company.id} />
              )}
              {activeTab === 'ai-tools' && (
                <AIJobDescriptionGenerator company={company?.displayName || company?.name} />
              )}
              {activeTab === 'profile' && (
                <CompanyProfileEditor
                  company={company}
                  onSave={updateCompanyProfile}
                />
              )}
              {activeTab === 'subscription' && company?.id && (
                <CompanyBillingPanel companyId={company.id} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
