import React from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BarChart3, Search, MessageSquare, Bell, Settings as SettingsIcon,
  Briefcase, FileText, Building2, Sparkles,
} from 'lucide-react';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';

interface Tile {
  title: string;
  description: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const CompanyPortal: React.FC = () => {
  const { user, isAuthenticated, isCompany, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/company-portal" replace />;
  // Super admins get in too — useful for support scenarios.
  if (!isCompany && !isAdmin) return <Navigate to="/" replace />;

  const tiles: Tile[] = [
    {
      title: 'Dashboard',
      description: 'Jobs, applicants, analytics, reviews, Q&A, updates, Why Join Us, AI assistant, and your company profile.',
      to: '/company-dashboard',
      icon: BarChart3,
      accent: 'bg-primary-100 text-primary-700',
    },
    {
      title: 'Talent Search',
      description: 'Browse candidates and search resumes by skills, experience, and location.',
      to: '/talent-search',
      icon: Search,
      accent: 'bg-indigo-100 text-indigo-700',
    },
    {
      title: 'Messages',
      description: 'Reply to candidates, continue existing conversations.',
      to: '/messages',
      icon: MessageSquare,
      accent: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Notifications',
      description: 'Review approvals, new messages, appeal decisions.',
      to: '/notifications',
      icon: Bell,
      accent: 'bg-rose-100 text-rose-700',
    },
    {
      title: 'AI Assistant',
      description: 'Generate job descriptions, screen candidates, match scoring.',
      to: '/company-dashboard#ai-tools',
      icon: Sparkles,
      accent: 'bg-violet-100 text-violet-700',
    },
    {
      title: 'Post & Manage Jobs',
      description: 'Add screening questions, sponsor listings, track applicants.',
      to: '/company-dashboard',
      icon: Briefcase,
      accent: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Account Settings',
      description: 'Email, password, sign out, delete account.',
      to: '/settings',
      icon: SettingsIcon,
      accent: 'bg-gray-100 text-gray-700',
    },
  ];

  const adminTiles: Tile[] = isAdmin
    ? [
        {
          title: 'XML Feeder',
          description: 'Platform-level ingestion config for external job feeds.',
          to: '/xml-feeder',
          icon: FileText,
          accent: 'bg-cyan-100 text-cyan-700',
        },
        {
          title: 'Company Sources',
          description: 'Platform-level source-of-truth for company data.',
          to: '/company-sources',
          icon: Building2,
          accent: 'bg-orange-100 text-orange-700',
        },
      ]
    : [];

  return (
    <>
      <Helmet><title>Company Portal · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Company Portal</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Everything you need to manage{' '}
              {user?.companyId ? 'your company' : 'employer accounts'} on HireQuadrant — in one place.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.map((t) => (
              <HardLink
                key={t.title}
                to={t.to}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-card-hover transition-all"
              >
                <div className={`inline-flex p-2.5 rounded-lg ${t.accent} mb-3`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-secondary-900 dark:text-white group-hover:text-primary-600 transition-colors">
                  {t.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{t.description}</p>
              </HardLink>
            ))}
          </div>

          {adminTiles.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-3">
                Super admin tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminTiles.map((t) => (
                  <HardLink
                    key={t.title}
                    to={t.to}
                    className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-card-hover transition-all"
                  >
                    <div className={`inline-flex p-2.5 rounded-lg ${t.accent} mb-3`}>
                      <t.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{t.description}</p>
                  </HardLink>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default CompanyPortal;
