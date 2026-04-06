import React from 'react';
import Header from '@theme-original/BlogPostItem/Header';
import type HeaderType from '@theme/BlogPostItem/Header';
import type {WrapperProps} from '@docusaurus/types';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

type Props = WrapperProps<typeof HeaderType>;

export default function HeaderWrapper(props: Props): React.JSX.Element {
  const {metadata, frontMatter} = useBlogPost();
  const fm = frontMatter as Record<string, unknown>;
  const image = fm.image as string | undefined;
  const imageAlt =
    (fm.image_alt as string | undefined) ??
    `Featured image for: ${metadata.title}`;
  const metadataWithUpdate = metadata as typeof metadata & {
    lastUpdatedAt?: number | string;
    lastUpdated?: string;
  };
  const normalizedLastUpdatedAt =
    typeof metadataWithUpdate.lastUpdatedAt === 'number'
      ? new Date(metadataWithUpdate.lastUpdatedAt).toISOString()
      : metadataWithUpdate.lastUpdatedAt;
  const modifiedIso =
    normalizedLastUpdatedAt ?? metadataWithUpdate.lastUpdated ?? metadata.date;
  const modifiedDate = new Date(modifiedIso);
  const hasValidModifiedDate = !Number.isNaN(modifiedDate.getTime());
  const formattedModifiedDate = hasValidModifiedDate
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(modifiedDate)
    : null;

  return (
    <>
      <Header {...props} />
      {formattedModifiedDate && (
        <p className="blog-last-updated">
          Last updated:{' '}
          <time dateTime={modifiedDate.toISOString()}>{formattedModifiedDate}</time>
        </p>
      )}
      {image && (
        <figure className="blog-featured-image">
          <img
            src={image}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
          />
        </figure>
      )}
    </>
  );
}
