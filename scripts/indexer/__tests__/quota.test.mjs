import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  BUCKET_INDEXING_API,
  BUCKET_URL_INSPECTION,
  DAILY_CAPS,
  SWEEP_BUDGET,
  URL_INSPECTION_PER_MINUTE,
  missedRecentDays,
  openQuota,
  pacificDayKey,
  quotaPath,
  readQuota,
  serializeQuota,
  writeQuota,
} from '../quota.mjs';

function tempStateDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'indexer-quota-'));
}

// ── Pacific day keys ────────────────────────────────────────────

test('pacificDayKey formats YYYY-MM-DD in America/Los_Angeles', () => {
  assert.equal(pacificDayKey(new Date('2026-08-09T18:00:00Z')), '2026-08-09');
  assert.equal(pacificDayKey('2026-01-05T20:00:00Z'), '2026-01-05');
});

test('pacificDayKey diverges from the UTC date inside the evening window', () => {
  // 2026-08-10T03:00Z is still 2026-08-09 20:00 in Pacific. Keying this off the UTC date
  // would open a fresh bucket ~7 hours early and double-spend the day's quota.
  const when = new Date('2026-08-10T03:00:00Z');
  assert.equal(when.toISOString().slice(0, 10), '2026-08-10');
  assert.equal(pacificDayKey(when), '2026-08-09');
});

test('pacificDayKey is correct across the spring-forward DST boundary', () => {
  // US DST begins 2026-03-08 at 02:00 local (10:00Z). At 07:30Z the offset is still -8, so
  // it is 2026-03-07 23:30 in Pacific. A hand-rolled -7 would answer 2026-03-08.
  assert.equal(pacificDayKey(new Date('2026-03-08T07:30:00Z')), '2026-03-07');
  // Just after the jump the offset is -7, and it is 2026-03-08 03:30 local.
  assert.equal(pacificDayKey(new Date('2026-03-08T10:30:00Z')), '2026-03-08');
});

test('pacificDayKey is correct across the fall-back DST boundary', () => {
  // DST ends 2026-11-01 at 02:00 PDT (09:00Z). At 07:30Z the offset is still -7, so it is
  // 2026-11-01 00:30 local. A hand-rolled -8 would answer 2026-10-31.
  assert.equal(pacificDayKey(new Date('2026-11-01T07:30:00Z')), '2026-11-01');
  // After the fall back the offset is -8: 2026-11-01 10:30Z is 02:30 local, same day.
  assert.equal(pacificDayKey(new Date('2026-11-01T10:30:00Z')), '2026-11-01');
  // And the boundary the other way: 2026-11-02T07:30Z is -8, so 2026-11-01 23:30 local.
  assert.equal(pacificDayKey(new Date('2026-11-02T07:30:00Z')), '2026-11-01');
});

// ── Caps ────────────────────────────────────────────────────────

test('caps match the verified §11.2 budget', () => {
  assert.equal(DAILY_CAPS[BUCKET_URL_INSPECTION], 2000);
  assert.equal(DAILY_CAPS[BUCKET_INDEXING_API], 200);
  assert.equal(SWEEP_BUDGET, 1800);
  assert.equal(URL_INSPECTION_PER_MINUTE, 600);
  // The sweep leaves 200 units of headroom for ad-hoc manual runs.
  assert.equal(DAILY_CAPS[BUCKET_URL_INSPECTION] - SWEEP_BUDGET, 200);
});

// ── reserve / cap behaviour ─────────────────────────────────────

