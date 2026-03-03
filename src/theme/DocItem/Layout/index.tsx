import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import RelatedGuides from '@site/src/components/RelatedGuides';
import MobileStickyCTA from '@site/src/components/MobileStickyCTA';
import PricingCTA from '@site/src/components/PricingCTA';
import { useLocation } from '@docusaurus/router';
import { getRelatedGuides } from '@site/src/content/relatedGuidesMap';

export default function LayoutWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const guides = getRelatedGuides(location.pathname);
  const showGlobalCta = !location.pathname.startsWith('/docs/pricing/');

  return (
    <Layout {...props}>
      {props.children}
      {guides.length > 0 && <RelatedGuides guides={guides} />}
      {showGlobalCta && (
        <PricingCTA
          title="Ready to Upgrade Your Learning?"
          subtitle="Use our partner link to claim 20% off Scrimba Pro and unlock all courses and career paths."
          buttonText="Claim 20% Off Scrimba Pro"
        />
      )}
      <MobileStickyCTA />
    </Layout>
  );
}
