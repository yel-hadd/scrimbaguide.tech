import React from 'react';
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';
import {useSidebarBreadcrumbs} from '@docusaurus/plugin-content-docs/client';
import {useHomePageRoute} from '@docusaurus/theme-common/internal';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

const BASE_URL = 'https://scrimbaguide.tech';

function toAbsoluteUrl(path?: string): string {
  if (!path) return BASE_URL;
  return /^https?:\/\//i.test(path) ? path : `${BASE_URL}${path}`;
}

function buildBreadcrumbSchema(
  breadcrumbs: Array<{label: string; href?: string}>,
  includeHome: boolean
) {
  if (!breadcrumbs.length) return null;

  const items: Array<Record<string, string | number>> = [];
  if (includeHome) {
    items.push({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${BASE_URL}/`,
    });
  }

  breadcrumbs.forEach((crumb, index) => {
    items.push({
      '@type': 'ListItem',
      position: index + (includeHome ? 2 : 1),
      name: crumb.label,
      item: toAbsoluteUrl(crumb.href),
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export default function DocBreadcrumbsWrapper(props: Props): React.ReactElement {
  const breadcrumbs = useSidebarBreadcrumbs();
  const homePageRoute = useHomePageRoute();
  const schema = buildBreadcrumbSchema(breadcrumbs ?? [], Boolean(homePageRoute));

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
