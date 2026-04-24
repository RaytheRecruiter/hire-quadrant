import React from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';

const ROWS: Array<{ key: keyof ReturnType<typeof useNotificationPreferences>['prefs']; label: string; hint?: string }> = [
  { key: 'email_job_alerts', label: 'Job alerts', hint: 'New jobs matching saved searches' },
  { key: 'email_application_updates', label: 'Application updates', hint: 'Status changes from employers' },
  { key: 'email_messages', label: 'Direct messages', hint: 'When a recruiter or employer messages you' },
  { key: 'email_review_responses', label: 'Review responses', hint: 'Replies to your reviews' },
  { key: 'email_marketing', label: 'Product updates', hint: 'Occasional feature announcements' },
];

const NotificationPreferencesPanel: React.FC = () => {
  const { prefs, save, loading, saving } = useNotificationPreferences();

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-4 w-4 text-primary-500" />
        <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
          Notification preferences
        </h2>
        {(loading || saving) && <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
      </div>

      <div className="space-y-3">
        {ROWS.map((r) => (
          <label key={r.key} className="flex items-start justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm text-secondary-900 dark:text-white">{r.label}</p>
              {r.hint && (
                <p className="text-xs text-gray-500 dark:text-slate-400">{r.hint}</p>
              )}
            </div>
            <input
              type="checkbox"
              checked={Boolean(prefs[r.key])}
              onChange={(e) => save({ [r.key]: e.target.checked } as Partial<typeof prefs>)}
              className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        ))}

        <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
          <label className="block text-sm text-secondary-900 dark:text-white mb-1">
            Digest frequency
          </label>
          <select
            value={prefs.digest_frequency}
            onChange={(e) => save({ digest_frequency: e.target.value as 'off' | 'daily' | 'weekly' })}
            className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="off">Off</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
    </section>
  );
};

export default NotificationPreferencesPanel;
