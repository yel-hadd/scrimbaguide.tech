import React from 'react';

/** What was reviewed. The wording differs because the subject differs. */
export type ProvenanceSubject =
  | 'course'
  | 'courses'
  | 'path'
  | 'platform'
  | 'help-centre'
  | 'pricing';

interface ProvenanceProps {
  /** Defaults to a single course, which is what most pages review. */
  subject?: ProvenanceSubject;
  /**
   * The review date, as `YYYY-MM` or `YYYY-MM-DD`. Pass `frontMatter.reviewed`
   * so the date lives in one place per page and only a real re-review moves it.
   *
   * Deliberately NOT derived from `last_update`: that field is bumped for
   * link-only and metadata edits, so deriving from it would silently claim a
   * review that never happened. Four blog posts already carry a `last_update`
   * months newer than their true review date.
   */
  date: string;
  /**
   * Per-page specifics, appended after a colon. This is the traceable part and
   * it is why this component does not flatten every page to one sentence:
   * "all nine modules expanded, 162 scrims".
   */
  detail?: string;
}

const LEAD: Record<ProvenanceSubject, string> = {
  course: 'Reviewed inside the course with a Pro account',
  courses: 'Reviewed inside the courses with a Pro account',
  path: 'Reviewed inside the path with a Pro account',
  platform: 'Reviewed inside Scrimba with a Pro account',
  'help-centre': "Checked against Scrimba's official help centre",
  pricing: "Checked against Scrimba's official pricing page",
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** `2026-09` or `2026-09-23` to `September 2026`. Returns '' for anything else. */
function formatReviewDate(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value.trim());
  if (!match) return '';
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : '';
}

/**
 * The one-line provenance stamp every page carries, per the house rule that
 * provenance is stated once per page.
 *
 * Before this component the line was hand-written in 44 different phrasings
 * across 94 pages, each with the month and year typed into the prose, where it
 * goes stale silently.
 */
export default function Provenance({
  subject = 'course',
  date,
  detail,
}: ProvenanceProps): React.ReactElement | null {
  const when = formatReviewDate(date);
  if (!when) return null;
  const trimmed = detail?.trim().replace(/\.$/, '');
  const tail = trimmed ? `: ${trimmed}.` : '.';
  return (
    <p className="provenance">
      <em>
        {LEAD[subject]}, {when}
        {tail}
      </em>
    </p>
  );
}
