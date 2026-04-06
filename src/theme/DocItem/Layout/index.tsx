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

/** Optional per-doc overrides for the layout affiliate block (YAML front matter). */
type DocAffiliateFrontMatter = {
  hideGlobalPricingCta?: boolean;
  affiliateCtaTitle?: string;
  affiliateCtaSubtitle?: string;
  affiliateCtaButtonText?: string;
  affiliateCtaType?: 'pro' | 'free';
  affiliateCtaShowDiscountNote?: boolean;
};


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
      knowsAbout: ['Scrimba', 'web development', 'interactive coding education', 'React', 'JavaScript'],
    },
  };

  return (
    <>
      <Head>
        {/* og:title and twitter:title are set by DocItem/Metadata with the properly truncated seoTitle */}
        <meta property="og:type" content="article" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content={siteConfig.title} />
        {dateModified && <meta property="article:modified_time" content={dateModified} />}
        <meta name="twitter:card" content="summary_large_image" />
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

function DocAffiliateCta({ pathname }: { pathname: string }): React.ReactElement | null {
  const { frontMatter } = useDoc();
  const fm = frontMatter as DocAffiliateFrontMatter;
  if (pathname.startsWith('/docs/pricing/') || fm.hideGlobalPricingCta) {
    return null;
  }

  const title = fm.affiliateCtaTitle ?? 'Ready to Upgrade Your Learning?';
  const subtitle =
    fm.affiliateCtaSubtitle ??
    'Use our partner link to claim 20% off Scrimba Pro and unlock all courses and career paths.';
  const ctaType = fm.affiliateCtaType ?? 'pro';

  const pricingProps: React.ComponentProps<typeof PricingCTA> = {
    title,
    subtitle,
    ctaType,
    buttonText: fm.affiliateCtaButtonText,
  };
  if (typeof fm.affiliateCtaShowDiscountNote === 'boolean') {
    pricingProps.showDiscountNote = fm.affiliateCtaShowDiscountNote;
  }

  return <PricingCTA {...pricingProps} />;
}

export default function LayoutWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const guides = getRelatedGuides(location.pathname);

  return (
    <Layout {...props}>
      <DocSeoHead />
      {props.children}
      {guides.length > 0 && <RelatedGuides guides={guides} />}
      <DocAffiliateCta pathname={location.pathname} />
      <div className="container margin-bottom--lg">
        <EmailCapture variant="docs" />
      </div>
      <MobileStickyCTA />
      <DesktopStickyCTA />
    </Layout>
  );
}
