import React from 'react';
import Metadata from '@theme-original/BlogPostPage/Metadata';
import type MetadataType from '@theme/BlogPostPage/Metadata';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {toSeoTitle} from '@site/src/utils/seoTitle';

type Props = WrapperProps<typeof MetadataType>;

export default function MetadataWrapper(props: Props): React.ReactElement {
  const {siteConfig} = useDocusaurusContext();
  const {metadata} = useBlogPost();
  const {title, description, date, permalink, frontMatter} = metadata;
  const metadataWithUpdate = metadata as unknown as {
    lastUpdatedAt?: number | string;
    lastUpdated?: string;
  };
  const lastUpdatedAt = metadataWithUpdate.lastUpdatedAt;
  const normalizedLastUpdatedAt =
    typeof lastUpdatedAt === 'number' ? new Date(lastUpdatedAt).toISOString() : lastUpdatedAt;
  const modifiedDate = normalizedLastUpdatedAt ?? metadataWithUpdate.lastUpdated ?? date;
  const baseUrl = 'https://scrimbaguide.tech';
  const canonicalUrl = `${baseUrl}${permalink}`;
  const toAbsoluteUrl = (url: string): string =>
    /^https?:\/\//i.test(url) ? url : `${baseUrl}${url}`;
  const imageUrl = frontMatter.image
    ? toAbsoluteUrl(frontMatter.image)
    : `${baseUrl}/img/social-card.png`;
  const seoTitle = toSeoTitle(title);

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: canonicalUrl,
    datePublished: date,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: 'Yassine El Haddad',
      url: `${baseUrl}/about`,
      knowsAbout: ['Scrimba', 'web development', 'interactive coding education', 'React', 'JavaScript'],
    },
    publisher: {
      '@id': `${baseUrl}/#organization`,
      '@type': 'Organization',
      name: siteConfig.title,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/img/logo.svg`,
      },
    },
    image: imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="article:author" content="Yassine El Haddad" />
        <meta property="article:published_time" content={date} />
        <meta property="article:modified_time" content={modifiedDate} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:site" content="@scrimbaguide" />
        <meta name="twitter:creator" content="@scrimbaguide" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <script type="application/ld+json">
          {JSON.stringify(blogPostingSchema)}
        </script>
      </Head>
      <Metadata {...props} />
    </>
  );
}
