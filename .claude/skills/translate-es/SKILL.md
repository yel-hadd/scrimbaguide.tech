---
name: translate-es
description: Spanish (LatAm-neutral) language profile for translating scrimbaguide.tech. Use together with the translate-content skill whenever translating or transcreating any page, UI string or catalog string into Spanish. Covers register, typography, morphosyntactic hazards, length expansion, Spanish-market search behaviour and competitors, translationese markers, known LLM failure modes and sign-off criteria.
---

# Spanish (es)

**Canonical Docusaurus locale tag: `es`.** Skill directory `translate-es`, i18n directory
`i18n/es/`, `htmlLang: es`, direction `ltr`, tier A, coverage `full`.

Load **`translate-content` as well**. That skill owns every repo mechanic (frontmatter, JSX,
anchors, glossary, sidecars, QA gate). This file owns Spanish, and repeats none of it.

`es` is the **reference implementation**: it is the first locale, the largest non-English
developer market, the lowest-risk script, and the locale the MQM thresholds are calibrated on.
Whatever is vague here gets copied into 46 other files, so fix it here rather than working
around it downstream.

---

## 1. Register decision, with justification

**Use `tú`. Never `usted`. LatAm-neutral vocabulary, no país-specific slang.**

Why `tú`:

- The audience is developers and career changers learning to code, most of them 20 to 35. In
  Spanish-language developer education, `tú` is the unmarked form: Platzi, freeCodeCamp Español,
  MDN en español and Código Facilito all use it. `usted` in this context reads as a bank letter
  or a government form, and it puts distance between the reader and a site whose whole pitch is
  "you type in the lesson".
