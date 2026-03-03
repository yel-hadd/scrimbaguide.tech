import React from 'react';
import Metadata from '@theme-original/BlogPostPage/Metadata';
import type MetadataType from '@theme/BlogPostPage/Metadata';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

type Props = WrapperProps<typeof MetadataType>;

export default function MetadataWrapper(props: Props): React.ReactElement {
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

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: canonicalUrl,
    datePublished: date,
    dateModified: modifiedDate,
    author: {
      '@type': 'Organization',
      name: 'ScrimbaGuide Team',
      url: `${baseUrl}/about`,
      knowsAbout: ['Scrimba', 'web development', 'interactive coding education', 'React', 'JavaScript'],
    },
    publisher: {
      '@id': `${baseUrl}/#organization`,
      '@type': 'Organization',
      name: 'ScrimbaGuide',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/img/logo.png`,
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
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:site_name" content="ScrimbaGuide" />
        <meta property="article:author" content="ScrimbaGuide Team" />
        <meta property="article:published_time" content={date} />
        <meta property="article:modified_time" content={modifiedDate} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:site" content="@scrimbaguide" />
        <meta name="twitter:creator" content="@scrimbaguide" />
        <meta name="twitter:title" content={title} />
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
