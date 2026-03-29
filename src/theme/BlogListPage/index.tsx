import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import type BlogListPageType from '@theme/BlogListPage';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof BlogListPageType>;

/**
 * Swizzle wrapper that adds a visible H1 to the /blog/ listing page.
 * Screaming Frog audit flagged /blog/ as missing an H1 — this fixes it.
 * The H1 is rendered visibly but small/muted so it doesn't conflict with
 * the blog list header UI while remaining unambiguous to crawlers.
 */
export default function BlogListPageWrapper(props: Props): React.ReactElement {
  const isFirstPage = !props.metadata.page || props.metadata.page === 1;

  return (
    <>
      {isFirstPage && (
        <h1 style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '0.25rem', fontWeight: 400 }}>
          Scrimba Guide Blog — Reviews, Tips, and Career Advice for Developers
        </h1>
      )}
      <BlogListPage {...props} />
    </>
  );
}
