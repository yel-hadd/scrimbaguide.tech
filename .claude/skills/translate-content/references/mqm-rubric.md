# MQM rubric

Quality is scored with **MQM** (Multidimensional Quality Metrics), the framework stewarded by
the MQM Council, aligned with **ISO 5060** and used as the human-evaluation standard at WMT.
It replaces "does this read okay" with a countable error rate.

Scoring is done by a **cold judge**: a separate model instance that never saw the drafting
context. A reviewer holding the drafting context rationalises its own choices.

## Error categories

| Category | Sub-types we care about |
|---|---|
| **Accuracy** | Mistranslation, Omission, Addition, Untranslated text |
| **Fluency** | Grammar, Spelling, Punctuation, Register, Inconsistency, Character encoding |
| **Terminology** | Glossary violation, inconsistent term use |
| **Style** | Awkward, unidiomatic, translationese |
| **Locale** | Number/date/currency format, typographic convention |
| **Non-translation** | Segment is unusable |

## Severity weights

| Severity | Points |
|---|---|
| Minor | 1 |
| Major | 5 |
| Non-translation | 25 |
| Negligible (minor punctuation) | 0.1 |

## The gate

A page ships when **all three** hold:

1. MQM error score **under 5.0 points per 1,000 source words**
2. **zero Major Accuracy errors**
3. **zero Terminology violations**

Terminology is binary rather than weighted on purpose: a mistranslated affiliate CTA or an
invented course name is a **commercial** error, not a stylistic one. It points a reader at a
product that does not exist in the catalog.

## The denominator is English source words

Identical for every locale, always. Without pinning this, two judges score the same page
differently, and a target-word denominator would need a segmenter for `ja`/`zh`/`th` that
nothing in this program defines: the same page would score 5.0 in French and 8.7 in Japanese
purely as an artefact of tokenization.

```bash
node scripts/mqm-wordcount.mjs docs/comparisons/scrimba-vs-udemy.mdx
```

The counter strips frontmatter, fenced code, inline code, import/export lines, JSX tags **and
all attribute values**, and markdown link targets (keeping link text), then counts whitespace
tokens containing at least one letter or digit. **Record `sourceWords` in the status sidecar**
so any score stays reproducible after the source changes.

```
score = (sum of severity weights) / sourceWords * 1000
```

## Minimum absolute error budget

A rate alone punishes short pages: a 300-word practice page fails on a single Minor error while
a 2,400-word comparison absorbs twelve. So a page also passes if it has **at most 2 points
total**, regardless of length, provided rules 2 and 3 still hold.

## Per-tier calibration

Calibrate on the first 20 `es` pages, then freeze per tier:

| Page class | Threshold |
|---|---|
| Tier A money pages (paths, comparisons, pricing, the 3 money blog posts) | strict: 3.0 / 1000 |
| Tier A everything else | 5.0 / 1000 |
| Tier C/D catalog and hub pages | 6.0 / 1000 |

Rules 2 and 3 never relax. Record the threshold in force alongside the score.

## What is NOT an error

- A sentence restructured to fit the target language's syntax. Faithful is not literal.
- A transcreated money page that swaps the competitor set or the job-market framing. That is
  the instruction (SKILL.md section 9); score it against the transcreation brief, not against
  the English sentence order.
- An English proper name left in English: course titles, path names and the platform vocabulary
  are frozen by `glossary.csv`. Scoring "Learn React" as Untranslated is a judge error, and it
  is the most common one on this repo.
- A `{#id}` anchor left in English. It is frozen by contract.
- Frozen code, file paths, CLI commands and URLs left in English.

## What is always Major

- A price quoted in any currency for a Scrimba plan.
- A claim the English source does not make, especially a graduate/testimonial claim
  ("when I finished the course"). The site's voice is an independent reviewer.
- A localized affiliate URL or internal route.
- An omitted CTA, comparison verdict or disclosure notice.

## Recording the result

The judge's output goes into the page's status sidecar:

```json
"mqm": { "score": 3.2, "sourceWords": 1840, "majorAccuracy": 0,
         "terminology": 0, "judgeModel": "...", "verdict": "pass" }
```

`verdict` is `pass` or `fail`. A `fail` feeds the failure ladder in `workflow.md`.

## The honest caveat

An MQM score from a model judge is a structured opinion, not a measurement. It is paired
deliberately with two checks that carry no model judgment at all: the deterministic per-file
gate (`jsx-integrity`, `glossary-check`, `check:content`) and the statistical translationese
check (`scripts/translationese-check.mjs`, plan section 13.5). Under the no-manual-review
decision, those two are the only pre-publish signals that are independent of the model doing
the grading.
