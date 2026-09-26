import React from 'react';
import ConsentBanner from '@site/src/components/ConsentBanner';

/** Mounts the cookie consent banner once, outside every layout. */
export default function Root({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <>
      {children}
      <ConsentBanner />
    </>
  );
}
