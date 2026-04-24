import React from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BarChart3, Search, MessageSquare, Bell, Settings as SettingsIcon,
  FileText, Building2, ShieldCheck, Flag, AlertTriangle,
  ClipboardList, Users as UsersIcon,
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
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/company-portal" replace />;
  // HireQuadrant internal — admin role only.
  if (!isAdmin) return <Navigate to="/" replace />;

  const moderation: Tile[] = [
    {
      title: 'Review Moderation',
      description: 'Approve or reject pending reviews. Entry point for new user content.',
      to: '/admin/reviews',
      icon: ShieldCheck,
      accent: 'bg-primary-100 text-primary-700',
    },
    {
      title: 'Review Reports',
      description: 'Handle user-flagged reviews (spam / abuse / fake / off-topic).',
      to: '/admin/reports',
      icon: Flag,
      accent: 'bg-rose-100 text-rose-700',
    },
    {
      title: 'Review Appeals',
      description: 'Reconsider rejected reviews that authors have contested.',
      to: '/admin/appeals',
      icon: AlertTriangle,
      accent: 'bg-amber-100 text-amber-700',
    },
  ];

  const platform: Tile[] = [
    {
      title: 'Admin Dashboard',
      description: 'Global stats across users, jobs, applications, companies, subscriptions.',
      to: '/admin',
      icon: BarChart3,
      accent: 'bg-indigo-100 text-indigo-700',
    },
    {
      title: 'Talent Search',
      description: 'Cross-company candidate / resume search for support and placement.',
      to: '/talent-search',
      icon: Search,
      accent: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'XML Feeder',
      description: 'Manage external job-feed ingestion (JobDiva + future providers).',
      to: '/xml-feeder',
      icon: FileText,
      accent: 'bg-cyan-100 text-cyan-700',
    },
    {
      title: 'Company Sources',
      description: 'Source-of-truth config for companies (domains, branding).',
      to: '/company-sources',
      icon: Building2,
      accent: 'bg-orange-100 text-orange-700',
    },
  ];

  const ops: Tile[] = [
    {
      title: 'Audit Log',
      description: 'Append-only history of moderation decisions, claims, and reports.',
      to: '/admin#audit',
      icon: ClipboardList,
      accent: 'bg-violet-100 text-violet-700',
    },
    {
      title: 'Messages',
      description: 'Your personal inbox — support reach-outs, internal coordination.',
      to: '/messages',
      icon: MessageSquare,
      accent: 'bg-teal-100 text-teal-700',
    },
    {
      title: 'Notifications',
      description: 'Recent activity on your admin actions.',
      to: '/notifications',
      icon: Bell,
      accent: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Account Settings',
      description: 'Your email, password reset, sign out, profile.',
      to: '/settings',
      icon: SettingsIcon,
      accent: 'bg-gray-100 text-gray-700',
    },
  ];

  const renderSection = (heading: string, tiles: Tile[]) => (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-3">
        {heading}
      </h2>
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
            <h3 className="font-semibold text-secondary-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {t.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{t.description}</p>
          </HardLink>
        ))}
      </div>
    </section>
  );

  return (
    <>
      <Helmet><title>HireQuadrant Portal · Admin</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl">
                <UsersIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                  HireQuadrant Portal
                </h1>
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  Internal management hub for HireQuadrant admins.
                </p>
              </div>
            </div>
          </header>

          {renderSection('Moderation queues', moderation)}
          {renderSection('Platform tools', platform)}
          {renderSection('Your account', ops)}
        </div>
      </div>
    </>
  );
};

export default CompanyPortal;
