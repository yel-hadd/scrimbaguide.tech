import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';
import RelatedGuides from '@site/src/components/RelatedGuides';
import MobileStickyCTA from '@site/src/components/MobileStickyCTA';
import PricingCTA from '@site/src/components/PricingCTA';
import { useLocation } from '@docusaurus/router';
import { getRelatedGuides } from '@site/src/content/relatedGuidesMap';

export default function FooterWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const guides = getRelatedGuides(location.pathname);
  const showGlobalCta = !location.pathname.includes('discount') && !location.pathname.includes('pricing');

  return (
    <>
      <Footer {...props} />
      {guides.length > 0 && <RelatedGuides guides={guides} />}
      {showGlobalCta && (
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
