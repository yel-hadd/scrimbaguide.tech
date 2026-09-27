/**
 * Known-issues ratchet shared by scripts/visual/matrix.mjs and
 * scripts/visual/interactions.mjs.
 *
 * A finding is a hard-check failure with a stable id (no page, viewport or
 * theme in it, so one defect is one entry). scripts/visual/known-issues.json
 * lists the findings we already know about. A run fails when:
 *   - a finding is not listed (a new regression), or
 *   - a listed entry for this harness no longer reproduces ("stale
 *     allowlist"): the fix landed, so the entry must come out in the same PR.
 * Stale entries are only judged on a full run; a --pages / --only subset
 * cannot prove an entry is gone.
 */
import fs from 'node:fs';

/**
 * Docusaurus CSS-module classes carry a build hash suffix (`tag_zVej`,
 * `searchQueryInput_Nydd`, `details_b_Ee`). Strip it so ids survive unrelated
 * CSS edits.
 *
 * The suffix is `_` plus four base64url characters, so the hash itself can
 * hold `_` or `-` (`codeLine_lJS_`, `breadcrumbsContainer_Z_bl`). A hash that
 * starts with `_` gives `local__abc`, which looks like a BEM element
 * (`lightbox__bar`), so that shape is stripped only when the local part is a
 * plain camelCase CSS-module name and the three characters are not all
 * lowercase letters (`sidebarItem__DBe` yes, `lightbox__nav` no). About 7% of
 * such hashes are all lowercase and keep their suffix: an id that changes
 * after an unrelated CSS edit is one of those.
 */
export function normalizeClass(cls) {
  const m = /^(.*[A-Za-z0-9])_([A-Za-z0-9_-]{4})$/.exec(cls);
  if (!m) return cls;
  const [, local, hash] = m;
  if (local.includes('_')) return cls;
  if (hash[0] !== '_') return local;
  if (/^[a-z][A-Za-z0-9]*$/.test(local) && !/^_[a-z]{3}$/.test(hash)) return local;
  return cls;
}

/** Normalize every class token inside a CSS selector string. */
export function normalizeSelector(selector) {
  return selector.replace(/\.([A-Za-z_][\w-]*)/g, (_, c) => '.' + normalizeClass(c));
}

const ISSUE_RE = /^(?:[A-Z0-9]+-\d+|untriaged)$/;

/**
 * Entry fields: id, harness ("matrix" | "interactions"), issue (an ISSUES id
 * or "untriaged", with a reason that says what to check), reason, and
 * optional volatile: true for a finding that depends on content order (which
 * posts sit on /blog/ page 1), not on CSS. A volatile entry still allowlists
 * the finding but is never reported stale.
 */
export function loadKnownIssues(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entries = Array.isArray(raw) ? raw : raw.entries;
  if (!Array.isArray(entries)) throw new Error(`${file}: expected an "entries" array`);
  const seen = new Set();
  for (const e of entries) {
    if (!e || typeof e.id !== 'string' || !e.id) throw new Error(`${file}: every entry needs an "id"`);
    if (e.harness !== 'matrix' && e.harness !== 'interactions') {
      throw new Error(`${file}: entry ${e.id} needs "harness": "matrix" or "interactions"`);
    }
    if (typeof e.reason !== 'string' || !e.reason.trim()) {
      throw new Error(`${file}: entry ${e.id} needs a "reason"`);
    }
    if (typeof e.issue !== 'string' || !ISSUE_RE.test(e.issue)) {
      throw new Error(`${file}: entry ${e.id} needs "issue": an ISSUES id (A11Y-04) or "untriaged"`);
    }
    if (e.volatile !== undefined && typeof e.volatile !== 'boolean') {
      throw new Error(`${file}: entry ${e.id}: "volatile" must be true or false`);
    }
    const key = `${e.harness}|${e.id}`;
    if (seen.has(key)) throw new Error(`${file}: duplicate entry ${e.id} (${e.harness})`);
    seen.add(key);
  }
  return entries;
}

/**
 * Group raw findings ({id, where}) into one record per id with every place
 * it was seen.
 */
export function groupFindings(raw) {
  const byId = new Map();
  for (const f of raw) {
    if (!byId.has(f.id)) byId.set(f.id, { id: f.id, detail: f.detail ?? null, where: [] });
    const rec = byId.get(f.id);
    if (f.where && !rec.where.includes(f.where)) rec.where.push(f.where);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Compare grouped findings with the known-issues entries for one harness.
 * Returns { unlisted, listed, stale, ok }.
 */
export function compareFindings({ findings, known, harness, fullRun }) {
  const mine = known.filter((e) => e.harness === harness);
  const knownIds = new Set(mine.map((e) => e.id));
  const foundIds = new Set(findings.map((f) => f.id));
  const unlisted = findings.filter((f) => !knownIds.has(f.id));
  const listed = findings.filter((f) => knownIds.has(f.id));
  const stale = fullRun ? mine.filter((e) => !e.volatile && !foundIds.has(e.id)) : [];
  return { unlisted, listed, stale, ok: unlisted.length === 0 && stale.length === 0 };
}

/** Print the ratchet verdict. Returns the process exit code (0 or 1). */
export function report({ harness, result, advisory = [], fullRun, log = console.log }) {
  const { unlisted, listed, stale } = result;
  log(`\n== ${harness}: ${listed.length} known, ${unlisted.length} new, ${stale.length} stale ==`);
  for (const f of unlisted) {
    log(`NEW    ${f.id}${f.detail ? `  (${f.detail})` : ''}`);
    for (const w of f.where.slice(0, 5)) log(`         at ${w}`);
    if (f.where.length > 5) log(`         ... and ${f.where.length - 5} more`);
  }
  for (const e of stale) {
    log(`STALE  ${e.id}  (listed in known-issues.json but no longer reproduces: remove the entry)`);
  }
  for (const f of listed) log(`known  ${f.id}  (${f.where.length} places)`);
  if (advisory.length) {
    log(`\n-- advisory (never fails the run) --`);
    for (const a of advisory) log(`note   ${a.id}${a.where?.length ? `  (${a.where.length} places)` : ''}`);
  }
  if (!fullRun) log('\n(subset run: stale entries not checked)');
  if (unlisted.length) {
    log(`\nFix the new findings, or, if one is accepted for now, add it to scripts/visual/known-issues.json with a reason.`);
  }
  return result.ok ? 0 : 1;
}

/** Fail fast with a clear message when nothing is serving the build. */
export async function assertServerUp(base) {
  try {
    const res = await fetch(base, { redirect: 'manual' });
    if (res.status < 500) return;
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.error(
      `No site at ${base} (${e.message}). Serve a production build first, e.g.\n` +
        `  npx docusaurus serve --port 3100 --host 127.0.0.1 --no-open\n` +
        `or pass --base <url>.`,
    );
    process.exit(2);
  }
}
