import React from 'react';
import { Helmet } from 'react-helmet-async';
import HardLink from './HardLink';

export interface Crumb {
  name: string;
  to?: string;
}

const ORIGIN = 'https://hirequadrant.com';

interface Props {
  items: Crumb[];
  className?: string;
}

const BreadcrumbSchema: React.FC<Props> = ({ items, className }) => {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.to ? `${ORIGIN}${item.to}` : undefined,
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>
      <nav
        aria-label="Breadcrumb"
        className={`text-sm text-gray-500 dark:text-slate-400 ${className ?? ''}`}
      >
        <ol className="flex items-center gap-1 flex-wrap">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {item.to ? (
                <HardLink to={item.to} className="hover:text-primary-600">
                  {item.name}
                </HardLink>
              ) : (
                <span className="text-secondary-900 dark:text-white">{item.name}</span>
              )}
              {i < items.length - 1 && <span className="mx-1 text-gray-300">/</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default BreadcrumbSchema;
