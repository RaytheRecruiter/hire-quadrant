import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Mail, Key, LogOut, Loader2 } from 'lucide-react';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import NotificationPreferencesPanel from '../components/profile/NotificationPreferencesPanel';
import TwoFactorPanel from '../components/security/TwoFactorPanel';
import SessionsPanel from '../components/security/SessionsPanel';
import GDPRPanel from '../components/security/GDPRPanel';

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [sending, setSending] = useState(false);

  if (authLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login?returnTo=/settings" replace />;

  const handlePasswordReset = async () => {
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success(`Password reset email sent to ${user.email}`);
  };

  return (
    <>
      <Helmet><title>Settings · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-slate-400">Account and privacy controls.</p>
          </header>

          <div className="space-y-3">
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-secondary-900 dark:text-white">Email</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-secondary-900 dark:text-white">Password</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  We'll send a password reset link to your email.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={sending}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60 whitespace-nowrap"
              >
                {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send reset email
              </button>
            </section>

            <HardLink
              to="/profile"
              className="block bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <h2 className="font-semibold text-secondary-900 dark:text-white mb-0.5">Edit profile</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">Name, photo, resume, and more</p>
            </HardLink>

            <HardLink
              to="/demographics"
              className="block bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <h2 className="font-semibold text-secondary-900 dark:text-white mb-0.5">Demographics</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">Optional EEO information</p>
            </HardLink>

            <NotificationPreferencesPanel />

            <TwoFactorPanel />

            <SessionsPanel />

            <GDPRPanel />

            <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <LogOut className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-secondary-900 dark:text-white">Sign out</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Log out of this device.</p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                Sign out
              </button>
            </section>

          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
