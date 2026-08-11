import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  GONE_RETENTION_DAYS,
  LEDGER_VERSION,
  P2_BACKOFF_DAYS,
  P3_CADENCE_DAYS,
  P4_CADENCE_DAYS,
  PRIORITIES,
  STATE_DIR,
  activeUrls,
  comparePriority,
  createLedger,
  createUrlRecord,
  isNotIndexedCoverageState,
  isSubmittedAndIndexed,
  ledgerPath,
  markGone,
  mergeLedgers,
  nextDueForFailCount,
  pruneGone,
  readLedger,
  recordError,
  recordInspection,
  resolveStateDir,
  selectDueUrls,
  serializeLedger,
  upsertUrl,
  writeLedger,
} from '../ledger.mjs';

function tempStateDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'indexer-ledger-'));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Schema ──────────────────────────────────────────────────────

test('createUrlRecord matches the normative §11.4 schema exactly', () => {
  const record = createUrlRecord({ locale: 'en', routePath: '/docs/paths/', now: '2026-08-09T00:00:00.000Z' });

  assert.deepEqual(Object.keys(record).sort(), [
    'coverageState',
    'crawledAs',
    'deployedSha',
    'failCount',
    'firstSeen',
    'googleCanonical',
    'indexingState',
    'inspectionResultLink',
    'lastCrawlTime',
    'lastError',
    'lastInspected',
    'locale',
    'nextDue',
    'pageFetchState',
    'priority',
    'referringUrls',
    'robotsTxtState',
    'routePath',
    'sitemap',
    'sourceHash',
    'status',
    'userCanonical',
    'verdict',
  ]);

  // The API's array field is `sitemap`, singular. `sitemaps` would silently never populate.
  assert.deepEqual(record.sitemap, []);
  assert.equal('sitemaps' in record, false);
  // 'en' for root URLs, never null.
  assert.equal(record.locale, 'en');
  assert.equal(record.status, 'active');
  assert.equal(record.priority, 'P0');
  assert.equal(record.failCount, 0);
  assert.equal(record.lastInspected, null);
  // A new URL is due immediately; null would mean parked.
  assert.equal(record.nextDue, '2026-08-09T00:00:00.000Z');
});

test('every ledger timestamp is ISO 8601 UTC, never a Pacific date key', () => {
  // The plan flags "keying the ledger in Pacific to match quota" as a real failure mode.
  const ledger = createLedger({ now: '2026-08-09T18:00:00.000Z' });
  recordInspection(ledger, 'https://scrimbaguide.tech/', { verdict: 'PASS', coverageState: 'Submitted and indexed' }, {
    now: '2026-08-10T03:00:00.000Z', // 2026-08-09 in Pacific
  });
  const record = ledger.urls['https://scrimbaguide.tech/'];
  assert.equal(record.lastInspected, '2026-08-10T03:00:00.000Z');
  assert.ok(record.lastInspected.endsWith('Z'));
  assert.ok(record.nextDue.endsWith('Z'));
  assert.equal(new Date(record.nextDue).toISOString(), record.nextDue);
});

test('resolveStateDir defaults to .indexer-state and honours --state-dir', () => {
  assert.equal(STATE_DIR, '.indexer-state');
  assert.equal(resolveStateDir({ argv: [], cwd: '/repo' }), path.resolve('/repo', '.indexer-state'));
  assert.equal(resolveStateDir({ argv: ['--state-dir', 'tmp/state'], cwd: '/repo' }), path.resolve('/repo', 'tmp/state'));
  assert.equal(ledgerPath('/repo/.indexer-state'), path.join('/repo/.indexer-state', 'ledger.json'));
});

// ── Priority ordering ───────────────────────────────────────────

