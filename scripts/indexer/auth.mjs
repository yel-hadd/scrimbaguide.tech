#!/usr/bin/env node

/**
 * Google Search Console / Indexing API auth + transport.
 *
 * This module is the SINGLE SOURCE OF TRUTH for the API contract (I18N-PLAN.md §11.0):
 * scopes, endpoints, percent-encoding, and error classification. Every other module under
 * scripts/indexer/ imports these constants rather than re-deriving them — five separate
 * review findings on the plan traced back to modules inventing their own copies.
 *
 * No new npm dependency. `googleapis` would land in a Docusaurus production install, and
 * every existing script here (submit-indexnow.mjs, assert-sitemap-url.mjs) uses node
 * builtins only. So the service-account JWT flow is hand-rolled: an RS256 assertion signed
 * with node:crypto, exchanged at oauth2.googleapis.com for a bearer token.
 *
 * SECURITY: never log `client_email`, `private_key_id`, or any part of `private_key`, and
 * never read or print the contents of secrets/. Every error path in this file runs its
 * message through redact().
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Repo root, resolved from this file so a run from any cwd finds secrets/ the same way. */
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ── Scopes ──────────────────────────────────────────────────────
//
// THE HIGHEST-CONSEQUENCE LINES IN THIS FILE.
//
// Use the READ-WRITE `webmasters` scope for EVERY Search Console call, including
// urlInspection. Verified against the live v1 discovery document: sitemaps.submit and
// sitemaps.delete accept ONLY `webmasters`, while urlInspection.index.inspect,
// sitemaps.list and sitemaps.get additionally accept `webmasters.readonly`. An agent
// reasonably reaching for least-privilege `webmasters.readonly` gets a SILENT 403 on every
// sitemap submit, which classifyError() below would then misreport as bad credentials.
// There is deliberately no `webmasters.readonly` constant exported here.
export const SCOPE_WEBMASTERS = 'https://www.googleapis.com/auth/webmasters';

// Indexing API only (notify.mjs, behind --enable-indexing-api). Separate JWT client on a
// different host; never mixed into a Search Console token request.
export const SCOPE_INDEXING = 'https://www.googleapis.com/auth/indexing';

// ── Site identity ───────────────────────────────────────────────
//
// This is a DOMAIN property, so siteUrl is the literal string below and never
// 'https://scrimbaguide.tech/'. Passing the URL-prefix form against a domain property
// returns 403. A domain property covers every locale subdirectory automatically, so the
// i18n rollout needs no new property per locale.
export const SITE_URL = 'sc-domain:scrimbaguide.tech';

