import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import type BlogListPageType from '@theme/BlogListPage';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogListPageType>;

export default function BlogListPageWrapper(props: Props): React.ReactElement {
  return (
    <>
      <Head>
        <title>Blog | ScrimbAGuide</title>
      </Head>
      <BlogListPage {...props} />
    </>
  );
}
