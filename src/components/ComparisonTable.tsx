import React from 'react';
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
  return (
    <div className="comparison-table-wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th className="comparison-table__highlight">{scrimbaLabel}</th>
            <th>{competitorName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td><strong>{row.feature}</strong></td>
              <td className="comparison-table__highlight">{row.scrimba}</td>
              <td>{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="comparison-table__cta-row">
        <AffiliateLink href={scrimbaUrl} variant="button">
          Try Scrimba Pro
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
