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

.DEFAULT_GOAL := help

# ── Help ─────────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
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

.PHONY: generate-pages
generate-pages: data/courses.json ## Generate course MDX pages from data
	node scripts/generate-course-pages.mjs

.PHONY: generate
generate: generate-data generate-pages ## Run full content generation pipeline

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

# ── Full pipeline ────────────────────────────────────────────────

.PHONY: pipeline
pipeline: scrape generate build ## Run entire pipeline: scrape → generate → build
