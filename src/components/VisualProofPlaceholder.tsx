import React from 'react';

interface VisualProofPlaceholderProps {
  type: 'video' | 'gif' | 'image';
  alt: string;
  caption?: string;
  height?: number; // approximate height in pixels
}

export default function VisualProofPlaceholder({
  type,
  alt,
  caption,
  height = 300,
}: VisualProofPlaceholderProps): React.ReactElement {
  return (
    <div className="visual-proof-placeholder">
      <div 
        className="visual-proof-placeholder__box" 
        style={{ height: `${height}px` }}
      >
        <div className="visual-proof-placeholder__content">
          <span className="visual-proof-placeholder__icon">
            {type === 'video' ? '▶️' : type === 'gif' ? '🎞️' : '🖼️'}
          </span>
          <p className="visual-proof-placeholder__text">
            <strong>Visual Proof:</strong> {alt}
          </p>
          <p className="visual-proof-placeholder__subtext">
            (Illustration coming soon)
          </p>
        </div>
      </div>
      {caption && <p className="visual-proof-placeholder__caption">{caption}</p>}
    </div>
  );
}
