import React from 'react';

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
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: `${itemName} Review`,
    itemReviewed: {
      '@type': itemType,
      name: itemName,
      url: itemUrl,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: ratingValue,
      bestRating: bestRating,
      worstRating: worstRating,
    },
    author: {
      '@type': 'Person',
      name: author,
      url: authorUrl,
    },
    publisher: {
      '@id': 'https://scrimbaguide.tech/#organization',
      '@type': 'Organization',
      name: 'Scrimba Guide',
      url: 'https://scrimbaguide.tech',
    },
    ...(reviewBody && { reviewBody }),
    ...(datePublished && { datePublished }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
