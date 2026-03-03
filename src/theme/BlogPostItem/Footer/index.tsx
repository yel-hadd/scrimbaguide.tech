import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';
import RelatedGuides from '@site/src/components/RelatedGuides';
import MobileStickyCTA from '@site/src/components/MobileStickyCTA';
import { useLocation } from '@docusaurus/router';
import { getRelatedGuides } from '@site/src/content/relatedGuidesMap';

export default function FooterWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const guides = getRelatedGuides(location.pathname);

  return (
    <>
      <Footer {...props} />
      {guides.length > 0 && <RelatedGuides guides={guides} />}
      <MobileStickyCTA />
    </>
  );
}
