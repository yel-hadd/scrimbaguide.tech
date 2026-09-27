// ejected from @docusaurus/theme-classic 3.9.2; re-diff on upgrade
/**
 * Swizzled BlogPostPage: renders breadcrumbs (Home > Blog > title, with the
 * post's only BreadcrumbList) above the post, and the desktop sticky CTA
 * (money pages only) after the post body. The end-of-post conversion CTA is
 * authored per post in MDX.
 */
import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import type { BlogSidebar } from '@docusaurus/plugin-content-blog';
import { HtmlClassNameProvider, ThemeClassNames } from '@docusaurus/theme-common';
import { BlogPostProvider, useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogLayout from '@theme/BlogLayout';
import BlogPostItem from '@theme/BlogPostItem';
import BlogPostPaginator from '@theme/BlogPostPaginator';
import BlogPostPageMetadata from '@theme/BlogPostPage/Metadata';
import TOC from '@theme/TOC';
import ContentVisibility from '@theme/ContentVisibility';
import DesktopStickyCTA from '@site/src/components/DesktopStickyCTA';
import BlogPostBreadcrumbs from '@site/src/components/BlogPostBreadcrumbs';

function BlogPostPageContent({
  sidebar,
  children,
}: {
  sidebar: BlogSidebar;
  children: ReactNode;
}): React.ReactElement {
  const { metadata, toc } = useBlogPost();
  const { nextItem, prevItem, frontMatter, title, permalink } = metadata;
  const {
    hide_table_of_contents: hideTableOfContents,
    toc_min_heading_level: tocMinHeadingLevel,
    toc_max_heading_level: tocMaxHeadingLevel,
  } = frontMatter;

  return (
    <BlogLayout
      sidebar={sidebar}
      toc={
        !hideTableOfContents && toc.length > 0 ? (
          <TOC
            toc={toc}
            minHeadingLevel={tocMinHeadingLevel}
            maxHeadingLevel={tocMaxHeadingLevel}
          />
        ) : undefined
      }
    >
      <ContentVisibility metadata={metadata} />

      <BlogPostBreadcrumbs title={title} permalink={permalink} />

      <BlogPostItem>{children}</BlogPostItem>

      {(nextItem || prevItem) && (
        <BlogPostPaginator nextItem={nextItem} prevItem={prevItem} />
      )}
      <DesktopStickyCTA />
    </BlogLayout>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BlogPostPage(props: any): React.ReactElement {
  const BlogPostContent = props.content;
  return (
    <BlogPostProvider content={props.content} isBlogPostPage>
      <HtmlClassNameProvider
        className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogPostPage)}
      >
        <BlogPostPageMetadata />
        <BlogPostPageContent sidebar={props.sidebar}>
          <BlogPostContent />
        </BlogPostPageContent>
      </HtmlClassNameProvider>
    </BlogPostProvider>
  );
}
