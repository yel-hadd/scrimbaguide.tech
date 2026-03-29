import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import type BlogListPageType from '@theme/BlogListPage';
import type { WrapperProps } from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogListPageType>;

/**
 * Swizzle wrapper that adds a visible H1 to the /blog/ listing page.
 * Screaming Frog audit flagged /blog/ as missing an H1 — this fixes it.
 * The H1 is visually hidden but semantically present and crawlable.
 */
export default function BlogListPageWrapper(props: Props): React.ReactElement {
  const isFirstPage = !props.metadata.page || props.metadata.page === 1;

  return (
    <>
      <Head>
        {isFirstPage && (
          <style>{`
            .blog-list-page-h1 {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }
          `}</style>
        )}
      </Head>
      {isFirstPage && (
        <h1 className="blog-list-page-h1">
          Scrimba Guide Blog — Reviews, Tips, and Career Advice for Developers
        </h1>
      )}
      <BlogListPage {...props} />
    </>
  );
}
