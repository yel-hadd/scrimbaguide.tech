import React from 'react';

interface PersonSchemaProps {
  name: string;
  url?: string;
  description?: string;
  knowsAbout?: string[];
  imageUrl?: string;
}

/**
 * Outputs Person schema for E-E-A-T and LLM extraction.
 * Use for author entities in Article/BlogPosting.
 */
export default function PersonSchema({
  name,
  url = 'https://scrimbaguide.tech/about',
  description = 'A team of senior frontend and fullstack developers who have collectively completed 40+ Scrimba courses and all 4 career paths.',
  knowsAbout = ['Scrimba', 'web development', 'interactive coding education', 'React', 'JavaScript', 'frontend development'],
  imageUrl = 'https://scrimbaguide.tech/img/logo.png',
}: PersonSchemaProps): React.ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(description && { description }),
    ...(knowsAbout.length > 0 && { knowsAbout }),
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
