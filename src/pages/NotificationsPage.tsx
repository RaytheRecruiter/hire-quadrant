import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const NotificationsPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, loading, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/notifications" replace />;

  const handleClick = async (id: string, url: string | null) => {
    await markRead(id);
    if (url) {
      if (url.startsWith('/')) navigate(url);
      else window.location.href = url;
    }
  };

  return (
    <>
      <Helmet><title>Notifications · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Notifications</h1>
              <p className="text-gray-600 dark:text-slate-400">
                {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            )}
          </header>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <Bell className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400 mb-3">No notifications yet.</p>
              <HardLink to="/alerts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Manage job alert preferences →
              </HardLink>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n.id, n.url)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      n.read_at
                        ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        : 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-medium ${n.read_at ? 'text-secondary-900 dark:text-white' : 'text-primary-900 dark:text-primary-200'}`}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-sm text-gray-700 dark:text-slate-300 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" aria-label="Unread" />}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
