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

  return (
    <>
      <Header {...props} />
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