test('reserve increments before the call and persists immediately', () => {
  const dir = tempStateDir();
  const quota = openQuota({ stateDir: dir, now: new Date('2026-08-09T18:00:00Z') });

  assert.equal(quota.day, '2026-08-09');
  assert.equal(quota.reserve(BUCKET_URL_INSPECTION, 1), true);

  // Persisted synchronously: a crash here must not hand the unit back.
  const onDisk = JSON.parse(fs.readFileSync(quotaPath(dir), 'utf8'));
  assert.equal(onDisk['2026-08-09'][BUCKET_URL_INSPECTION], 1);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('reserve refuses to exceed the cap and does not increment on refusal', () => {
  const dir = tempStateDir();
  const now = new Date('2026-08-09T18:00:00Z');
  writeQuota(dir, { '2026-08-09': { [BUCKET_URL_INSPECTION]: 1799, [BUCKET_INDEXING_API]: 0 } });

  const quota = openQuota({ stateDir: dir, now });
  assert.equal(quota.remaining(BUCKET_URL_INSPECTION, { cap: SWEEP_BUDGET }), 1);
  assert.equal(quota.reserve(BUCKET_URL_INSPECTION, 1, { cap: SWEEP_BUDGET }), true);
  assert.equal(quota.reserve(BUCKET_URL_INSPECTION, 1, { cap: SWEEP_BUDGET }), false);
  assert.equal(quota.used(BUCKET_URL_INSPECTION), 1800);
  assert.equal(quota.remaining(BUCKET_URL_INSPECTION, { cap: SWEEP_BUDGET }), 0);

  // The 200 units of headroom above the sweep budget are still available to a manual run.
  assert.equal(quota.remaining(BUCKET_URL_INSPECTION), 200);
  assert.equal(quota.reserve(BUCKET_URL_INSPECTION, 200), true);
  assert.equal(quota.reserve(BUCKET_URL_INSPECTION, 1), false);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('a batch of N costs N indexing-API units, not one', () => {
  // Google: "Quota is counted at the URL level ... 10 requests in a single HTTP request
  // still counts as 10." Reading this as 200 requests x 100 URLs is a 20x overspend.
  const dir = tempStateDir();
  const quota = openQuota({ stateDir: dir, now: new Date('2026-08-09T18:00:00Z') });

  assert.equal(quota.reserve(BUCKET_INDEXING_API, 100), true);
  assert.equal(quota.used(BUCKET_INDEXING_API), 100);
  assert.equal(quota.reserve(BUCKET_INDEXING_API, 100), true);
  assert.equal(quota.used(BUCKET_INDEXING_API), 200);
  // The 201st URL is refused even though only two HTTP requests were made.
  assert.equal(quota.reserve(BUCKET_INDEXING_API, 1), false);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('reserve rejects non-positive and non-integer counts', () => {
  const dir = tempStateDir();
  const quota = openQuota({ stateDir: dir, persist: false });
  assert.throws(() => quota.reserve(BUCKET_URL_INSPECTION, 0), /positive integer/);
  assert.throws(() => quota.reserve(BUCKET_URL_INSPECTION, 1.5), /positive integer/);
  assert.throws(() => quota.reserve('madeUpBucket', 1), /Unknown quota bucket/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a new Pacific day starts a fresh bucket and leaves yesterday intact', () => {
  const dir = tempStateDir();
  const yesterday = openQuota({ stateDir: dir, now: new Date('2026-08-10T03:00:00Z') }); // 08-09 PT
  assert.equal(yesterday.day, '2026-08-09');
  yesterday.reserve(BUCKET_URL_INSPECTION, 1743);

  const today = openQuota({ stateDir: dir, now: new Date('2026-08-10T08:00:00Z') }); // 08-10 PT
  assert.equal(today.day, '2026-08-10');
  assert.equal(today.used(BUCKET_URL_INSPECTION), 0);
  assert.equal(today.all['2026-08-09'][BUCKET_URL_INSPECTION], 1743);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('release hands back units for a call that was never issued', () => {
  const dir = tempStateDir();
  const quota = openQuota({ stateDir: dir, now: new Date('2026-08-09T18:00:00Z') });
  quota.reserve(BUCKET_URL_INSPECTION, 5);
  assert.equal(quota.release(BUCKET_URL_INSPECTION, 2), 3);
  assert.equal(quota.release(BUCKET_URL_INSPECTION, 99), 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── Persistence ─────────────────────────────────────────────────

test('quota.json serializes with sorted keys, 2-space indent and a trailing newline', () => {
  const serialized = serializeQuota({
    '2026-08-10': { [BUCKET_URL_INSPECTION]: 5, [BUCKET_INDEXING_API]: 1 },
    '2026-08-09': { [BUCKET_URL_INSPECTION]: 1743, [BUCKET_INDEXING_API]: 0 },
  });
  assert.equal(
    serialized,
    `{
  "2026-08-09": {
    "indexingApi": 0,
    "urlInspection": 1743
  },
  "2026-08-10": {
    "indexingApi": 1,
    "urlInspection": 5
  }
}\n`,
  );
});

test('readQuota returns an empty object when the file is missing and rejects corruption', () => {
  const dir = tempStateDir();
  assert.deepEqual(readQuota(dir), {});
  fs.writeFileSync(quotaPath(dir), '{ not json');
  assert.throws(() => readQuota(dir), /Corrupt quota file/);
  fs.writeFileSync(quotaPath(dir), '[]');
  assert.throws(() => readQuota(dir), /keyed by Pacific date/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('missedRecentDays flags Pacific days with no committed record', () => {
  const now = new Date('2026-08-10T18:00:00Z'); // 2026-08-10 PT
  assert.deepEqual(missedRecentDays({ '2026-08-09': {}, '2026-08-08': {} }, { now }), []);
  assert.deepEqual(missedRecentDays({ '2026-08-09': {} }, { now }), ['2026-08-08']);
  assert.deepEqual(missedRecentDays({}, { now }), ['2026-08-09', '2026-08-08']);
});
