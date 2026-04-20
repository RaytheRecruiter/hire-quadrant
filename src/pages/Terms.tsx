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

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 dark:text-slate-300">
                By accessing and using HireQuadrant, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">2. Use License</h2>
              <p className="text-gray-700 dark:text-slate-300 mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on HireQuadrant for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-slate-300">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on the site</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">3. Disclaimer</h2>
              <p className="text-gray-700 dark:text-slate-300">
                The materials on HireQuadrant are provided on an 'as is' basis. HireQuadrant makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">4. Limitations</h2>
              <p className="text-gray-700 dark:text-slate-300">
                In no event shall HireQuadrant or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the site, even if HireQuadrant or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">5. Accuracy of Materials</h2>
              <p className="text-gray-700 dark:text-slate-300">
                The materials appearing on HireQuadrant could include technical, typographical, or photographic errors. HireQuadrant does not warrant that any of the materials on the site are accurate, complete, or current. HireQuadrant may make changes to the materials contained on its site at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">6. Links</h2>
              <p className="text-gray-700 dark:text-slate-300">
                HireQuadrant has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by HireQuadrant of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">7. Modifications</h2>
              <p className="text-gray-700 dark:text-slate-300">
                HireQuadrant may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
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
