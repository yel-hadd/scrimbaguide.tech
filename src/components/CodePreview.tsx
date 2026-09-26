import React, { useId, useMemo, useState } from 'react';
import AffiliateLink from './AffiliateLink';

/**
 * Base styles injected into every preview so the boxes in a drill are visible
 * without the drill's own CSS having to care about colours. Layout properties
 * are never set here, so the learner's CSS is the only thing deciding layout.
 * Keep in sync with the renderer that produces static/img/practice/*.webp.
 */
const PREVIEW_BASE_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font: 14px/1.4 system-ui, sans-serif; color: #1c1c28; background: #fff; }
  .card, .panel, .cell, header, nav, main, footer, .sidebar { background: #ece8ff; border: 1px solid #b8a5ff; border-radius: 6px; padding: 12px; min-height: 48px; }
  .grid .card, .cards .card { min-height: 64px; }
  header, footer { background: #4c31c8; color: #fff; border-color: #4c31c8; }
  nav, .sidebar { background: #f4f1ff; }
  main { min-height: 120px; }
  button { font: inherit; padding: 6px 12px; border-radius: 6px; border: 1px solid #4c31c8; background: #4c31c8; color: #fff; }
  .badge { background: #ffd166; border-color: #e0a800; padding: 4px 10px; min-height: 0; }
  .cell { min-height: 80px; }
  h3 { margin: 0 0 6px; font-size: 16px; }
  p { margin: 0 0 12px; }
`;

interface CodePreviewProps {
  /** Markup rendered inside the sandboxed preview. */
  html: string;
  /** Starting CSS shown in the editor; the learner edits this. */
  css: string;
  /** Short label used for the editor and iframe accessible names. */
  title: string;
  /** Preview height in px. */
  height?: number;
  /** Scrimba course to open for the "real editor" line; affiliate param is appended by AffiliateLink. */
  scrimbaUrl?: string;
  /** Course name for the CTA sentence, e.g. "Learn Flexbox". */
  scrimbaLabel?: string;
  /** Access level of that course, shown next to the link so nobody hits an unexpected paywall. */
  scrimbaAccess?: 'Free' | 'Pro';
  /** GA cta_location forwarded to AffiliateLink. */
  location?: string;
}

/**
 * Live, editable CSS drill. Everything runs in a `srcdoc` iframe with an empty
 * `sandbox` attribute, so the learner's text can style the markup but cannot run
 * scripts, submit forms, or touch the parent page. Used on the /docs/practice/
 * layout drills next to the static "expected result" figure.
 */
export default function CodePreview({
  html,
  css,
  title,
  height = 240,
  scrimbaUrl,
  scrimbaLabel = 'the course',
  scrimbaAccess,
  location,
}: CodePreviewProps): React.ReactElement {
  const [value, setValue] = useState(css);
  const id = useId();

  const srcDoc = useMemo(
    () =>
      `<!doctype html><html><head><meta charset="utf-8"><style>${PREVIEW_BASE_CSS}</style><style>${value}</style></head><body>${html}</body></html>`,
    [html, value],
  );

  const dirty = value !== css;

  return (
    <div className="code-preview">
      <div className="code-preview__toolbar">
        <span className="code-preview__title">Try it: {title}</span>
        <button
          type="button"
          className="code-preview__reset"
          onClick={() => setValue(css)}
          disabled={!dirty}
        >
          Reset
        </button>
      </div>
      <div className="code-preview__panes">
        <div className="code-preview__editor">
          <label htmlFor={`${id}-css`} className="code-preview__label">
            CSS (edit me)
          </label>
          <textarea
            id={`${id}-css`}
            className="code-preview__textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            style={{ height }}
          />
        </div>
        <div className="code-preview__result">
          <span className="code-preview__label" aria-hidden="true">
            Result
          </span>
          <iframe
            className="code-preview__frame"
            title={`Live result for ${title}`}
            sandbox=""
            srcDoc={srcDoc}
            style={{ height }}
            loading="lazy"
          />
        </div>
      </div>
      {scrimbaUrl && (
        <p className="code-preview__cta">
          This drill is ours, not Scrimba's, and the box above only renders CSS. To practise the same
          properties in a full editor with the course's own challenges, open{' '}
          <AffiliateLink ctaType="code-preview" href={scrimbaUrl} location={location ?? 'code-preview'}>
            {scrimbaLabel} on Scrimba
          </AffiliateLink>
          {scrimbaAccess === 'Pro' && ' (Pro course; the free tier includes other CSS courses)'}
          {scrimbaAccess === 'Free' && ' (free, no card needed)'}.
        </p>
      )}
    </div>
  );
}
