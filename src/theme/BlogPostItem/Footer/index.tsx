import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';
import RelatedGuides from '@site/src/components/RelatedGuides';
import MobileStickyCTA from '@site/src/components/MobileStickyCTA';
import PricingCTA from '@site/src/components/PricingCTA';
import { useLocation } from '@docusaurus/router';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import { getRelatedGuides } from '@site/src/content/relatedGuidesMap';

type BlogFooterFrontMatter = {
  hideFooterPricingCta?: boolean;
};

export default function FooterWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const { metadata } = useBlogPost();
  const fm = metadata.frontMatter as BlogFooterFrontMatter;
  const guides = getRelatedGuides(location.pathname);
  const showPathCta = !location.pathname.includes('discount') && !location.pathname.includes('pricing');
  const showFooterPricing = showPathCta && !fm.hideFooterPricingCta;

  return (
    <>
      <Footer {...props} />
      {guides.length > 0 && <RelatedGuides guides={guides} />}
      {showFooterPricing && (
        <PricingCTA
          title="Want Full Access to Scrimba?"
          subtitle="Use our partner link to claim 20% off Pro and unlock all courses, paths, and Discord access."
          buttonText="Claim 20% Off Scrimba Pro"
        />
      )}
      <MobileStickyCTA />
    </>
  );
}
