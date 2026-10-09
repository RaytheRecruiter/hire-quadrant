import React from 'react';
import { Helmet } from 'react-helmet-async';

const SecurityPolicy: React.FC = () => (
  <>
    <Helmet>
      <title>Vulnerability Disclosure Policy · HireQuadrant</title>
      <meta name="description" content="How to report a security vulnerability on HireQuadrant, and what to expect after you do." />
    </Helmet>
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Vulnerability Disclosure Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: October 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-secondary-800">
          <p>
            If you've found a security vulnerability in HireQuadrant, we want to know about it. This page describes
            what's in scope, how to report a finding, and what you can expect from us once you do.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">How to report</h2>
            <p>
              Email <a className="text-primary-600 hover:underline" href="mailto:security@hirequadrant.com">security@hirequadrant.com</a> with
              a description of the issue, the steps to reproduce it, and its potential impact. Include proof-of-concept
              details if you have them — screenshots, request/response examples, or a short video all help us triage faster.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">What's in scope</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>hirequadrant.com and its subdomains</li>
              <li>Authentication, authorization, and account-isolation issues</li>
              <li>Data exposure — candidate, employer, or application data visible to parties who shouldn't see it</li>
              <li>Injection, XSS, CSRF, and similar web application vulnerabilities</li>
              <li>Payment and billing flow integrity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">What's not in scope</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Denial-of-service testing, load testing, or any testing that degrades service for other users</li>
              <li>Social engineering, phishing, or physical attacks against staff or offices</li>
              <li>Automated scanning that generates high-volume traffic without prior coordination</li>
              <li>Reports produced solely by an automated scanner without a demonstrated, manually-verified impact</li>
              <li>Issues in third-party services we link to but don't operate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Testing guidelines</h2>
            <p>
              Do not access, modify, or delete data that isn't yours. Do not test against real candidate or employer
              accounts — create your own test account instead. If a finding requires touching another user's data to
              confirm, stop and describe what you'd expect to happen instead of actually doing it. Contact us first to
              coordinate before running anything that could affect production users or data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">What to expect from us</h2>
            <p>
              We aim to acknowledge reports within 72 hours and will follow up with a plan or questions after
              triage. We'll let you know when a fix ships. We don't currently run a paid bug bounty program, but we're
              glad to credit researchers (with permission) once an issue is resolved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Safe harbor</h2>
            <p>
              We won't pursue legal action against anyone who reports a vulnerability in good faith, in scope, and in
              line with the testing guidelines above — even if that required accessing our systems in a way that
              would otherwise violate our Terms of Service. If in doubt about whether something is authorized, ask us
              first at the address above.
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default SecurityPolicy;
