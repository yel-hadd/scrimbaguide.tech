import React from 'react';

interface CourseSchemaProps {
  name: string;
  description: string;
  provider?: string;
  url: string;
  duration?: string;
  difficulty?: string;
}

export default function CourseSchema({
  name,
  description,
  provider = 'Scrimba',
  url,
  duration,
  difficulty,
}: CourseSchemaProps): React.ReactElement {
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
    ...(difficulty && {
      educationalLevel: difficulty,
    }),
    ...(duration && {
      timeRequired: duration,
    }),
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      priceCurrency: 'USD',
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
