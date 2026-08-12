/**
 * Docusaurus plugin: register the `/search` route and build the Pagefind index.
 *
 * Replaces `@easyops-cn/docusaurus-search-local` (I18N-PLAN.md section 12). That
 * plugin shipped a single 7.8 MB lunr JSON that the browser had to download in
 * full before the first keystroke, and it duplicated that monolith into every
 * locale build (~374 MB at the full 48-locale roster, blocker B2). Pagefind
 * instead emits a sharded binary index: a ~45 KB runtime, a ~72 KB WASM blob and
 * ~28 KB index chunks, of which the browser fetches only the chunks a query
 * actually touches.
 *
 * TWO RESPONSIBILITIES, deliberately in one plugin:
 *
 *   1. `contentLoaded` registers `/search` (baseUrl-prefixed, so `/de/search`
 *      under `localeConfigs.de.baseUrl`). The route used to come from the
 *      easyops theme; without it `@theme/SearchPage` would be an orphan file and
 *      the `SearchAction` JSON-LD in `config/metadata.ts` would point at a 404.
 *      This half NEVER skips - every locale build needs its own search page.
 *   2. `postBuild` shells out to the Pagefind CLI over `outDir`.
 *
 * ZERO LOCALE WIRING, ON PURPOSE (plan section 12.2). Pagefind reads the `lang`
 * attribute of each page's `<html>` element and builds one independent index per
 * language it finds; at query time the browser reads the same attribute and
 * loads only its own language's index. Docusaurus already sets `<html lang>`
 * from `localeConfigs[locale].htmlLang`, so there is nothing to configure here.
 * NEVER pass `--force-language`: it collapses all 48 languages into one index
 * and makes every visitor download every language.
 *
 * WHY THE SKIP GATE MATTERS. A registered `postBuild` plugin also runs inside
 * every matrix `build-locale` job. Without `SKIP_PAGEFIND=1` there, the assemble
 * step would merge up to 48 per-locale `pagefind/` directories into the tree and
 * then add the merged index on top - recreating the exact size problem this
 * migration exists to fix. The contract (plan Phase 0b): every matrix job sets
 * `SKIP_PAGEFIND=1`, assemble deletes every per-locale `pagefind` directory it
 * merged, and then runs `pagefind --site merged` over the MERGED tree, once.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');

/** Route path (relative to baseUrl) served by `@theme/SearchPage`. */
const SEARCH_ROUTE = 'search';

/**
 * `/de/` + `search` -> `/de/search`.
 *
 * `normalizeUrl` from `@docusaurus/utils` does this, but requiring it would add
 * an undeclared dependency on a package that only reaches this plugin
 * transitively through `@docusaurus/core`. Docusaurus normalizes `baseUrl` to
 * always carry a leading and a trailing slash before a plugin ever sees it, so
 * the join is a single well-defined case.
 */
function joinBaseUrl(baseUrl, route) {
  const prefix = baseUrl && baseUrl.endsWith('/') ? baseUrl : `${baseUrl || ''}/`;
  return `${prefix}${route}`;
}

/** Directory Pagefind writes into, relative to `outDir`. Also the URL prefix. */
const PAGEFIND_DIR = 'pagefind';

/**
 * Chrome that would otherwise be indexed as page content.
 *
 * Pagefind already ignores `nav` and `footer` by default, which covers the
 * navbar, both sidebars, breadcrumbs, pagination and the whole site footer
 * (verified against a real build: no navbar CTA and no footer text reaches a
 * fragment). Two things do leak, and both are on EVERY page:
 *
 *   - the skip-to-content link, which lands at the head of every excerpt;
 *   - the table of contents, which repeats every heading on the page and so
 *     doubles the weight of heading words in the ranking.
 *
 * The TOC class names are stable Docusaurus theme classes, but the skip link's
 * is CSS-module-hashed (`skipToContent_fXkl`), hence the substring match.
 *
 * This is an exclusion list, NOT a root selector. `--root-selector main` would
 * do the same job more tidily and would also silently drop any page that has no
 * `<main>` element out of the index entirely, which is a worse failure than a
 * little noise: it fails open on chrome and closed on content.
 */
const EXCLUDE_SELECTORS = [
  '[class*="skipToContent"]',
  '.theme-doc-toc-desktop',
  '.theme-doc-toc-mobile',
  '.table-of-contents',
].join(',');

/**
 * Locating the CLI, most deterministic first.
 *
 * The `pagefind` package declares `"exports"` with only an `import` condition,
 * so `require.resolve('pagefind')` and `require.resolve('pagefind/package.json')`
 * both throw ERR_PACKAGE_PATH_NOT_EXPORTED from this CommonJS plugin. Hence the
 * path probing rather than a resolve call. `npx` is the last resort because it
 * is the only step that can reach the network.
 */
