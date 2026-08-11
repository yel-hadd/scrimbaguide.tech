import React from 'react';
import { useLocation } from '@docusaurus/router';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath, toRoutePath } from './schemaUtils';

export interface FaqItem {
  q: string;
  a: string;
}

interface DocFaqSchemaProps {
  questions: FaqItem[];
}

/**
 * JSON-LD FAQPage schema for doc pages.
 * Add to comparison and path pages that contain FAQ sections;
 * increases AI Overview and featured snippet eligibility.
 */
export default function DocFaqSchema({ questions }: DocFaqSchemaProps): React.ReactElement {
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  // Locale-stripped: /de/blog/tags is still the tags page.
  const routePath = toRoutePath(pathname);
  const isBlogListPage =
    routePath === '/blog' ||
    routePath.startsWith('/blog/page') ||
    routePath.startsWith('/blog/tags') ||
    routePath.startsWith('/blog/archive');

  if (isBlogListPage) {
    return <></>;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntityOfPage: pageUrl,
    mainEntity: questions.map(({ q, a }) => ({
      '@type': 'Question',
      name: plainText(q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: plainText(a),
      },
    })),
  };

  return (
    <script
      id={schemaScriptId('faq', canonicalPath)}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
