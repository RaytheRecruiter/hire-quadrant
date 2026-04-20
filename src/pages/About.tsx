import React from 'react';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About HireQuadrant — Work with employers who show up</title>
        <meta name="description" content="HireQuadrant is building the job board where every application gets real feedback. Learn our story." />
        <meta property="og:title" content="About HireQuadrant" />
        <meta property="og:description" content="HireQuadrant is building the job board where every application gets real feedback." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-8">About HireQuadrant</h1>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 dark:text-slate-300 mb-4">
                We're building the job board for people who deserve better. No black holes. No ghosting. Just real opportunities with employers who actually show up.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">The Problem</h2>
              <p className="text-lg text-gray-700 dark:text-slate-300 mb-4">
                Job seekers apply to dozens of roles and hear nothing back. Employers waste time sifting through unqualified candidates. Traditional job boards benefit from this broken system — more applications means more revenue, regardless of quality.
              </p>
              <p className="text-lg text-gray-700 dark:text-slate-300">
                We built HireQuadrant to change that.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">How We're Different</h2>
              <ul className="space-y-3 text-lg text-gray-700 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="text-amber-500">✓</span>
                  <span><strong>Real feedback:</strong> Every application is screened and tracked. You know where you stand.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-500">✓</span>
                  <span><strong>Quality over quantity:</strong> Employers only post jobs they're actively hiring for.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-500">✓</span>
                  <span><strong>AI-powered matching:</strong> We surface roles that actually fit your profile.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-500">✓</span>
                  <span><strong>Transparency:</strong> See who's viewed your profile, when they shortlisted you, what they're looking for.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">Get in Touch</h2>
              <p className="text-lg text-gray-700 dark:text-slate-300">
                Questions? Ideas? <a href="mailto:hello@hirequadrant.com" className="text-primary-500 hover:text-primary-600 font-semibold">Email us</a> — we read every message.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
