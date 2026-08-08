import React, {type ReactNode} from 'react';
import OriginalBlogTagsPostsPage from '@theme-original/BlogTagsPostsPage';
import {PageMetadata} from '@docusaurus/theme-common';
import type {Props} from '@theme/BlogTagsPostsPage';

/**
 * Wraps the stock tag-archive page to give paginated variants their own title
 * and description. Docusaurus reuses the tag title on every page, so
 * /blog/tags/guide/page/2..4 all shipped as `35 posts tagged with "Guide"`,
 * four URLs competing on one string.
 *
 * The original already renders an H1 on every page, so only the metadata needs
 * fixing. Rendering PageMetadata *after* the original works because Docusaurus
 * uses react-helmet-async, where the last <title> mounted wins.
 *
 * Not noindexed, for the same reason as the blog list pages: these are real
 * crawl paths into older posts, and self-referencing canonicals plus unique
 * titles is the current guidance for pagination.
 */
export default function BlogTagsPostsPage(props: Props): ReactNode {
  const {tag, listMetadata} = props;
  const page = listMetadata?.page ?? 1;
  const totalPages = listMetadata?.totalPages ?? 1;

  return (
    <>
      <OriginalBlogTagsPostsPage {...props} />
      {page > 1 && (
        <PageMetadata
          title={`Posts tagged "${tag.label}", Page ${page} of ${totalPages}`}
          description={`Page ${page} of ${totalPages} of Scrimba Guide posts tagged "${tag.label}".`}
        />
      )}
    </>
  );
}
