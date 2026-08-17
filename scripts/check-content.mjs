#!/usr/bin/env node
/**
 * Content guardrails. Fails the build if an editorial invariant regresses:
 *   1. No punctuation that is forbidden for the file's locale/script. For English and every
 *      other Latin-script locale that is today's rule verbatim: no em-dashes.
 *   2. No exact Scrimba prices, in ANY currency (regional + drift; link to /our-pricing).
 *      Competitor/bootcamp prices are allowed, so we only flag an amount that sits directly
 *      next to a Scrimba plan (its own price), not one that merely shares a comparison line
 *      with "Scrimba Pro".
 *   3. No reappearance of the stale Backend path duration (30.1 hrs -> 36.2 hrs).
 *   4. Affiliate integrity under i18n/**: every scrimba.com URL either routes through
 *      <AffiliateLink> or carries the `via=` param (plan invariant 9, risk R6). A translated
 *      CTA that lost its affiliate param is silent lost revenue with a green build.
 *
 * Scope: the authored English surfaces (docs, blog, src/*) plus every translation payload
 * under i18n/**. Translations were previously unchecked entirely (plan issue C9), so a
 * localized Scrimba price would have shipped unnoticed.
 *
 * Rule DATA lives in check-content.config.json. Plan section 15.2 row 3: all rule CODE lands
 * in one unit, and the per-language typographic assertions of plan section 13.2 arrive later
 * as config entries. Enabling a rule for a locale must be a data change, never a code change,
 * which is why the punctuation blacklist and the typographic rules are both table-driven here.
 *
 * Usage: node scripts/check-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_PATH = path.join(ROOT, 'check-content.config.json');

/** Authored English surfaces. Unchanged from before i18n. */
const CONTENT_DIRS = ['docs', 'blog', 'src/pages', 'src/components', 'src/content'];
/** Translation payloads (plan issue C9). Everything a translating agent can write. */
const I18N_DIR = 'i18n';

const CONTENT_EXTS = new Set(['.md', '.mdx', '.tsx', '.ts']);
/**
 * i18n/ additionally carries `.json` (the `write-translations` output: code.json and the
 * per-plugin theme JSON), which is prose the same way MDX is and leaks prices just as easily.
 */
const I18N_EXTS = new Set(['.md', '.mdx', '.tsx', '.ts', '.json']);

/**
 * Generated files under i18n/. They are rebuilt in `prebuild` from committed inputs, so
 * linting them reports the same violation twice and cannot be fixed in place.
 */
const I18N_GENERATED = new Set(['coverage.json', 'translation-status.json']);

// ---------------------------------------------------------------------------- file discovery

/**
 * `.status` sidecars (i18n/<L>/.status/*.json) are machine-written translation metadata, not
 * prose. Skipping every dot-directory covers them and any future cache dir in one rule.
 */
function isSkippedDir(name) {
  return name.startsWith('.') || name === 'node_modules';
}

