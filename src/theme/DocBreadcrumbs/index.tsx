import React from 'react';
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';
import {useLocation} from '@docusaurus/router';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

const BASE_URL = 'https://scrimbaguide.tech';

function buildBreadcrumbSchema(pathname: string) {
  // Split path into segments: /docs/courses/react/learn-react -> ["docs","courses","react","learn-react"]
  const segments = pathname.replace(/^\/|\/$/g, '').split('/');
  if (segments.length < 2) return null;

  const items = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const item: Record<string, unknown> = {
      '@type': 'ListItem',
      position: index + 1,
      name,
    };

    // Don't include "item" URL on the last breadcrumb (current page)
    if (index < segments.length - 1) {
      item.item = `${BASE_URL}${path}/`;
    }

    return item;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export default function DocBreadcrumbsWrapper(props: Props): React.ReactElement {
  const {pathname} = useLocation();
  const schema = buildBreadcrumbSchema(pathname);

  return (
    <>
      {schema && (
        <Head>
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        </Head>
      )}
      <DocBreadcrumbs {...props} />
    </>
  );
}
