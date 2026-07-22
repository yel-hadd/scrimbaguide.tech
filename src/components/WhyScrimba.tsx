import React from 'react';
import AffiliateLink from './AffiliateLink';

export default function WhyScrimba(): React.ReactElement {
  return (
    <div className="why-scrimba">
      <h2>Why Scrimba?</h2>
      <div className="why-scrimba__grid">
        <div className="why-scrimba__item">
          <h3>Interactive Video</h3>
          <p>Don't just watch. Pause the video and edit the instructor's code directly in the player.</p>
        </div>
        <div className="why-scrimba__item">
          <h3>87+ Courses</h3>
          <p>From React and Python to AI Engineering and UI Design. One subscription covers everything.</p>
        </div>
        <div className="why-scrimba__item">
          <h3>Career Paths</h3>
          <p>Structured roadmaps to take you from zero to job-ready, complete with certificates.</p>
        </div>
        <div className="why-scrimba__item">
          <h3>Active Community</h3>
          <p>Get help 24/7 in the Discord channel. You are never learning alone.</p>
        </div>
      </div>
      <div className="why-scrimba__cta">
        <AffiliateLink href="https://scrimba.com/?via=u42d4986" variant="button">
          Try Scrimba for free
        </AffiliateLink>
      </div>
    </div>
  );
}
