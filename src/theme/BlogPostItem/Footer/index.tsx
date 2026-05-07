import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';
import RelatedGuides from '@site/src/components/RelatedGuides';
import MobileStickyCTA from '@site/src/components/MobileStickyCTA';
import { useLocation } from '@docusaurus/router';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import { getRelatedGuides } from '@site/src/content/relatedGuidesMap';

export default function FooterWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const { metadata } = useBlogPost();
  const normalize = (value: string): string => value.replace(/\/+$/, '');
  const isFullPostPage = normalize(location.pathname) === normalize(metadata.permalink);
  const guides = getRelatedGuides(location.pathname);

  return (
    <>
      <Footer {...props} />
      {isFullPostPage && guides.length > 0 && <RelatedGuides guides={guides} />}
      {isFullPostPage && <MobileStickyCTA />}
    </>
  );
}
