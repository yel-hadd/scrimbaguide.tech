#!/usr/bin/env bash
# Interleaved Lighthouse A/B for one path on two servers (mobile, lab data).
#
#   bash scripts/visual/lh-ab.sh <path> <baseUrlA> <baseUrlB> [runs=6]
#   bash scripts/visual/lh-ab.sh / http://127.0.0.1:3101 http://127.0.0.1:3102
#
# Each round runs A then B, so load on this machine (a build, a browser, the
# other side's server) hits both sides equally. Never compare a "before" batch
# with an "after" batch run later: on 2026-09-27 a sequential before/after of /
# showed mobile perf falling 94 to 76, and the interleaved rerun of the same
# two builds reversed it to 65.5 to 74.5 (LCP 7.6 s to 6.25 s).
#
# Prints the median performance score, LCP, FCP, TBT, CLS and the most frequent
# LCP element per side. Raw JSON goes to $LH_AB_OUT (default: a new mktemp dir;
# set it under /home/toor/sg-work/<program>/ to keep the runs past a reboot).
# Needs Chrome at $CHROME_PATH (default /usr/bin/google-chrome); lighthouse@12.6.1
# (the version the pinned @lhci/cli 0.15.1 runs) comes from npx, nothing is installed in the repo.
set -euo pipefail

usage="usage: lh-ab.sh <path> <baseUrlA> <baseUrlB> [runs=6]"
PAGE="${1:?$usage}"
A="${2:?$usage}"
B="${3:?$usage}"
RUNS="${4:-6}"
CHROME_PATH="${CHROME_PATH:-/usr/bin/google-chrome}"
OUT="${LH_AB_OUT:-$(mktemp -d -t lh-ab-XXXXXX)}"
mkdir -p "$OUT"

for side in A B; do
  base="${!side}"
  curl -sf -o /dev/null "${base%/}${PAGE}" || { echo "no answer from ${base%/}${PAGE}" >&2; exit 2; }
done

for i in $(seq 1 "$RUNS"); do
  for side in A B; do
    base="${!side}"
    out="$OUT/${side}-run${i}.json"
    echo "== round $i/$RUNS side $side: ${base%/}${PAGE}"
    npx -y lighthouse@12.6.1 "${base%/}${PAGE}" \
      --output=json --output-path="$out" \
      --chrome-path="$CHROME_PATH" \
      --chrome-flags="--headless=new --no-sandbox" \
      --only-categories=performance \
      --quiet || echo "!! run failed: side $side round $i" >&2
  done
done

node - "$OUT" "$A" "$B" <<'EOF'
const fs = require('fs');
const path = require('path');
const [dir, urlA, urlB] = process.argv.slice(2);
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
function lcpSelector(audit) {
  const outer = audit?.details?.items?.[0];
  const item = outer?.items?.[0] ?? outer;
  return item?.node?.selector ?? item?.node?.snippet ?? '(none)';
}
for (const [side, url] of [['A', urlA], ['B', urlB]]) {
  const runs = fs.readdirSync(dir)
    .filter((f) => f.startsWith(`${side}-run`) && f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .filter((r) => r.categories?.performance?.score != null);
  if (!runs.length) { console.log(`${side} ${url}: no successful runs`); continue; }
  const num = (id) => median(runs.map((r) => r.audits[id].numericValue));
  const counts = {};
  for (const r of runs) {
    const sel = lcpSelector(r.audits['largest-contentful-paint-element']);
    counts[sel] = (counts[sel] || 0) + 1;
  }
  const [lcpEl, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  console.log(`${side} ${url} (${runs.length} runs)`);
  console.log(`  perf ${(median(runs.map((r) => r.categories.performance.score)) * 100).toFixed(1)}` +
    `  LCP ${Math.round(num('largest-contentful-paint'))} ms  FCP ${Math.round(num('first-contentful-paint'))} ms` +
    `  TBT ${Math.round(num('total-blocking-time'))} ms  CLS ${num('cumulative-layout-shift').toFixed(3)}`);
  console.log(`  LCP element (${n}/${runs.length}): ${lcpEl}`);
}
console.log(`Raw JSON: ${dir}`);
EOF