// ── Endpoints ───────────────────────────────────────────────────
//
// Use searchconsole.googleapis.com (the discovery document's rootUrl) throughout.
// www.googleapis.com/webmasters/v3 is a legacy alias; pinning one host stops two modules
// from forking onto different bases.
export const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
export const SITEMAPS_BASE = 'https://searchconsole.googleapis.com/webmasters/v3/sites';
export const ANALYTICS_URL = `${SITEMAPS_BASE}/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
export const INDEXING_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
export const INDEXING_BATCH = 'https://indexing.googleapis.com/batch';

/** Google's OAuth2 token endpoint; also the `aud` claim of the JWT assertion. */
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** RFC 7523 grant type for the service-account (two-legged) flow. */
export const JWT_BEARER_GRANT = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

/** Assertions are short-lived; Google caps this at 1 hour. */
const ASSERTION_LIFETIME_SECONDS = 3600;

/** Refresh a cached token this many seconds before its real expiry. */
const TOKEN_REFRESH_MARGIN_SECONDS = 60;

/** Default path to the local key, used only as the last resolution step. */
export const DEFAULT_KEY_FILE = path.join('secrets', 'gsc-service-account.json');

/**
 * Both path params of every Sitemaps call are percent-encoded, always. `feedpath` is an
 * ABSOLUTE URL ('https://scrimbaguide.tech/de/sitemap.xml'), not a filename and not a
 * site-relative path. Success is HTTP 200 with an EMPTY body — do not parse it.
 */
export function sitemapResourceUrl(feedpath) {
  return `${SITEMAPS_BASE}/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(feedpath)}`;
}

/** `sitemaps.list` resource for the property. */
export function sitemapsListUrl() {
  return `${SITEMAPS_BASE}/${encodeURIComponent(SITE_URL)}/sitemaps`;
}

// ── Redaction ───────────────────────────────────────────────────

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PEM_RE = /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g;
const PRIVATE_KEY_ID_RE = /("private_key_id"\s*:\s*")[^"]*(")/g;
const PRIVATE_KEY_FIELD_RE = /("private_key"\s*:\s*")(?:[^"\\]|\\.)*(")/g;
const BEARER_RE = /\b(ya29|1\/\/)[\w.\-/+]{10,}/g;
// Three base64url segments joined by dots: a JWT assertion or an id_token.
const JWT_RE = /\b[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g;

/**
 * Scrub anything credential-shaped out of a value before it reaches a log, an Error
 * message, or a report on the public indexer-state branch. Applied on EVERY error path.
 * This rule exists because a review agent once echoed parts of the key file into a
 * transcript.
 */
export function redact(value) {
  const text = value instanceof Error
    ? `${value.name}: ${value.message}`
    : typeof value === 'string' ? value : JSON.stringify(value ?? null);
  if (!text) return '';
  return text
    .replace(PEM_RE, '[redacted private key]')
    .replace(PRIVATE_KEY_FIELD_RE, '$1[redacted]$2')
    .replace(PRIVATE_KEY_ID_RE, '$1[redacted]$2')
    .replace(BEARER_RE, '[redacted token]')
    .replace(JWT_RE, '[redacted jwt]')
    .replace(EMAIL_RE, '[redacted email]');
}

// ── Credential resolution ───────────────────────────────────────

/**
 * Resolution order (§11.1): the GSC_SERVICE_ACCOUNT_JSON env var, which holds the VERBATIM
 * un-encoded contents of the key file (NOT base64); then `--key-file <path>`; then
 * secrets/gsc-service-account.json.
 *
 * This function deliberately does not READ the default key file — it only checks that the
 * path exists and returns it. Reading happens in loadServiceAccount(), so tests can
 * exercise resolution without ever opening the real key.
 *
 * Returns { kind: 'env' | 'key-file' | 'default', json?, file? } or null when nothing
 * resolves.
 */
export function resolveCredentialSource({
  env = process.env,
  argv = process.argv.slice(2),
  rootDir = REPO_ROOT,
} = {}) {
  const fromEnv = env.GSC_SERVICE_ACCOUNT_JSON;
  if (fromEnv && fromEnv.trim()) {
    return { kind: 'env', json: fromEnv };
  }

  const flagIdx = argv.indexOf('--key-file');
  if (flagIdx !== -1 && argv[flagIdx + 1]) {
    const file = path.resolve(rootDir, argv[flagIdx + 1]);
    return { kind: 'key-file', file };
  }

  const fallback = path.resolve(rootDir, DEFAULT_KEY_FILE);
  if (fs.existsSync(fallback)) {
    return { kind: 'default', file: fallback };
  }

  return null;
}

export const CREDENTIAL_REMEDIATION =
  'No Google service-account credentials found. Set GSC_SERVICE_ACCOUNT_JSON (verbatim JSON, not base64), pass --key-file <path>, or place the key at secrets/gsc-service-account.json.';

/**
 * Parse and validate a service-account key. Throws a redacted Error rather than exiting so
 * that callers (and tests) choose the failure mode; loadServiceAccountOrExit() is the
 * process-level wrapper.
 */
export function parseServiceAccount(json, { origin = 'credentials' } = {}) {
  let parsed;
  try {
    parsed = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (err) {
    // The parse error message can echo the surrounding bytes of the key, hence redact().
    throw new Error(`${origin} is not valid JSON: ${redact(err)}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${origin} did not contain a JSON object`);
  }
  // Never interpolate the values themselves into these messages.
  if (typeof parsed.client_email !== 'string' || !parsed.client_email) {
    throw new Error(`${origin} is missing client_email`);
  }
  if (typeof parsed.private_key !== 'string' || !parsed.private_key.includes('PRIVATE KEY')) {
    throw new Error(`${origin} is missing a usable private_key`);
  }
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    private_key_id: parsed.private_key_id ?? null,
    token_uri: typeof parsed.token_uri === 'string' && parsed.token_uri ? parsed.token_uri : TOKEN_URL,
  };
}

/** Resolve + read + validate. Throws (redacted) on any failure. */
export function loadServiceAccount(options = {}) {
  const source = options.source ?? resolveCredentialSource(options);
  if (!source) {
    throw new Error(CREDENTIAL_REMEDIATION);
  }
  if (source.kind === 'env') {
    return parseServiceAccount(source.json, { origin: 'GSC_SERVICE_ACCOUNT_JSON' });
  }
  let raw;
  try {
    raw = fs.readFileSync(source.file, 'utf8');
  } catch (err) {
    // Report the path, not the contents.
    throw new Error(`Could not read service-account key at ${source.file}: ${redact(err)}`);
  }
  return parseServiceAccount(raw, { origin: `service-account key ${source.file}` });
}

/** Process-level wrapper: one-line remediation, exit 1. Used by the CLI entry points. */
export function loadServiceAccountOrExit(options = {}) {
  try {
    return loadServiceAccount(options);
  } catch (err) {
    console.error(`[indexer] ${redact(err)}`);
    process.exit(1);
    return undefined; // unreachable; keeps the return type honest for callers
  }
}

// ── JWT assembly ────────────────────────────────────────────────

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Build the RS256 self-signed assertion for the two-legged flow.
 *
 * Exported so tests can verify header/claims/signature against a throwaway keypair without
 * any network access and without touching the real key.
 */
export function buildJwtAssertion(credentials, scopes, { now = Date.now() } = {}) {
  const scopeList = normalizeScopes(scopes);
  const issuedAt = Math.floor(now / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  if (credentials.private_key_id) header.kid = credentials.private_key_id;

  const claims = {
    iss: credentials.client_email,
    scope: scopeList.join(' '),
    aud: credentials.token_uri ?? TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + ASSERTION_LIFETIME_SECONDS,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64url(signer.sign(credentials.private_key));
  return `${signingInput}.${signature}`;
}

/** Scopes are always a sorted, de-duplicated list so the cache key is stable. */
function normalizeScopes(scopes) {
  const list = Array.isArray(scopes) ? scopes : [scopes];
  const cleaned = list.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
  if (cleaned.length === 0) {
    throw new Error('getAccessToken requires at least one scope (see SCOPE_WEBMASTERS / SCOPE_INDEXING)');
  }
  return [...new Set(cleaned)].sort();
}

// ── Token exchange + in-process cache ───────────────────────────

/**
 * Cache key = scope set + a fingerprint of the credentials. The fingerprint is a hash, so
 * neither the client_email nor the private_key_id can leak through a cache dump or a
 * debugger frame label.
 */
function cacheKey(credentials, scopeList) {
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${credentials.client_email}|${credentials.private_key_id ?? ''}`)
    .digest('hex')
    .slice(0, 12);
  return `${fingerprint}:${scopeList.join(' ')}`;
}

