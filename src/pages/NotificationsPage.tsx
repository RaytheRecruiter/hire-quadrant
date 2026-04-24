import React from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bell } from 'lucide-react';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';

const NotificationsPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/notifications" replace />;

  return (
    <>
      <Helmet><title>Notifications · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Updates on your applications, saved companies, and job alerts.
            </p>
          </header>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
            <Bell className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400 mb-3">
              Notifications will appear here once there's activity on your account.
            </p>
            <HardLink
              to="/alerts"
              className="inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage job alert preferences →
            </HardLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
