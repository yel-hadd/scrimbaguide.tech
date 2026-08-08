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
 *
 * Pagination: Docusaurus gives every paginated page the same title and
 * description, so /blog/page/2..8 all shipped as "Blog | Scrimba Guide" with
 * no H1 at all. We differentiate both, and render an H1 on every page.
 *
 * Deliberately NOT noindexed. Google dropped rel=next/prev and treats
 * paginated pages as ordinary URLs; noindexing them is the common "fix" but it
 * degrades the crawl path to older posts, which for a 50-plus post blog is the
 * main way deep archive content stays discoverable. Self-referencing canonicals
 * (Docusaurus default) plus unique titles is the current guidance.
 */
export default function BlogListPage(props: Props): ReactNode {
  const {metadata, items, sidebar} = props;
  const page = metadata.page ?? 1;
  const totalPages = metadata.totalPages ?? 1;
  const isFirstPage = page === 1;
  const {siteConfig: {title: siteTitle}} = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const isBlogOnlyMode = permalink === '/';
  const baseTitle = isBlogOnlyMode ? siteTitle : blogTitle;
  const title = isFirstPage ? baseTitle : `${baseTitle}, Page ${page} of ${totalPages}`;
  const description = isFirstPage
    ? blogDescription
    : `Page ${page} of ${totalPages} of the Scrimba Guide blog: reviews, tips, and career advice for developers.`;

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <PageMetadata title={title} description={description} />
      <SearchMetadata tag="blog_posts_list" />
      <BlogListPageStructuredData {...props} />
      <BlogLayout sidebar={sidebar}>
        <h1 className="blog-list-page__title">
          {isFirstPage
            ? 'Scrimba Guide Blog, Reviews, Tips, and Career Advice for Developers'
            : `Scrimba Guide Blog, Page ${page} of ${totalPages}`}
        </h1>
        <BlogPostItems items={items} />
        <BlogListPaginator metadata={metadata} />
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