/** Map<cacheKey, { token, expiresAtMs }>. In-process only; never persisted. */
const tokenCache = new Map();

/** Test/CLI hook: drop cached tokens (e.g. after switching credentials). */
export function clearTokenCache() {
  tokenCache.clear();
}

/**
 * Exchange a signed assertion for a bearer token, caching it until exp - 60s.
 *
 * @param {string[]} scopes
 * @returns {Promise<string>} the access token
 */
export async function getAccessToken(scopes, options = {}) {
  const scopeList = normalizeScopes(scopes);
  const credentials = options.credentials ?? loadServiceAccountOrExit(options);
  const now = options.now ?? Date.now();
  const key = cacheKey(credentials, scopeList);

  const cached = tokenCache.get(key);
  if (cached && cached.expiresAtMs > now) return cached.token;

  const assertion = buildJwtAssertion(credentials, scopeList, { now });
  const body = new URLSearchParams({ grant_type: JWT_BEARER_GRANT, assertion }).toString();

  let response;
  try {
    response = await (options.fetchImpl ?? fetch)(credentials.token_uri ?? TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (err) {
    // Transport failure. Redact because the assertion itself is in scope here.
    throw new Error(`Token request failed: ${redact(err)}`);
  }

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok || !json?.access_token) {
    // Google returns { error, error_description }. Both are safe-ish, but redact anyway:
    // a malformed-JWT error can quote the assertion back at us.
    const detail = json?.error_description ?? json?.error ?? text.slice(0, 200);
    throw new Error(`Token request rejected (HTTP ${response.status}): ${redact(detail)}`);
  }

  const lifetime = Number(json.expires_in) || ASSERTION_LIFETIME_SECONDS;
  tokenCache.set(key, {
    token: json.access_token,
    expiresAtMs: now + (lifetime - TOKEN_REFRESH_MARGIN_SECONDS) * 1000,
  });
  return json.access_token;
}

// ── Transport ───────────────────────────────────────────────────

/**
 * One authenticated request.
 *
 * DOES NOT THROW ON NON-2xx. The caller classifies with classifyError(), because a 403 can
 * mean either "your credentials are wrong" (fatal) or "you are going too fast" (routine).
 * Transport failures — DNS, socket, abort — do throw, and callers must treat those as the
 * transport class: retry, and never touch failCount or nextDue.
 *
 * @returns {Promise<{status: number, headers: Headers, json: any, text: string}>}
 */
export async function gscFetch(url, { method = 'GET', body, scopes, headers = {}, ...options } = {}) {
  const token = options.accessToken ?? (await getAccessToken(scopes ?? [SCOPE_WEBMASTERS], options));

  const init = {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      ...headers,
    },
  };
  if (body !== undefined && body !== null) {
    if (typeof body === 'string' || body instanceof Uint8Array) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      init.headers['content-type'] = 'application/json';
    }
  }

  let response;
  try {
    response = await (options.fetchImpl ?? fetch)(url, init);
  } catch (err) {
    throw new Error(`Request to ${redact(url)} failed in transport: ${redact(err)}`);
  }

  // Sitemaps submit/delete answer 200 with an EMPTY body. Parsing it as JSON would throw,
  // so an unparseable body is `null`, never an error.
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { status: response.status, headers: response.headers, json, text };
}

