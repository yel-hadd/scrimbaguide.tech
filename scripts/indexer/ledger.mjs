#!/usr/bin/env node

/**
 * The indexer ledger: the SOLE reader and writer of `${STATE_DIR}/ledger.json`
 * (I18N-PLAN.md §11.4 and the state-file registry in §17). Every other module — discover,
 * sitemaps, inspect, notify, report — mutates ledger state through the helpers exported
 * here and never touches the file directly. One writer per file is the structural defence
 * against two modules inventing two schemas for one file.
 *
 * TIMEZONE RULE, READ THIS BEFORE EDITING:
 *   ALL LEDGER TIMESTAMPS ARE ISO 8601 UTC. Only quota.json uses Pacific date keys, and it
 *   uses them because that is when Google's daily quota resets. Re-keying the ledger in
 *   Pacific "to match quota" computes wrong nextDue windows for every URL — the plan calls
 *   this out as a real, expected failure mode. UTC here, Pacific only in quota.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * The indexer-state branch is checked out into the working tree at this path (state files
 * sit at the BRANCH ROOT — there is no nested indexer-state/ directory inside it).
 * `.gitignore` already ignores /.indexer-state/, so a local run can never be committed to
 * main by accident.
 */
export const STATE_DIR = '.indexer-state';

export const LEDGER_VERSION = 1;
export const LEDGER_FILENAME = 'ledger.json';

/** Resolve the state directory, honouring `--state-dir <path>` on any indexer CLI. */
export function resolveStateDir({ argv = process.argv.slice(2), cwd = process.cwd() } = {}) {
  const idx = argv.indexOf('--state-dir');
  const raw = idx !== -1 && argv[idx + 1] ? argv[idx + 1] : STATE_DIR;
  return path.resolve(cwd, raw);
}

export function ledgerPath(stateDir = STATE_DIR) {
  return path.join(stateDir, LEDGER_FILENAME);
}

// ── Priority ladder (§11.3 C) ───────────────────────────────────

/**
 * P0 new URL, never inspected            -> next run
 * P1 content changed (sitemap lastmod newer than lastInspected; later, a sourceHash diff)
 *                                        -> next run
 * P2 last verdict FAIL, or a not-indexed coverageState
 *                                        -> backoff ladder below, then park
 * P3 money page                          -> weekly
 * P4 everything else, indexed and healthy-> every 30 days, round-robin
 */
export const PRIORITIES = ['P0', 'P1', 'P2', 'P3', 'P4'];

/** Lower rank wins. Used for the sweep's selection order. */
const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p, i]));

/** The P2 ladder, in days. Index = failCount - 1. Beyond the last rung, the URL is parked. */
export const P2_BACKOFF_DAYS = [1, 3, 7, 14, 30];

/** Cadence in days for the healthy tiers. */
export const P3_CADENCE_DAYS = 7;
export const P4_CADENCE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Compare two priority labels; unknown labels sort last so a corrupt row cannot jump the queue. */
export function comparePriority(a, b) {
  const ra = PRIORITY_RANK[a] ?? PRIORITIES.length;
  const rb = PRIORITY_RANK[b] ?? PRIORITIES.length;
  return ra - rb;
}

/**
 * The P2 backoff ladder: 1d, 3d, 7d, 14d, 30d, then park.
 *
 * `failCount` is the count AFTER the failure being recorded, so failCount 1 -> 1 day.
 * Once it passes the last rung the URL is parked with nextDue = null: five consecutive
 * failures over ~55 days means the page needs a human, not another inspection unit.
 */
export function nextDueForFailCount(failCount, fromIso) {
  const rung = P2_BACKOFF_DAYS[failCount - 1];
  if (rung === undefined) return null;
  return isoFrom(fromIso, rung * DAY_MS);
}

/** Cadence for a healthy URL: weekly for money pages, monthly for everything else. */
export function nextDueForHealthy(isMoneyPage, fromIso) {
  return isoFrom(fromIso, (isMoneyPage ? P3_CADENCE_DAYS : P4_CADENCE_DAYS) * DAY_MS);
}