export function walk(dir, exts, skipFile = () => false) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!isSkippedDir(entry.name)) out.push(...walk(full, exts, skipFile));
    } else if (exts.has(path.extname(entry.name)) && !skipFile(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Every file this check owns, as repo-relative paths. */
export function collectFiles(root = ROOT) {
  const files = [];
  for (const dir of CONTENT_DIRS) files.push(...walk(path.join(root, dir), CONTENT_EXTS));
  files.push(...walk(path.join(root, I18N_DIR), I18N_EXTS, (name) => I18N_GENERATED.has(name)));
  return files.map((f) => path.relative(root, f));
}

/**
 * `i18n/<locale>/...` -> that locale. Everything else is the source locale. Locale directory
 * names keep canonical BCP 47 casing (`pt-BR`), so no normalization here.
 */
export function localeForPath(rel) {
  const parts = rel.split(path.sep);
  return parts[0] === I18N_DIR && parts.length > 2 ? parts[1] : 'en';
}

/**
 * Only translation payloads carry the affiliate-integrity rule (plan invariant 9), i.e. files
 * under `i18n/<locale>/`. The i18n/ root holds infrastructure (locales.config.ts, tiers.json),
 * which is code the same way `src/` is and has no outbound CTAs to protect.
 */
export function isTranslationPath(rel) {
  const parts = rel.split(path.sep);
  return parts[0] === I18N_DIR && parts.length > 2;
}

// ------------------------------------------------------------------------------ price rules

// A Scrimba price leak = an amount attached to a Scrimba plan as ITS price.
// Adjacency (not mere co-occurrence) avoids flagging competitor/bootcamp/salary
// figures that share a comparison line with "Scrimba Pro".
const SCRIMBA_PRICE_LEAK = [
  // "Scrimba Pro is $20" — gap may not cross a sentence (.) or table (|) boundary.
  /scrimba\s+(?:pro|bootcamp|subscription|plan)\b[^.|\n]{0,15}\$\s?\d/i,
  // "$20/month for Scrimba Pro" — price directly attributed via for/of.
  /\$\s?\d[\d.,kK]*\s*(?:\/?\s?(?:mo|month|yr|year))?\s+(?:for|of)\s+scrimba\s+pro\b/i,
  // A Scrimba price expressed as CODE rather than prose, e.g.
  // `const scrimbaMonthly = 30`. The prose patterns above cannot see this, and
  // it shipped a live $30/mo figure into the bootcamp calculator once already.
  /(?:const|let|var)\s+\w*scrimba\w*\s*(?::\s*number\s*)?=\s*\d/i,
];

/**
 * The localized half of rule 2 (plan section 4 Phase 1 / invariant 10). The dollar patterns
 * above only understand `$`, so a translated page pricing Scrimba in euros or zloty passed.
 * Symbols are the plan's list, one per market currency: EUR GBP JPY INR TRY PLN BRL RUB SAR
 * CHF SEK/DKK/NOK CZK HUF RON BGN. ASCII fallbacks (zl, Kc, lv) are included because
 * translators type them when a keyboard layout is missing.
 */
const CUR_SYMBOL = String.raw`(?:€|£|¥|₹|₺|₽|﷼|R\$)`;
/**
 * Word-shaped currency tokens need boundaries, and `\b` is unusable here: `zł` and `лв` are
 * not ASCII word characters, so `\b` fires in the middle of them. Unicode letter lookarounds
 * under /u are the portable form.
 */
const CUR_WORD = String.raw`(?<!\p{L})(?:zł|zl|Kč|Kc|CHF|kr|Ft|lei|лв|lv)(?!\p{L})`;
const CURRENCY = `(?:${CUR_SYMBOL}|${CUR_WORD})`;
/** Amounts may carry thin/no-break spaces as thousands separators in fr, ru, pl, cs. */
const AMOUNT = String.raw`\d[\d.,\u00A0\u202F]*`;
/** Prefix (€20) and suffix (20 €) placement are both live; which one is a locale convention. */
const LOCALIZED_PRICE = `(?:${CURRENCY}\\s?${AMOUNT}|${AMOUNT}\\s?${CURRENCY})`;
const PLAN = String.raw`scrimba\s+(?:pro|bootcamp|subscription|plan)\b`;
/** Same 15-char window and same sentence/table stops as the dollar rules. */
const GAP = String.raw`[^.|\n]{0,15}`;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Price-then-plan ("20 € par mois pour Scrimba Pro") cannot use the dollar rule's `for|of`
 * connective, because the connective is a different word in all 48 languages. Positional
 * adjacency replaces it, tempered so the gap may not contain a comparison connective:
 * "30 € contre Scrimba Pro" is a competitor's price, not ours, and flagging it would fail
 * every comparison page. Connectives are config data so a locale can add its own.
 */
function buildMirrorGap(connectives) {
  const alt = connectives.map(escapeRegExp).join('|');
  return alt ? `(?:(?!${alt})[^.|\\n]){0,15}` : GAP;
}

// --------------------------------------------------------------------------- affiliate rule

/**
 * Outbound scrimba.com links only. A bare mention of the string "scrimba.com" in prose is not
 * a link and carries no revenue; subdomains (docs.scrimba.com) are documentation, not the
 * affiliate program.
 */
const SCRIMBA_URL = /https?:\/\/(?:www\.)?scrimba\.com(?:\/[^\s"'`)>\]}\\]*)?/giu;

/**
 * The URL is the value of a JSX prop or an object key: `href="https://..."`,
 * `ctaHref={"https://..."}`, `sourceUrl: "https://..."`, `"url": "https://..."` in a
 * translation JSON. Captures the prop name so it can be tested against the config allowlist.
 */
const PROP_BEFORE_URL = /(?:^|[\s{,([])["']?([A-Za-z][\w-]*)["']?\s*[:=]\s*\{?\s*["'`]$/;
/** `<a ` / `<a>` but not `<article>`. */
const RAW_ANCHOR_OPEN = /<a(?=[\s>])/g;

/**
 * The affiliate id is defined once, in src/constants.ts. Read it rather than retyping it, so a
 * rotation of the id cannot leave this guardrail asserting the old one forever. `.ts` cannot be
 * imported from a `.mjs` script, hence the source read.
 */
export function readAffiliateId(root = ROOT) {
  const file = path.join(root, 'src/constants.ts');
  const src = fs.readFileSync(file, 'utf8');
  const match = src.match(/export\s+const\s+AFFILIATE_ID\s*=\s*['"`]([^'"`]+)['"`]/);
  if (!match) throw new Error(`check-content: could not read AFFILIATE_ID from ${file}`);
  return match[1];
}

/**
 * Is the character at `index` inside an open `<Tag ...>`? `stateBefore` carries the answer
 * across line breaks, because MDX authors routinely wrap long tags over several lines (the
 * `<AffiliateLink\n  href=...\n>` shape is all over `docs/`). A `>` inside a JSX expression
 * would close the tag early here; that direction is safe for `<AffiliateLink>` (it can only
 * demand an explicit `via=`, never miss a leak).
 */
function tagOpenAt(line, index, opener, stateBefore) {
  const before = line.slice(0, index);
  const lastClose = before.lastIndexOf('>');
  let lastOpen = -1;
  if (typeof opener === 'string') {
    lastOpen = before.lastIndexOf(opener);
  } else {
    opener.lastIndex = 0;
    for (let m = opener.exec(before); m !== null; m = opener.exec(before)) lastOpen = m.index;
  }
  if (lastOpen === -1) return stateBefore && lastClose === -1;
  return lastOpen > lastClose;
}

// ---------------------------------------------------------------------------- config loading

export function loadConfig(configPath = CONFIG_PATH) {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function toCharSet(...lists) {
  const set = new Set();
  for (const list of lists) for (const ch of list ?? []) set.add(ch);
  return set;
}

/**
 * Compile one locale's punctuation blacklist and typographic rules. Forbidden characters come
 * from the script, minus anything the locale explicitly allows, so relaxing a rule for one
 * language never touches the others.
 */
function compileLocale(config, locale) {
  const defaults = config.defaultLocale ?? {};
  const entry = config.locales?.[locale] ?? defaults;
  const scriptName = entry.script ?? defaults.script ?? 'latin';
  const script = config.scripts?.[scriptName] ?? {};

  const allowed = toCharSet(script.allowedPunctuation, entry.allowedPunctuation);
  const forbidden = [
    ...toCharSet(script.forbiddenPunctuation, entry.forbiddenPunctuation),
  ].filter((ch) => !allowed.has(ch));

  const rules = (entry.rules ?? [])
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const flags = rule.flags ?? 'u';
      // Fail loudly. A half-written rule that silently never fires is worse than no rule.
      if (rule.type === 'forbid') {
        if (!rule.pattern) throw new Error(`check-content.config.json: rule "${rule.id}" is enabled but has no "pattern"`);
        return { id: rule.id, type: 'forbid', message: rule.message ?? rule.id, pattern: new RegExp(rule.pattern, flags) };
      }
      if (rule.type === 'require') {
        if (!rule.when || !rule.must) throw new Error(`check-content.config.json: rule "${rule.id}" is enabled but has no "when"/"must"`);
        return {
          id: rule.id,
          type: 'require',
          message: rule.message ?? rule.id,
          when: new RegExp(rule.when, flags),
          must: new RegExp(rule.must, flags),
        };
      }
      throw new Error(`check-content.config.json: rule "${rule.id}" has unknown type "${rule.type}"`);
    });

  return { locale, script: scriptName, forbidden, rules };
}

// ----------------------------------------------------------------------------------- linting

/** Cheap prefilters. Every price pattern needs both, and most lines have neither. */
const HAS_SCRIMBA = /scrimba/i;
const HAS_DIGIT = /\d/;
const STALE_BACKEND_HOURS = /\b(?:30\.1|39\.4)\b/;

/**
 * Build a linter. Everything language-independent is compiled once here, and each locale is
 * compiled on first sight and cached: this walks ~250 files today and thousands once i18n/
 * fills up (measured: 2,100 files in ~0.25s), so no regex may be constructed inside the
 * per-line loop and no file may be read twice. It gates every build via `prebuild`.
 */
/**
 * The bare scrimba.com URLs an English source file already contains.
 *
 * Maps a translation path back to its English original and collects every
 * scrimba.com URL there that carries no affiliate param. Used to exempt a
 * translation from the affiliate rule when it is faithfully reproducing a link
 * the English page deliberately left untagged (the /our-pricing citation).
 * Returns an empty set when the source cannot be resolved, so the rule fails
 * CLOSED: an unresolvable path keeps the strict behaviour.
 */
function englishBareScrimbaUrls(rel) {
  const m = rel.match(/^i18n\/[^/]+\/docusaurus-plugin-content-(docs\/current|blog|pages)\/(.+)$/);
  if (!m) return new Set();
  const base = { 'docs/current': 'docs', blog: 'blog', pages: 'src/pages' }[m[1]];
  const src = path.join(ROOT, base, m[2]);
  if (!fs.existsSync(src)) return new Set();
  const out = new Set();
  const text = fs.readFileSync(src, 'utf8');
  const rx = new RegExp(SCRIMBA_URL.source, 'g');
  let hit;
  while ((hit = rx.exec(text)) !== null) {
    if (!hit[0].includes('via=')) out.add(hit[0]);
  }
  return out;
}

export function createLinter({ config = loadConfig(), affiliateId = readAffiliateId() } = {}) {
  const mirrorGap = buildMirrorGap(config.priceRules?.comparisonConnectives ?? []);
  const priceRules = [
    ...SCRIMBA_PRICE_LEAK,
    // "Scrimba Pro kostet 20 €" — plan then its own price.
    new RegExp(`${PLAN}${GAP}${LOCALIZED_PRICE}`, 'iu'),
    // "20 € par mois pour Scrimba Pro" — price then the plan it belongs to.
    new RegExp(`${LOCALIZED_PRICE}${mirrorGap}${PLAN}`, 'iu'),
  ];
  const affiliateParam = `via=${affiliateId}`;
  const affiliate = config.affiliateRules ?? {};
  const wrapperTags = (affiliate.wrapperComponents ?? ['AffiliateLink']).map((c) => `<${c}`);
  // Prop names whose value is not a hand-written anchor: either a React component appends
  // `via=` itself, or the value only ever reaches JSON-LD. Data, so a new component is a
  // config edit (see the $comment on `affiliateRules` in check-content.config.json).
  const allowedProps = new Set(Object.keys(affiliate.allowedProps ?? {}));
  const localeCache = new Map();

  function localeRules(locale) {
    let compiled = localeCache.get(locale);
    if (!compiled) {
      compiled = compileLocale(config, locale);
      localeCache.set(locale, compiled);
    }
    return compiled;
  }

  /** @returns {string[]} human-readable violations, `rel:line message` shaped. */
  function lintFile(rel, text) {
    const violations = [];
    const { locale, forbidden, rules } = localeRules(localeForPath(rel));
    const checkAffiliate = isTranslationPath(rel);
    // Bare (un-tagged) scrimba.com URLs present in this file's ENGLISH source.
    // A translation copying one of these is obeying link parity, not stripping a
    // via= param -- see the exemption at the violation site below.
    const englishBareUrls = checkAffiliate ? englishBareScrimbaUrls(rel) : null;
    const lines = text.split('\n');
    // Multi-line tag state, carried down the file. Tracked for every line of a translation
    // file (not just the ones holding a URL), because a tag opened three lines earlier is
    // exactly the shape MDX authors use.
    const wrapperOpen = wrapperTags.map(() => false);
    let anchorOpen = false;

    lines.forEach((line, i) => {
      const n = i + 1;
      const excerpt = line.trim().slice(0, 100);

      for (const ch of forbidden) {
        if (line.includes(ch)) {
          // Keep the original wording for the em dash; it is the message people know.
          const label = ch === '—' ? 'em-dash (—)' : `punctuation not allowed in ${locale} (${ch})`;
          violations.push(`${rel}:${n} ${label}: ${excerpt}`);
        }
      }

      if (HAS_SCRIMBA.test(line) && HAS_DIGIT.test(line) && priceRules.some((re) => re.test(line))) {
        violations.push(`${rel}:${n} possible exact Scrimba price (link to /our-pricing instead): ${excerpt}`);
      }

      if ((line.includes('30.1') || line.includes('39.4')) && STALE_BACKEND_HOURS.test(line)) {
        violations.push(`${rel}:${n} stale Backend hours (should be 36.2 as of 2026-08): ${excerpt}`);
      }

      for (const rule of rules) {
        const failed = rule.type === 'forbid'
          ? rule.pattern.test(line)
          : rule.when.test(line) && !rule.must.test(line);
        if (failed) violations.push(`${rel}:${n} ${locale} ${rule.id}: ${rule.message}: ${excerpt}`);
      }

      if (checkAffiliate && line.includes('scrimba.com')) {
        SCRIMBA_URL.lastIndex = 0;
        let match;
        while ((match = SCRIMBA_URL.exec(line)) !== null) {
          if (match[0].includes(affiliateParam)) continue;
          const wrapped = wrapperTags.some((tag, t) => tagOpenAt(line, match.index, tag, wrapperOpen[t]));
          // A hand-written `<a href>` is never exempt: it is the one shape that reaches the
          // browser with whatever the translator typed (CLAUDE.md forbids it for this reason).
          const inRawAnchor = tagOpenAt(line, match.index, RAW_ANCHOR_OPEN, anchorOpen);
          const prop = PROP_BEFORE_URL.exec(line.slice(0, match.index))?.[1];
          if (!wrapped && !(prop && allowedProps.has(prop) && !inRawAnchor)) {
            // SOURCE PARITY EXEMPTION. Two rules of this program collide here:
            // "every scrimba.com link carries via=" (invariant 9) and "never
            // change a link target" (slug/link parity). When the ENGLISH source
            // deliberately links to scrimba.com WITHOUT the affiliate param --
            // the /our-pricing reference is the real case, where tagging an
            // "official price" citation would be dishonest -- a faithful
            // translation must copy it verbatim, and flagging that punishes the
            // translator for obeying the more important rule.
            // So: a bare URL in a translated file is a violation only if it is
            // NOT bare in the English source. A translator who STRIPS a via=
            // param still fails, which is the revenue case this rule exists for.
            if (englishBareUrls && englishBareUrls.has(match[0])) continue;
            violations.push(`${rel}:${n} scrimba.com link without affiliate attribution (use <AffiliateLink> or ${affiliateParam}): ${match[0].slice(0, 100)}`);
          }
        }
      }
      // `>` alone closes a wrapped tag (`<AffiliateLink\n href=...\n>`), so a line with no
      // `<` still moves the state.
      if (checkAffiliate && (line.includes('<') || line.includes('>'))) {
        for (let t = 0; t < wrapperTags.length; t += 1) {
          wrapperOpen[t] = tagOpenAt(line, line.length, wrapperTags[t], wrapperOpen[t]);
        }
        anchorOpen = tagOpenAt(line, line.length, RAW_ANCHOR_OPEN, anchorOpen);
      }
    });

    return violations;
  }

  return { lintFile, localeRules, config };
}

// -------------------------------------------------------------------------------------- main

export function main(root = ROOT) {
  const linter = createLinter();

  // Compile every configured locale up front. Rules compile lazily during linting, so without
  // this a typo in a rule that no file happens to reach would surface days later, and a broken
  // config would read as a content violation instead of the developer error it is.
  try {
    for (const locale of Object.keys(linter.config.locales ?? {})) {
      if (!locale.startsWith('$')) linter.localeRules(locale);
    }
  } catch (err) {
    console.error(`Content guardrail config error: ${err.message}`);
    process.exit(1);
  }

  const violations = [];
  for (const rel of collectFiles(root)) {
    violations.push(...linter.lintFile(rel, fs.readFileSync(path.join(root, rel), 'utf8')));
  }

  if (violations.length) {
    console.error(`Content guardrail failed (${violations.length} issue(s)):`);
    for (const v of violations) console.error('  ' + v);
    process.exit(1);
  }
  console.log(
    'Content guardrails passed: no em-dashes, Scrimba price leaks (any currency), stale Backend hours, or stripped affiliate params.',
  );
}

// Importable by the tests, executable by `npm run check:content`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
