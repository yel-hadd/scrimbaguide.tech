import React from 'react';
import Link from '@docusaurus/Link';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import { getBlogContextualCta } from '@site/src/content/blogContextualCtas';
import AffiliateLink from './AffiliateLink';

/**
 * Contextual next-step CTA injected after every blog post body.
 */
function slugFromBlogMetadata(permalink: string, frontMatterSlug: unknown): string {
  if (typeof frontMatterSlug === 'string' && frontMatterSlug.length > 0) {
    return frontMatterSlug;
  }
  const trimmed = permalink.replace(/\/$/, '');
  const segment = trimmed.split('/').filter(Boolean).pop();
  return segment ?? '';
}

export default function BlogContextualCta(): React.ReactElement {
  const { metadata } = useBlogPost();
  const slug = slugFromBlogMetadata(metadata.permalink, metadata.frontMatter.slug);
  const cta = getBlogContextualCta(slug);
  const isExternal = cta.href.startsWith('http');

  return (
    <aside
      className="blog-contextual-cta margin-vert--xl"
      aria-label="Suggested next step"
    >
      <h2 className="text--lg margin-bottom--sm">{cta.title}</h2>
      <p className="margin-bottom--md">{cta.body}</p>
      {isExternal ? (
        <AffiliateLink href={cta.href} variant="button">
          {cta.linkLabel}
        </AffiliateLink>
      ) : (
        <Link className="cta-link cta-link--button" to={cta.href}>
          {cta.linkLabel}
        </Link>
      )}
    </aside>
  );
}