test('priority ordering is P0 before P1 before P2 before P3 before P4', () => {
  assert.deepEqual(PRIORITIES, ['P0', 'P1', 'P2', 'P3', 'P4']);
  const shuffled = ['P3', 'P0', 'P4', 'P2', 'P1'].sort(comparePriority);
  assert.deepEqual(shuffled, PRIORITIES);
  // An unrecognised label sorts last so a corrupt row cannot jump the queue.
  assert.ok(comparePriority('P4', 'P9') < 0);
});

test('selectDueUrls orders by priority, then overdue-ness, then URL, and skips parked/gone', () => {
  const now = Date.parse('2026-08-09T12:00:00.000Z');
  const ledger = createLedger();
  const add = (url, fields) => {
    ledger.urls[url] = { ...createUrlRecord({ now: '2026-08-01T00:00:00.000Z' }), ...fields };
  };

  add('https://scrimbaguide.tech/d/', { priority: 'P4', nextDue: '2026-08-01T00:00:00.000Z' });
  add('https://scrimbaguide.tech/c/', { priority: 'P3', nextDue: '2026-08-09T00:00:00.000Z' });
  add('https://scrimbaguide.tech/b/', { priority: 'P0', nextDue: '2026-08-09T11:00:00.000Z' });
  add('https://scrimbaguide.tech/a/', { priority: 'P0', nextDue: '2026-08-05T00:00:00.000Z' });
  add('https://scrimbaguide.tech/parked/', { priority: 'P2', nextDue: null });
  add('https://scrimbaguide.tech/gone/', { priority: 'P0', status: 'gone', nextDue: null });
  add('https://scrimbaguide.tech/future/', { priority: 'P0', nextDue: '2026-09-09T00:00:00.000Z' });

  const due = selectDueUrls(ledger, { now }).map((entry) => entry.url);
  assert.deepEqual(due, [
    'https://scrimbaguide.tech/a/', // P0, most overdue
    'https://scrimbaguide.tech/b/', // P0
    'https://scrimbaguide.tech/c/', // P3
    'https://scrimbaguide.tech/d/', // P4
  ]);

  assert.deepEqual(selectDueUrls(ledger, { now, limit: 2 }).map((e) => e.url), [
    'https://scrimbaguide.tech/a/',
    'https://scrimbaguide.tech/b/',
  ]);
});

// ── The P2 backoff ladder ───────────────────────────────────────

test('the P2 ladder is 1d, 3d, 7d, 14d, 30d, then park', () => {
  assert.deepEqual(P2_BACKOFF_DAYS, [1, 3, 7, 14, 30]);
  const from = '2026-08-09T00:00:00.000Z';
  assert.equal(nextDueForFailCount(1, from), '2026-08-10T00:00:00.000Z');
  assert.equal(nextDueForFailCount(2, from), '2026-08-12T00:00:00.000Z');
  assert.equal(nextDueForFailCount(3, from), '2026-08-16T00:00:00.000Z');
  assert.equal(nextDueForFailCount(4, from), '2026-08-23T00:00:00.000Z');
  assert.equal(nextDueForFailCount(5, from), '2026-09-08T00:00:00.000Z');
  assert.equal(nextDueForFailCount(6, from), null); // parked
});

test('a FAIL verdict walks the ladder rung by rung and then parks the URL', () => {
  const url = 'https://scrimbaguide.tech/docs/paths/';
  const ledger = createLedger();
  upsertUrl(ledger, url, { locale: 'en', routePath: '/docs/paths/' }, { now: '2026-08-09T00:00:00.000Z' });

  let at = Date.parse('2026-08-09T00:00:00.000Z');
  const expected = [...P2_BACKOFF_DAYS, null];
  for (let i = 0; i < expected.length; i += 1) {
    const now = new Date(at).toISOString();
    const record = recordInspection(ledger, url, { verdict: 'FAIL' }, { now });
    assert.equal(record.priority, 'P2');
    assert.equal(record.failCount, i + 1);
    const rung = expected[i];
    assert.equal(record.nextDue, rung === null ? null : new Date(at + rung * DAY_MS).toISOString());
    at += DAY_MS;
  }

  // Parked URLs are never selected again.
  assert.deepEqual(selectDueUrls(ledger, { now: at + 400 * DAY_MS }), []);
});

