import React, { useId } from 'react';
import AffiliateLink from './AffiliateLink';

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
}

export default function ComparisonTable({
  competitorName,
  scrimbaLabel = 'Scrimba',
  rows,
  scrimbaUrl = 'https://scrimba.com/?via=u42d4986',
  competitorUrl,
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
          {rows.map((row, i) => (
            <tr key={i}>
              <th scope="row">{row.feature}</th>
              <td className="comparison-table__highlight">{row.scrimba}</td>
              <td>{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="comparison-table__cta-row">
        <AffiliateLink href={scrimbaUrl} variant="button">
          Claim 20% off Pro
        </AffiliateLink>
        {competitorUrl && (
          <a href={competitorUrl} target="_blank" rel="noopener noreferrer" className="comparison-table__secondary-cta">
            Visit {competitorName}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </div>
  );
}
