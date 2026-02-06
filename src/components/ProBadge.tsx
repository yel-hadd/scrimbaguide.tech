import React from 'react';

interface ProBadgeProps {
  access: 'Free' | 'Pro';
}

export default function ProBadge({ access }: ProBadgeProps): React.ReactElement {
  return (
    <span className={`pro-badge pro-badge--${access.toLowerCase()}`}>
      {access}
    </span>
  );
}
