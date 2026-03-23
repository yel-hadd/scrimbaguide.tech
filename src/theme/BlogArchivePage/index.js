import React from 'react';
import Link from '@docusaurus/Link';
import {PageMetadata} from '@docusaurus/theme-common';
import Head from '@docusaurus/Head';
import {useDateTimeFormat} from '@docusaurus/theme-common/internal';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
function Year({year, posts}) {
  const dateTimeFormat = useDateTimeFormat({
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const formatDate = (lastUpdated) =>
    dateTimeFormat.format(new Date(lastUpdated));
  return (
    <>
      <Heading as="h2" id={year}>
        {year}
      </Heading>
      <ul>
        {posts.map((post) => (
          <li key={post.metadata.date}>
            <Link to={post.metadata.permalink}>
              {formatDate(post.metadata.date)} - {post.metadata.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
function YearsSection({years}) {
  return (
    <section className="margin-vert--lg">
      <div className="container">
        <div className="row">
          {years.map((_props, idx) => (
            <div key={idx} className="col col--4 margin-vert--lg">
              <Year {..._props} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function listPostsByYears(blogPosts) {
  const postsByYear = blogPosts.reduce((posts, post) => {
    const year = post.metadata.date.split('-')[0];
    const yearPosts = posts.get(year) ?? [];
    return posts.set(year, [post, ...yearPosts]);
  }, new Map());
  return Array.from(postsByYear, ([year, posts]) => ({
    year,
    posts,
  }));
}
export default function BlogArchive({archive}) {
  const {siteConfig} = useDocusaurusContext();
  const baseUrl = 'https://scrimbaguide.tech';
  const canonicalUrl = `${baseUrl}/blog/archive`;
  const title = 'Blog Archive | Scrimba Guide';
  const description = 'Browse all Scrimba Guide blog posts by year.';
  const years = listPostsByYears(archive.blogPosts);
  return (
    <>
      <PageMetadata title={title} description={description} />
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={`${baseUrl}/img/social-card.png`} />
        <meta property="og:site_name" content={siteConfig.title} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:site" content="@scrimbaguide" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${baseUrl}/img/social-card.png`} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <Layout>
        <header className="hero hero--primary">
          <div className="container">
            <Heading as="h1" className="hero__title">
              {title}
            </Heading>
            <p className="hero__subtitle">{description}</p>
          </div>
        </header>
        <main>{years.length > 0 && <YearsSection years={years} />}</main>
      </Layout>
    </>
  );
}
