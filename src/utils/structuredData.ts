// JSON-LD builders for company pages so Google can surface reviews and
// ratings in SERP rich results.

export function buildOrganizationLd(params: {
  name: string;
  url: string;
  logo?: string | null;
  description?: string | null;
  sameAs?: string[];
}) {
  const { name, url, logo, description, sameAs } = params;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo ? { logo } : {}),
    ...(description ? { description } : {}),
    ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function buildAggregateRatingLd(params: {
  itemName: string;
  ratingValue: number;
  reviewCount: number;
}) {
  const { itemName, ratingValue, reviewCount } = params;
  if (!reviewCount || ratingValue <= 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: { '@type': 'Organization', name: itemName },
    ratingValue: ratingValue.toFixed(1),
    reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}
