# Explain (the Scrimba AI explainer)

Everything about generating, grading, embedding and linking explainers lives in
the `scrimba-explain` skill (`.claude/skills/scrimba-explain/`). Load that
skill; do not duplicate its rules here.

What this browsing skill still needs to know:

- Two surfaces: the EXPLAIN button in `<ide-header>` on any lesson (uses the
  current scrim and highlighted code as context; results come out Unlisted), and
  the hub at `/explain` (free-text prompt, Public/Private toggle, attachments;
  the composer defaults to Public).
- Explainer pages (`/explain/guide<id>`) auto-play. Pause immediately with
  `document.querySelectorAll('video').forEach(v => v.pause())`. The narration is
  rendered as prose in `<article>`; `get_page_text` returns the headed sections.
- Generating an explainer spends the user's allowance and publishes under their
  name. Never create one unless the user asked for it in this session.
- Explainer links never carry `?via=` (see the affiliate rules in the
  scrimba-explain skill).
