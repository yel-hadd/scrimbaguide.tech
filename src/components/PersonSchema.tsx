import React from 'react';

interface PersonSchemaProps {
  name: string;
  url?: string;
  description?: string;
  knowsAbout?: string[];
  imageUrl?: string;
  /** Use Organization for publisher/brand entities; Person for named authors */
  schemaType?: 'Person' | 'Organization';
  /** Social profiles (LinkedIn, GitHub, etc.) */
  sameAs?: string[];
}

/**
 * Outputs Person or Organization schema for E-E-A-T and LLM extraction.
 */
export default function PersonSchema({
  name,
  url = 'https://scrimbaguide.tech/about',
  description = 'A team of senior frontend and fullstack developers who have collectively completed 40+ Scrimba courses and all 4 career paths.',
  knowsAbout = ['Scrimba', 'web development', 'interactive coding education', 'React', 'JavaScript', 'frontend development'],
  imageUrl = 'https://scrimbaguide.tech/img/logo.svg',
  schemaType = 'Person',
  sameAs,
}: PersonSchemaProps): React.ReactElement {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name,
    url,
    ...(description && { description }),
    ...(knowsAbout.length > 0 && { knowsAbout }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };

  if (schemaType === 'Organization') {
    base.logo = {
      '@type': 'ImageObject',
      url: imageUrl,
    };
  } else if (imageUrl) {
    base.image = {
      '@type': 'ImageObject',
      url: imageUrl,
    };
  }

  const schema = base;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
