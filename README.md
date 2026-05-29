# ScrimbaGuide

The unofficial guide to [Scrimba](https://scrimba.com/?via=u42d4986) — course reviews, learning path guides, pricing breakdowns, and honest comparisons. Built with [Docusaurus 3](https://docusaurus.io/) and deployed to [scrimbaguide.tech](https://scrimbaguide.tech).

## Project Structure

```
scrimbaguide.tech/
├── scraper/                          # Python scraper (Selenium)
│   ├── scrape.py                     #   Main scraping script
│   └── requirements.txt              #   Python dependencies
├── scripts/                          # Node.js data + build scripts
│   └── build-data.mjs                #   output/index.json → data/*.json (runtime data)
├── blog/                             # Blog posts (MDX, date-prefixed)
├── docs/                             # Documentation pages (MDX, hand-authored)
│   ├── comparisons/                  #   Platform comparison guides
│   ├── courses/{react,js,ai,...}/    #   Course pages by topic
│   ├── faq/                          #   FAQ & help articles
│   ├── paths/                        #   Learning path deep-dives
│   └── pricing/                      #   Pricing & plans guides
├── src/
│   ├── components/                   #   Reusable React components
│   ├── css/custom.css                #   Global styles
│   ├── pages/index.tsx               #   Homepage
│   └── theme/                        #   Docusaurus theme swizzles
├── static/                           #   Static assets
├── Makefile                          #   Development workflow
├── docusaurus.config.ts              #   Site configuration
├── sidebars.ts                       #   Sidebar structure
└── package.json                      #   Node.js config
```

## Quick Start

```bash
make install      # install Node + Python dependencies
make dev          # start dev server at localhost:3000
```

## Available Commands

```
make help             Show all available commands

make install          Install all dependencies (Node + Python)
make dev              Start Docusaurus dev server
make build            Build production site
make serve            Build and serve locally
make typecheck        Run TypeScript type checking

make scrape           Run the Scrimba scraper (full crawl)
make scrape-resume    Resume an interrupted scrape
make scrape-courses   Scrape only course pages

make generate-data    Process scraped data → data/*.json
make generate         Build data/*.json (pages are hand-authored)

make pipeline         Run entire pipeline: scrape → generate → build

make clean            Remove build artifacts
make clean-data       Remove generated data (keeps scraped output)
make clean-all        Remove everything (build + data + envs)
```

## Data Pipeline

```
  Scrimba.com                 output/              data/              docs/courses/
 ┌───────────┐  make scrape  ┌──────────┐  make   ┌──────────┐  make  ┌──────────┐
 │  website   │────────────→ │index.json│  gen-   │courses   │  gen-  │  *.mdx   │
 │  sitemap   │              │  *.md    │  data   │.json     │  pages │  files   │
 │  help docs │              │  *.png   │────────→│help.json │───────→│          │
 └───────────┘               └──────────┘         └──────────┘        └──────────┘
```

## Key Conventions

- **Affiliate links**: All outbound Scrimba links use `<AffiliateLink>`, which appends `?via=u42d4986` and adds `rel="nofollow"`.
- **Internal linking**: Hub-and-spoke model — topic hubs link to individual course pages, which link back.
- **Blog slugs**: All blog posts use explicit `slug` frontmatter for clean URLs (e.g., `/blog/scrimba-review`).
- **Accessibility**: WCAG AA compliant — focus indicators, underlined content links, proper heading hierarchy, ARIA accordion patterns, color contrast.

## Deployment

Automated via GitHub Actions on push to `main` (see `.github/workflows/deploy.yml`).
Hosted on GitHub Pages with custom domain `scrimbaguide.tech`.
