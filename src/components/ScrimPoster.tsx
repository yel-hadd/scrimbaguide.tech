import React from 'react';
import AffiliateLink from './AffiliateLink';

interface ScrimPosterProps {
  /** The scrim the poster opens, e.g. `https://scrimba.com/frontend-path-c0j/~06l6`. */
  href: string;
  /** A frame from that scrim, under /static. */
  src: string;
  /** What is visible in the frame, naming the lesson. */
  alt: string;
  width: number;
  height: number;
  /** One line under the poster: what opens when you press play. */
  caption: React.ReactNode;
  /** Small tag on the frame, e.g. "Free sample lesson" or "Pro lesson". */
  badge?: string;
  /** GA `cta_location`, so each poster's clicks can be compared. */
  location: string;
  /** Above-the-fold use (homepage hero): load eagerly with high priority. */
  priority?: boolean;
  /** Extra class on the link, e.g. to size the poster inside a layout. */
  className?: string;
}

/**
 * A frame from a real scrim with a play button, linking to that lesson on
 * scrimba.com. The homepage hero uses it for the demo scrim; money pages use
 * it with a screenshot taken inside the path so "press play" opens the lesson
 * the reader is looking at.
 */
export default function ScrimPoster({
  href,
  src,
  alt,
  width,
  height,
  caption,
  badge,
  location,
  priority = false,
  className = '',
}: ScrimPosterProps): React.ReactElement {
  return (
    <AffiliateLink
      href={href}
      variant="card"
      className={`hero-scrim-poster ${className}`.trim()}
      location={location}
    >
      <span className="hero-scrim-poster__frame">
        <img
          className="hero-scrim-poster__img"
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
        {badge ? (
          <span className={`hero-scrim-poster__badge hero-scrim-poster__badge--${/\bpro\b/i.test(badge) ? 'pro' : 'free'}`}>
            {badge}
          </span>
        ) : null}
        <span className="hero-scrim-poster__play" aria-hidden="true">
          {/* Geometric triangle, nudged right so its visual centre (not its
              bounding box) sits on the circle's centre. */}
          <svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
            <path d="M8.5 5.2v13.6a.8.8 0 0 0 1.2.7l10.4-6.8a.8.8 0 0 0 0-1.4L9.7 4.5a.8.8 0 0 0-1.2.7z" fill="currentColor" />
          </svg>
        </span>
      </span>
      <span className="hero-scrim-poster__caption">{caption}</span>
    </AffiliateLink>
  );
}
