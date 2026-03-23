/**
 * Path advisor: scoring + copy for Scrimba career path recommendations.
 * Pure functions — safe to test and reuse from PathAdvisor.
 */

export type Experience = 'beginner' | 'some' | 'junior' | 'senior';
export type Goal = 'job' | 'backend' | 'ai' | 'explore';
export type Hours = 'low' | 'mid' | 'high';
/** Fourth question: learner context (no PII). */
export type Situation = 'career-switch' | 'student' | 'employed-learning' | 'exploring';

export type PathKey = 'frontend' | 'fullstack' | 'backend' | 'ai';

const PATH_HOURS: Record<PathKey, number> = {
  frontend: 81.6,
  fullstack: 108.4,
  backend: 30.1,
  ai: 11.4,
};

const HOURS_PER_WEEK: Record<Hours, number> = {
  low: 4,
  mid: 10,
  high: 18,
};

export const PATHS: Record<
  PathKey,
  {
    title: string;
    doc: string;
    blurb: string;
    affiliateNote: string;
  }
> = {
  frontend: {
    title: 'Frontend Developer Career Path',
    doc: '/docs/paths/frontend-developer-path',
    blurb:
      'Best if you are starting from zero or want a hireable React portfolio with MDN-backed curriculum.',
    affiliateNote: 'Start free, then upgrade through our partner link when you are ready for Pro.',
  },
  fullstack: {
    title: 'Fullstack Developer Career Path',
    doc: '/docs/paths/fullstack-developer-path',
    blurb:
      'Best when you want frontend through Next.js plus backend, databases, TypeScript, and AI engineering in one track.',
    affiliateNote: 'Heavy time investment—annual billing usually wins if you will stick with it 3+ months.',
  },
  backend: {
    title: 'Backend Developer Career Path',
    doc: '/docs/paths/backend-developer-path',
    blurb:
      'Best if you are comfortable with JavaScript and want Node, SQL, security, and DevOps depth without redoing all of React.',
    affiliateNote: 'Pair with the Backend course hub for electives after the path intro.',
  },
  ai: {
    title: 'AI Engineer Career Path',
    doc: '/docs/paths/ai-engineer-path',
    blurb:
      'Best for developers who already ship code and want agents, RAG, MCP, and AI app patterns—not a first programming course.',
    affiliateNote: 'If you are brand new to code, finish Frontend fundamentals first so you can move faster here.',
  },
};

export interface AdvisorInput {
  experience: Experience;
  goal: Goal;
  hours: Hours;
  situation: Situation;
}

export interface PathRecommendation {
  primary: PathKey;
  secondary?: PathKey;
  /** Weeks to complete primary path at stated pace (rounded). */
  weeksEstimate: { min: number; max: number };
  /** Short bullets explaining the pick. */
  reasoning: string[];
  /** Actionable first steps this week. */
  firstWeekSteps: string[];
  /** Prefer Pro pricing CTA vs free try. */
  ctaEmphasis: 'pro' | 'free';
}

function paceWeeks(path: PathKey, hours: Hours): { min: number; max: number } {
  const h = PATH_HOURS[path];
  const w = HOURS_PER_WEEK[hours];
  const weeks = h / w;
  const min = Math.max(1, Math.round(weeks * 0.85));
  const max = Math.max(min + 1, Math.round(weeks * 1.2));
  return { min, max };
}

function buildReasoning(
  input: AdvisorInput,
  primary: PathKey,
  secondary: PathKey | undefined,
): string[] {
  const { experience, goal, hours, situation } = input;
  const lines: string[] = [];

  if (goal === 'ai' && (experience === 'beginner' || experience === 'some')) {
    lines.push(
      'AI Engineer assumes you can ship web apps; beginners get a faster route by building that base on Frontend first.',
    );
  } else if (goal === 'backend' && experience === 'beginner') {
    lines.push(
      'Backend path expects JavaScript comfort; Fullstack or Frontend gets you there without skipping fundamentals.',
    );
  } else if (goal === 'job' && hours === 'low' && primary === 'fullstack') {
    lines.push(
      'Fullstack is the longest path; at under ~5 hours/week it is still doable but will take many months—consistency matters more than speed.',
    );
  } else if (goal === 'job' && hours === 'high' && primary === 'fullstack') {
    lines.push(
      'With solid weekly hours, Fullstack is a strong hireability play: broader projects and stack exposure.',
    );
  } else if (goal === 'explore') {
    lines.push('Exploring is lowest risk on Frontend: clear milestones, free modules to try, then decide on Pro.');
  }

  if (situation === 'employed-learning' && hours === 'low') {
    lines.push('Fitting study around a job usually favors one focused path and smaller weekly wins—not context-switching across four tracks.');
  }
  if (situation === 'student' && primary === 'fullstack') {
    lines.push('Students often use a semester or summer block; Fullstack maps well to a concentrated push if you can protect study time.');
  }

  if (lines.length === 0) {
    lines.push(`We weighted your goal (${goal}), experience level, weekly hours, and context to match Scrimba’s path design.`);
  }

  if (secondary) {
    lines.push(`Also keep ${PATHS[secondary].title} on your radar as a next or parallel focus.`);
  }

  return lines;
}

