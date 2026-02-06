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

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    author: {
      '@type': 'Organization',
      name: 'ScrimbAGuide Team',
      url: 'https://scrimbaguide.tech',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ScrimbAGuide',
      url: 'https://scrimbaguide.tech',
      logo: {
        '@type': 'ImageObject',
        url: 'https://scrimbaguide.tech/img/logo.png',
      },
    },
    image: frontMatter.image
      ? `https://scrimbaguide.tech${frontMatter.image}`
      : 'https://scrimbaguide.tech/img/social-card.png',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://scrimbaguide.tech${permalink}`,
    },
  };

  return (
    <>
      <Head>
        <script type="application/ld+json">
          {JSON.stringify(blogPostingSchema)}
        </script>
      </Head>
      <Metadata {...props} />
    </>
  );
}
