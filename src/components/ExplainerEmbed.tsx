import React from 'react';

interface ExplainerEmbedProps {
  /** Explainer id, the part after `scrimba.com/explain/`, e.g. `guide0ab07v8g9`. */
  id: string;
  /** Accessible name for the iframe: what the explainer teaches. */
  title: string;
  /** One line telling the reader what to notice. */
  caption?: React.ReactNode;
}

/**
 * Embedded Scrimba Explain explainer (narrated slide video) in a responsive
 * 16:9 frame, with a caption and a plain link to the explainer page.
 */
export default function ExplainerEmbed({ id, title, caption }: ExplainerEmbedProps): React.ReactElement {
  const url = `https://scrimba.com/explain/${id}`;
  return (
    <figure className="explainer-embed">
      <div className="explainer-embed__frame">
        <iframe
          src={url}
          title={title}
          loading="lazy"
          allow="fullscreen"
         
          style={{ border: 0 }}
        />
      </div>
      <figcaption>
        {caption ? <span className="explainer-embed__caption">{caption}</span> : null}
        {/*
          Deliberately a plain anchor, not <AffiliateLink>. Explainer pages are
          not course pages: the ?via= parameter fires Scrimba's one-time
          discount modal on whatever page it lands on, which is out of context
          on an explainer. The affiliate CTA lives elsewhere on the page.
        */}
        <a className="explainer-embed__link" href={url} target="_blank" rel="nofollow noopener">
          Open on scrimba.com
        </a>
      </figcaption>
    </figure>
  );
}
