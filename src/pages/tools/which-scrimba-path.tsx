import React, { useEffect } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { useHistory } from '@docusaurus/router';

const CANONICAL_PATHS = 'https://scrimbaguide.tech/docs/paths';

/**
 * Legacy URL: consolidate SEO on /docs/paths. Client-side navigation preserves #path-advisor for deep links.
 */
export default function WhichScrimbaPathRedirect(): React.ReactElement {
  const history = useHistory();

  useEffect(() => {
    history.replace('/docs/paths#path-advisor');
  }, [history]);

  return (
    <Layout title="Redirecting…" description="The path advisor lives on the Scrimba learning paths hub.">
      <Head>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={CANONICAL_PATHS} />
        <meta property="og:url" content={CANONICAL_PATHS} />
      </Head>
      <main className="container margin-vert--lg">
        <p>Redirecting you to the learning paths hub…</p>
        <p>
          If nothing happens,{' '}
          <a href="/docs/paths#path-advisor">open the path advisor on the learning paths page</a>.
        </p>
      </main>
    </Layout>
  );
}