test('a not-indexed coverageState advances the ladder even when the verdict passes', () => {
  const url = 'https://scrimbaguide.tech/de/docs/paths/';
  const ledger = createLedger();
  const now = '2026-08-09T00:00:00.000Z';

  // The i18n canary of §11.5: Google folding a translation into another page.
  const record = recordInspection(ledger, url, {
    verdict: 'PASS',
    coverageState: 'Alternate page with proper canonical tag',
    googleCanonical: 'https://scrimbaguide.tech/docs/paths/',
    userCanonical: 'https://scrimbaguide.tech/de/docs/paths/',
  }, { now });

  assert.equal(record.failCount, 1);
  assert.equal(record.priority, 'P2');
  assert.equal(record.nextDue, '2026-08-10T00:00:00.000Z');
  // The raw free text is stored verbatim.
  assert.equal(record.coverageState, 'Alternate page with proper canonical tag');
});

test('a healthy result resets failCount and drops to the P3/P4 cadence', () => {
  const url = 'https://scrimbaguide.tech/docs/pricing/';
  const ledger = createLedger();
  const now = '2026-08-09T00:00:00.000Z';

  recordInspection(ledger, url, { verdict: 'FAIL' }, { now });
  assert.equal(ledger.urls[url].failCount, 1);

  const money = recordInspection(ledger, url, { verdict: 'PASS', coverageState: 'Submitted and indexed' }, {
    now,
    isMoneyPage: true,
  });
  assert.equal(money.failCount, 0);
  assert.equal(money.priority, 'P3');
  assert.equal(money.nextDue, new Date(Date.parse(now) + P3_CADENCE_DAYS * DAY_MS).toISOString());

  const ordinary = recordInspection(ledger, url, { verdict: 'PASS', coverageState: 'Submitted and indexed' }, { now });
  assert.equal(ordinary.priority, 'P4');
  assert.equal(ordinary.nextDue, new Date(Date.parse(now) + P4_CADENCE_DAYS * DAY_MS).toISOString());
});

// ── Errors never advance the ladder ─────────────────────────────

test('a 5xx records lastError but never touches failCount or nextDue', () => {
  const url = 'https://scrimbaguide.tech/docs/faq/';
  const ledger = createLedger();
  upsertUrl(ledger, url, {}, { now: '2026-08-09T00:00:00.000Z' });
  const before = { ...ledger.urls[url] };

  const record = recordError(ledger, url, {
    status: 503,
    reason: 'backendError',
    at: '2026-08-09T01:00:00.000Z',
    classification: 'retry',
  });

  assert.deepEqual(record.lastError, { at: '2026-08-09T01:00:00.000Z', status: 503, reason: 'backendError' });
  assert.equal(record.failCount, before.failCount);
  assert.equal(record.nextDue, before.nextDue);
  assert.equal(record.priority, before.priority);
});

test('a rate limit likewise leaves failCount and nextDue untouched', () => {
  const url = 'https://scrimbaguide.tech/blog/';
  const ledger = createLedger();
  upsertUrl(ledger, url, {}, { now: '2026-08-09T00:00:00.000Z' });
  const before = { ...ledger.urls[url] };

  const record = recordError(ledger, url, { status: 403, reason: 'rateLimitExceeded', classification: 'rate_limit' });
  assert.equal(record.failCount, 0);
  assert.equal(record.nextDue, before.nextDue);
});

test('a 400/404 parks the URL (the one explicit nextDue exception) without a failCount bump', () => {
  const url = 'https://scrimbaguide.tech/gone-page/';
  const ledger = createLedger();
  upsertUrl(ledger, url, {}, { now: '2026-08-09T00:00:00.000Z' });

  const record = recordError(ledger, url, { status: 404, reason: 'notFound', classification: 'permanent_skip' });
  assert.equal(record.nextDue, null);
  assert.equal(record.failCount, 0);
});

