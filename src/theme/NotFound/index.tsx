import React from 'react';
import Head from '@docusaurus/Head';
import NotFound from '@theme-original/NotFound';
import type NotFoundType from '@theme/NotFound';
import type {WrapperProps} from '@docusaurus/types';

type Props = WrapperProps<typeof NotFoundType>;

/**
 * Wraps the stock NotFound page to add a robots meta tag.
 *
 * The 404 shipped with a canonical (an odd one: trailingSlash:true appends a
 * slash after the literal .html) but no robots directive, the only built page
 * with neither. It is never in sitemap.xml, so a crawler only reaches it by
 * following a broken link, and it should not be indexed when that happens.
 *
 * Must be name="robots", not property="robots": crawlers only read the name
 * attribute. See the same note in src/theme/SearchPage/SearchPage.jsx.
 *
 * Wrapped rather than ejected so stock 404 behaviour survives Docusaurus
 * upgrades.
 */
export default function NotFoundWrapper(props: Props): React.ReactElement {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <NotFound {...props} />
    </>
  );
}
