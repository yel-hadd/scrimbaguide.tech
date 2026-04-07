import React, { useState, useId, Fragment } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { useRef } from 'react';
import { plainText, schemaScriptId, toAbsoluteUrl, toCanonicalPath } from './schemaUtils';

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
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { pathname } = useLocation();
  const canonicalPath = toCanonicalPath(pathname);
  const pageUrl = toAbsoluteUrl(canonicalPath);
  const isBlogListPage =
    canonicalPath === '/blog' ||
    canonicalPath.startsWith('/blog/page') ||
    canonicalPath.startsWith('/blog/tags') ||
    canonicalPath.startsWith('/blog/archive');
  const shouldEmitSchema = emitSchema && !isBlogListPage;

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

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

  const renderAnswerBlocks = (text: string): React.ReactNode => {
    const blocks = text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
    if (blocks.length === 0) return null;
    return (
      <>
        {blocks.map((block, idx) => (
          <p key={`${baseId}-answer-${idx}`}>{renderAnswerText(block)}</p>
        ))}
      </>
    );
  };

  const onQuestionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const total = items.length;
    if (total === 0) return;

    const focusByIndex = (target: number) => {
      const normalized = ((target % total) + total) % total;
      buttonRefs.current[normalized]?.focus();
    };

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusByIndex(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusByIndex(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusByIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusByIndex(total - 1);
    }
  };

  // JSON-LD FAQ Schema with optional citation
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntityOfPage: pageUrl,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: plainText(item.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: plainText(item.a),
      },
    })),
  };

  return (
    <div className="faq-accordion">
      {shouldEmitSchema && (
        <script
          id={schemaScriptId('faq', canonicalPath)}
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
              type="button"
              className="faq-accordion__question"
              onClick={() => toggle(i)}
              onKeyDown={(event) => onQuestionKeyDown(event, i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              ref={(node) => {
                buttonRefs.current[i] = node;
              }}
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
              {renderAnswerBlocks(item.a)}
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
