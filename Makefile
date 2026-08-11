# ──────────────────────────────────────────────────────────────────
# ScrimbaGuide — development workflow
# ──────────────────────────────────────────────────────────────────

SHELL      := /bin/bash
PYTHON     := python3
VENV       := .venv
PIP        := $(VENV)/bin/pip
PY         := $(VENV)/bin/python
NODE_BIN   := node_modules/.bin
OUTPUT_DIR := output
I18N_DIR   := i18n
# The only locale roster in the codebase (I18N-PLAN.md section 17). i18n-scaffold validates
# against it rather than accepting any string, so a typo cannot create an orphan directory
# tree that the coverage manifest will never look at.
LOCALES_CONFIG := $(I18N_DIR)/locales.config.ts

.DEFAULT_GOAL := help

# ── Help ─────────────────────────────────────────────────────────

# The character class includes digits so the i18n-* targets are listed; without it
# `make help` silently hides every target whose name contains a number.
.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Environment setup ────────────────────────────────────────────

.PHONY: install
install: node_modules $(VENV) ## Install all dependencies (Node + Python)

node_modules: package.json package-lock.json
	npm ci
	@touch node_modules

$(VENV): scraper/requirements.txt
	$(PYTHON) -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r scraper/requirements.txt
	@touch $(VENV)

.PHONY: clean-env
clean-env: ## Remove venv and node_modules
	rm -rf $(VENV) node_modules

# ── Scraping ─────────────────────────────────────────────────────

.PHONY: scrape
scrape: $(VENV) ## Run the Scrimba scraper (incremental, default)
	$(PY) scraper/scrape.py --output $(OUTPUT_DIR)

.PHONY: scrape-fast
scrape-fast: $(VENV) ## Fast pass only (JSON-LD via httpx, skip Selenium modules)
	$(PY) scraper/scrape.py --output $(OUTPUT_DIR) --no-modules

.PHONY: scrape-full
scrape-full: $(VENV) ## Force re-scrape ignoring the incremental cache
	$(PY) scraper/scrape.py --output $(OUTPUT_DIR) --full

.PHONY: scrape-courses
scrape-courses: $(VENV) ## Scrape only course pages
	$(PY) scraper/scrape.py --output $(OUTPUT_DIR) --type course

# ── Content generation ───────────────────────────────────────────

.PHONY: generate-data
generate-data: $(OUTPUT_DIR)/index.json ## Process scraped data → data/*.json
	node scripts/build-data.mjs

# Course and practice pages under docs/ are hand-authored and maintained by hand.
# build-data.mjs only produces data/*.json (consumed by runtime React components).
.PHONY: generate
generate: generate-data ## Build data/*.json from scraped output (pages are hand-authored)

# ── i18n ─────────────────────────────────────────────────────────

