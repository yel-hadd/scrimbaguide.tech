import React from 'react';
import { useLocation } from '@docusaurus/router';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath } from './schemaUtils';

/**
 * Converts "9.8 hrs" or "86 min" to an ISO 8601 duration (e.g. PT9H48M).
 * Already-ISO values (e.g. "PT9H46M27S" from the catalog JSON-LD) pass through.
 * Returns '' when the input cannot be expressed as a valid ISO 8601 duration,
 * so callers omit timeRequired rather than emit an invalid value Google rejects.
 */
function toISODuration(duration: string): string {
  if (/^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/.test(duration)) {
    return duration;
  }
  const hrsMatch = duration.match(/^(\d+(?:\.\d+)?)\s*hrs?$/i);
  if (hrsMatch) {
    const h = parseFloat(hrsMatch[1]);
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return mins > 0 ? `PT${hours}H${mins}M` : `PT${hours}H`;
  }
  const minMatch = duration.match(/^(\d+)\s*min$/i);
  if (minMatch) return `PT${minMatch[1]}M`;
  return '';
}

interface ModuleInfo {
  name: string;
  duration: string;
  lessons: number;
}

interface CourseSchemaProps {
  name: string;
  description: string;
  provider?: string;
  url: string;
  duration?: string;
  /** Exact ISO 8601 duration from the catalog (preferred over `duration`). */
  timeRequired?: string;
  difficulty?: string;
  access?: 'Free' | 'Pro';
  keywords?: string[];
  modules?: ModuleInfo[];
  /** Course image for rich results (absolute URL recommended) */
  imageUrl?: string;
}

export default function CourseSchema({
  name,
  description,
  provider = 'Scrimba',
  url,
  duration,
  timeRequired,
  difficulty,
  access,
  keywords,
  modules,
  imageUrl = 'https://scrimbaguide.tech/img/social-card.png',
}: CourseSchemaProps): React.ReactElement {
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  const isFree = access === 'Free';
  // Prefer the exact catalog ISO duration; fall back to parsing the label.
  const isoDuration = toISODuration(timeRequired || duration || '');

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${pageUrl}#course`,
    name: plainText(name),
    description: plainText(description),
    image: toAbsoluteUrl(imageUrl),
    mainEntityOfPage: pageUrl,
    provider: {
      '@type': 'EducationalOrganization',
      name: provider,
      url: 'https://scrimba.com',
      sameAs: ['https://scrimba.com'],
    },
    url: toAbsoluteUrl(url),
    inLanguage: 'en',
    ...(difficulty && {
      educationalLevel: difficulty,
    }),
    ...(isoDuration && {
      timeRequired: isoDuration,
    }),
    ...(keywords && keywords.length > 0 && {
      teaches: keywords,
    }),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      ...(isoDuration && { courseWorkload: isoDuration }),
    },
  };

  if (access) {
    schema.offers = {
      '@type': 'Offer',
      ...(isFree ? { price: '0' } : {}),
      ...(isFree ? { priceCurrency: 'USD' } : {}),
      category: isFree ? 'Free' : 'Paid',
      availability: 'https://schema.org/InStock',
      url: toAbsoluteUrl(url),
    };
  }

  if (modules && modules.length > 0) {
    schema.hasPart = {
      '@type': 'ItemList',
      itemListElement: modules.map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: plainText(m.name),
        description: `${m.lessons} lessons, ${plainText(m.duration)}`,
      })),
    };
  }

  return (
    <script
      id={schemaScriptId('course', canonicalPath, plainText(name))}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
