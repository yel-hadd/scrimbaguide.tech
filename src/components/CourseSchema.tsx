import React from 'react';

/** Converts "9.8 hrs" or "86 min" to ISO 8601 duration (e.g. PT9H48M). */
function toISODuration(duration: string): string {
  const hrsMatch = duration.match(/^(\d+(?:\.\d+)?)\s*hrs?$/i);
  if (hrsMatch) {
    const h = parseFloat(hrsMatch[1]);
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return mins > 0 ? `PT${hours}H${mins}M` : `PT${hours}H`;
  }
  const minMatch = duration.match(/^(\d+)\s*min$/i);
  if (minMatch) return `PT${minMatch[1]}M`;
  return duration;
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
  difficulty,
  access,
  keywords,
  modules,
  imageUrl = 'https://scrimbaguide.tech/img/social-card.png',
}: CourseSchemaProps): React.ReactElement {
  const isFree = access === 'Free';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    image: imageUrl,
    provider: {
      '@type': 'EducationalOrganization',
      name: provider,
      url: 'https://scrimba.com',
      sameAs: ['https://scrimba.com'],
    },
    url,
    inLanguage: 'en',
    ...(difficulty && {
      educationalLevel: difficulty,
    }),
    ...(duration && {
      timeRequired: toISODuration(duration),
    }),
    ...(keywords && keywords.length > 0 && {
      teaches: keywords,
    }),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: duration ? toISODuration(duration) : 'PT2H',
    },
  };

  if (access) {
    schema.offers = {
      '@type': 'Offer',
      ...(isFree ? { price: '0' } : {}),
      ...(isFree ? { priceCurrency: 'USD' } : {}),
      category: isFree ? 'Free' : 'Paid',
      availability: 'https://schema.org/InStock',
      url,
    };
  }

  if (modules && modules.length > 0) {
    schema.hasPart = {
      '@type': 'ItemList',
      itemListElement: modules.map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: m.name,
        description: `${m.lessons} lessons, ${m.duration}`,
      })),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
