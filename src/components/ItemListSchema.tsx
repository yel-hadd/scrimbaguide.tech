import React from 'react';
import { useLocation } from '@docusaurus/router';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath } from './schemaUtils';

export interface ListItem {
  name: string;
  /** Absolute or relative URL for this item */
  url?: string;
  description?: string;
  position?: number;
}

interface ItemListSchemaProps {
  name: string;
  description?: string;
  items: ListItem[];
}

/**
 * JSON-LD ItemList schema for blog posts with ranked or ordered lists.
 * Use on: bootcamp alternatives, JS projects list, vibe coding survival guide, any "best X" post.
 * Increases eligibility for rich results and AI Overview list extraction.
 */
export default function ItemListSchema({
  name,
  description,
  items,
}: ItemListSchemaProps): React.ReactElement {
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${pageUrl}#itemlist`,
    name: plainText(name),
    ...(description ? { description: plainText(description) } : {}),
    mainEntityOfPage: pageUrl,
    itemListElement: items.map((item, index) => {
      const element: Record<string, unknown> = {
        '@type': 'ListItem',
        position: item.position ?? index + 1,
        name: plainText(item.name),
      };
      if (item.url) {
        element.url = toAbsoluteUrl(item.url);
      }
      if (item.description) element.description = plainText(item.description);
      return element;
    }),
  };

  return (
    <script
      id={schemaScriptId('itemlist', canonicalPath, plainText(name))}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
