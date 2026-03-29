import React from 'react';

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
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description ? { description } : {}),
    itemListElement: items.map((item, index) => {
      const element: Record<string, unknown> = {
        '@type': 'ListItem',
        position: item.position ?? index + 1,
        name: item.name,
      };
      if (item.url) {
        element.url = item.url.startsWith('http')
          ? item.url
          : `https://scrimbaguide.tech${item.url}`;
      }
      if (item.description) element.description = item.description;
      return element;
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
