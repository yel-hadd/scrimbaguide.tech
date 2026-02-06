import React from 'react';

interface CourseSchemaProps {
  name: string;
  description: string;
  provider?: string;
  url: string;
  duration?: string;
  difficulty?: string;
  access?: 'Free' | 'Pro';
  keywords?: string[];
}

export default function CourseSchema({
  name,
  description,
  provider = 'Scrimba',
  url,
  duration,
  difficulty,
  access,
  keywords,
}: CourseSchemaProps): React.ReactElement {
  const isFree = access === 'Free';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: 'https://scrimba.com',
    },
    url,
    inLanguage: 'en',
    ...(difficulty && {
      educationalLevel: difficulty,
    }),
    ...(duration && {
      timeRequired: duration,
    }),
    ...(keywords && keywords.length > 0 && {
      teaches: keywords,
    }),
    offers: {
      '@type': 'Offer',
      price: isFree ? '0' : undefined,
      priceCurrency: 'USD',
      category: isFree ? 'Free' : 'Paid',
      availability: 'https://schema.org/InStock',
      url,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: duration || 'PT2H',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