function isoFrom(fromIso, offsetMs) {
  const base = fromIso ? Date.parse(fromIso) : Date.now();
  return new Date(base + offsetMs).toISOString();
}

/** Every timestamp written to the ledger goes through here. UTC, always. */
export function toIsoUtc(value = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

// ── coverageState interpretation (§11.3 C, §11.5) ───────────────

/**
 * `coverageState` is FREE TEXT, not an enum (confirmed in the discovery document), so match
 * tolerantly and always store the raw value verbatim in the ledger.
 */

/**
 * The gate metric in §11.5 is defined on this exact string and nothing else. Keep it exact:
 * a tolerant match here would silently inflate the number the whole tier gate rests on.
 */
export function isSubmittedAndIndexed(coverageState) {
  return coverageState === 'Submitted and indexed';
}

/**
 * Tolerant "Google is not indexing this" test, used to drive the P2 backoff ladder.
 * Covers 'Crawled - currently not indexed', 'Discovered - currently not indexed',
 * 'Excluded by \'noindex\' tag', 'Duplicate without user-selected canonical' and
 * 'Alternate page with proper canonical tag' — the last two being the i18n canary of §11.5.
 * Deliberately narrow: over-matching would sink healthy URLs into the 30-day tier.
 */
export function isNotIndexedCoverageState(coverageState) {
  if (typeof coverageState !== 'string' || !coverageState.trim()) return false;
  const state = coverageState.toLowerCase();
  return (
    state.includes('not indexed') ||
    state.startsWith('excluded') ||
    state.includes('duplicate') ||
    state.startsWith('alternate page')
  );
}

// ── Records ─────────────────────────────────────────────────────

/**
 * The normative per-URL schema of §11.4. Field names are exact and exhaustive; note that
 * the API's array field is `sitemap` (SINGULAR) and that `locale` is 'en' for root URLs and
 * never null.
 */
export function createUrlRecord({
  locale = 'en',
  routePath = '/',
  now = toIsoUtc(),
  priority = 'P0',
  sourceHash = null,
  deployedSha = null,
} = {}) {
  return {
    locale,
    routePath,
    status: 'active',
    firstSeen: now,
    lastInspected: null,
    // A brand-new URL is due immediately; null would mean "parked or gone, never scheduled".
    nextDue: now,
    priority,
    failCount: 0,
    sourceHash,
    deployedSha,
    verdict: null,
    indexingState: null,
    robotsTxtState: null,
    pageFetchState: null,
    crawledAs: null,
    coverageState: null,
    googleCanonical: null,
    userCanonical: null,
    lastCrawlTime: null,
    sitemap: [],
    referringUrls: [],
    inspectionResultLink: null,
    lastError: null,
  };
}

export function createLedger({ now = toIsoUtc() } = {}) {
  return { version: LEDGER_VERSION, updatedAt: now, urls: {} };
}

// ── Read / write ────────────────────────────────────────────────

/**
 * Sort object keys ascending, recursively. The ledger is committed daily to a PUBLIC branch,
 * so a stable key order is what makes the diff readable instead of a full-file churn.
 */
function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeysDeep(value[key]);
    return out;
  }
  return value;
}

/** Deterministic serialization: sorted keys, 2-space indent, trailing newline. */
export function serializeLedger(ledger) {
  return `${JSON.stringify(sortKeysDeep(ledger), null, 2)}\n`;
}

