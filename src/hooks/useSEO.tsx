import { Helmet } from 'react-helmet-async';

interface SEOOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

const BASE_URL = 'https://hirequadrant.com';
const DEFAULT_TITLE = 'HireQuadrant - Work with employers who show up';
const DEFAULT_DESCRIPTION = 'See who is interested. Get real feedback. Know where you stand at every step. Find jobs with transparent, responsive employers.';
const DEFAULT_OG_IMAGE = 'https://hirequadrant.com/og-image.svg';

export function useSEO(options: SEOOptions = {}) {
  const title = options.title
    ? `${options.title} - HireQuadrant`
    : DEFAULT_TITLE;
  const description = options.description || DEFAULT_DESCRIPTION;
  const canonical = options.canonical
    ? (options.canonical.startsWith('http') ? options.canonical : `${BASE_URL}${options.canonical}`)
    : `${BASE_URL}${typeof window !== 'undefined' ? window.location.pathname : '/'}`;
  const ogImage = options.ogImage || DEFAULT_OG_IMAGE;
  const ogType = options.ogType || 'website';

  return {
    title,
    description,
    canonical,
    ogImage,
    ogType,
    helmet: (
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content={ogType} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        {options.noindex && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>
    )
  };
}
