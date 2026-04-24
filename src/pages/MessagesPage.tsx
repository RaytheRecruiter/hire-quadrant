import React from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/messages" replace />;

  return (
    <>
      <Helmet><title>Messages · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Messages</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Conversations with employers who reach out about your profile.
            </p>
          </header>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400">
              No messages yet. When an employer messages you, it'll show here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagesPage;
