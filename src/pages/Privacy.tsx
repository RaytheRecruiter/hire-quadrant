import React from 'react';
import { Helmet } from 'react-helmet-async';

const Privacy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — HireQuadrant</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-8">Privacy Policy</h1>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-slate-300">
                HireQuadrant ("we", "us", or "our") operates the hirequadrant.com website and mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">2. Data We Collect</h2>
              <p className="text-gray-700 dark:text-slate-300 mb-4">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Account information (name, email, password)</li>
                <li>Profile information (resume, experience, skills)</li>
                <li>Job application data</li>
                <li>Communications between users and employers</li>
                <li>Usage analytics and device information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">3. How We Use Your Data</h2>
              <p className="text-gray-700 dark:text-slate-300">We use your data to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Provide and improve our services</li>
                <li>Process job applications and match candidates with employers</li>
                <li>Send you updates and notifications</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">4. Data Security</h2>
              <p className="text-gray-700 dark:text-slate-300">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">5. Your Rights</h2>
              <p className="text-gray-700 dark:text-slate-300">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">6. Contact Us</h2>
              <p className="text-gray-700 dark:text-slate-300">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@hirequadrant.com" className="text-primary-500 hover:text-primary-600">
                  privacy@hirequadrant.com
                </a>
              </p>
            </section>

            <p className="text-sm text-gray-500 dark:text-slate-500 pt-8 border-t border-gray-200 dark:border-slate-700">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
