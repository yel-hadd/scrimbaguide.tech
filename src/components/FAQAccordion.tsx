import React, { useState, useId, Fragment } from 'react';
import Link from '@docusaurus/Link';

export interface FAQItem {
  q: string;
  a: string;
  sourceUrl?: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
  emitSchema?: boolean;
}

export default function FAQAccordion({
  items,
  title,
  emitSchema = true,
}: FAQAccordionProps): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const stripMarkdown = (text: string): string =>
    text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');

  /** Renders FAQ answer text with [label](href) converted to real links (MDX passes plain strings). */
  const renderAnswerText = (text: string): React.ReactNode => {
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = linkRe.exec(text)) !== null) {
      if (m.index > last) {
        parts.push(text.slice(last, m.index));
      }
      const label = m[1];
      const href = m[2];
      const isInternal = href.startsWith('/') || href.startsWith('.');
      parts.push(
        isInternal ? (
          <Link key={key++} to={href}>
            {label}
          </Link>
        ) : (
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ),
      );
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      parts.push(text.slice(last));
    }
    return parts.length > 0 ? <Fragment>{parts}</Fragment> : text;
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
        text: stripMarkdown(item.a),
      },
    })),
  };

  return (
    <div className="faq-accordion">
      {emitSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
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
              <p>{renderAnswerText(item.a)}</p>
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
