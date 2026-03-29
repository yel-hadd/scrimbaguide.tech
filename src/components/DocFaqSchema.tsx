import React from 'react';

export interface FaqItem {
  q: string;
  a: string;
}

interface DocFaqSchemaProps {
  questions: FaqItem[];
}

/**
 * JSON-LD FAQPage schema for doc pages.
 * Add to comparison and path pages that contain FAQ sections —
 * increases AI Overview and featured snippet eligibility.
 */
export default function DocFaqSchema({ questions }: DocFaqSchemaProps): React.ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
