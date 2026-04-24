import React from 'react';
import { Helmet } from 'react-helmet-async';

const Cookies: React.FC = () => (
  <>
    <Helmet>
      <title>Cookie Policy · HireQuadrant</title>
      <meta name="description" content="What cookies HireQuadrant uses and why." />
    </Helmet>
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-secondary-800">
          <p>
            Cookies are small text files that websites place on your device. HireQuadrant uses a small number of
            cookies — all are either strictly necessary or used for measurement. We don't use third-party
            advertising cookies.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Strictly necessary</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Auth session</strong> — set by Supabase to keep you signed in while you use the site.</li>
              <li><strong>CSRF protection</strong> — a short-lived token to protect form submissions from cross-site attacks.</li>
            </ul>
            <p>These cookies cannot be disabled; without them the site won't work.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Measurement</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Google Analytics</strong> — anonymous page-view and navigation data. Helps us understand which pages are useful and where to invest.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Local storage</h2>
            <p>
              We also use browser local storage (not cookies) to remember small preferences like your dark-mode
              setting and recently-viewed jobs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Control</h2>
            <p>
              You can clear cookies at any time from your browser's settings. Most browsers also let you block
              non-essential cookies — on HireQuadrant that will only affect the analytics signal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Contact</h2>
            <p>
              Questions about cookies? Reach us via <a className="text-primary-600 hover:underline" href="/support">Support</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default Cookies;
