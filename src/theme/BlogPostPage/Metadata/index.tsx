import React from 'react';
import Metadata from '@theme-original/BlogPostPage/Metadata';
import type MetadataType from '@theme/BlogPostPage/Metadata';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

type Props = WrapperProps<typeof MetadataType>;

type PostAuthor = {name?: string; url?: string; imageURL?: string; key?: string | null};

const SITE_ORIGIN = 'https://scrimbaguide.tech';

/** Used only when a post lists no authors (every post currently lists one). */
const FALLBACK_AUTHOR: PostAuthor = {
  name: 'Yassine El Haddad',
  url: '/about/',
  imageURL: '/img/authors/yassine-el-haddad.webp',
};

function toAbsoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Site-internal page URLs end in "/" (trailingSlash: true); files and external URLs are left alone. */
function withTrailingSlash(url: string): string {
  if (!url.startsWith(`${SITE_ORIGIN}/`) && url !== SITE_ORIGIN) return url;
  const [base, hash = ''] = url.split('#');
  if (base.endsWith('/') || /\.[a-z0-9]+$/i.test(base)) return url;
  return `${base}/${hash ? `#${hash}` : ''}`;
}

/** Same entity @id PersonSchema emits on /about/, so each byline resolves to its profile node
    (which carries knowsAbout and sameAs; they are not restated per post). */
function personId(url: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${url}#person-${slug}`;
}

function toPerson(author: PostAuthor, name: string): Record<string, unknown> {
  const url = author.url ? withTrailingSlash(toAbsoluteUrl(author.url)) : undefined;
  return {
    '@type': 'Person',
    ...(url && {'@id': personId(url, name)}),
    name,
    ...(url && {url}),
    ...(author.imageURL && {image: toAbsoluteUrl(author.imageURL)}),
  };
}

export default function MetadataWrapper(props: Props): React.ReactElement {
  const {siteConfig} = useDocusaurusContext();
  const {metadata} = useBlogPost();
  const {title, description, date, permalink, frontMatter, authors} = metadata;
  const namedAuthors = (authors as PostAuthor[]).filter((author) => author.name?.trim());
  const postAuthors = namedAuthors.length > 0 ? namedAuthors : [FALLBACK_AUTHOR];
  const authorNames = postAuthors.map((author) => author.name!.trim());
  const authorNodes = postAuthors.map((author, i) => toPerson(author, authorNames[i]));
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
  const imageUrl = frontMatter.image
    ? toAbsoluteUrl(frontMatter.image)
    : `${baseUrl}/img/social-card.png`;

  const rawKeywords = frontMatter.keywords as string[] | string | undefined;
  const keywordsString = Array.isArray(rawKeywords)
    ? rawKeywords.join(', ')
    : typeof rawKeywords === 'string'
      ? rawKeywords
      : undefined;

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: canonicalUrl,
    datePublished: date,
    dateModified: modifiedDate,
    // The post's own byline: one Person, or an array when a post has several authors.
    author: authorNodes.length === 1 ? authorNodes[0] : authorNodes,
    // Bare @id reference to the Organization defined in headTags (config), injected
    // on every page. Avoids re-declaring a second @type:Organization node per page.
    publisher: { '@id': `${baseUrl}/#organization` },
    image: imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    ...(keywordsString && { keywords: keywordsString }),
  };

  return (
    <>
      <Head>
        <meta property="og:type" content="article" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="article:published_time" content={date} />
        <meta property="article:modified_time" content={modifiedDate} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:site" content="@scrimbaguide" />
        <meta name="twitter:creator" content="@scrimbaguide" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <script type="application/ld+json">
          {JSON.stringify(blogPostingSchema)}
        </script>
      </Head>
      <Metadata {...props} />
      {/* After the stock Metadata so these win the Head dedupe: the stock tag
          is a single comma-joined list of profile URLs, and both authors share
          /about/. One tag per author, by name, matching the visible byline. */}
      <Head>
        {authorNames.map((name) => (
          <meta key={name} property="article:author" content={name} />
        ))}
      </Head>
    </>
  );
}
