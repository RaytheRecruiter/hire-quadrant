import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, CheckCircle2, Lightbulb, Target } from 'lucide-react';
import HardLink from '../components/HardLink';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { prettyFromSlug } from '../utils/seoSlug';

const ORIGIN = 'https://hirequadrant.com';

// Curated, role-agnostic prep content. Role-specific questions are
// derived from the slug when possible; otherwise a generic bank is shown.
const BEHAVIORAL = [
  'Tell me about yourself and why you\'re interested in this role.',
  'Walk me through a recent project you\'re proud of.',
  'Tell me about a time you disagreed with a teammate and how you resolved it.',
  'Describe a failure and what you learned.',
  'Why are you leaving your current role?',
  'Where do you see yourself in three years?',
];

const ROLE_TEMPLATES: Record<string, string[]> = {
  engineer: [
    'Design a URL shortener that can handle 10K req/s.',
    'Explain how you would approach debugging an intermittent production issue.',
    'How do you decide between SQL and NoSQL for a new service?',
    'Walk through a technical tradeoff you made recently and why.',
  ],
  data: [
    'Describe a dataset you cleaned from raw to model-ready. What surprised you?',
    'How would you measure the success of a new recommendation algorithm?',
    'Explain p-values to a non-technical stakeholder.',
    'Walk us through how you\'d build a churn prediction model.',
  ],
  product: [
    'How would you prioritize the next 3 features for a B2B SaaS product?',
    'Walk me through a feature you shipped. What metrics moved?',
    'A key metric drops 20% overnight. How do you investigate?',
    'How do you decide when to say no to a customer request?',
  ],
  designer: [
    'Walk us through your design process on a recent project.',
    'How do you incorporate user feedback into iterations?',
    'Tell me about a design tradeoff you made between aesthetics and usability.',
  ],
  manager: [
    'How do you run a 1:1?',
    'A direct report is underperforming. Walk me through how you\'d handle it.',
    'How do you balance shipping speed with code/design quality across your team?',
  ],
  sales: [
    'Walk me through your pipeline management approach.',
    'Tell me about a deal you almost lost and how you saved (or didn\'t save) it.',
    'How do you qualify a prospect?',
  ],
};

function inferRoleBucket(slug: string): keyof typeof ROLE_TEMPLATES {
  const s = slug.toLowerCase();
  if (/engineer|developer|programmer|swe|devops|sre/.test(s)) return 'engineer';
  if (/data|analyst|scientist|ml|ai/.test(s)) return 'data';
  if (/product/.test(s)) return 'product';
  if (/design|ux|ui/.test(s)) return 'designer';
  if (/manager|lead|director|vp|head/.test(s)) return 'manager';
  if (/sales|account|business development|bdr|sdr/.test(s)) return 'sales';
  return 'engineer';
}

const InterviewPrepPage: React.FC = () => {
  const { roleSlug } = useParams<{ roleSlug: string }>();
  const roleName = prettyFromSlug(roleSlug ?? '');
  const bucket = inferRoleBucket(roleSlug ?? '');
  const roleQuestions = ROLE_TEMPLATES[bucket];

  const pageUrl = `${ORIGIN}/interview-prep/${roleSlug}`;
  const metaTitle = `${roleName} interview prep — top questions & answers · HireQuadrant`;
  const metaDesc = `Practice ${roleName} interview questions with sample approaches. Curated by HireQuadrant from real hiring patterns.`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${roleName} interview questions and how to prepare`,
    author: { '@type': 'Organization', name: 'HireQuadrant' },
    datePublished: '2026-04-24',
    mainEntityOfPage: pageUrl,
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbSchema
            className="mb-4"
            items={[
              { name: 'Home', to: '/' },
              { name: 'Interview prep', to: '/interview-prep' },
              { name: roleName },
            ]}
          />

          <header className="mb-8 flex items-start gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
              <BookOpen className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-1">
                {roleName} interview prep
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                Practice the questions employers actually ask.
              </p>
            </div>
          </header>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary-500" />
              Role-specific questions
            </h2>
            <ul className="space-y-2">
              {roleQuestions.map((q) => (
                <li
                  key={q}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  {q}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Behavioral bank (works for any role)
            </h2>
            <ul className="space-y-2">
              {BEHAVIORAL.map((q) => (
                <li
                  key={q}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  {q}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
              How to prepare in one week
            </h2>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-slate-300 list-decimal list-inside">
              <li>
                <span className="font-semibold">Days 1–2:</span> Rewrite your resume bullets using
                STAR (Situation, Task, Action, Result). Quantify every outcome.
              </li>
              <li>
                <span className="font-semibold">Day 3:</span> Research the company — read their
                blog, open roles, and 3 most recent news items. Prep 3 questions to ask.
              </li>
              <li>
                <span className="font-semibold">Days 4–5:</span> Do 2 mock interviews with a peer
                or record yourself. Focus on concise STAR answers.
              </li>
              <li>
                <span className="font-semibold">Day 6:</span> Prepare a "why this company / why
                this role" story. 90 seconds, out loud.
              </li>
              <li>
                <span className="font-semibold">Day 7:</span> Logistics — outfit, room, lighting,
                camera, water, backup internet, resume PDF ready to share.
              </li>
            </ol>
          </section>

          <div className="flex items-center justify-between">
            <HardLink
              to={`/jobs?q=${encodeURIComponent(roleName)}`}
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Browse open {roleName} roles →
            </HardLink>
            <HardLink
              to={`/salaries/${roleSlug}`}
              className="text-sm text-gray-500 hover:text-primary-600"
            >
              See {roleName} salaries →
            </HardLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default InterviewPrepPage;
