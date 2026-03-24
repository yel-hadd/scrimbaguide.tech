import React from 'react';
import Metadata from '@theme-original/DocItem/Metadata';
import type MetadataType from '@theme/DocItem/Metadata';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {toSeoTitle} from '@site/src/utils/seoTitle';

type Props = WrapperProps<typeof MetadataType>;

export default function DocMetadataWrapper(props: Props): React.ReactElement {
  const {metadata} = useDoc();
  const seoTitle = toSeoTitle(metadata.title);

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta property="og:title" content={seoTitle} />
        <meta name="twitter:title" content={seoTitle} />
      </Head>
      <Metadata {...props} />
    </>
  );
}
