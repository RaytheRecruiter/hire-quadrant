import React from 'react';
import { Link } from 'react-router-dom';
import HardLink from '../components/HardLink';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const NotFound: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found — HireQuadrant</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-500 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Page Not Found</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <HardLink
            to="/"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-soft hover:shadow-card-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </HardLink>
        </div>
      </div>
    </>
  );
};

export default NotFound;
