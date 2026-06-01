import React from 'react';

/**
 * Decorative animated reconstruction of the Scrimba icon: four blocks forming
 * two offset stair-steps, rebuilt from the official logo geometry (viewBox
 * 0 0 35 12). Brand violet with a warm accent block. Purely decorative
 * (aria-hidden); every bit of motion is CSS and stops under
 * prefers-reduced-motion, where it renders as a clean static mark.
 */
export default function ScrimbaBlocksArt({
  className = '',
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      className={`scrimba-blocks ${className}`.trim()}
      viewBox="0 0 35 12"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="scrimba-blocks__b scrimba-blocks__b--1" x="0" y="6" width="11.534" height="5.767" rx="0.7" />
      <rect className="scrimba-blocks__b scrimba-blocks__b--2" x="5.767" y="0.233" width="11.533" height="5.767" rx="0.7" />
      <rect className="scrimba-blocks__b scrimba-blocks__b--3" x="23.067" y="6" width="11.534" height="5.767" rx="0.7" />
      <rect className="scrimba-blocks__b scrimba-blocks__b--4" x="28.834" y="0.233" width="5.767" height="5.767" rx="0.7" />
    </svg>
  );
}
