import React, { useCallback, useId, useRef, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

/**
 * ScrimSandbox: a tiny, real, in-browser code editor that mirrors Scrimba's
 * core "scrim" mechanic on the homepage. Edit the HTML/CSS/JS, hit Run, and the
 * sandboxed iframe renders it. No transpile step, no auto-run: nothing executes
 * until the visitor clicks Run, exactly like pausing a scrim and running an edit.
 *
 * Syntax highlighting uses prism-react-renderer (already a Docusaurus dep) as a
 * highlighted <pre> layer behind a transparent <textarea>.
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
  const preRef = useRef<HTMLPreElement>(null);
  const idBase = useId();
  const editorId = `${idBase}-editor`;

  const run = useCallback(() => {
    const frame = iframeRef.current;
    if (frame) frame.srcdoc = source;
    setHasRun(true);
    trackRun();
  }, [source]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    },
    [run],
  );

  // Keep the highlight layer scroll-aligned with the textarea.
  const syncScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const pre = preRef.current;
    if (pre) {
      pre.scrollTop = e.currentTarget.scrollTop;
      pre.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

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
      <div className="scrim-window__editarea">
        <Highlight theme={themes.vsDark} code={source} language="markup">
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="scrim-window__highlight" aria-hidden="true" ref={preRef}>
              {tokens.map((line, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
        <textarea
          id={editorId}
          className="scrim-window__editor"
          value={source}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          aria-describedby={`${idBase}-hint`}
        />
      </div>

      <div className="scrim-window__toolbar">
        <span id={`${idBase}-hint`} className="scrim-window__hint">
          Edit the code, then run it.
        </span>
        <button type="button" className="scrim-window__run" onClick={run}>
          {'▶'} Run
        </button>
      </div>

      <div className="scrim-window__preview-wrap">
        <iframe
          ref={iframeRef}
          className="scrim-window__preview"
          title="Live preview of your code"
          sandbox="allow-scripts"
        />
        {!hasRun && (
          <div className="scrim-window__placeholder" aria-hidden="true">
            Hit Run to see the result here.
          </div>
        )}
      </div>
    </div>
  );
}
