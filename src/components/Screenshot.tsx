import React from 'react';

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
}

/**
 * First-hand screenshot from inside a Scrimba course, with a caption and a
 * source note. Used on course/path/feature pages to show what a lesson
 * actually looks like rather than describing it.
 */
export default function Screenshot({
  src,
  alt,
  width,
  height,
  caption,
  source = 'Screenshot of scrimba.com, taken by scrimbaguide.tech.',
  narrow = false,
}: ScreenshotProps): React.ReactElement {
  return (
    <figure className={narrow ? 'screenshot screenshot--narrow' : 'screenshot'}>
      <a href={src} target="_blank" rel="noopener" title="Open full size">
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      </a>
      {(caption || source) && (
        <figcaption>
          {caption ? <span className="screenshot__caption">{caption}</span> : null}
          {source ? <span className="screenshot__source">{source}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}
