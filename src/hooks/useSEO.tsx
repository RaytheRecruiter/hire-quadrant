import { Helmet } from 'react-helmet-async';

interface SEOOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

const BASE_URL = 'https://nexegin.com';
const DEFAULT_TITLE = 'Nexegin — Find your next IT role';
const DEFAULT_DESCRIPTION = 'Explore IT jobs, save opportunities, and manage your applications in one place.';
const DEFAULT_OG_IMAGE = 'https://nexegin.com/og-image.png';

export function useSEO(options: SEOOptions = {}) {
  const title = options.title
    ? `${options.title} · Nexegin`
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
