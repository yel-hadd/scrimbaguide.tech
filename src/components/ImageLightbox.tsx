import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AffiliateLink from '@site/src/components/AffiliateLink';
import { DEMO_SCRIM_URL } from '@site/src/constants';

export interface LightboxCta {
  /** Destination. A scrimba.com URL routes through <AffiliateLink>. */
  href: string;
  /** Link text. One short clause, no hype. */
  label: string;
  /** GA `cta_location` label. */
  location?: string;
}

export interface LightboxItem {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** "What to notice" line from the figure's caption. */
  caption?: string;
  source?: string;
}

interface ImageLightboxProps {
  items: LightboxItem[];
  startIndex: number;
  cta?: LightboxCta;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled])';

/* Icons are SVG rather than text glyphs (x, <, >). A glyph is centred by its
   line box, not by its ink, so in a round button it sits visibly off-centre
   and the offset changes with the font. An SVG box centres exactly. */
function CloseIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M6 6 L18 18 M18 6 L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
      <path
        d={direction === 'left' ? 'M15 5 L9 12 L15 19' : 'M9 5 L15 12 L9 19'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full-screen viewer for the screenshots on a page.
 *
 * Before this existed, clicking a screenshot opened the raw `.webp` in a new
 * tab: off-site, no caption, no way back. The viewer keeps the reader on the
 * page, shows the description and caption with the image, steps through every
 * screenshot on the page, and puts one quiet next step underneath the caption
 * rather than a button over the image.
 */
export default function ImageLightbox({
  items,
  startIndex,
  cta,
  onClose,
}: ImageLightboxProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);

  const count = items.length;
  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  /* Mount-only: focus in, lock the page, and put focus back on unmount. This
     must NOT depend on the callbacks, or every re-render (paging to the next
     image) would re-run it, yank focus off the arrow the reader just pressed
     and re-save an already-locked overflow value. */
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  /* Keys are bound on the document rather than the dialog: clicking the
     backdrop moves focus to <body>, and a dialog-scoped handler goes deaf. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight' && count > 1) go(1);
      else if (event.key === 'ArrowLeft' && count > 1) go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, go, count]);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    /* Trap Tab inside the dialog: without this, focus walks into the page
       behind, which a screen reader still announces. */
    const nodes = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    ).filter((node) => node.offsetParent !== null);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const item = items[index];
  if (!item) return null;

  const nextStep: LightboxCta = cta ?? {
    href: DEMO_SCRIM_URL,
    label: 'Open a real Scrimba lesson (2 min, no signup)',
    location: 'lightbox-demo-scrim',
  };
  const isScrimba = nextStep.href.includes('scrimba.com');
  /* The caption is "what to notice"; the alt is the full description. Showing
     both would repeat itself when a figure has no caption of its own. */
  const showAlt = !item.caption || item.alt.trim() !== item.caption.trim();

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      onKeyDown={onKeyDown}
      /* Close on any press that lands outside the figure, so the padding, the
         gaps beside a portrait image and the area under the caption all work. */
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.lightbox__figure') && !target.closest('.lightbox__nav')) onClose();
      }}
      ref={dialogRef}
    >
      <div className="lightbox__bar">
        {count > 1 && (
          <span className="lightbox__counter" aria-live="polite">
            {index + 1} of {count}
          </span>
        )}
        <button ref={closeRef} type="button" className="lightbox__close" onClick={onClose} aria-label="Close image viewer">
          <CloseIcon />
        </button>
      </div>

      {count > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          onClick={() => go(-1)}
          aria-label="Previous image"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      <figure className="lightbox__figure">
        <button
          type="button"
          className="lightbox__imgbutton"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in to full size'}
        >
          <img
            key={item.src}
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            className={`lightbox__img${zoomed ? ' lightbox__img--zoomed' : ''}`}
            decoding="async"
          />
        </button>

        <figcaption className="lightbox__caption">
          {item.caption ? <span className="lightbox__caption-text">{item.caption}</span> : null}
          {showAlt ? <span className="lightbox__desc">{item.alt}</span> : null}
          {item.source ? <span className="lightbox__source">{item.source}</span> : null}
          <span className="lightbox__next">
            {isScrimba ? (
              <AffiliateLink ctaType="lightbox" href={nextStep.href} location={nextStep.location}>
                {nextStep.label}
              </AffiliateLink>
            ) : (
              <a href={nextStep.href}>{nextStep.label}</a>
            )}
          </span>
        </figcaption>
      </figure>

      {count > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          onClick={() => go(1)}
          aria-label="Next image"
        >
          <ChevronIcon direction="right" />
        </button>
      )}
    </div>
  );
}

/** Renders the viewer into <body> once mounted in the browser. */
export function LightboxPortal(props: ImageLightboxProps): React.ReactElement | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<ImageLightbox {...props} />, document.body);
}

/**
 * Builds the gallery from the figures already in the document, in reading
 * order, so prev/next walks the page's screenshots without every <Screenshot>
 * having to register with a provider.
 */
export function collectGallery(current: HTMLElement | null): { items: LightboxItem[]; index: number } {
  const figures = Array.from(document.querySelectorAll<HTMLElement>('figure.screenshot'));
  const items: LightboxItem[] = [];
  let index = 0;
  figures.forEach((figure) => {
    const img = figure.querySelector('img');
    if (!img) return;
    if (figure === current) index = items.length;
    items.push({
      src: img.getAttribute('src') ?? '',
      alt: img.getAttribute('alt') ?? '',
      width: Number(img.getAttribute('width')) || img.naturalWidth,
      height: Number(img.getAttribute('height')) || img.naturalHeight,
      caption: figure.querySelector('.screenshot__caption')?.textContent?.trim() || undefined,
      source: figure.querySelector('.screenshot__source')?.textContent?.trim() || undefined,
    });
  });
  return { items, index };
}
