import { useEffect } from 'react';

interface SEOOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

const BASE_URL = 'https://hirequadrant.com';
const DEFAULT_TITLE = 'HireQuadrant — Jobs that actually reply to you';
const DEFAULT_DESCRIPTION = 'Skip the black hole. Find your next career opportunity on HireQuadrant — every application is screened, tracked, and acknowledged.';
const DEFAULT_OG_IMAGE = 'https://hirequadrant.com/og-image.svg';

function upsertMeta(selector: string, attr: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets title, description, canonical, and OG tags for the current page.
 * Call with an empty options object to reset to defaults.
 */
export function useSEO(options: SEOOptions = {}) {
  useEffect(() => {
    const title = options.title
      ? `${options.title} · HireQuadrant`
      : DEFAULT_TITLE;
    const description = options.description || DEFAULT_DESCRIPTION;
    const canonical = options.canonical
      ? (options.canonical.startsWith('http') ? options.canonical : `${BASE_URL}${options.canonical}`)
      : `${BASE_URL}${window.location.pathname}`;
    const ogImage = options.ogImage || DEFAULT_OG_IMAGE;

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertLink('canonical', canonical);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    if (options.noindex) {
      upsertMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
    } else {
      const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (robots) robots.remove();
    }
  }, [options.title, options.description, options.canonical, options.ogImage, options.noindex]);
}
