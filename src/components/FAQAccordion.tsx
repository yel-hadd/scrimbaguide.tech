import React, { useState, useId } from 'react';

export interface FAQItem {
  q: string;
  a: string;
  sourceUrl?: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
}

export default function FAQAccordion({
  items,
  title,
}: FAQAccordionProps): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // JSON-LD FAQ Schema with optional citation
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
        ...(item.sourceUrl && { citation: item.sourceUrl }),
      },
    })),
  };

  return (
    <div className="faq-accordion">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {title && <h2 className="faq-accordion__title">{title}</h2>}
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const buttonId = `${baseId}-btn-${i}`;
        const panelId = `${baseId}-panel-${i}`;

        return (
          <div
            key={i}
            className={`faq-accordion__item ${isOpen ? 'faq-accordion__item--open' : ''}`}
          >
            <button
              id={buttonId}
              className="faq-accordion__question"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span>{item.q}</span>
              <span className="faq-accordion__icon" aria-hidden="true">
                {isOpen ? '\u2212' : '+'}
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="faq-accordion__answer"
              hidden={!isOpen}
            >
              <p>{item.a}</p>
              {item.sourceUrl && (
                <p className="faq-accordion__source">
                  Source:{' '}
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Scrimba Help Centre
                  </a>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
