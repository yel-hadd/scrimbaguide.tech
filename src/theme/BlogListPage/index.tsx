import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import type BlogListPageType from '@theme/BlogListPage';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {toSeoTitle} from '@site/src/utils/seoTitle';

type Props = WrapperProps<typeof BlogListPageType>;

const BASE_URL = 'https://scrimbaguide.tech';
const BLOG_DESC = "Scrimba blog posts, reviews, and tips. Learn which courses to take, how to save money, and how to get hired as a developer.";
const BLOG_TITLE = 'Blog | Scrimba Guide';

function toAbsoluteUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `${BASE_URL}${path}`;
}

export default function BlogListPageWrapper(props: Props): React.ReactElement {
  const {siteConfig} = useDocusaurusContext();
  const permalink = props.metadata?.permalink ?? '/blog/';
  const blogTitle = props.metadata?.blogTitle ?? BLOG_TITLE;
  const blogDescription = props.metadata?.blogDescription ?? BLOG_DESC;
  const canonicalUrl = toAbsoluteUrl(permalink);
  const seoBlogTitle = toSeoTitle(blogTitle);

  return (
    <>
      <Head>
        <title>{seoBlogTitle}</title>
        <meta name="description" content={blogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoBlogTitle} />
        <meta property="og:description" content={blogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={`${BASE_URL}/img/social-card.png`} />
        <meta property="og:site_name" content={siteConfig.title} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:site" content="@scrimbaguide" />
        <meta name="twitter:title" content={seoBlogTitle} />
        <meta name="twitter:description" content={blogDescription} />
        <meta name="twitter:image" content={`${BASE_URL}/img/social-card.png`} />
      </Head>
      <header className="container margin-top--md margin-bottom--sm">
        <h1>Scrimba Guide Blog</h1>
      </header>
      <BlogListPage {...props} />
    </>
  );
}
