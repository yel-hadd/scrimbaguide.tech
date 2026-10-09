import React from 'react';
import Head from '@docusaurus/Head';
import { useLocation } from '@docusaurus/router';
// @theme-original: importing '@theme/Layout' here would resolve to this very
// file (user swizzles shadow the theme alias) and recurse into itself.
import Layout from '@theme-original/Layout';

/**
 * Every page has a markdown twin at the same path with a `.md` suffix
 * (written by scripts/generate-llms-from-sitemap.mjs at build time).
 * Advertise it so AI systems and other markdown-aware clients can find it
 * without sniffing user agents; the Worker serves the twin on
 * `Accept: text/markdown`.
 */
function markdownTwinHref(pathname: string): string {
  if (pathname === '/') return '/index.md';
  return `${pathname.replace(/\/+$/, '')}.md`;
}

export default function LayoutWithMarkdownAlternate(
  props: React.ComponentProps<typeof Layout>,
): React.ReactElement {
  const { pathname } = useLocation();
  return (
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href={markdownTwinHref(pathname)} />
      </Head>
      <Layout {...props} />
    </>
  );
}
