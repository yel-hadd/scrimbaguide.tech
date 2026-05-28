import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';
import RelatedGuides from '@site/src/components/RelatedGuides';
import { useLocation } from '@docusaurus/router';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import { getRelatedGuides } from '@site/src/content/relatedGuidesMap';

export default function FooterWrapper(props: any): React.ReactElement {
  const location = useLocation();
  const { metadata } = useBlogPost();
  const normalize = (value: string): string => value.replace(/\/+$/, '');
  const isFullPostPage = normalize(location.pathname) === normalize(metadata.permalink);
  const guides = getRelatedGuides(location.pathname);

  // Blog posts already get one contextual CTA from BlogPostPage (BlogContextualCta).
  // We intentionally do NOT add a second footer PricingCTA here, so each post shows
  // a single conversion CTA rather than two stacked at the bottom.
  return (
    <>
      <Footer {...props} />
      {isFullPostPage && guides.length > 0 && <RelatedGuides guides={guides} />}
    </>
  );
}
