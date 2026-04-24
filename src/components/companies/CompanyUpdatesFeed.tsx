import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone, Pin, Loader2 } from 'lucide-react';
import { useCompanyUpdates } from '../../hooks/useCompanyUpdates';

interface Props {
  companyId: string;
  max?: number;
}

const CompanyUpdatesFeed: React.FC<Props> = ({ companyId, max = 3 }) => {
  const { updates, loading } = useCompanyUpdates(companyId);

  if (loading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
      </div>
    );
  }

  if (updates.length === 0) return null;
  const visible = updates.slice(0, max);

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Company Updates</h2>
      </div>
      <div className="space-y-4">
        {visible.map((u) => (
          <article
            key={u.id}
            className="border-l-2 border-primary-400 pl-4"
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-secondary-900 dark:text-white">{u.title}</h3>
              {u.pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {formatDistanceToNow(new Date(u.published_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">
              {u.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CompanyUpdatesFeed;
