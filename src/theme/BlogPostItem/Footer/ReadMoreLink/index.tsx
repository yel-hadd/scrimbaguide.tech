import React, {type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/BlogPostItem/Footer/ReadMoreLink';

function ReadMoreLabel() {
  return (
    <b>
      <Translate
        id="theme.blog.post.readMore"
        description="The label used in blog post item excerpts to link to full blog posts">
        Read more
      </Translate>
    </b>
  );
}

/**
 * Swizzled wrapper of the stock ReadMoreLink.
 *
 * Every excerpt on /blog/ used the same anchor text, "Read more", with no
 * post title in it (SEO-07: Lighthouse's link-text audit reads the anchor's
 * own text content, not aria-label, so a repeated generic link text still
 * fails it even though the stock aria-label already names the post).
 *
 * This keeps the visible "Read more" label, the stock href, and the stock
 * aria-label ("Read more about {title}") untouched, and appends a visually
 * hidden span inside the same <a> naming the post. That gives the anchor's
 * text content a unique name per post while the accessible name (still the
 * aria-label) already contained "Read more" (label-in-name, WCAG 2.5.3).
 * The .sr-only span is stripped by the llms.txt parser
 * (scripts/generate-llms-from-sitemap.mjs:398), so it adds no noise there.
 */
export default function BlogPostItemFooterReadMoreLink(
  props: Props,
): ReactNode {
  const {blogPostTitle, ...linkProps} = props;
  return (
    <Link
      aria-label={translate(
        {
          message: 'Read more about {title}',
          id: 'theme.blog.post.readMoreLabel',
          description:
            'The ARIA label for the link to full blog posts from excerpts',
        },
        {title: blogPostTitle},
      )}
      {...linkProps}>
      <ReadMoreLabel />
      <span className="sr-only"> about {blogPostTitle}</span>
    </Link>
  );
}
