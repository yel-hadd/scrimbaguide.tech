#!/usr/bin/env node

/**
 * Persisted quota buckets for the indexing automation (I18N-PLAN.md §11.2, §11.4).
 * Sole reader/writer of `${STATE_DIR}/quota.json` (§17 registry).
 *
 * TWO RULES THIS FILE EXISTS TO ENFORCE:
 *
 * 1. BUCKETS ARE KEYED BY PACIFIC CALENDAR DATE, because midnight America/Los_Angeles is
 *    when Google resets the daily quota. Deriving the day key from UTC double-spends the
 *    budget once per day, every day (the UTC day rolls over 7 or 8 hours early). The key is
 *    derived with Intl.DateTimeFormat and timeZone 'America/Los_Angeles' — never a
 *    hand-rolled offset, which silently breaks twice a year at the DST boundaries.
 *
 *    This is the ONLY file in the indexer that uses Pacific dates. Every ledger timestamp
 *    is ISO 8601 UTC; see the banner in ledger.mjs.
 *
 * 2. RESERVE BEFORE THE CALL, NEVER AFTER. reserve() increments and (by default) persists
 *    before the caller issues the request, so a crash after a successful request cannot
 *    hand the quota back and let tomorrow's run re-spend it.
 *
 * Shape on disk:
 *   { "2026-08-09": { "urlInspection": 1743, "indexingApi": 0 } }
 */

import fs from 'node:fs';
import path from 'node:path';

import { STATE_DIR } from './ledger.mjs';

export const QUOTA_FILENAME = 'quota.json';

/** Bucket names. These are the keys inside a day's object; nothing else is written. */
export const BUCKET_URL_INSPECTION = 'urlInspection';
export const BUCKET_INDEXING_API = 'indexingApi';

/**
 * Verified caps from §11.2.
 *
 * urlInspection: 2,000/day and 600/min per site. One URL per call — there is NO bulk
 *   endpoint. This is the scarce resource the whole design orbits.
 * indexingApi: 200 URLs/day per GCP project. Google is explicit that "quota is counted at
 *   the URL level": combining 10 requests into one HTTP batch still costs 10. So the cap is
 *   200 URLs/day, not 200 requests/day, and callers must reserve the batch's URL COUNT.
 */
export const DAILY_CAPS = Object.freeze({
  [BUCKET_URL_INSPECTION]: 2000,
  [BUCKET_INDEXING_API]: 200,
});

/**
 * The daily sweep budgets 1,800 inspections, leaving 200 units of headroom so an ad-hoc
 * indexer-manual.yml run after a content fix is not blocked by the scheduled sweep.
 */
export const SWEEP_BUDGET = 1800;

/** Per-minute ceiling for URL Inspection, and the throttle that keeps the sweep under it. */
export const URL_INSPECTION_PER_MINUTE = 600;
/** ~8 req/s: comfortably under 600/min even with retries in flight. */
export const INSPECT_THROTTLE_MS = 125;

/**
 * Pacific day key, 'YYYY-MM-DD'.
 *
 * Intl does the DST arithmetic; formatToParts is used instead of a locale string so the
 * result cannot drift with the host's default locale or calendar.
 */
