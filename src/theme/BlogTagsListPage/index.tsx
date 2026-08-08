import React, {type ReactNode} from 'react';
import OriginalBlogTagsListPage from '@theme-original/BlogTagsListPage';
import {PageMetadata} from '@docusaurus/theme-common';
import type {Props} from '@theme/BlogTagsListPage';

/**
 * Gives the tag index its own meta description. Without this it inherits the
 * site-wide default, which it shared with /blog/authors/.
 */
export default function BlogTagsListPage(props: Props): ReactNode {
  return (
    <>
      <OriginalBlogTagsListPage {...props} />
      <PageMetadata description="Every topic covered on the Scrimba Guide blog, from course reviews and learning paths to pricing and developer career advice." />
    </>
  );
}
