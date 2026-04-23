import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, MessageCircle, BookOpen, Search, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import HardLink from '../components/HardLink';

interface FAQItem {
  category: string;
  questions: {
    q: string;
    a: string;
  }[];
}

const Support: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Sign up" in the top right. Fill in your email and password, then check your email for verification. You can also sign up with Google or LinkedIn for faster registration.',
        },
        {
          q: 'How do I search for jobs?',
          a: 'Use the search bar on the home page to filter by job title, location, or company. For advanced filtering, visit the "Advanced Search" page to refine by salary, job type, and skills.',
        },
        {
          q: 'Can I apply to jobs without creating an account?',
          a: 'No, you need to create an account to apply for jobs. This helps us track your applications and employers can contact you directly.',
        },
      ],
    },
    {
      category: 'Applications & Offers',
      questions: [
        {
          q: 'How do I track my application status?',
          a: 'Go to your Profile page to see all your applications. You\'ll see real-time status updates including "Applied", "Screening", "Interview", "Offer", or "Rejected".',
        },
        {
          q: 'Can I withdraw my application?',
          a: 'Yes, visit your profile, find the job you applied for, and click "Withdraw Application". The employer will be notified immediately.',
        },
        {
          q: 'How long does it take to hear back from employers?',
          a: 'It varies by company, but most respond within 5-14 days. We notify you immediately when employers review your application.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click "Sign in", then "Forgot password?". Enter your email and we\'ll send you a link to reset your password within 5 minutes.',
        },
        {
          q: 'Is my data safe?',
          a: 'Yes. We use SSL encryption, secure databases, and never share your data with third parties without consent. See our Privacy Policy for full details.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, go to Account Settings → Danger Zone → Delete Account. This will permanently remove your profile and all applications.',
        },
      ],
    },
    {
      category: 'For Employers',
      questions: [
        {
          q: 'How much does it cost to post a job?',
          a: 'Check our Pricing page for plans. Basic plan starts at $29/month for 3 active listings. Enterprise plans available for high-volume hiring.',
        },
        {
          q: 'How do I manage my company profile?',
          a: 'Sign up as a Company, then go to Company Dashboard. Upload your logo, edit details, post jobs, and track applications all in one place.',
        },
        {
          q: 'Can I reach out to candidates directly?',
          a: 'Yes, you can message candidates who apply to your jobs. We also offer resume search to find passive candidates.',
        },
      ],
    },
  ];

  const filteredFAQ = faqData
    .map(section => ({
      ...section,
      questions: section.questions.filter(
        item =>
          item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.a.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter(section => section.questions.length > 0);

  return (
    <>
      <Helmet>
        <title>Support & Help Center — HireQuadrant</title>
        <meta name="description" content="Get help with your HireQuadrant account, job search, applications, and more." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Support Center</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 mb-8">
              Find answers to common questions or reach out to our support team.
            </p>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <HardLink
                to="/contact"
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all"
              >
                <MessageCircle className="h-6 w-6 text-primary-500 mx-auto mb-2" />
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">Contact Us</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">Send us a message</p>
              </HardLink>

              <a
                href="mailto:support@hirequadrant.com"
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all"
              >
                <HelpCircle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">Email Support</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">support@hirequadrant.com</p>
              </a>

              <a
                href="#faq"
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all"
              >
                <BookOpen className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">Browse FAQ</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">See common questions</p>
              </a>
            </div>
          </div>

          {/* Search FAQ */}
          <div id="faq" className="mb-12">
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
              />
            </div>

            {/* FAQ Categories */}
            <div className="space-y-4">
              {filteredFAQ.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-slate-400">
                    No results found. Try different search terms or contact us at support@hirequadrant.com
                  </p>
                </div>
              ) : (
                filteredFAQ.map(category => (
                  <div
                    key={category.category}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === category.category ? null : category.category
                        )
                      }
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <h3 className="font-bold text-secondary-900 dark:text-white">{category.category}</h3>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedCategory === category.category ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedCategory === category.category && (
                      <div className="border-t border-gray-100 dark:border-slate-700 space-y-4 px-6 py-4">
                        {category.questions.map((item, idx) => (
                          <div key={idx}>
                            <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">
                              {item.q}
                            </h4>
                            <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                              {item.a}
                            </p>
                            {idx < category.questions.length - 1 && (
                              <div className="border-b border-gray-100 dark:border-slate-700 my-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Still Need Help */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-50/50 dark:from-primary-900/20 dark:to-slate-900/20 rounded-2xl p-8 border border-primary-100/20 dark:border-primary-900/20 text-center">
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
              Still need help?
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Our support team is here to help. Reach out and we'll respond within 24 hours.
            </p>
            <HardLink
              to="/contact"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Contact Support
            </HardLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default Support;
