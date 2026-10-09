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
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">1. Who operates this service</h2>
              <p className="text-gray-700 dark:text-slate-300">
                HireQuadrant ("we", "us", or "our") is operated by Quadrant, Inc. and runs the hirequadrant.com website.
                This policy explains what personal data we collect from candidates and employers, how we use it, who
                we share it with, and the choices you have.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">2. Data we collect</h2>
              <p className="text-gray-700 dark:text-slate-300 mb-4">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Account information (name, email, password)</li>
                <li>Profile information (resume file and parsed content, work experience, education, skills, location, job preferences)</li>
                <li>Job application data (which jobs you've applied to, status, employer responses)</li>
                <li>Company information submitted by employer accounts (company profile, job postings, billing contact)</li>
                <li>Communications between candidates and employers sent through the platform</li>
                <li>Usage analytics and device information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">3. How we use your data</h2>
              <p className="text-gray-700 dark:text-slate-300">We use your data to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Provide and improve our services</li>
                <li>Process job applications and connect candidates with employers</li>
                <li>Send account, application, and (where you've opted in) marketing notifications</li>
                <li>Process employer billing for subscriptions and job sponsorship purchases</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">4. Resume discoverability and employer access</h2>
              <p className="text-gray-700 dark:text-slate-300">
                Employers on a Resume Database subscription can search candidate profiles by skills, experience, and
                other profile fields. Search results show limited information by default; an employer must use an
                "unlock" on your specific profile (consuming part of their subscription's monthly allotment) before
                your full contact details and resume become visible to them. Unlocking a profile does not notify you
                automatically. You can control what's visible in your profile — including removing your resume or
                marking your profile as not discoverable — from your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">5. Who we share data with</h2>
              <p className="text-gray-700 dark:text-slate-300 mb-4">
                We don't sell your personal data. We share it only as needed to run the service, including with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Employers you apply to, or who unlock your profile under the terms above</li>
                <li>Supabase, our database, authentication, and file-storage provider</li>
                <li>Stripe, for employer subscription and payment processing (we do not store full payment card numbers ourselves)</li>
                <li>Our email delivery provider, for transactional and account emails</li>
                <li>Anthropic, to parse uploaded resumes into structured fields (skills, titles, certifications) and to generate AI-assisted features like match scoring</li>
                <li>Mapbox, to geocode job and candidate locations for location-based search</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">6. Data retention and deletion</h2>
              <p className="text-gray-700 dark:text-slate-300">
                We retain your account and profile data for as long as your account is active. You can request
                deletion of your account and associated personal data at any time from your account settings or by
                emailing us at the address below; we'll remove it except where we're required to retain certain
                records (for example, billing records) to meet legal or accounting obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">7. Data security</h2>
              <p className="text-gray-700 dark:text-slate-300">
                Data is transmitted over HTTPS and stored with access controls that restrict who can read it. No
                method of transmission or storage is 100% secure, and we can't guarantee absolute security. If you
                believe you've found a security issue, see our <a href="/security-policy" className="text-primary-500 hover:text-primary-600">Vulnerability Disclosure Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">8. Your rights</h2>
              <p className="text-gray-700 dark:text-slate-300">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for optional communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">9. Contact us</h2>
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
