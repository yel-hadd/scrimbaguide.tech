import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import type {Props} from '@theme/BlogListPage';
import BlogPostItems from '@theme/BlogPostItems';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';

/**
 * Replaces the default BlogListPage to inject a visible SEO H1 inside the
 * content area (after the navbar), not above the layout.
 *
 * The H1 is styled small/muted so it doesn't compete with the blog post
 * titles, it satisfies Screaming Frog's "missing H1" audit while
 * staying out of the visual hierarchy.
 *
 * Previous approach used a wrapper fragment that placed the H1 before
 * <BlogListPage>, which caused it to render above the navbar.
 */
export default function BlogListPage(props: Props): ReactNode {
  const {metadata, items, sidebar} = props;
  const isFirstPage = !metadata.page || metadata.page === 1;
  const {siteConfig: {title: siteTitle}} = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const isBlogOnlyMode = permalink === '/';
  const title = isBlogOnlyMode ? siteTitle : blogTitle;

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
      <BlogListPageStructuredData {...props} />
      <BlogLayout sidebar={sidebar}>
        {isFirstPage && (
          <h1 className="blog-list-page__title">
            Scrimba Guide Blog, Reviews, Tips, and Career Advice for Developers
          </h1>
        )}
        <BlogPostItems items={items} />
        <BlogListPaginator metadata={metadata} />
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
