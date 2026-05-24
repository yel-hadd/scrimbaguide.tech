import React from 'react';
import { useLocation } from '@docusaurus/router';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath } from './schemaUtils';

interface ReviewSchemaProps {
  itemName: string;
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
  /** schema.org @type for itemReviewed (default SoftwareApplication for Scrimba product reviews) */
  itemType?: string;
  /** Canonical URL for the reviewed subject (defaults to Scrimba). Use page URL for comparison articles. */
  itemUrl?: string;
  author?: string;
  authorUrl?: string;
  reviewBody?: string;
  datePublished?: string;
}

export default function ReviewSchema({
  itemName,
  ratingValue,
  bestRating = 5,
  worstRating = 1,
  itemType = 'SoftwareApplication',
  itemUrl = 'https://scrimba.com',
  author = 'Yassine El Haddad',
  authorUrl = 'https://scrimbaguide.tech/about',
  reviewBody,
  datePublished,
}: ReviewSchemaProps): React.ReactElement {
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${pageUrl}#review`,
    name: `${plainText(itemName)} Review`,
    mainEntityOfPage: pageUrl,
    itemReviewed: {
      '@type': itemType,
      name: plainText(itemName),
      url: toAbsoluteUrl(itemUrl),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: ratingValue,
      bestRating: bestRating,
      worstRating: worstRating,
    },
    author: {
      '@type': 'Person',
      name: plainText(author),
      url: toAbsoluteUrl(authorUrl),
    },
    // Bare @id reference to the Organization defined globally in headTags.
    publisher: { '@id': 'https://scrimbaguide.tech/#organization' },
    ...(reviewBody && { reviewBody: plainText(reviewBody) }),
    ...(datePublished && { datePublished }),
  };

  return (
    <script
      id={schemaScriptId('review', canonicalPath, plainText(itemName))}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
