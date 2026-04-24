import React from 'react';
import { Helmet } from 'react-helmet-async';

const ContentPolicy: React.FC = () => (
  <>
    <Helmet>
      <title>Content Policy · HireQuadrant</title>
      <meta name="description" content="Rules for content posted on HireQuadrant — reviews, Q&A, company updates, messages." />
    </Helmet>
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Content Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-secondary-800">
          <p>
            HireQuadrant is an open platform where current and former employees share experiences and employers
            represent their companies. To keep that useful and safe, everyone posting on HireQuadrant agrees to
            follow this Content Policy.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">What you can post</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Honest, firsthand accounts of your workplace experience.</li>
              <li>Specific, constructive feedback on pay, management, culture, and growth.</li>
              <li>Company information that is publicly known or authorized by the employer.</li>
              <li>Responses to reviews that engage professionally.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">What's not allowed</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Harassment or targeted abuse</strong> of individuals, including named coworkers or managers.</li>
              <li><strong>Discriminatory language</strong> based on race, religion, gender, sexual orientation, national origin, age, or disability.</li>
              <li><strong>Confidential or proprietary information</strong> such as trade secrets, NDAs, internal security details, or customer data.</li>
              <li><strong>Personal contact information</strong> about third parties (phone numbers, home addresses, private email).</li>
              <li><strong>Fake, coached, or incentivized reviews.</strong> Employers may not post reviews about their own company. Employees may not be compensated for positive reviews.</li>
              <li><strong>Spam, promotional content, or off-topic posts.</strong></li>
              <li><strong>Illegal activity</strong> — threats, copyrighted material you don't own, content that violates applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Moderation</h2>
            <p>
              Every review is held for moderation before it's published. Our moderators use this policy as the basis
              for approval and rejection decisions. You can report any post you think violates this policy from the
              flag icon on the review. Rejected review authors can appeal the decision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Employer responses</h2>
            <p>
              Employers who claim a company page may respond to reviews on that page. Responses are public and must
              follow this policy — no disclosing the reviewer's identity, no retaliation, no off-topic promotion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Takedown requests</h2>
            <p>
              Reviewers can edit or delete their own reviews at any time from the review card or <a className="text-primary-600 hover:underline" href="/my-reviews">My Reviews</a>.
              Companies concerned about content on their page can file a takedown via <a className="text-primary-600 hover:underline" href="/support">Support</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary-900">Updates</h2>
            <p>
              We may update this policy as the platform evolves. Material changes will be announced on the site.
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default ContentPolicy;