test('a completed inspection clears a stale error from an earlier attempt', () => {
  const url = 'https://scrimbaguide.tech/docs/';
  const ledger = createLedger();
  recordError(ledger, url, { status: 503, classification: 'retry', at: '2026-08-09T00:00:00.000Z' });
  const record = recordInspection(ledger, url, { verdict: 'PASS', coverageState: 'Submitted and indexed' }, {
    now: '2026-08-09T02:00:00.000Z',
  });
  assert.equal(record.lastError, null);
});

// ── coverageState interpretation ────────────────────────────────

test('isSubmittedAndIndexed is an exact match, because the tier gate rests on it', () => {
  assert.equal(isSubmittedAndIndexed('Submitted and indexed'), true);
  assert.equal(isSubmittedAndIndexed('Indexed, not submitted in sitemap'), false);
  assert.equal(isSubmittedAndIndexed(null), false);
});

test('isNotIndexedCoverageState matches the not-indexed states tolerantly but narrowly', () => {
  for (const state of [
    'Crawled - currently not indexed',
    'Discovered - currently not indexed',
    "Excluded by 'noindex' tag",
    'Duplicate without user-selected canonical',
    'Alternate page with proper canonical tag',
  ]) {
    assert.equal(isNotIndexedCoverageState(state), true, state);
  }
  for (const state of ['Submitted and indexed', 'Indexed, not submitted in sitemap', null, '', undefined]) {
    assert.equal(isNotIndexedCoverageState(state), false, String(state));
  }
});

// ── Reconciliation ──────────────────────────────────────────────

test('markGone parks the record and removes it from the active rollup', () => {
  const ledger = createLedger();
  upsertUrl(ledger, 'https://scrimbaguide.tech/a/', {}, { now: '2026-08-09T00:00:00.000Z' });
  upsertUrl(ledger, 'https://scrimbaguide.tech/b/', {}, { now: '2026-08-09T00:00:00.000Z' });

  markGone(ledger, 'https://scrimbaguide.tech/b/');
  assert.equal(ledger.urls['https://scrimbaguide.tech/b/'].status, 'gone');
  assert.equal(ledger.urls['https://scrimbaguide.tech/b/'].nextDue, null);
  assert.deepEqual(activeUrls(ledger).map(([url]) => url), ['https://scrimbaguide.tech/a/']);

  // A URL that comes back is active and re-queued as P0.
  upsertUrl(ledger, 'https://scrimbaguide.tech/b/', {}, { now: '2026-08-10T00:00:00.000Z' });
  assert.equal(ledger.urls['https://scrimbaguide.tech/b/'].status, 'active');
  assert.equal(ledger.urls['https://scrimbaguide.tech/b/'].priority, 'P0');
});

test('pruneGone keeps gone records for the retention window, then drops them', () => {
  const now = Date.parse('2026-08-09T00:00:00.000Z');
  const ledger = createLedger();
  ledger.urls['https://scrimbaguide.tech/recent/'] = {
    ...createUrlRecord({ now: new Date(now - 10 * DAY_MS).toISOString() }),
    status: 'gone',
  };
  ledger.urls['https://scrimbaguide.tech/ancient/'] = {
    ...createUrlRecord({ now: new Date(now - (GONE_RETENTION_DAYS + 1) * DAY_MS).toISOString() }),
    status: 'gone',
  };

  assert.equal(pruneGone(ledger, { now }), 1);
  assert.deepEqual(Object.keys(ledger.urls), ['https://scrimbaguide.tech/recent/']);
});

// ── Serialization ───────────────────────────────────────────────

