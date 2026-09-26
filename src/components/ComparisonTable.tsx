import React, { useId } from 'react';
import AffiliateLink from './AffiliateLink';
import { MONETISED_HOSTS } from '@site/src/constants';

interface ComparisonRow {
  feature: string;
  scrimba: string;
  competitor: string;
}

interface ComparisonTableProps {
  competitorName: string;
  scrimbaLabel?: string;
  rows: ComparisonRow[];
  scrimbaUrl?: string;
  competitorUrl?: string;
  /** Drop the CTA row when the page already has a CTA nearby (e.g. a
   *  VerdictBox right above the table on comparison leaves). */
  hideCta?: boolean;
}

export default function ComparisonTable({
  competitorName,
  scrimbaLabel = 'Scrimba',
  rows,
  scrimbaUrl = 'https://scrimba.com/?via=u42d4986',
  competitorUrl,
  hideCta = false,
}: ComparisonTableProps): React.ReactElement {
  const captionId = useId();
  const helpId = useId();
  return (
    <div
      className="comparison-table-wrapper"
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      aria-describedby={helpId}
    >
      <p id={helpId} className="sr-only">
        This comparison table may scroll horizontally on smaller screens.
      </p>
      <table className="comparison-table">
        <caption id={captionId} className="sr-only">
          {scrimbaLabel} versus {competitorName} feature comparison
        </caption>
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col" className="comparison-table__highlight">{scrimbaLabel}</th>
            <th scope="col">{competitorName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature}>
              <th scope="row">{row.feature}</th>
              <td className="comparison-table__highlight">{row.scrimba}</td>
              <td>{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!hideCta || competitorUrl) && (
        <div className="comparison-table__cta-row">
          {!hideCta && (
            <AffiliateLink href={scrimbaUrl} variant="button" location="comparison-table">
              Claim 20% off Pro
            </AffiliateLink>
          )}
          {competitorUrl && (
            <a
              href={competitorUrl}
              target="_blank"
              // A tracked competitor link is a paid link too (Google requires nofollow).
              rel={MONETISED_HOSTS.some((h) => competitorUrl.includes(h)) ? 'nofollow noopener noreferrer' : 'noopener noreferrer'}
              className="comparison-table__secondary-cta"
            >
              Visit {competitorName}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
