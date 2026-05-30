import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * ScrimSandbox: a tiny, real, in-browser code editor that mirrors Scrimba's
 * core "scrim" mechanic on the homepage. Edit the HTML/CSS/JS, hit Run, and the
 * sandboxed iframe re-renders. No transpile step, no dependencies.
 *
 * The point is conversion: let a visitor *feel* edit-and-run before they click
 * out to a real lesson, instead of reading about an interactive format passively.
 */

const STARTER_SOURCE = `<h1>Edit me, then hit Run</h1>
<button onclick="this.textContent = 'You ran it \\u{1F389}'">
  Click me
</button>

<style>
  body   { font-family: system-ui, sans-serif; padding: 1.1rem; color: #1b1430; }
  h1     { color: #6f4eff; font-size: 1.4rem; margin: 0 0 0.8rem; }
  button { font: inherit; padding: 0.5rem 0.9rem; border: 0; border-radius: 8px;
           background: #6f4eff; color: #fff; cursor: pointer; }
  button:hover { background: #5b3fd9; }
</style>`;

function trackRun(): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'scrim_sandbox_run', {
    page_location: window.location.href,
  });
}

export default function ScrimSandbox(): React.ReactElement {
  const [source, setSource] = useState<string>(STARTER_SOURCE);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const idBase = useId();
  const editorId = `${idBase}-editor`;

  const render = useCallback((markup: string) => {
    const frame = iframeRef.current;
    if (frame) frame.srcdoc = markup;
  }, []);

  // Render the starter source once on mount so the preview is never empty.
  useEffect(() => {
    render(STARTER_SOURCE);
  }, [render]);

  const run = useCallback(() => {
    render(source);
    setHasRun(true);
    trackRun();
  }, [render, source]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    },
    [run],
  );

  return (
    <div className="scrim-window scrim-window--live">
      <div className="scrim-window__bar">
        <span className="scrim-window__dot" />
        <span className="scrim-window__dot" />
        <span className="scrim-window__dot" />
        <span className="scrim-window__file">index.html</span>
        <span className="scrim-window__status" aria-live="polite">
          {hasRun ? 'ran ✓' : 'editing'}
        </span>
      </div>

      <label className="sr-only" htmlFor={editorId}>
        Editable code. Change it, then press Run or Ctrl plus Enter.
      </label>
      <textarea
        id={editorId}
        className="scrim-window__editor"
        value={source}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        onChange={(e) => setSource(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-describedby={`${idBase}-hint`}
      />

      <div className="scrim-window__toolbar">
        <span id={`${idBase}-hint`} className="scrim-window__hint">
          Edit the code, then run it.
        </span>
        <button type="button" className="scrim-window__run" onClick={run}>
          {'▶'} Run
        </button>
      </div>

      <iframe
        ref={iframeRef}
        className="scrim-window__preview"
        title="Live preview of your code"
        sandbox="allow-scripts"
      />
    </div>
  );
}
