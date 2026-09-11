import React from 'react';
import { useLocation } from '@docusaurus/router';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath } from './schemaUtils';

interface VideoSchemaProps {
  name: string;
  description: string;
  /** Poster image path or absolute URL */
  thumbnailUrl: string;
  /** Video file path or absolute URL */
  contentUrl: string;
  /** ISO 8601 date-time the video was recorded, with timezone */
  uploadDate: string;
  /** ISO 8601 duration, e.g. "PT41S" */
  duration?: string;
}

/**
 * JSON-LD VideoObject schema for a self-hosted video embedded in a post.
 * Makes the recording eligible for video rich results and gives AI search a
 * machine-readable description of what the clip shows.
 */
export default function VideoSchema({
  name,
  description,
  thumbnailUrl,
  contentUrl,
  uploadDate,
  duration,
}: VideoSchemaProps): React.ReactElement {
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  const scriptId = schemaScriptId('video', canonicalPath, plainText(name));
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${pageUrl}#${scriptId}`,
    name: plainText(name),
    description: plainText(description),
    thumbnailUrl: [toAbsoluteUrl(thumbnailUrl)],
    contentUrl: toAbsoluteUrl(contentUrl),
    uploadDate,
    mainEntityOfPage: pageUrl,
  };

  if (duration) schema.duration = duration;

  return (
    <script
      id={scriptId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
