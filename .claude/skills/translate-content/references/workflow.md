# Workflow: translate, reflect, refine, verify, judge

The reflection pattern from Andrew Ng's `translation-agent`, layered onto this repo's contract.

```
1 translate  -> 2 reflect -> 3 refine -> 4 verify (deterministic) -> 5 cold judge (MQM)
                                              |                            |
                                              +-- fail: fix and re-verify  +-- fail: failure ladder
```

## 1. Translate

Inputs to the prompt, all of them, every time:

- the English source file, whole (never a fragment: context is what prevents literalism)
- `references/glossary.csv` rows in scope for this locale
- the `translate-<lang>` profile: register, typography, morphosyntax, search behaviour
- the tier: **faithful** or **transcreation** (SKILL.md section 9)

Glossary injection is doing more work here than any amount of prompt polish. Research on
terminology-aware translation shows glossary injection plus constrained decoding measurably
reduces meaning-altering deviation. Invest there first.

## 2. Reflect

The model critiques its **own** output against explicit criteria and produces **no new
translation**. Separating critique from rewriting is what makes the critique specific.

Critique against:

- the MQM categories (`mqm-rubric.md`)
- the register decision from the language profile section 1
- the typographic assertions from section 2, one by one
- the length expansion factor from section 4 (H2s and meta descriptions that now overrun)
- the known failure modes from section 7
- the repo contract: frontmatter, anchors, JSX, glossary, voice, price rule

## 3. Refine

Apply the critique. Do not re-translate from scratch at this step.

## 4. Verify mechanically

Deterministic, no model judgment:

```bash
npm run check:content
node scripts/jsx-integrity.mjs  <englishSource> <translatedFile>
node scripts/glossary-check.mjs <englishSource> <translatedFile>
```

plus: the MDX compiles. **No `docusaurus build` here** - under the Phase 2 exclusion rule a
Core-set locale cannot build until its whole route set exists, so a per-file build gate is
unsatisfiable mid-run. The locale build happens once, at the barrier.

Mechanical failures are fixed and re-verified. They do not consume an attempt on the failure
ladder: a wrong `href` is not a quality judgment.

## 5. Judge cold

A separate model instance that never saw the drafting context scores MQM
(`mqm-rubric.md`) and returns an error list plus a verdict. Independence matters: a reviewer
holding the drafting context rationalises its own choices.

Record `score`, `sourceWords`, `majorAccuracy`, `terminology`, `judgeModel` and `verdict` in
the page's status sidecar.

## The failure ladder

The loop above has no exit on its own, and there is **no human branch**: manual review is ruled
out at every tier. Without a ladder, a page the judge fails twice has no legal state: it cannot
ship, cannot be dropped without breaking the completeness invariant, and cannot fall back to
English. An unattended run would deadlock.

| Attempt | Action |
|---|---|
| 1 | translate, reflect, refine |
| 2 | refine again with the judge's error list injected **verbatim** |
| 3 | re-translate from source, and append the accumulated errors to that language skill's section 7 ("Known LLM failure modes") |
| after 3 | record `state: "blocked"` in the sidecar with the MQM report, **auto-drop the route from the locale's coverage manifest**, and continue with the remaining pages |

A dropped route leaves hreflang, leaves the sitemap, and **never renders an English fallback**.
That is what makes auto-drop safe: the completeness invariant reads "complete relative to its
coverage manifest".

Step 3 is the compounding part of the system. A failure mode written into the language skill is
a failure mode the next 200 pages do not repeat. Skipping the write-up is how a program runs
for six weeks and learns nothing.

## The launch gate

A locale launches when:

- its coverage manifest is complete relative to `i18n/tiers.json`
- **no more than 10% of its declared routes were auto-dropped** (above that, the pipeline is
  failing on this language: hold the locale, do not launch a smaller manifest)
- the per-locale barrier is green

Below the 10% threshold, launching with a smaller manifest is legitimate.

```bash
node scripts/translation-status.mjs --check
node scripts/build-coverage-manifest.mjs --check   # enforces both completeness and the 10% veto
```

## Two honest caveats, kept in the file on purpose

- Ng reports that the reflection workflow is "sometimes competitive with, and sometimes worse
  than, commercial providers" on BLEU. **Reflection is not a guarantee.** That is why step 5 is
  a separate cold judge and why the statistical translationese check exists.
- Supervised training actively pushes LLMs toward literalism ("Lost in Literalism",
  arXiv:2503.04369). Literalism is the **expected** failure mode here, not an edge case. When
  in doubt about whether a sentence is too literal, it probably is.

## Batching

Translate one page at a time, verify it, judge it, write its sidecar, move on. Batching pages
into a single prompt trades the thing that matters (full-document context per page) for a
saving that the failure ladder then spends anyway on a re-run.

Never run two agents against the same locale directory at once. Sidecars are sharded per page,
but `data/i18n/<L>/*.json` and the four UI-string files are not.
