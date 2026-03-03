import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import type BlogListPageType from '@theme/BlogListPage';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogListPageType>;

const BASE_URL = 'https://scrimbaguide.tech';
const BLOG_DESC = "Scrimba guides, reviews, and tips. Learn which courses to take, how to save money, and how to get hired as a developer.";
const BLOG_TITLE = "Blog | ScrimbaGuide";

export default function BlogListPageWrapper(props: Props): React.ReactElement {
  return (
    <>
      <Head>
        <title>{BLOG_TITLE}</title>
        <meta name="description" content={BLOG_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={BLOG_TITLE} />
        <meta property="og:description" content={BLOG_DESC} />
        <meta property="og:url" content={`${BASE_URL}/blog/`} />
        <meta property="og:image" content={`${BASE_URL}/img/social-card.png`} />
        <meta property="og:site_name" content="ScrimbaGuide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={BLOG_TITLE} />
        <meta name="twitter:description" content={BLOG_DESC} />
        <meta name="twitter:image" content={`${BASE_URL}/img/social-card.png`} />
      </Head>
      <BlogListPage {...props} />
    </>
  );
}