function firstWeekSteps(primary: PathKey, goal: Goal): string[] {
  const steps: string[] = [
    'Open the path guide and skim the module order so you know the sequence before starting.',
    'Try two free Scrimba modules in that stack to confirm the scrim format works for you.',
    'Block 2–3 calendar slots this week before upgrading—habit beats motivation.',
  ];
  if (goal === 'job') {
    steps.push('Pick one portfolio-sized project from the path to treat as your north star.');
  }
  return steps;
}

/**
 * Map answers to paths. Weekly hours change timeline estimates and some primary choices (e.g. low hours + junior job seeker → Frontend first).
 */
export function computePathRecommendation(input: AdvisorInput): PathRecommendation {
  const { experience, goal, hours, situation } = input;

  let primary: PathKey;
  let secondary: PathKey | undefined;

  // --- Decision rules (aligned with Scrimba path prerequisites) ---

  if (goal === 'ai' && (experience === 'beginner' || experience === 'some')) {
    primary = 'frontend';
    secondary = 'ai';
  } else if (goal === 'backend' && experience === 'beginner') {
    primary = 'fullstack';
    secondary = 'frontend';
  } else if (goal === 'backend' && experience === 'senior') {
    primary = 'backend';
    secondary = undefined;
  } else if (goal === 'backend' && (experience === 'junior' || experience === 'some')) {
    primary = 'fullstack';
    secondary = 'backend';
  } else if (goal === 'job' && experience === 'beginner') {
    primary = 'frontend';
  } else if (goal === 'job' && experience === 'some') {
    primary = 'fullstack';
    secondary = 'frontend';
  } else if (goal === 'job' && (experience === 'junior' || experience === 'senior')) {
    if (experience === 'junior' && hours === 'low') {
      primary = 'frontend';
      secondary = 'fullstack';
    } else {
      primary = 'fullstack';
    }
  } else if (goal === 'explore') {
    primary = 'frontend';
    secondary = undefined;
  } else if (goal === 'ai' && experience !== 'beginner' && experience !== 'some') {
    primary = 'ai';
  } else {
    primary = 'frontend';
    secondary = undefined;
  }

  // Clamp secondary !== primary
  if (secondary === primary) secondary = undefined;

  const weeksEstimate = paceWeeks(primary, hours);
  const reasoning = buildReasoning(input, primary, secondary);
  const firstWeek = firstWeekSteps(primary, goal);

  const ctaEmphasis: 'pro' | 'free' =
    situation === 'exploring' || (goal === 'explore' && experience === 'beginner') ? 'free' : 'pro';

  return {
    primary,
    secondary,
    weeksEstimate,
    reasoning,
    firstWeekSteps: firstWeek,
    ctaEmphasis,
  };
}

export const EXPERIENCE_OPTIONS: readonly { value: Experience; label: string }[] = [
  { value: 'beginner', label: 'Complete beginner — little or no code' },
  { value: 'some', label: 'Some HTML/CSS/JS, still shaky' },
  { value: 'junior', label: 'Junior developer shipping small features' },
  { value: 'senior', label: 'Experienced dev adding a new stack' },
] as const;

export const GOAL_OPTIONS: readonly { value: Goal; label: string }[] = [
  { value: 'job', label: 'Get hired as a developer' },
  { value: 'backend', label: 'Build backend skills — APIs, databases, Node' },
  { value: 'ai', label: 'Build AI-powered apps and agents' },
  { value: 'explore', label: 'Explore coding before I commit' },
] as const;

export const HOURS_OPTIONS: readonly { value: Hours; label: string }[] = [
  { value: 'low', label: 'Under 5 hours / week' },
  { value: 'mid', label: '5–15 hours / week' },
  { value: 'high', label: '15+ hours / week' },
] as const;

export const SITUATION_OPTIONS: readonly { value: Situation; label: string }[] = [
  { value: 'career-switch', label: "Career switch — I'm aiming for a developer job" },
  { value: 'student', label: 'Student — fitting this around classes' },
  { value: 'employed-learning', label: 'Working full-time — studying on the side' },
  { value: 'exploring', label: 'Just exploring — not sure yet' },
] as const;