function resolvePagefindCommand(siteDir) {
  if (process.env.PAGEFIND_BIN) {
    return { command: process.env.PAGEFIND_BIN, args: [], how: 'PAGEFIND_BIN' };
  }

  const binJs = path.join(siteDir, 'node_modules', 'pagefind', 'lib', 'runner', 'bin.cjs');
  if (fs.existsSync(binJs)) {
    // Spawned through this process' own node so the shebang and PATH play no part.
    return { command: process.execPath, args: [binJs], how: 'node_modules/pagefind' };
  }

  for (const shim of ['pagefind', 'pagefind.cmd']) {
    const binShim = path.join(siteDir, 'node_modules', '.bin', shim);
    if (fs.existsSync(binShim)) {
      return { command: binShim, args: [], how: 'node_modules/.bin' };
    }
  }

  return { command: 'npx', args: ['--yes', 'pagefind'], how: 'npx' };
}

/** Total bytes under `dir`, or null when it does not exist. */
async function directorySize(dir) {
  let total = 0;
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += (await directorySize(full)) ?? 0;
    } else if (entry.isFile()) {
      total += (await fsp.stat(full)).size;
    }
  }
  return total;
}

function formatBytes(bytes) {
  if (bytes === null) return 'unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * The full argument list, minus the binary.
 *
 * Note what is NOT here: `--force-language`. Pagefind derives the language of
 * each page from its `<html lang>` and builds one index per language; forcing a
 * single language would merge all 48 into one index and make every visitor
 * download every language's terms. See the header comment.
 */
function pagefindArgs(outDir) {
  return ['--site', outDir, '--exclude-selectors', EXCLUDE_SELECTORS];
}

function runPagefind({ command, args }, outDir) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      [...args, ...pagefindArgs(outDir)],
      // The index is small but the walk is over every built HTML file; 10 MB of
      // buffered output is far more than Pagefind's summary ever produces.
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(
            `[pagefind] indexing failed: ${error.message}\n${stdout}\n${stderr}`,
          ));
          return;
        }
        resolve(`${stdout}${stderr}`);
      },
    );
  });
}

/** The `Indexed N languages/pages/words` block, flattened to one line. */
function summarizePagefindOutput(output) {
  const interesting = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^Indexed \d/.test(line) || /^Discovered \d+ language/.test(line));
  return interesting.length > 0 ? interesting.join(', ') : 'no summary reported';
}

module.exports = function pagefindPlugin(context) {
  const { baseUrl, siteDir } = context;

  return {
    name: 'pagefind',

    async contentLoaded({ actions: { addRoute } }) {
      addRoute({
        // Prefixed with the locale baseUrl, so this is `/search` for en and
        // `/de/search` for de. `trailingSlash: true` turns it into
        // `search/index.html` at write time, matching the canonical shape the
        // `SearchAction` target and `normalize-canonical-urls` both expect.
        path: joinBaseUrl(baseUrl, SEARCH_ROUTE),
        component: '@theme/SearchPage',
        exact: true,
      });
    },

    async postBuild({ outDir }) {
      if (process.env.SKIP_PAGEFIND === '1') {
        console.log(
          '[pagefind] SKIP_PAGEFIND=1, skipping indexing. ' +
          'The merged-tree build is expected to run Pagefind once over all locales.',
        );
        return;
      }

      const command = resolvePagefindCommand(siteDir);
      const output = await runPagefind(command, outDir);
      const size = await directorySize(path.join(outDir, PAGEFIND_DIR));

      console.log(`[pagefind] indexed via ${command.how}: ${summarizePagefindOutput(output)}`);
      console.log(`[pagefind] index written to ${PAGEFIND_DIR}/ (${formatBytes(size)} on disk)`);
    },
  };
};

// Named exports for the unit tests (scripts/__tests__/search-modal.test.mjs).
// The plugin entry point stays the default CommonJS export so the `plugins`
// array in docusaurus.config.ts keeps working unchanged.
module.exports.SEARCH_ROUTE = SEARCH_ROUTE;
module.exports.PAGEFIND_DIR = PAGEFIND_DIR;
module.exports.joinBaseUrl = joinBaseUrl;
module.exports.pagefindArgs = pagefindArgs;
module.exports.EXCLUDE_SELECTORS = EXCLUDE_SELECTORS;
module.exports.resolvePagefindCommand = resolvePagefindCommand;
module.exports.summarizePagefindOutput = summarizePagefindOutput;
module.exports.formatBytes = formatBytes;
