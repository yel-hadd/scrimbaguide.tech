# Facts file (output of the browse step, input to draft and fact-check)

One Markdown file per course in the scratchpad, `facts-<slug>.md`. Only things
seen; no inference. Every entry says where it was seen.

```
# <course> (<url>) browsed <YYYY-MM-DD>

## Header (op-stats): 9.4 hrs, Beginner, free, 200,000+ students, 10 languages
## Teacher card: Per Borgen (page <title> says ...; trust the card)
## JSON-LD description: "..."

## Curriculum (expanded TOC, my count vs module header)
1. Build a Passenger Counter App | header 0/30, 82 min | counted 30 scrims
   - ~02 Welcome (0:58) SAMPLE
   - ~03 Your first variable (4:32)
   ...
   Pro-gated items: "Solo Project (PRO) - Basketball Scoreboard"
2. ...

## Lessons opened
### ~03 Your first variable (module 1, 4:32)
- files: index.html, index.js; deps: none
- transcript quotes: "today is actually a really important day..." (0:05)
- challenge? no
- what the preview shows at 3:40: ...
### ...

## Screenshots taken
- static/img/scrimba/<slug>/<what>.webp 1400x788, 118 KB, lesson ~1f at 2:10,
  shows: ... ; alt draft: ...
- title cards: chapter-01 ... (skipped chapter 4: licensed GIF)

## Surprises / corrections to existing page
- page said X; course shows Y (seen at ...)

## Not verified
- ...
```