- The English source addresses the reader directly and constantly ("you get", "you will
  build"). Rendering that with `usted` would force a formality the English never had, which is
  an MQM Fluency/Register error, not a stylistic preference.
- Consistency matters more than the choice itself. Register drift across 190 pages is the
  clearest machine-output tell there is, and mixed `tú`/`usted` inside one page is the version
  of it a reader notices immediately.

**Vosotros is banned.** It is Spain-only and instantly marks the page as not written for the
larger market. Plural address is `ustedes` on the rare occasions it is needed.

Why LatAm-neutral rather than es-ES: Mexico, Colombia, Argentina, Chile and Peru together
dominate the Spanish-language developer search volume, and neutral Spanish reads as slightly
formal but correct in Spain, while Peninsular Spanish reads as foreign in Latin America. A
future `es-ES` split is a derived orthography and vocabulary pass, not a fresh translation.

Neutral vocabulary decisions, applied everywhere:

| Use | Not |
|---|---|
| computadora / la computadora | ordenador (ES), compu (informal) |
| video | vídeo (ES) |
| celular | móvil (ES) |
| programación, programar | codear, codificar |
| curso gratis / gratuito | curso free |
| suscripción | membresía (varies by market) |
| navegador | browser |
| empezar, aprender | comenzar a (heavier), iniciar (calque) |

Anglicisms that STAY in English because the market uses them: `frontend`, `backend`,
`fullstack`, `bootcamp`, `deploy` (verb: "hacer deploy" or better "desplegar"), `framework`,
`bug`, `commit`, `pull request`, plus everything frozen in `glossary.csv`.

---

## 2. Typographic and orthographic rules, as testable assertions

Written so they can be promoted into `check-content.config.json` as `es` rules.

1. **Opening `¿` is mandatory.** Every sentence ending in `?` opens with `¿`.
   Assert: no `?` in prose whose sentence has no matching `¿` before it.
   This is the single most common Spanish machine-output defect and it appears in titles first:
   `"Learn React": ¿merece la pena?`, never `"Learn React": merece la pena?`.
2. **Opening `¡` is mandatory.** Same rule for `!`. In practice the site rarely exclaims;
   if the English has no exclamation, the Spanish should not invent one.
3. **No em-dash (U+2014) and no en-dash (U+2013).** Repo-wide rule for Latin-script locales.
   Spanish parenthetical asides take commas or parentheses, and the Spanish dialogue dash
   (raya) has no use on this site.
   Assert: zero U+2014 and zero U+2013 code points in `i18n/es/**`.
4. **Headings and titles are sentence case, not Title Case.** Spanish capitalizes only the
   first word and proper nouns. `## Precios, en resumen`, never `## Precios, En Resumen`.
   Frozen English product names keep their own casing inside a sentence-case heading.
   Assert: no heading with 3+ capitalized words that are not glossary terms.
5. **Accents are kept on capital letters.** `Á É Í Ó Ú Ñ`. `MÁS`, not `MAS`.
   Assert: no all-caps word containing a vowel that the same word carries an accent on
   elsewhere in the file.
6. **No space before `?` `!` `:` `;`.** That is French. Spanish sets them tight.
   Assert: zero occurrences of ` ?`, ` !`, ` :`, ` ;` in prose.
7. **Quotation marks are `“ ”`,** not `" "` and not `« »`. Nested quotes use `‘ ’`.
   Frozen course names in a title use `“Learn React”` where the English used `"Learn React"`.
   Assert: zero straight double quotes in prose (they remain legal inside code and JSX props).
8. **Decimal separator is the point; no thousands separator below 10,000.**
   Durations and lesson counts come from the catalog and sit next to code and UI, and the
   larger LatAm markets (MX, CO, PE, CL) use the point. `9.8 h`, `207 lecciones`.
   Assert: no digit sequence of the form `\d,\d` in a duration or count.
9. **Percent sign is tight: `50%`.** Not `50 %`.
10. **Dates are `12 de agosto de 2026`**, month lowercase, no ordinal. Never `Agosto 12, 2026`.
11. **`ñ` and accents are never stripped**, including in `title` and `description`. A
    frontmatter value that lost its accents is a Locale error, not a typo.
12. **No double spaces, no space before a closing tag, no trailing whitespace.**

Sources: CLDR for number, date and capitalisation (`contextTransforms`) patterns; RAE for
punctuation. Do not invent rules that CLDR already answers.

---

## 3. Morphosyntactic hazards, EN to ES

Each with the concrete failure it causes here.

**Gerund calque of `-ing`.** English `-ing` is a noun, an adjective and a continuous tense;
Spanish `-ando/-iendo` is only the continuous tense and never a title or a noun.
`Learning React` becomes `Aprender React`, never `Aprendiendo React`. In headings and CTAs the
infinitive or a noun is correct. This is the most frequent single defect in EN to ES machine
output and it lands in H2s, which are the strings the reader scans.

**Noun stacking.** English builds `frontend developer career path`; Spanish cannot stack nouns
and must use `de` chains, which run long and get ugly fast. Prefer restructuring:
`la ruta de desarrollo frontend`, not `la ruta de la carrera del desarrollador frontend`.
This directly drives the length overrun in section 4.

**Passive voice.** `is taught by` calques to `es enseñado por`, which is wooden. Spanish
prefers the reflexive passive (`se enseña`) or an active recast (`Bob Ziroll enseña`).
Passive-voice density is one of the shallow features the translationese check measures, so this
is not only a style note.

**Subject pronoun overuse.** Spanish drops the subject. `Tú puedes empezar gratis` should be
`Puedes empezar gratis`. Retaining `tú` in every sentence is a literal-translation fingerprint
and reads as emphatic, which changes the tone of a neutral reviewer.

**Gender and number agreement on borrowed nouns.** `la app`, `el bootcamp`, `la web`,
`el scrim` (masculine: it is a masculine product noun; keep it consistent site-wide),
`los scrims` (frozen plural, per the glossary). Getting the article wrong on a frozen term is
visible on every page it appears.

**False friends that change meaning.** `actually` is `en realidad`, not `actualmente`.
`eventually` is `con el tiempo`, not `eventualmente`. `library` is `biblioteca`, not
`librería`. `support` (verb) is `admitir` / `ser compatible con`, not `soportar`.
`realize` is `darse cuenta`, not `realizar`. Each of these is an MQM Major Accuracy error
because the sentence still reads fluently while saying something else.

**Adverb inflation.** `-mente` adverbs are long and stack badly. `interactively` is better as
`de forma interactiva` once, but three `-mente` adverbs in a paragraph is a tell. Recast.

**Comparative constructions.** `cheaper than a bootcamp` is `más barato que un bootcamp`; do
not calque `than` after a number as `que` when Spanish requires `de` (`más de 200 lecciones`,
never `más que 200 lecciones`). This one shows up constantly on catalog pages.

**Conditional and future in claims.** English `you will build eight projects` is a promise;
Spanish future (`construirás`) carries the same force, but `vas a construir` is warmer and more
neutral-LatAm. Keep the claim strength identical to the English: never upgrade a hedge
(`can help you`) into a promise (`te consigue`).

---

## 4. Length expansion factor, measured

Measured on 16 real strings from this repo (navbar labels, MegaMenu descriptions, H2s from
`docs/comparisons/`, and two `description` frontmatter values), translated to the register
above and counted:

| Metric | Ratio ES/EN |
|---|---|
| Characters, aggregate | **1.15** |
| Words, aggregate | **1.18** |
| Characters, median per string | 1.10 |
| Characters, short UI strings (25 or fewer) | **0.98** |
| Characters, prose over 60 characters | **1.22** |

Read that shape carefully: **short UI strings do not expand** (`Paths` to `Rutas`, `Courses` to
`Cursos`), so the navbar and buttons are safe. **Prose expands about 22%**, and it is the
strings with a hard budget that suffer.

Consequences:

- **Titles: the 44 content-character cap is uniform and is NOT relaxed for Spanish.** An
  English title at 41 characters will not survive a literal translation. Cut the descriptor,
  not the frozen product name.
- **Meta descriptions: target 140 English-equivalent characters so Spanish lands under 160.**
  Write the Spanish to the budget directly rather than translating and trimming.
- **H2s: keep under about 60 characters.** Long H2s wrap to three lines on mobile and break
  the scan pattern the page depends on. This is where noun-stacking (section 3) bites.
- Table cells in comparison pages are the other pressure point: a 22% expansion in a two-column
  table forces a wrap that changes how the comparison reads. Shorten the cell, never the claim.

Re-measure after the first 20 pages ship, and replace these numbers with the real corpus
values. The method above is the method to repeat.

---

## 5. Search behaviour in this market

This is what makes the file an SEO skill and not a translation skill. `keywords` frontmatter is
**re-researched from this section**, never translated.

**Evaluation intent (highest commercial value):**

| Pattern | Note |
|---|---|
| `opiniones` | The dominant review modifier. "Scrimba opiniones", "Platzi opiniones". |
| `vale la pena` | LatAm phrasing of "is it worth it". Use in body copy and titles. |
| `merece la pena` | Spain phrasing. Include as a secondary variant in body copy, not in the title. |
| `reseña` | Lower volume than `opiniones`, cleaner SERP. Good for an H2. |
| `es bueno` / `es confiable` | Trust-oriented long tail: "¿Scrimba es bueno?" |
| `precio` / `cuánto cuesta` | Pricing intent. Answer the question, never with a number: link to `/our-pricing`. |
| `gratis` | Very high volume. "cursos de programación gratis" is a top-of-funnel workhorse. |

**Learning intent:** `aprender a programar`, `curso de React`, `curso de JavaScript desde
cero`, `desde cero` (the Spanish equivalent of "from scratch", extremely common and worth
carrying into H1s), `paso a paso`, `en español` (searchers add this explicitly, so the page
being in Spanish is itself the differentiator).

**Career intent:** `cambiar de carrera a programación`, `ser programador sin título`,
`primer trabajo como desarrollador`, `sueldo desarrollador junior`.

**Local competitor set** (for the Phase 7 transcreation of money pages, and for the comparison
pages' framing):

- **Platzi** is the incumbent and the single most important local comparison. Colombian, huge
  in MX/CO/AR, subscription model, Spanish-language video with a strong community angle. Any
  transcreated money page that lists only Codecademy and Udemy is missing the comparison the
  reader actually came for.
- **Código Facilito** (MX), **EDteam** (PE), **Open Bootcamp** and **KeepCoding** (ES),
  **Coderhouse** (AR) for bootcamp-style comparisons.
- **freeCodeCamp en español** and **MDN en español** are the free-alternative benchmarks.
- Udemy is present and price-anchored in this market; Coursera is present and university-branded.

Transcreated pages use Platzi as the primary local anchor, keep the English source's claims,
and never invent a comparison the site has not researched.

---

## 6. Spanish translationese markers

The automatable half feeds `scripts/translationese-check.mjs`; the rest is for the reflect step.

**Phrases that mark machine or AI Spanish. Avoid unless the English forces them:**

- `en el mundo de la programación`, `hoy en día`, `en la era digital`
- `cabe destacar`, `es importante destacar`, `es importante mencionar`, `vale la pena señalar`
- `sumergirse en`, `adentrarse en`, `desbloquear tu potencial`
- `poderoso` / `potente` for "powerful", `robusto` for "robust", `sólido` for "solid"
- `permite a los usuarios`, `ofrece la posibilidad de`
- `asimismo`, `no obstante`, `por consiguiente`, `en primer lugar` (correct, but a density of
  formal connectors is the register of a translated white paper, not a review)
- `el cual` / `la cual` where `que` is natural
- `Aprende más` for "Learn more" (prefer `Más información`, `Ver más`, or a concrete label)

**Structural markers, which are what the JSD check actually measures:**

- Function-word frequency skew from calqued prepositions: `de` inflation from noun-stacking,
  `para` where Spanish would use an infinitive alone.
- Sentence length tracking the English one for one. Spanish paragraphs breathe differently;
  a Spanish page whose sentence-length distribution matches the English exactly is a
  translated page, and it is detectable.
- Subject pronoun retention (section 3).
- Passive-voice density above native Spanish technical writing.
- Low ratio of `se` constructions.

The `humanizer` skill is the English-language version of this check and is the model for the
Spanish one. Load it for the refine step on money pages.

---

## 7. Known LLM failure modes for EN to ES

**This section starts EMPTY and grows.** It is the compounding asset in the whole system: every
entry here is a defect the next 200 pages do not repeat.

**How to add an entry.** When the cold judge fails a page a third time (attempt 3 of the
failure ladder in `translate-content/references/workflow.md`), append the error class here
before re-translating. Also append anything the native-register critic flags twice on
different pages.

Format:

```
### <short name of the failure>
Seen on: <route>, <route>
Symptom: <what the output does>
Cause: <why the model does it, if known>
Fix instruction: <one sentence that can be pasted into the translate prompt>
```

_(No entries yet. The first Spanish run populates this.)_

---

## 8. Sign-off criteria

| Gate | Threshold for `es` |
|---|---|
| MQM, money pages (paths, comparisons, pricing, the 3 money blog posts) | under **3.0** per 1,000 source words |
| MQM, everything else | under **5.0** per 1,000 source words |
| Major Accuracy errors | **0**, always |
| Terminology violations | **0**, always (binary, `glossary-check.mjs`) |
| Minimum absolute budget | a page also passes at 2.0 total points regardless of length |
| Translationese JSD | at or below the `es` native profile p95 |

**Who clears it:** the cold judge (a model instance that never saw the drafting context), plus
the deterministic per-file gate, plus the per-locale barrier. There is no human review branch
at any tier.

**`es` carries one extra obligation as the calibration locale.** The first 20 pages are scored,
then the thresholds above are confirmed or adjusted **once** and frozen for Tier A. Record the
20 scores and the decision alongside this file before continuing; a threshold that keeps moving
is not a gate.

**Launch gate for the locale:** coverage complete relative to `full`, no more than 10% of
declared routes auto-dropped, locale build green with `onBrokenLinks` and `onBrokenAnchors` set
to throw. Then, and only then, `status: 'live'` in `i18n/locales.config.ts`.
