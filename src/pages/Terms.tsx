import React from 'react';
import { Helmet } from 'react-helmet-async';

const Terms: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service — HireQuadrant</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-8">Terms of Service</h1>
          <p className="text-gray-700 dark:text-slate-300 mb-4">
            HireQuadrant is operated by Quadrant, Inc. These terms apply to candidates browsing and applying for
            jobs, and to employers using paid subscriptions and job sponsorship features. By accessing or using
            HireQuadrant, you agree to be bound by these terms. If you don't agree, please don't use the service.
          </p>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">1. Accounts</h2>
              <p className="text-gray-700 dark:text-slate-300">
                You're responsible for the accuracy of the information in your account and for keeping your login
                credentials secure. You must be legally able to work (for candidate accounts) or to represent the
                company you're creating an employer account for. We may suspend or terminate accounts that violate
                these terms or our <a href="/content-policy" className="text-primary-500 hover:text-primary-600">Content Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">2. Acceptable use</h2>
              <p className="text-gray-700 dark:text-slate-300 mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Scrape, bulk-download, or systematically extract job listings, candidate profiles, or other data from the site outside of normal use</li>
                <li>Misrepresent your identity, a company's identity, or a job posting's terms</li>
                <li>Use candidate contact information obtained through the Resume Database for any purpose other than legitimate recruiting for the role(s) you've posted</li>
                <li>Attempt to interfere with, disrupt, or gain unauthorized access to the service or other users' accounts</li>
                <li>Post content that violates our <a href="/content-policy" className="text-primary-500 hover:text-primary-600">Content Policy</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">3. Employer subscriptions and billing</h2>
              <p className="text-gray-700 dark:text-slate-300">
                Resume Database subscriptions and job sponsorship purchases are billed through Stripe. Subscriptions
                renew automatically each billing period until cancelled; you can cancel anytime from your billing
                settings, effective at the end of the current period. Job sponsorship purchases are one-time charges
                for the duration shown at checkout. Fees are generally non-refundable except where required by law or
                stated otherwise at the time of purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">4. Job postings and content</h2>
              <p className="text-gray-700 dark:text-slate-300">
                Employers are responsible for the accuracy of their job postings and company information. HireQuadrant
                also aggregates publicly posted job listings from third-party sources; we don't guarantee the
                accuracy, availability, or current status of any listing, and a listing's presence on HireQuadrant
                doesn't imply our endorsement of the employer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">5. Disclaimer</h2>
              <p className="text-gray-700 dark:text-slate-300">
                The service is provided "as is." We don't guarantee that any application will be reviewed, that any
                job will result in an interview or offer, or that any job listing is current or accurate. We make no
                warranties, express or implied, including implied warranties of merchantability, fitness for a
                particular purpose, or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">6. Limitation of liability</h2>
              <p className="text-gray-700 dark:text-slate-300">
                To the extent permitted by law, HireQuadrant and Quadrant, Inc. won't be liable for indirect,
                incidental, or consequential damages arising from your use of the service, including lost data,
                lost profits, or business interruption.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">7. Links to other sites</h2>
              <p className="text-gray-700 dark:text-slate-300">
                We haven't reviewed every site linked from HireQuadrant and aren't responsible for their content.
                Linking to a site doesn't imply our endorsement of it. Use of any linked site is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">8. Changes to these terms</h2>
              <p className="text-gray-700 dark:text-slate-300">
                We may update these terms from time to time. Continuing to use HireQuadrant after a change means you
                accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">9. Contact us</h2>
              <p className="text-gray-700 dark:text-slate-300">
                Questions about these terms can be sent to{' '}
                <a href="mailto:support@hirequadrant.com" className="text-primary-500 hover:text-primary-600">
                  support@hirequadrant.com
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

export default Terms;
