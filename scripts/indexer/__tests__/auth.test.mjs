import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ANALYTICS_URL,
  CREDENTIAL_REMEDIATION,
  INDEXING_BATCH,
  INDEXING_URL,
  INSPECT_URL,
  JWT_BEARER_GRANT,
  RATE_LIMIT_REASONS,
  SCOPE_INDEXING,
  SCOPE_WEBMASTERS,
  SITEMAPS_BASE,
  SITE_URL,
  TOKEN_URL,
  buildJwtAssertion,
  classifyError,
  clearTokenCache,
  extractErrorReason,
  getAccessToken,
  gscFetch,
  jitter,
  loadServiceAccount,
  parseServiceAccount,
  redact,
  resolveCredentialSource,
  sitemapResourceUrl,
  sitemapsListUrl,
} from '../auth.mjs';

// A throwaway keypair, generated per run. The real key at secrets/gsc-service-account.json
// is NEVER read by these tests.
function throwawayCredentials() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return {
    publicKey,
    credentials: {
      client_email: 'throwaway@example.iam.gserviceaccount.com',
      private_key: privateKey,
      private_key_id: 'test-key-id',
      token_uri: TOKEN_URL,
    },
  };
}

function decodeSegment(segment) {
  return JSON.parse(Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

function fakeResponse({ status = 200, body = '', headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    async text() {
      return body;
    },
  };
}

// ── §11.0 constants ─────────────────────────────────────────────

test('§11.0 constants are the exact contract values', () => {
  assert.equal(SCOPE_WEBMASTERS, 'https://www.googleapis.com/auth/webmasters');
  assert.equal(SCOPE_INDEXING, 'https://www.googleapis.com/auth/indexing');
  assert.equal(SITE_URL, 'sc-domain:scrimbaguide.tech');
  assert.equal(INSPECT_URL, 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect');
  assert.equal(SITEMAPS_BASE, 'https://searchconsole.googleapis.com/webmasters/v3/sites');
  assert.equal(ANALYTICS_URL, 'https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Ascrimbaguide.tech/searchAnalytics/query');
  assert.equal(INDEXING_URL, 'https://indexing.googleapis.com/v3/urlNotifications:publish');
  assert.equal(INDEXING_BATCH, 'https://indexing.googleapis.com/batch');
  assert.equal(JWT_BEARER_GRANT, 'urn:ietf:params:oauth:grant-type:jwt-bearer');
});

test('the read-write webmasters scope is the only Search Console scope exported', async () => {
  // Least-privilege webmasters.readonly gives a silent 403 on every sitemap submit, so the
  // module must not offer it as a tempting alternative.
  const source = await fs.promises.readFile(new URL('../auth.mjs', import.meta.url), 'utf8');
  const exportedReadonly = /export\s+const\s+\w+\s*=\s*'[^']*webmasters\.readonly'/.test(source);
  assert.equal(exportedReadonly, false);
});

test('sitemap resource URLs percent-encode both the site and the absolute feedpath', () => {
  assert.equal(
    sitemapResourceUrl('https://scrimbaguide.tech/de/sitemap.xml'),
    'https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Ascrimbaguide.tech/sitemaps/https%3A%2F%2Fscrimbaguide.tech%2Fde%2Fsitemap.xml',
  );
  assert.equal(
    sitemapsListUrl(),
    'https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Ascrimbaguide.tech/sitemaps',
  );
});

// ── Error classification table (§11.0), every row ───────────────

test('classifyError: 403 rate-limit reasons are NOT fatal', () => {
  for (const reason of RATE_LIMIT_REASONS) {
    const json = { error: { code: 403, errors: [{ reason }] } };
    assert.equal(classifyError(403, json), 'rate_limit', `403/${reason}`);
    assert.equal(classifyError(403, json, { hasSucceeded: true }), 'rate_limit', `403/${reason} mid-sweep`);
  }
});

test('classifyError: any 429 is a rate limit regardless of reason', () => {
  assert.equal(classifyError(429, null), 'rate_limit');
  assert.equal(classifyError(429, { error: { errors: [{ reason: 'backendError' }] } }), 'rate_limit');
});

test('classifyError: 403 with any other reason before a success is fatal', () => {
  const json = { error: { code: 403, errors: [{ reason: 'forbidden' }] } };
  assert.equal(classifyError(403, json), 'fatal');
  assert.equal(classifyError(403, { error: { status: 'PERMISSION_DENIED' } }), 'fatal');
  assert.equal(classifyError(403, null), 'fatal');
});

test('classifyError: a 403 after a URL has already succeeded degrades to permanent_skip', () => {
  // The fatal row of the table is scoped to "before any URL has succeeded"; a mid-sweep 403
  // must not abort 1,700 remaining inspections.
  const json = { error: { code: 403, errors: [{ reason: 'forbidden' }] } };
  assert.equal(classifyError(403, json, { hasSucceeded: true }), 'permanent_skip');
});

test('classifyError: 400 and 404 are permanent_skip, never fatal', () => {
  assert.equal(classifyError(400, { error: { errors: [{ reason: 'badRequest' }] } }), 'permanent_skip');
  assert.equal(classifyError(404, { error: { errors: [{ reason: 'notFound' }] } }), 'permanent_skip');
});

test('classifyError: 5xx is retry', () => {
  assert.equal(classifyError(500, null), 'retry');
  assert.equal(classifyError(502, null), 'retry');
  assert.equal(classifyError(503, { error: { errors: [{ reason: 'backendError' }] } }), 'retry');
});

test('classifyError: 2xx is ok and unlisted statuses fall back to retry, not fatal', () => {
  assert.equal(classifyError(200, {}), 'ok');
  assert.equal(classifyError(204, null), 'ok');
  assert.equal(classifyError(401, null), 'retry');
  assert.equal(classifyError(0, null), 'retry');
});

test('extractErrorReason reads the classic envelope and falls back to error.status', () => {
  assert.equal(extractErrorReason({ error: { errors: [{ reason: 'quotaExceeded' }] } }), 'quotaExceeded');
  assert.equal(extractErrorReason({ error: { status: 'RESOURCE_EXHAUSTED' } }), 'RESOURCE_EXHAUSTED');
  assert.equal(extractErrorReason({}), null);
  assert.equal(extractErrorReason(null), null);
});

test('jitter stays within +/-20% of the base delay', () => {
  assert.equal(jitter(1000, () => 0), 800);
  assert.equal(jitter(1000, () => 1), 1200);
  assert.equal(jitter(1000, () => 0.5), 1000);
});

// ── Redaction ───────────────────────────────────────────────────

test('redact scrubs private keys, key ids, emails and tokens', () => {
  const { credentials } = throwawayCredentials();
  const payload = JSON.stringify({
    client_email: credentials.client_email,
    private_key_id: credentials.private_key_id,
    private_key: credentials.private_key,
  });
  const redacted = redact(payload);

  assert.ok(!redacted.includes('BEGIN PRIVATE KEY'));
  assert.ok(!redacted.includes('throwaway@example.iam.gserviceaccount.com'));
  assert.ok(!redacted.includes('test-key-id'));
  assert.ok(!redacted.includes(credentials.private_key.split('\n')[1]));
});

test('redact scrubs bearer tokens and JWT assertions out of error messages', () => {
  const { credentials } = throwawayCredentials();
  const assertion = buildJwtAssertion(credentials, [SCOPE_WEBMASTERS]);
  const message = redact(new Error(`bad assertion ${assertion} for ya29.a0AfB_byC1234567890abcdef`));
  assert.ok(!message.includes(assertion));
  assert.ok(!message.includes('ya29.a0AfB_byC1234567890abcdef'));
});

// ── Credential resolution (§11.1) ───────────────────────────────

test('resolveCredentialSource prefers the env var, verbatim JSON and not base64', () => {
  const source = resolveCredentialSource({
    env: { GSC_SERVICE_ACCOUNT_JSON: '{"client_email":"a@b.iam.gserviceaccount.com"}' },
    argv: ['--key-file', 'somewhere.json'],
    rootDir: '/nonexistent-root',
  });
  assert.equal(source.kind, 'env');
  assert.equal(source.json, '{"client_email":"a@b.iam.gserviceaccount.com"}');
});

test('resolveCredentialSource falls back to --key-file, then the default path, then null', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexer-auth-'));
  const keyFile = path.join(dir, 'key.json');
  fs.writeFileSync(keyFile, '{}');

  const viaFlag = resolveCredentialSource({ env: {}, argv: ['--key-file', keyFile], rootDir: dir });
  assert.equal(viaFlag.kind, 'key-file');
  assert.equal(viaFlag.file, keyFile);

  // No env, no flag, and no secrets/gsc-service-account.json under this fake root.
  assert.equal(resolveCredentialSource({ env: {}, argv: [], rootDir: dir }), null);

  // Now plant a default-path key under the fake root and confirm it is found by PATH only —
  // resolveCredentialSource must not read the file.
  fs.mkdirSync(path.join(dir, 'secrets'));
  fs.writeFileSync(path.join(dir, 'secrets', 'gsc-service-account.json'), '{}');
  const viaDefault = resolveCredentialSource({ env: {}, argv: [], rootDir: dir });
  assert.equal(viaDefault.kind, 'default');
  assert.equal(viaDefault.file, path.join(dir, 'secrets', 'gsc-service-account.json'));
  assert.equal(viaDefault.json, undefined);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadServiceAccount throws the one-line remediation when nothing resolves', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexer-auth-'));
  assert.throws(
    () => loadServiceAccount({ env: {}, argv: [], rootDir: dir }),
    (err) => err.message === CREDENTIAL_REMEDIATION,
  );
  fs.rmSync(dir, { recursive: true, force: true });
});

