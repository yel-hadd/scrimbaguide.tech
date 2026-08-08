import React, {type ReactNode} from 'react';
import OriginalBlogAuthorsListPage from '@theme-original/Blog/Pages/BlogAuthorsListPage';
import {PageMetadata} from '@docusaurus/theme-common';
import type {Props} from '@theme/Blog/Pages/BlogAuthorsListPage';

/**
 * Gives the authors index its own meta description. Without this it inherits
 * the site-wide default, which it shared with /blog/tags/.
 */
export default function BlogAuthorsListPage(props: Props): ReactNode {
  return (
    <>
      <OriginalBlogAuthorsListPage {...props} />
      <PageMetadata description="Who writes Scrimba Guide: the authors behind our Scrimba course reviews, learning path guides, and developer career advice." />
    </>
  );
}
