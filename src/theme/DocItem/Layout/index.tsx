import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import RelatedGuides from '@site/src/components/RelatedGuides';
import MobileStickyCTA from '@site/src/components/MobileStickyCTA';
import DesktopStickyCTA from '@site/src/components/DesktopStickyCTA';
import PricingCTA from '@site/src/components/PricingCTA';
import EmailCapture from '@site/src/components/EmailCapture';
import { useLocation } from '@docusaurus/router';
import { getRelatedGuides } from '@site/src/content/relatedGuidesMap';

function DocSeoHead(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  const { metadata, frontMatter } = useDoc();
  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const canonical = `${baseUrl}${metadata.permalink}`;
  const title = metadata.title;
  const description =
    (typeof frontMatter.description === 'string' && frontMatter.description) ||
    metadata.description ||
    siteConfig.tagline;
  const ogImage = `${baseUrl}/img/social-card.png`;
  const dateModified =
    metadata.lastUpdatedAt != null
      ? new Date(metadata.lastUpdatedAt as string | number | Date).toISOString()
      : undefined;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: canonical,
    inLanguage: 'en',
    ...(dateModified && { dateModified }),
    publisher: {
      '@id': 'https://scrimbaguide.tech/#organization',
      '@type': 'Organization',
      name: siteConfig.title,
      url: 'https://scrimbaguide.tech',
      logo: {
        '@type': 'ImageObject',
        url: 'https://scrimbaguide.tech/img/logo.svg',
      },
    },
    author: {
      '@type': 'Person',
      name: 'Yassine El Haddad',
      url: 'https://scrimbaguide.tech/about',
    },
  };

  return (
    <>
      <Head>
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content={siteConfig.title} />
        {dateModified && <meta property="article:modified_time" content={dateModified} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={canonical} />
      </Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
    </>
  );
}

export default function LayoutWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const guides = getRelatedGuides(location.pathname);
  const showGlobalCta = !location.pathname.startsWith('/docs/pricing/');

  return (
    <Layout {...props}>
      <DocSeoHead />
      {props.children}
      {guides.length > 0 && <RelatedGuides guides={guides} />}
      {showGlobalCta && (
        <PricingCTA
          title="Ready to Upgrade Your Learning?"
          subtitle="Use our partner link to claim 20% off Scrimba Pro and unlock all courses and career paths."
          buttonText="Claim 20% Off Scrimba Pro"
        />
      )}
      <div className="container margin-bottom--lg">
        <EmailCapture variant="docs" />
      </div>
      <MobileStickyCTA />
      <DesktopStickyCTA />
    </Layout>
  );
}
