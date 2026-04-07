import React from 'react';
import { useLocation } from '@docusaurus/router';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath } from './schemaUtils';

export interface HowToStep {
  name: string;
  text: string;
  /** Optional estimated time for this step, e.g. "PT2H" (ISO 8601 duration) */
  timeRequired?: string;
  /** Optional URL image for this step */
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  /** Total estimated time, e.g. "PT3M" (ISO 8601 duration) */
  totalTime?: string;
  /** Estimated cost, e.g. "$19" */
  estimatedCost?: string;
}

/**
 * JSON-LD HowTo schema for blog posts with step-by-step structure.
 * Use on process-oriented posts: web dev roadmaps, learning guides, job search guides.
 * Increases eligibility for rich results and AI Overview step extraction.
 */
export default function HowToSchema({
  name,
  description,
  steps,
  totalTime,
  estimatedCost,
}: HowToSchemaProps): React.ReactElement {
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${pageUrl}#howto`,
    name: plainText(name),
    description: plainText(description),
    mainEntityOfPage: pageUrl,
    step: steps.map((step, index) => {
      const stepObj: Record<string, unknown> = {
        '@type': 'HowToStep',
        position: index + 1,
        name: plainText(step.name),
        text: plainText(step.text),
      };
      if (step.timeRequired) stepObj.timeRequired = step.timeRequired;
      if (step.image) stepObj.image = toAbsoluteUrl(step.image);
      return stepObj;
    }),
  };

  if (totalTime) schema.totalTime = totalTime;
  if (estimatedCost) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: estimatedCost,
    };
  }

  return (
    <script
      id={schemaScriptId('howto', canonicalPath, plainText(name))}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
