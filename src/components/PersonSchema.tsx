import React from 'react';
import { useLocation } from '@docusaurus/router';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath } from './schemaUtils';

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
  description = 'An independent reviewer covering Scrimba\'s catalog, learning paths, pricing, and how it compares to other coding platforms.',
  knowsAbout = ['Scrimba', 'web development', 'interactive coding education', 'React', 'JavaScript', 'frontend development'],
  imageUrl = 'https://scrimbaguide.tech/img/logo.svg',
  schemaType = 'Person',
  sameAs,
}: PersonSchemaProps): React.ReactElement {
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  /* The @id identifies the entity, not the page. Two people described on the
     same page (see /about/) must not share one, or consumers merge them into a
     single entity with conflicting names. */
  const entitySlug = plainText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${toAbsoluteUrl(url)}#${schemaType.toLowerCase()}-${entitySlug}`,
    name: plainText(name),
    url: toAbsoluteUrl(url),
    mainEntityOfPage: pageUrl,
    ...(description && { description: plainText(description) }),
    ...(knowsAbout.length > 0 && { knowsAbout }),
    ...(sameAs && sameAs.length > 0 && { sameAs: sameAs.map((item) => toAbsoluteUrl(item)) }),
  };

  if (schemaType === 'Organization') {
    base.logo = {
      '@type': 'ImageObject',
      url: toAbsoluteUrl(imageUrl),
    };
  } else if (imageUrl) {
    base.image = {
      '@type': 'ImageObject',
      url: toAbsoluteUrl(imageUrl),
    };
  }

  const schema = base;

  return (
    <script
      id={schemaScriptId('person', canonicalPath, plainText(name))}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
