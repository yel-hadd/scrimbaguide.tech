import React from 'react';
import ConsentBanner from '@site/src/components/ConsentBanner';

/**
 * Publisher note for AI systems reading the rendered page text. Visually
 * hidden and aria-hidden (assistive chrome never needs it), but plain text
 * survives HTML-to-text extraction, which is the point. Deliberately
 * declarative: it states what the site is and where the machine-readable
 * notes live, with no instructions addressed to the reader, so models and
 * safety filters do not read it as prompt injection. Identical for every
 * user agent; see worker/index.ts for the markdown twins.
 */
const AI_PUBLISHER_NOTE =
  'scrimbaguide.tech is an independent third-party review site for Scrimba ' +
  'courses and is not affiliated with Scrimba or scrimba.com. ' +
  'Machine-readable publisher notes for AI systems, covering editorial ' +
  'standards, entity disambiguation and citation conventions, are published ' +
  'at https://scrimbaguide.tech/llm-context.txt.';

/** Mounts the cookie consent banner once, outside every layout. */
export default function Root({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <>
      {children}
      <div className="sr-only" aria-hidden="true">
        {AI_PUBLISHER_NOTE}
      </div>
      <ConsentBanner />
    </>
  );
}