# `make i18n-scaffold LOCALE=de` prepares a locale for translation. It creates the DIRECTORY
# TREE and the write-translations JSON files ONLY. It must never copy English markdown, and
# this comment exists so nobody "fixes" that later.
#
# The official Docusaurus i18n tutorial says to run
# `cp -r docs/ i18n/fr/docusaurus-plugin-content-docs/current/`. That advice is actively
# harmful in this repo. Our coverage manifest (I18N-PLAN.md section 4 Phase 2) is derived FROM
# DISK: the presence of a markdown file under i18n/<locale>/ IS the signal that a translator
# wrote it. Copy English in and an untranslated copy becomes indistinguishable from a real
# translation, so an interrupted multi-day run reads as "covered", earns hreflang plus a
# self-canonical, and ships English pages under a non-English hreflang WITH A GREEN BUILD.
# That is the invariant-4 violation the plan spends a whole decision row forbidding, and
# nothing in CI would catch it. Docusaurus already falls back to English per file at build
# time, so the copy buys nothing and destroys the only disk signal we have.
#
# mkdir runs BEFORE write-translations on purpose: until a locale reaches `status: 'live'` in
# the roster it is absent from `i18n.locales`, and Docusaurus rejects a `--locale` it is not
# configured to build. Creating the tree first means the failure is informative instead of
# leaving a half-scaffolded locale behind.
.PHONY: i18n-scaffold
i18n-scaffold: node_modules ## Scaffold a locale's dirs + translation JSON (LOCALE=xx)
	@if [ -z "$(LOCALE)" ]; then \
		echo "error: LOCALE is required. Usage: make i18n-scaffold LOCALE=de"; \
		exit 1; \
	fi
	@if ! grep -qE "^[[:space:]]*locale: '$(LOCALE)'," $(LOCALES_CONFIG); then \
		echo "error: '$(LOCALE)' is not in $(LOCALES_CONFIG)."; \
		echo "       Add its roster record there first. That file is the single source of truth"; \
		echo "       for every locale-aware consumer, so a locale it does not know about would"; \
		echo "       get directories on disk and appear in no manifest, matrix, or hreflang set."; \
		exit 1; \
	fi
	mkdir -p $(I18N_DIR)/$(LOCALE)/docusaurus-plugin-content-docs/current
	mkdir -p $(I18N_DIR)/$(LOCALE)/docusaurus-plugin-content-blog
	mkdir -p $(I18N_DIR)/$(LOCALE)/docusaurus-plugin-content-pages
	mkdir -p $(I18N_DIR)/$(LOCALE)/.status
	@npx docusaurus write-translations --locale $(LOCALE) || { \
		echo ""; \
		echo "error: docusaurus write-translations --locale $(LOCALE) failed."; \
		echo "       Most likely '$(LOCALE)' is still status: 'draft' in the roster and therefore"; \
		echo "       not in i18n.locales. The directory tree was created, so this is resumable."; \
		exit 1; \
	}
	@echo ""
	@echo "Scaffolded $(I18N_DIR)/$(LOCALE)/ (directories + translation JSON only)."
	@echo "No markdown was copied, by design. Every .mdx under $(I18N_DIR)/$(LOCALE)/ must be"
	@echo "written by a translator; see the comment above this target in the Makefile."

# Reports declared-minus-covered per locale. The reducer script is a Phase 5 deliverable
# (I18N-PLAN.md section 17: scripts/translation-status.mjs is the SOLE writer of
# i18n/translation-status.json). Until it lands this target explains itself and exits 0, so a
# CI job or a habit that calls `make i18n-status` does not fail on the Phase 1 commit.
.PHONY: i18n-status
i18n-status: ## Report declared-minus-covered per locale
	@node scripts/build-coverage-manifest.mjs >/dev/null
	@node -e "\
	  const m = require('./i18n/coverage.json');\
	  const rows = Object.entries(m.locales).filter(([,v]) => v.status !== 'draft' || v.coveredCount > 0);\
	  if (!rows.length) { console.log('No locale has any translated route yet. 47 locales are status: draft.'); process.exit(0); }\
	  console.log('locale  tier cov      status   covered/declared  missing stale blocked');\
	  for (const [l,v] of rows) console.log(\
	    l.padEnd(8)+String(v.tier).padEnd(5)+String(v.coverage).padEnd(9)+String(v.status).padEnd(9)+\
	    (v.coveredCount+'/'+v.declaredCount).padEnd(18)+String(v.missing.length).padEnd(8)+\
	    String(v.stale.length).padEnd(6)+v.blocked.length);"

# Fails if any LIVE locale is incomplete relative to its declared scope, which is the
# section 1 launch gate made computable ("a locale ships complete or not at all").
.PHONY: i18n-check
i18n-check: ## Block if a live locale is incomplete
	node scripts/build-coverage-manifest.mjs --check

# ── Development ──────────────────────────────────────────────────

.PHONY: dev
dev: node_modules ## Start Docusaurus dev server
	npm start

.PHONY: build
build: node_modules ## Build production site
	npm run build

.PHONY: serve
serve: build ## Build and serve locally
	npm run serve

.PHONY: typecheck
typecheck: node_modules ## Run TypeScript type checking
	npm run typecheck

# ── Housekeeping ─────────────────────────────────────────────────

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf build .docusaurus

.PHONY: clean-data
clean-data: ## Remove generated data (keeps scraped output)
	rm -rf data

.PHONY: clean-all
clean-all: clean clean-data clean-env ## Remove everything (build + data + envs)

.PHONY: lint
lint: node_modules ## Check for build errors (dry run)
	npm run build 2>&1 | tail -5

# ── Tests ────────────────────────────────────────────────────────

.PHONY: test-a11y
test-a11y: ## Build site and run axe-core accessibility tests
	npm run build
	npm run test:a11y

# ── Full pipeline ────────────────────────────────────────────────

.PHONY: pipeline
pipeline: scrape generate build ## Run entire pipeline: scrape → generate → build
