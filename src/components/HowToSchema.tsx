import React from 'react';

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
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => {
      const stepObj: Record<string, unknown> = {
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
      };
      if (step.timeRequired) stepObj.timeRequired = step.timeRequired;
      if (step.image) stepObj.image = step.image;
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
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