test('parseServiceAccount validates required fields without echoing their values', () => {
  assert.throws(() => parseServiceAccount('{"private_key":"x"}'), /missing client_email/);
  assert.throws(
    () => parseServiceAccount('{"client_email":"a@b.com","private_key":"nope"}'),
    (err) => /missing a usable private_key/.test(err.message) && !err.message.includes('a@b.com'),
  );
  const parsed = parseServiceAccount(JSON.stringify(throwawayCredentials().credentials));
  assert.equal(parsed.token_uri, TOKEN_URL);
});

// ── JWT assembly ────────────────────────────────────────────────

test('buildJwtAssertion produces a verifiable RS256 assertion with the right claims', () => {
  const { publicKey, credentials } = throwawayCredentials();
  const now = Date.UTC(2026, 7, 9, 12, 0, 0);
  const assertion = buildJwtAssertion(credentials, [SCOPE_WEBMASTERS], { now });

  const [headerSeg, claimsSeg, signatureSeg] = assertion.split('.');
  assert.equal(assertion.split('.').length, 3);
  assert.ok(!/[+/=]/.test(assertion), 'segments must be base64url, not base64');

  const header = decodeSegment(headerSeg);
  assert.deepEqual(header, { alg: 'RS256', typ: 'JWT', kid: 'test-key-id' });

  const claims = decodeSegment(claimsSeg);
  assert.equal(claims.iss, credentials.client_email);
  assert.equal(claims.aud, TOKEN_URL);
  assert.equal(claims.scope, SCOPE_WEBMASTERS);
  assert.equal(claims.iat, Math.floor(now / 1000));
  assert.equal(claims.exp, Math.floor(now / 1000) + 3600);

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerSeg}.${claimsSeg}`);
  verifier.end();
  const signature = Buffer.from(signatureSeg.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  assert.equal(verifier.verify(publicKey, signature), true);
});

test('buildJwtAssertion sorts and de-duplicates scopes, and rejects an empty list', () => {
  const { credentials } = throwawayCredentials();
  const assertion = buildJwtAssertion(credentials, [SCOPE_WEBMASTERS, SCOPE_INDEXING, SCOPE_WEBMASTERS]);
  const claims = decodeSegment(assertion.split('.')[1]);
  assert.equal(claims.scope, [SCOPE_INDEXING, SCOPE_WEBMASTERS].sort().join(' '));
  assert.throws(() => buildJwtAssertion(credentials, []), /at least one scope/);
});

// ── Token exchange + transport (injected fetch, no network) ─────

test('getAccessToken posts a jwt-bearer grant and caches until exp - 60s', async () => {
  clearTokenCache();
  const { credentials } = throwawayCredentials();
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return fakeResponse({ body: JSON.stringify({ access_token: 'token-1', expires_in: 3600 }) });
  };

  const now = Date.UTC(2026, 7, 9, 12, 0, 0);
  const token = await getAccessToken([SCOPE_WEBMASTERS], { credentials, fetchImpl, now });
  assert.equal(token, 'token-1');
  assert.equal(calls[0].url, TOKEN_URL);
  const body = new URLSearchParams(calls[0].init.body);
  assert.equal(body.get('grant_type'), JWT_BEARER_GRANT);
  assert.equal(body.get('assertion').split('.').length, 3);

  // Inside the cache window: no second request.
  await getAccessToken([SCOPE_WEBMASTERS], { credentials, fetchImpl, now: now + 3_000_000 });
  assert.equal(calls.length, 1);

  // Past exp - 60s: refreshed.
  await getAccessToken([SCOPE_WEBMASTERS], { credentials, fetchImpl, now: now + 3_600_000 });
  assert.equal(calls.length, 2);

  // A different scope set is a different cache entry.
  await getAccessToken([SCOPE_INDEXING], { credentials, fetchImpl, now: now + 3_600_000 });
  assert.equal(calls.length, 3);
  clearTokenCache();
});

test('getAccessToken redacts the assertion out of a rejection message', async () => {
  clearTokenCache();
  const { credentials } = throwawayCredentials();
  const fetchImpl = async (_url, init) => {
    const assertion = new URLSearchParams(init.body).get('assertion');
    return fakeResponse({
      status: 400,
      body: JSON.stringify({ error: 'invalid_grant', error_description: `bad assertion ${assertion}` }),
    });
  };
  await assert.rejects(
    () => getAccessToken([SCOPE_WEBMASTERS], { credentials, fetchImpl }),
    (err) => err.message.includes('[redacted jwt]') && !err.message.includes('eyJhbGciOiJSUzI1NiI'),
  );
  clearTokenCache();
});

test('gscFetch does not throw on non-2xx and returns the parsed body', async () => {
  const fetchImpl = async () => fakeResponse({
    status: 403,
    body: JSON.stringify({ error: { code: 403, errors: [{ reason: 'quotaExceeded' }] } }),
  });
  const res = await gscFetch(INSPECT_URL, { method: 'POST', body: { siteUrl: SITE_URL }, accessToken: 'x', fetchImpl });
  assert.equal(res.status, 403);
  assert.equal(classifyError(res.status, res.json), 'rate_limit');
});

test('gscFetch tolerates the empty 200 body that sitemaps.submit returns', async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return fakeResponse({ status: 200, body: '' });
  };
  const res = await gscFetch(sitemapResourceUrl('https://scrimbaguide.tech/sitemap.xml'), {
    method: 'PUT',
    accessToken: 'x',
    fetchImpl,
  });
  assert.equal(res.status, 200);
  assert.equal(res.json, null);
  assert.equal(seen.init.method, 'PUT');
  assert.equal(seen.init.headers.authorization, 'Bearer x');
  assert.equal(seen.init.body, undefined);
});
