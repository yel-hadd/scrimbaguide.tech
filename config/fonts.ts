import type { HtmlTagObject } from '@docusaurus/types';

/**
 * Origin warm-up and webfont `headTags`, in emission order.
 *
 * The scrimba.com preconnect leads the list because it is the destination of
 * every affiliate CTA, so the TLS handshake is already done by the time a
 * visitor clicks. The font tags follow.
 */
export const fontHeadTags: HtmlTagObject[] = [
  {
    tagName: 'link',
    attributes: { rel: 'preconnect', href: 'https://scrimba.com' },
  },
  // Fonts: preconnect + non-blocking stylesheet beats the render-blocking
  // @import that used to live at the top of custom.css.
  {
    tagName: 'link',
    attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  },
  {
    tagName: 'link',
    attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
  },
  {
    tagName: 'link',
    attributes: {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap',
    },
  },
];
