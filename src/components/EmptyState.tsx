import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  illustration?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: { label: string; to?: string; onClick?: () => void };
  secondaryAction?: { label: string; to?: string; onClick?: () => void };
}

const EmptyState: React.FC<Props> = ({ illustration, icon, title, description, primaryAction, secondaryAction }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-soft p-10 md:p-14 text-center animate-fade-in">
      <div className="mx-auto w-40 h-40 mb-6">
        {illustration || (
          <div className="w-full h-full bg-primary-50 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center text-primary-400 dark:text-primary-300">
            {icon}
          </div>
        )}
      </div>
      <h3 className="font-display text-2xl font-bold text-secondary-900 dark:text-white mb-2 text-balance">{title}</h3>
      <p className="text-gray-500 dark:text-slate-400 mb-7 max-w-md mx-auto text-balance leading-relaxed">{description}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {primaryAction && (
          primaryAction.to ? (
            <Link
              to={primaryAction.to}
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-soft hover:shadow-card-hover transition-all"
            >
              {primaryAction.label}
            </Link>
          ) : (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-soft hover:shadow-card-hover transition-all"
            >
              {primaryAction.label}
            </button>
          )
        )}
        {secondaryAction && (
          secondaryAction.to ? (
            <Link
              to={secondaryAction.to}
              className="text-primary-600 hover:text-primary-800 font-semibold px-4 py-2"
            >
              {secondaryAction.label}
            </Link>
          ) : (
            <button
              onClick={secondaryAction.onClick}
              className="text-primary-600 hover:text-primary-800 font-semibold px-4 py-2"
            >
              {secondaryAction.label}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default EmptyState;
