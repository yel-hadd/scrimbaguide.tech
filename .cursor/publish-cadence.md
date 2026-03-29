# Publication Cadence — 15 TOFU Posts Q2 2026

*Created: 2026-03-29*
*Cadence: 2 posts/week. Start date: week of March 31, 2026.*

---

## Rationale for Post Order

- **Lead with shareability** (Posts 5+13): "Can AI replace junior devs" and "What is vibe coding" both have high share-rate hooks and target active Reddit/Twitter communities. Seeding these first builds awareness and backlinks for subsequent posts.
- **Follow with volume** (Posts 1+2): Salary guide and web dev roadmap have the highest monthly search volume (20k+ each). These anchor the site's authority for career-change queries.
- **Intersperse** high-intent with high-reach to maintain organic momentum.
- **Vibe coding cluster** published in consecutive weeks (Week 2 + Week 3 + Week 4) so the hub page can go live as soon as all three are published.

---

## Week-by-Week Schedule

| Week | Start | Post A | Post B |
|------|-------|--------|--------|
| 1 | Mar 31 | Post 5 — Can AI Replace Junior Developers in 2026? | Post 13 — What Is Vibe Coding? |
| 2 | Apr 7 | Post 1 — Developer Salary Guide 2026 | Post 14 — From Vibe Coder to Real Developer |
| 3 | Apr 14 | Post 2 — Web Development Roadmap 2026 | Post 15 — Vibe Coding Survival Guide |
| 4 | Apr 21 | *Publish vibe coding hub page* | Post 12 — JavaScript Projects for Beginners |
| 5 | Apr 28 | Post 4 — How Long to Learn Web Dev? | Post 11 — How to Escape Tutorial Hell |
| 6 | May 5 | Post 3 — Is Web Development Worth It? | Post 10 — Best Coding Bootcamp Alternatives |
| 7 | May 12 | Post 6 — AI Tools for Learning to Code | Post 7 — Developer Job Without a Degree |
| 8 | May 19 | Post 8 — How to Get Your First Developer Job | Post 9 — Should JS Devs Learn TypeScript? |

---

## Per-Post Launch Actions

For every post published, execute these steps on publish day:

### 1. On-site
- [ ] Verify `last_update.date` set to actual publish date
- [ ] Verify all affiliate links include UTM params (see tracking-plan.md)
- [ ] Verify `DocFaqSchema` renders in `<head>` (Rich Results Test)
- [ ] Verify additional schema (HowTo / ItemList) where applicable
- [ ] Submit URL to Google Search Console for indexing

### 2. Reddit (primary distribution)
Submit to the matching subreddit with a genuine, non-promotional framing. Post the article link in a text post — don't just drop a raw link.

| Post | Subreddit | Post angle |
|------|-----------|------------|
| Post 5 (AI Replace Devs) | r/webdev, r/cscareerquestions | "I analyzed the BLS data on AI's actual impact on developer employment — the numbers surprised me" |
| Post 13 (What Is Vibe Coding) | r/vibecoding, r/learnprogramming | "Collins WOTY 2025. Here's what vibe coding actually means for people learning to code" |
| Post 1 (Salary Guide) | r/learnprogramming, r/cscareerquestions | "Entry-level dev salaries in 2026: what each specialization actually pays" |
| Post 14 (Vibe Coder to Dev) | r/vibecoding, r/learnprogramming | "The specific JS concepts that vibe coders hit walls on — and how to learn them" |
| Post 2 (Web Dev Roadmap) | r/learnprogramming, r/webdev | "Complete web dev roadmap 2026: hours per stage, what to learn, in what order" |
| Post 15 (Vibe Coding Survival) | r/vibecoding, r/javascript | "The 10 JS concepts that cause 90% of vibe coding bugs — quick reference" |
| Post 12 (JS Projects) | r/learnjavascript, r/learnprogramming | "25 JavaScript projects for beginners, ranked by what you actually learn from each" |
| Post 4 (How Long) | r/learnprogramming | "How long does web development actually take to learn? Time estimates per skill tier" |
| Post 11 (Tutorial Hell) | r/learnprogramming | "What causes tutorial hell structurally — and the one format that prevents it" |
| Post 3 (Is It Worth It) | r/learnprogramming, r/cscareerquestions | "Is web development worth learning in 2026? ROI analysis vs bootcamp cost" |
| Post 10 (Bootcamp Alternatives) | r/learnprogramming, r/cscareerquestions | "Coding bootcamp alternatives in 2026: honest comparison (I've used most of them)" |
| Post 6 (AI Tools) | r/learnprogramming, r/webdev | "Does GitHub Copilot hurt or help when you're learning to code? It depends on the stage" |
| Post 7 (No Degree) | r/cscareerquestions, r/learnprogramming | "82% of working developers learned online. The portfolio-vs-degree debate in 2026" |
| Post 8 (First Dev Job) | r/cscareerquestions | "Complete job search guide for junior developers in 2026: portfolio, ATS, cadence" |
| Post 9 (TypeScript) | r/typescript, r/learnprogramming | "TypeScript became the #1 GitHub language in 2025. Should JS devs switch? Data says..." |

### 3. Twitter/X
For each post, draft a 6–8 tweet thread. Lead with the most surprising data point from the post. Post day of publication.

**Thread template:**
```
Tweet 1: Hook — the counterintuitive stat or surprising finding
Tweet 2: Context — why this matters right now
Tweets 3–6: Key data points or steps from the post (one per tweet)
Tweet 7: Summary / takeaway
Tweet 8: "Full breakdown here: [link]" — only link in the last tweet
```

### 4. Hacker News (selected posts)
Submit Post 5 (Can AI Replace Junior Devs) and Post 13 (What Is Vibe Coding) to Hacker News "Show HN" on publish day.

**HN title format:** "Show HN: [data-driven angle — not promotional]"
- Post 5: "Show HN: BLS data on AI's actual impact on developer employment (2026)"
- Post 13: "Show HN: What 'vibe coding' means for developers who can't debug AI-generated code"

### 5. Quora
For vibe coding posts (13, 14, 15): answer "What is vibe coding?" and "How do I learn JavaScript?" questions with a substantive answer, link to the relevant post as a reference at the end.

---

## Vibe Coding Hub Page Timing

The hub page (`/blog/vibe-coding-hub`) should go live in **Week 4** after all three vibe coding posts are published (Weeks 1, 2, 3). The hub needs all three posts live to link to them.

Hub page launch checklist:
- [ ] All 3 vibe coding posts published and indexed
- [ ] Hub page created with ItemList JSON-LD linking to all 3
- [ ] Each vibe coding post updated to include link back to hub
- [ ] Hub page submitted to Google Search Console

---

## KPIs to Track Monthly

| Metric | Baseline | 30-day target | 90-day target |
|--------|---------|----------------|----------------|
| Organic sessions (blog) | — | 500/month from new posts | 3,000/month |
| `affiliate_link_clicked` events | — | 50/month | 300/month |
| Email captures | — | 30/month | 200/month |
| Posts in top 20 Google for target keyword | 0 | 3 | 10 |
| AI Overview citations | unknown | Check monthly | Check monthly |
