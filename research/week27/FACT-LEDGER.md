# Fact ledger — week 27 batch (frozen)

Frozen during pilot #1. Posts #3 and #8 reuse these AI-trust figures verbatim.

## Framing notes

FRAMING (mandatory): All five percentage stats (84%/51%, 46%/33%/3%, 66%, 45%, 75.3%) are from the Stack Overflow 2025 Developer Survey, whose results were published Dec 29, 2025 (data collected mid-2025). They are the LATEST PUBLISHED numbers because the 2026 edition only opened June 23, 2026 and has no results yet. NEVER write 'the 2026 survey found' for any of these; always attribute to '2025' and, where natural, note the 2026 survey just opened. This is the single highest-risk error for this post.

METR scope (mandatory, do not overstate): The 19%-slower result is narrow. State the scope inline every time it is used: 16 experienced developers, large mature repos they already knew, early-2025 frontier (Cursor Pro + Claude 3.5/3.7 Sonnet). Do NOT generalize it to 'AI makes everyone slower.' METR itself added a Feb 2026 caveat that 'these historical results no longer reflect the current impact of AI models on open-source developer productivity,' so frame it as a 2025 snapshot about expert devs on familiar code, used to make the point that you cannot judge AI output you cannot read, not as a permanent verdict on AI productivity.

75.3% precision: This is the share who selected 'When I don't trust AI's answers' as a reason for asking another PERSON instead of AI, not a blanket 'three-quarters always ask a human.' Keep the approved wording's conditional framing.

Trust figures are rounded: underlying values are 45.7% distrust, 32.7% trust, 3.1% highly trust. '46% / 33% / ~3%' is accurate rounding; fine to use.

Agent-doubling: only soft point. Source says 'doubled since' the earlier 2026 agents survey, not a verified 12-month YoY. Use 'has doubled' and drop 'year over year.'

No em-dashes in any approved wording (build gates on it); curly quotes shown here are plain in intent. All figures spot-checked against the primary survey/study pages, not secondary blogs.

## Claims

### 84% use or plan to use AI tools; 51% of professional developers use them daily.

- Verdict: CONFIRMED
- Figure: 84% using or planning to use AI tools; 51% of professional developers use AI daily (prior year was 76%).
- Source: Stack Overflow 2025 Developer Survey, AI section (latest published edition) (2025-12-29 (results published; data collected mid-2025))
- URL: https://survey.stackoverflow.co/2025/ai
- Approved wording: Stack Overflow's 2025 Developer Survey, the most recent published edition (the 2026 survey only opened on June 23, 2026), found that 84% of developers are using or planning to use AI tools, and 51% of professional developers use them daily.

### More devs distrust AI accuracy (46%) than trust it (33%); only 3% highly trust.

- Verdict: CONFIRMED
- Figure: Trust = 32.7% (3.1% highly trust + 29.6% somewhat trust); distrust = 45.7% (26.1% somewhat distrust + 19.6% highly distrust); highly trust 3.1%. Rounds to 46% distrust vs 33% trust, ~3% highly trust.
- Source: Stack Overflow 2025 Developer Survey, AI section (2025-12-29 (results published))
- URL: https://survey.stackoverflow.co/2025/ai
- Approved wording: In that same 2025 survey, more developers distrust the accuracy of AI output (46%) than trust it (33%), and only about 3% say they highly trust it.

### 66% name 'almost right, but not quite' the top frustration.

- Verdict: CONFIRMED
- Figure: 66% cite 'AI solutions that are almost right, but not quite' as the biggest frustration.
- Source: Stack Overflow 2025 Developer Survey, AI section (2025-12-29 (results published))
- URL: https://survey.stackoverflow.co/2025/ai
- Approved wording: The top frustration in the 2025 survey was AI answers that are 'almost right, but not quite,' named by 66% of developers.

### 45% say debugging AI-generated code is more time-consuming.

- Verdict: CONFIRMED
- Figure: 45.2% report 'Debugging AI-generated code is more time-consuming.'
- Source: Stack Overflow 2025 Developer Survey, AI section (2025-12-29 (results published))
- URL: https://survey.stackoverflow.co/2025/ai
- Approved wording: In the 2025 survey, 45% of developers said debugging AI-generated code is more time-consuming than writing it themselves.

### 75.3% ask a person for help when AI cannot be trusted.

- Verdict: CONFIRMED
- Figure: 75.3% selected 'When I don't trust AI's answers' as the top reason they turn to another person for help instead of AI.
- Source: Stack Overflow 2025 Developer Survey, AI section (2025-12-29 (results published))
- URL: https://survey.stackoverflow.co/2025/ai
- Approved wording: When developers in the 2025 survey were asked why they turn to another person instead of AI, the most common reason, given by 75.3%, was that they do not trust the AI's answer.

### Experienced open-source devs were 19% slower with early-2025 AI tools while estimating ~20% faster (scope: 16 experienced devs, mature repos, Claude 3.5/3.7 Sonnet).

- Verdict: CONFIRMED
- Figure: 16 experienced open-source developers, 246 tasks in large mature repos (avg 22k+ stars, 1M+ lines, years of personal experience), Cursor Pro with Claude 3.5/3.7 Sonnet. They were 19% slower with AI allowed; forecast 24% speedup beforehand and still estimated ~20% speedup afterward.
- Source: METR, 'Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity' (arXiv:2507.09089) (2025-07-10)
- URL: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
- Approved wording: A METR randomized controlled trial published in July 2025 (arXiv:2507.09089) found that 16 experienced open-source developers, working in large repositories they already knew well, took 19% longer to finish tasks when allowed to use early-2025 AI tools (Cursor Pro with Claude 3.5 and 3.7 Sonnet), even though they estimated the tools had made them about 20% faster.

### The 2026 SO survey opened June 23 2026 ('for human developers only').

- Verdict: CONFIRMED
- Figure: Survey opened June 23, 2026; titled 'The 2026 Developer Survey is now open (for human developers only)!'
- Source: Stack Overflow Blog (2026-06-23)
- URL: https://stackoverflow.blog/2026/06/23/the-2026-developer-survey-is-now-open-for-human-developers-only/
- Approved wording: Stack Overflow opened its 2026 Developer Survey on June 23, 2026, billed 'for human developers only,' which is why the 2025 results are still the latest published numbers.

### Agent usage doubled year over year.

- Verdict: SOFTEN
- Figure: The June 23 2026 post states 'agent usage has doubled' and links to a May 27 2026 agents survey as the baseline; it does NOT state a clean year-over-year figure. Drop 'year over year.'
- Source: Stack Overflow Blog (2026 survey announcement) (2026-06-23)
- URL: https://stackoverflow.blog/2026/06/23/the-2026-developer-survey-is-now-open-for-human-developers-only/
- Approved wording: Stack Overflow notes that agent usage has doubled since its earlier 2026 agents survey, while developer concerns about AI-generated code have grown alongside it.

