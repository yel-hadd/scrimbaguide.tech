import React, { useCallback, useRef, useState } from 'react';
import {
  LightboxPortal,
  collectGallery,
  type LightboxCta,
  type LightboxItem,
} from '@site/src/components/ImageLightbox';

interface ScreenshotProps {
  /** Path under /static, e.g. `/img/scrimba/learn-javascript/blackjack.webp`. */
  src: string;
  /** Descriptive alt text: what is visible, named product + lesson, no keyword lists. */
  alt: string;
  /** Intrinsic size, so the browser reserves space and avoids layout shift. */
  width: number;
  height: number;
  /** One line telling the reader what to notice. */
  caption?: React.ReactNode;
  /** Source note appended in smaller text. Defaults to a scrimba.com attribution. */
  source?: string;
  /** Portrait or small crops: cap the width instead of stretching to the column. */
  narrow?: boolean;
  /** Overrides the viewer's default demo-scrim next step. */
  cta?: LightboxCta;
}

/**
 * First-hand screenshot from inside a Scrimba course, with a caption and a
 * source note. Used on course/path/feature pages to show what a lesson
 * actually looks like rather than describing it.
 *
 * Clicking opens an in-page viewer that steps through every screenshot on the
 * page. The anchor is kept as the fallback so the image is still reachable
 * without JavaScript, and so ctrl/cmd/middle click still opens the file in a
 * new tab the way a link should.
 */
export default function Screenshot({
  src,
  alt,
  width,
  height,
  caption,
  source = 'Screenshot of scrimba.com, taken by scrimbaguide.tech.',
  narrow = false,
  cta,
}: ScreenshotProps): React.ReactElement {
  const figureRef = useRef<HTMLElement>(null);
  const [gallery, setGallery] = useState<{ items: LightboxItem[]; index: number } | null>(null);
  /* Stable, so the viewer's mount effect is not torn down on every render. */
  const closeGallery = useCallback(() => setGallery(null), []);

  return (
    <figure ref={figureRef} className={narrow ? 'screenshot screenshot--narrow' : 'screenshot'}>
      <a
        href={src}
        target="_blank"
        rel="noopener"
        title="Open image viewer"
        className="screenshot__link"
        onClick={(event) => {
          /* Let the browser handle intent-to-open-elsewhere unchanged. */
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          setGallery(collectGallery(figureRef.current));
        }}
      >
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      </a>
      {(caption || source) && (
        <figcaption>
          {caption ? <span className="screenshot__caption">{caption}</span> : null}
          {source ? <span className="screenshot__source">{source}</span> : null}
        </figcaption>
      )}
      {gallery && (
        <LightboxPortal
          items={gallery.items}
          startIndex={gallery.index}
          cta={cta}
          onClose={closeGallery}
        />
      )}
    </figure>
  );
}
