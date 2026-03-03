import React from 'react';

interface ReviewSchemaProps {
  itemName: string;
  ratingValue: number;
  bestRating?: number;
  author?: string;
  reviewBody?: string;
  datePublished?: string;
}

export default function ReviewSchema({
  itemName,
  ratingValue,
  bestRating = 5,
  author = 'ScrimbaGuide Team',
  reviewBody,
  datePublished,
}: ReviewSchemaProps): React.ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: `${itemName} Review`,
    itemReviewed: {
      '@type': 'Thing',
      name: itemName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: ratingValue,
      bestRating: bestRating,
    },
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://scrimbaguide.tech/about',
    },
    publisher: {
      '@id': 'https://scrimbaguide.tech/#organization',
      '@type': 'Organization',
      name: 'ScrimbaGuide',
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