// ── Error classification (§11.0 table) ──────────────────────────

/**
 * The four reasons Google returns as HTTP 403 that are really rate limits. The naive rule
 * "403 is fatal" would abort the whole sweep on a routine throttle.
 */
export const RATE_LIMIT_REASONS = new Set([
  'quotaExceeded',
  'dailyLimitExceeded',
  'rateLimitExceeded',
  'userRateLimitExceeded',
]);

/**
 * Pull the machine-readable reason out of a Google error envelope. The classic form is
 * { error: { errors: [{ reason }] } }; newer surfaces use { error: { status } }.
 */
export function extractErrorReason(json) {
  const error = json?.error;
  if (!error || typeof error !== 'object') return null;
  if (Array.isArray(error.errors)) {
    for (const entry of error.errors) {
      if (entry && typeof entry.reason === 'string' && entry.reason) return entry.reason;
    }
  }
  if (typeof error.status === 'string' && error.status) return error.status;
  return null;
}

/**
 * Classify an HTTP response per §11.0.
 *
 *   'rate_limit'     -> not fatal. Sleep 15s / 60s / 900s + jitter. If the 3rd attempt still
 *                       fails, or 5 consecutive URLs hit it, persist state, write the
 *                       summary, and exit 0: the day's quota is spent, which is not a red build.
 *   'fatal'          -> exit 1. Credentials, scope, or a missing `sc-domain:` prefix.
 *   'permanent_skip' -> record lastError, set nextDue = null, log, continue. Never fatal.
 *   'retry'          -> retry 3x with backoff, then record lastError, leave nextDue
 *                       unchanged, continue.
 *
 * `hasSucceeded` is caller state: the fatal row of the table is explicitly scoped to "on the
 * first call before any URL has succeeded". A 403 that appears mid-sweep, after the
 * credentials have already proven themselves, is a property of that one URL, not of the run,
 * so it degrades to permanent_skip instead of killing 1,700 remaining inspections.
 */
export function classifyError(status, json, { hasSucceeded = false } = {}) {
  if (status >= 200 && status < 300) return 'ok';

  const reason = extractErrorReason(json);

  if (status === 429) return 'rate_limit';
  if (status === 403) {
    if (reason && RATE_LIMIT_REASONS.has(reason)) return 'rate_limit';
    return hasSucceeded ? 'permanent_skip' : 'fatal';
  }
  if (status === 400 || status === 404) return 'permanent_skip';
  if (status >= 500) return 'retry';

  // Anything unlisted (401 mid-run, 408, a proxy's 0) is treated as retryable rather than
  // fatal: the cost of one wasted retry is a second, the cost of a false fatal is the day.
  return 'retry';
}

/** Backoff schedule for the 'rate_limit' and 'retry' classes, per §11.0. */
export const RATE_LIMIT_BACKOFF_MS = [15_000, 60_000, 900_000];

/** Add up to +/-20% jitter so parallel runners do not resynchronise on the same second. */
export function jitter(ms, random = Math.random) {
  return Math.round(ms * (0.8 + random() * 0.4));
}
