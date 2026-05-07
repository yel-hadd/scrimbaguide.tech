import React from 'react';
import { totalCoursesLabel } from '@site/src/utils/scrimbaFacts';

export default function WhyScrimba(): React.ReactElement {
  return (
    <div className="why-scrimba">
      <h2>Why people pick Scrimba over passive video</h2>
      <div className="why-scrimba__grid">
        <div className="why-scrimba__item">
          <h3>Code in the lesson</h3>
          <p>Pause any video and edit the instructor's code in the same window. No tab-switching to a separate editor.</p>
        </div>
        <div className="why-scrimba__item">
          <h3>{totalCoursesLabel} courses, one subscription</h3>
          <p>React, Python, AI engineering, backend, design — covered without per-course payments.</p>
        </div>
        <div className="why-scrimba__item">
          <h3>Career paths, not playlists</h3>
          <p>Four ordered tracks (Frontend, Fullstack, Backend, AI Engineer) with hiring modules at the end.</p>
        </div>
        <div className="why-scrimba__item">
          <h3>Discord backup</h3>
          <p>A live community channel for when you're stuck on a project at 11 pm.</p>
        </div>
      </div>
    </div>
  );
}