test('serializeLedger sorts keys ascending with 2-space indent for a readable public diff', () => {
  const ledger = { urls: { 'https://b/': { locale: 'en' } }, version: 1, updatedAt: '2026-08-09T00:00:00.000Z' };
  const out = serializeLedger(ledger);
  assert.equal(out.indexOf('"updatedAt"') < out.indexOf('"urls"'), true);
  assert.equal(out.indexOf('"urls"') < out.indexOf('"version"'), true);
  assert.ok(out.includes('\n  "urls": {'));
  assert.ok(out.endsWith('}\n'));
});

test('ledger round-trip is byte-identical: write, read, write', () => {
  const dir = tempStateDir();
  const now = '2026-08-09T00:00:00.000Z';
  const ledger = createLedger({ now });
  upsertUrl(ledger, 'https://scrimbaguide.tech/docs/paths/', { locale: 'en', routePath: '/docs/paths/' }, { now });
  upsertUrl(ledger, 'https://scrimbaguide.tech/', { locale: 'en', routePath: '/' }, { now });
  recordInspection(ledger, 'https://scrimbaguide.tech/', {
    verdict: 'PASS',
    coverageState: 'Submitted and indexed',
    sitemap: ['https://scrimbaguide.tech/sitemap.xml'],
    referringUrls: Array.from({ length: 25 }, (_, i) => `https://scrimbaguide.tech/ref-${i}/`),
  }, { now });

  writeLedger(dir, ledger, { now });
  const first = fs.readFileSync(ledgerPath(dir), 'utf8');
  const reread = readLedger(dir);
  writeLedger(dir, reread, { now });
  const second = fs.readFileSync(ledgerPath(dir), 'utf8');

  assert.equal(second, first);
  assert.equal(reread.version, LEDGER_VERSION);
  // referringUrls is capped at 10 so a hub page cannot bloat the committed file.
  assert.equal(reread.urls['https://scrimbaguide.tech/'].referringUrls.length, 10);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('readLedger returns an empty ledger when absent and refuses a corrupt file', () => {
  const dir = tempStateDir();
  assert.deepEqual(readLedger(dir), { version: LEDGER_VERSION, updatedAt: readLedger(dir).updatedAt, urls: {} });

  fs.writeFileSync(ledgerPath(dir), '{ not json');
  assert.throws(() => readLedger(dir), /Corrupt ledger/);
  fs.writeFileSync(ledgerPath(dir), '{"version":1}');
  assert.throws(() => readLedger(dir), /missing the required/);

  fs.rmSync(dir, { recursive: true, force: true });
});

// ── Merge ───────────────────────────────────────────────────────

test('mergeLedgers is per-URL last-write-wins keyed on lastInspected', () => {
  const base = createLedger();
  base.urls['https://scrimbaguide.tech/a/'] = { ...createUrlRecord(), lastInspected: '2026-08-09T00:00:00.000Z', verdict: 'PASS' };
  base.urls['https://scrimbaguide.tech/b/'] = { ...createUrlRecord(), lastInspected: '2026-08-09T00:00:00.000Z', verdict: 'PASS' };

  const incoming = createLedger();
  incoming.urls['https://scrimbaguide.tech/a/'] = { ...createUrlRecord(), lastInspected: '2026-08-10T00:00:00.000Z', verdict: 'FAIL' };
  incoming.urls['https://scrimbaguide.tech/b/'] = { ...createUrlRecord(), lastInspected: '2026-08-08T00:00:00.000Z', verdict: 'FAIL' };
  incoming.urls['https://scrimbaguide.tech/c/'] = { ...createUrlRecord(), lastInspected: null };

  const merged = mergeLedgers(base, incoming);
  assert.equal(merged.urls['https://scrimbaguide.tech/a/'].verdict, 'FAIL'); // newer wins
  assert.equal(merged.urls['https://scrimbaguide.tech/b/'].verdict, 'PASS'); // older loses
  assert.ok(merged.urls['https://scrimbaguide.tech/c/']); // new URL is added
});
