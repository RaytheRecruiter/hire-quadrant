import React, { useEffect, useState } from 'react';
import HardLink from './HardLink';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'hq-cookie-consent-v1';

interface Consent {
  necessary: true; // always on
  measurement: boolean;
  decidedAt: string;
}

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.decidedAt !== 'string') return null;
    return parsed as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  // Notify analytics loader if it's listening
  window.dispatchEvent(new CustomEvent('hq-consent-changed', { detail: c }));
}

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    writeConsent({ necessary: true, measurement: true, decidedAt: new Date().toISOString() });
    setVisible(false);
  };
  const rejectOptional = () => {
    writeConsent({ necessary: true, measurement: false, decidedAt: new Date().toISOString() });
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-card-hover p-4"
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg flex-shrink-0">
          <Cookie className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="min-w-0">
          <h2 id="cookie-consent-title" className="text-sm font-semibold text-secondary-900 dark:text-white">
            Cookies on HireQuadrant
          </h2>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            We use a small number of cookies — the strictly necessary ones to keep you signed in, plus Google
            Analytics for anonymous measurement. See our{' '}
            <HardLink to="/cookies" className="underline hover:text-primary-600">
              Cookie Policy
            </HardLink>{' '}
            for details.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              type="button"
              onClick={acceptAll}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={rejectOptional}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Necessary only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