const PACIFIC_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function pacificDayKey(when = new Date()) {
  const date = when instanceof Date ? when : new Date(when);
  const parts = Object.fromEntries(PACIFIC_PARTS.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function quotaPath(stateDir = STATE_DIR) {
  return path.join(stateDir, QUOTA_FILENAME);
}

/** Sorted keys + 2-space indent, matching ledger.json: this is committed to a public branch. */
export function serializeQuota(quota) {
  const sorted = {};
  for (const day of Object.keys(quota).sort()) {
    const buckets = quota[day] ?? {};
    const dayOut = {};
    for (const bucket of Object.keys(buckets).sort()) dayOut[bucket] = buckets[bucket];
    sorted[day] = dayOut;
  }
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

export function readQuota(stateDir = STATE_DIR) {
  const file = quotaPath(stateDir);
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.trim()) return {};
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // A corrupt quota file must not be silently reset to zero: that is a licence to spend
    // the day's budget twice.
    throw new Error(`Corrupt quota file at ${file}: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Quota file at ${file} is not an object keyed by Pacific date`);
  }
  return parsed;
}

export function writeQuota(stateDir, quota) {
  const file = quotaPath(stateDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, serializeQuota(quota), 'utf8');
  return quota;
}

/**
 * Open the quota buckets for a given moment.
 *
 * Usage is deliberately reserve-then-call:
 *
 *   const quota = openQuota({ stateDir });
 *   if (!quota.reserve(BUCKET_URL_INSPECTION, 1, { cap: SWEEP_BUDGET })) break;  // day is done
 *   await inspect(url);
 *
 * `persist` defaults to true: each reservation is flushed to disk before the caller's
 * request goes out, which is the whole point of reserving first. Pass `persist: false` for
 * a dry run, then call save() yourself.
 */
export function openQuota({ stateDir = STATE_DIR, now = new Date(), persist = true } = {}) {
  const quota = readQuota(stateDir);
  const day = pacificDayKey(now);
  if (!quota[day]) quota[day] = {};
  const buckets = quota[day];
  for (const bucket of Object.keys(DAILY_CAPS)) {
    if (typeof buckets[bucket] !== 'number') buckets[bucket] = 0;
  }

  function capFor(bucket, override) {
    const cap = override ?? DAILY_CAPS[bucket];
    if (typeof cap !== 'number') throw new Error(`Unknown quota bucket: ${bucket}`);
    return cap;
  }

  const api = {
    /** The Pacific date these buckets belong to. */
    day,
    /** The whole file, for callers that need the freshness check on previous days. */
    all: quota,

    used(bucket) {
      return buckets[bucket] ?? 0;
    },

    remaining(bucket, { cap } = {}) {
      return Math.max(0, capFor(bucket, cap) - api.used(bucket));
    },

    /**
     * Reserve `count` units BEFORE issuing the call. Returns false — without incrementing —
     * when the reservation would exceed the cap, which is the signal to stop the sweep and
     * exit 0 with a summary (a spent budget is not a red build).
     *
     * For the Indexing API, `count` is the batch's URL count, never 1 per HTTP request.
     */
    reserve(bucket, count = 1, { cap } = {}) {
      if (!Number.isInteger(count) || count < 1) {
        throw new Error(`reserve(${bucket}) needs a positive integer count, received ${count}`);
      }
      const limit = capFor(bucket, cap);
      if (api.used(bucket) + count > limit) return false;
      buckets[bucket] = api.used(bucket) + count;
      if (persist) writeQuota(stateDir, quota);
      return true;
    },

    /**
     * Hand back units for a call that was never actually issued (e.g. a pre-flight guard
     * rejected the URL). Never call this after a request has left the process: the whole
     * reserve-first rule exists so a crash cannot free spent quota.
     */
    release(bucket, count = 1) {
      buckets[bucket] = Math.max(0, api.used(bucket) - count);
      if (persist) writeQuota(stateDir, quota);
      return buckets[bucket];
    },

    save() {
      return writeQuota(stateDir, quota);
    },
  };

  return api;
}

/**
 * Freshness check for indexer-sweep.yml (§11.6): GitHub's scheduled runs can be delayed or
 * dropped, and a superseded run leaves no record. If neither of the last two Pacific days
 * has a committed record, the workflow emits ::warning:: and report.mjs flags
 * `sweep_missed_days`.
 */
export function missedRecentDays(quota, { now = new Date(), days = 2 } = {}) {
  const missed = [];
  for (let i = 1; i <= days; i += 1) {
    const key = pacificDayKey(new Date(new Date(now).getTime() - i * 24 * 60 * 60 * 1000));
    if (!quota[key]) missed.push(key);
  }
  return missed;
}