export function readLedger(stateDir = STATE_DIR) {
  const file = ledgerPath(stateDir);
  if (!fs.existsSync(file)) return createLedger();
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Refuse to continue on a corrupt ledger: rebuilding from scratch would re-spend a full
    // day of inspection quota on URLs we already know about.
    throw new Error(`Corrupt ledger at ${file}: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || typeof parsed.urls !== 'object' || parsed.urls === null) {
    throw new Error(`Ledger at ${file} is missing the required { version, urls } shape`);
  }
  return { version: parsed.version ?? LEDGER_VERSION, updatedAt: parsed.updatedAt ?? null, urls: parsed.urls };
}

export function writeLedger(stateDir, ledger, { now = toIsoUtc() } = {}) {
  const file = ledgerPath(stateDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const next = { ...ledger, version: ledger.version ?? LEDGER_VERSION, updatedAt: now };
  fs.writeFileSync(file, serializeLedger(next), 'utf8');
  return next;
}

// ── Mutations ───────────────────────────────────────────────────

/** Insert a URL, or refresh the discovery-time fields of one already present. */
export function upsertUrl(ledger, url, fields = {}, { now = toIsoUtc() } = {}) {
  const existing = ledger.urls[url];
  if (!existing) {
    const record = { ...createUrlRecord({ now, ...fields }), ...pickWritable(fields) };
    ledger.urls[url] = record;
    return record;
  }
  Object.assign(existing, pickWritable(fields));
  // A URL that reappears after being marked gone is active again and must be re-queued.
  if (existing.status === 'gone' && fields.status !== 'gone') {
    existing.status = 'active';
    existing.priority = 'P0';
    existing.nextDue = now;
  }
  return existing;
}

/** Only these fields may be set by discovery; verdict fields belong to recordInspection. */
const DISCOVERY_FIELDS = ['locale', 'routePath', 'status', 'priority', 'nextDue', 'sourceHash', 'deployedSha', 'sitemap'];

function pickWritable(fields) {
  const out = {};
  for (const key of DISCOVERY_FIELDS) {
    if (Object.hasOwn(fields, key)) out[key] = fields[key];
  }
  return out;
}

/**
 * Reconciliation (§11.3 A): a ledger URL absent from the current discovery set is `gone`,
 * never scheduled again, and excluded from every rollup and ratio. Records are RETAINED (90
 * days, pruned by pruneGone) so a bad deploy cannot lose history.
 */
export function markGone(ledger, url) {
  const record = ledger.urls[url];
  if (!record) return null;
  record.status = 'gone';
  record.nextDue = null;
  return record;
}

export const GONE_RETENTION_DAYS = 90;

/** Drop `gone` records older than the retention window, keyed on lastInspected/firstSeen. */
export function pruneGone(ledger, { now = Date.now(), retentionDays = GONE_RETENTION_DAYS } = {}) {
  const cutoff = now - retentionDays * DAY_MS;
  let pruned = 0;
  for (const [url, record] of Object.entries(ledger.urls)) {
    if (record.status !== 'gone') continue;
    const stamp = Date.parse(record.lastInspected ?? record.firstSeen ?? '') || 0;
    if (stamp < cutoff) {
      delete ledger.urls[url];
      pruned += 1;
    }
  }
  return pruned;
}

/**
 * Apply a successful URL Inspection result.
 *
 * `isMoneyPage` is supplied by the caller rather than derived here: the money-page list
 * lives in src/utils/moneyPagePaths.ts, which is TypeScript the indexer cannot import.
 *
 * Only a FAIL verdict or a not-indexed coverageState advances failCount and the P2 ladder.
 * A healthy result resets failCount to 0 and drops the URL back to its cadence tier.
 */
export function recordInspection(ledger, url, result = {}, { now = toIsoUtc(), isMoneyPage = false } = {}) {
  const record = ledger.urls[url] ?? upsertUrl(ledger, url, {}, { now });

  record.lastInspected = now;
  record.verdict = result.verdict ?? null;
  record.indexingState = result.indexingState ?? null;
  record.robotsTxtState = result.robotsTxtState ?? null;
  record.pageFetchState = result.pageFetchState ?? null;
  record.crawledAs = result.crawledAs ?? null;
  // Store the raw free text verbatim; interpretation happens at read time.
  record.coverageState = result.coverageState ?? null;
  record.googleCanonical = result.googleCanonical ?? null;
  record.userCanonical = result.userCanonical ?? null;
  record.lastCrawlTime = result.lastCrawlTime ?? null;
  record.sitemap = Array.isArray(result.sitemap) ? [...result.sitemap] : [];
  // Cap referringUrls at 10: this file is committed daily and a hub page can list hundreds.
  record.referringUrls = Array.isArray(result.referringUrls) ? result.referringUrls.slice(0, 10) : [];
  record.inspectionResultLink = result.inspectionResultLink ?? null;
  // A completed inspection clears any stale transport/HTTP error from a previous attempt.
  record.lastError = null;

  const failed = result.verdict === 'FAIL' || isNotIndexedCoverageState(result.coverageState);
  if (failed) {
    record.failCount = Math.min(record.failCount + 1, P2_BACKOFF_DAYS.length + 1);
    record.priority = 'P2';
    record.nextDue = nextDueForFailCount(record.failCount, now);
  } else {
    record.failCount = 0;
    record.priority = isMoneyPage ? 'P3' : 'P4';
    record.nextDue = nextDueForHealthy(isMoneyPage, now);
  }
  return record;
}

/**
 * Record a transport or HTTP error against a URL.
 *
 * THIS NEVER TOUCHES failCount. Errors are a property of the request, not of the page, and
 * letting them advance the P2 ladder would silently sink healthy URLs into the 30-day tier
 * during any Google outage.
 *
 * nextDue is likewise left alone, with one explicit exception from the §11.0 table: a
 * 400/404 ('permanent_skip') parks the URL with nextDue = null, because re-inspecting a URL
 * Google refuses to accept just burns quota.
 */
export function recordError(ledger, url, { status = null, reason = null, at = toIsoUtc(), classification = null } = {}) {
  const record = ledger.urls[url] ?? upsertUrl(ledger, url, {}, { now: at });
  record.lastError = { at, status, reason };
  if (classification === 'permanent_skip') record.nextDue = null;
  return record;
}

// ── Selection ───────────────────────────────────────────────────

/**
 * The sweep's candidate list: active URLs whose nextDue has arrived, ordered by priority,
 * then by how overdue they are, then by URL so the order is deterministic across runs.
 * Locale round-robin and the 1,800/day budget are applied by inspect.mjs on top of this.
 */
export function selectDueUrls(ledger, { now = Date.now(), limit = Infinity } = {}) {
  const nowMs = typeof now === 'number' ? now : Date.parse(now);
  const due = [];
  for (const [url, record] of Object.entries(ledger.urls)) {
    if (record.status !== 'active') continue;
    // null nextDue means parked (P2 exhausted) or gone: never scheduled.
    if (!record.nextDue) continue;
    if (Date.parse(record.nextDue) > nowMs) continue;
    due.push({ url, record });
  }
  due.sort((a, b) => {
    const byPriority = comparePriority(a.record.priority, b.record.priority);
    if (byPriority !== 0) return byPriority;
    const byDue = Date.parse(a.record.nextDue) - Date.parse(b.record.nextDue);
    if (byDue !== 0) return byDue;
    return a.url < b.url ? -1 : a.url > b.url ? 1 : 0;
  });
  return due.slice(0, limit);
}

/** Rows counted by every rollup and ratio: active only, `gone` excluded (§11.3 A). */
export function activeUrls(ledger) {
  return Object.entries(ledger.urls).filter(([, record]) => record.status === 'active');
}

/**
 * Merge rule for commit-state.sh (§11.4): per-URL last-write-wins keyed on `lastInspected`.
 * `base` is the freshly fetched branch state, `incoming` is this run's in-memory state.
 */
export function mergeLedgers(base, incoming) {
  const merged = createLedger({ now: toIsoUtc() });
  merged.urls = { ...base.urls };
  for (const [url, record] of Object.entries(incoming.urls)) {
    const existing = merged.urls[url];
    if (!existing) {
      merged.urls[url] = record;
      continue;
    }
    const a = Date.parse(existing.lastInspected ?? '') || 0;
    const b = Date.parse(record.lastInspected ?? '') || 0;
    merged.urls[url] = b >= a ? record : existing;
  }
  return merged;
}
