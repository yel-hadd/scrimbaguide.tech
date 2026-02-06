#!/usr/bin/env python3
"""
Scrimba content scraper.

Crawls scrimba.com and scrimba.helpscoutdocs.com to extract public course,
topic, marketing, and help-article pages.  Outputs structured Markdown with
YAML frontmatter plus full-page screenshots.

Usage:
    python scraper/scrape.py                        # scrape all public pages
    python scraper/scrape.py --urls urls.txt        # scrape specific URLs
    python scraper/scrape.py --resume               # resume from last run
    python scraper/scrape.py --type course          # scrape only courses

Output layout:
    output/
    ├── index.json                     # manifest of all scraped pages
    ├── scrape.log                     # detailed log
    ├── scrimba.com/
    │   ├── course/<slug>/index.md     # course page content
    │   ├── course/<slug>/screenshot.png
    │   ├── topic/<slug>/index.md
    │   ├── topic/<slug>/screenshot.png
    │   └── marketing/<slug>/index.md
    └── scrimba.helpscoutdocs.com/
        └── help/<slug>/index.md
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# ── Constants ────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "output"
LOG_FILE = OUTPUT_DIR / "scrape.log"

SCRIMBA_BASE = "https://scrimba.com"
HELP_BASE = "https://scrimba.helpscoutdocs.com"

# Scrimba sitemap / known public URL patterns
SITEMAP_URL = f"{SCRIMBA_BASE}/sitemap.xml"

# Pages to skip (private lessons, auth pages, etc.)
PRIVATE_PATTERNS = [
    r"/learn/[^/]+/[^/]+$",       # individual lesson pages
    r"/playground",
    r"/dashboard",
    r"/settings",
    r"/auth",
    r"/login",
    r"/signup",
    r"/certificate/",
]

PAGE_LOAD_TIMEOUT = 15
SCREENSHOT_WAIT = 2


# ── Logging ──────────────────────────────────────────────────────

def setup_logging(output_dir: Path) -> logging.Logger:
    output_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("scraper")
    logger.setLevel(logging.DEBUG)

    fmt = logging.Formatter("%(asctime)s  %(levelname)-8s %(message)s", datefmt="%H:%M:%S")

    fh = logging.FileHandler(output_dir / "scrape.log", mode="w", encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)

    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)

    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger


# ── URL discovery ────────────────────────────────────────────────

def classify_url(url: str) -> str | None:
    """Classify a URL into a page type, or None to skip."""
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")

    # Skip private pages
    for pattern in PRIVATE_PATTERNS:
        if re.search(pattern, path):
            return None

    if parsed.netloc == "scrimba.helpscoutdocs.com":
        return "help"

    if parsed.netloc != "scrimba.com":
        return None

    # Topic pages: /t/<id>
    if re.match(r"^/t/", path):
        return "topic"

    # Course/path pages: /<slug> with course ID suffix
    if re.match(r"^/[a-z]", path) and not path.startswith("/t/"):
        # Check for known marketing pages
        marketing_slugs = {
            "", "/teams", "/topics", "/security-policy", "/privacy-policy",
            "/terms-of-service", "/affiliate", "/accessibility-statement",
            "/roadmap", "/talents", "/about", "/project-hints",
            "/github-education", "/help", "/null",
        }
        if path in marketing_slugs:
            return "marketing"
        return "course"

    return "marketing"


def discover_urls_from_sitemap(driver: webdriver.Chrome, logger: logging.Logger) -> list[str]:
    """Fetch all URLs from Scrimba's sitemap."""
    logger.info("Fetching sitemap: %s", SITEMAP_URL)
    driver.get(SITEMAP_URL)
    time.sleep(2)

    # Parse sitemap XML
    source = driver.page_source
    urls = re.findall(r"<loc>(https?://[^<]+)</loc>", source)
    logger.info("Found %d URLs in sitemap", len(urls))
    return urls


def discover_help_urls(driver: webdriver.Chrome, logger: logging.Logger) -> list[str]:
    """Crawl the help center index to find all article URLs."""
    logger.info("Discovering help articles from %s", HELP_BASE)
    driver.get(HELP_BASE)
    time.sleep(3)

    urls = set()
    urls.add(HELP_BASE)

    # Find all links on the help homepage
    links = driver.find_elements(By.CSS_SELECTOR, "a[href]")
    for link in links:
        href = link.get_attribute("href") or ""
        if HELP_BASE in href:
            urls.add(href.split("?")[0].split("#")[0])

    # Visit each category page to find articles
    category_urls = [u for u in urls if "/category/" in u]
    for cat_url in category_urls:
        try:
            driver.get(cat_url)
            time.sleep(2)
            cat_links = driver.find_elements(By.CSS_SELECTOR, "a[href]")
            for link in cat_links:
                href = link.get_attribute("href") or ""
                if HELP_BASE in href:
                    urls.add(href.split("?")[0].split("#")[0])
        except Exception as e:
            logger.warning("Error crawling %s: %s", cat_url, e)

    logger.info("Found %d help URLs", len(urls))
    return sorted(urls)


def load_urls_from_file(path: Path) -> list[str]:
    """Load URLs from a text file (one per line)."""
    return [line.strip() for line in path.read_text().splitlines() if line.strip() and not line.startswith("#")]


# ── Scraping ─────────────────────────────────────────────────────

def extract_page(driver: webdriver.Chrome, url: str, page_type: str) -> dict:
    """Extract content from a loaded page."""
    now = datetime.now(timezone.utc).isoformat()

    title = driver.title or ""
    meta_desc = ""
    try:
        meta = driver.find_element(By.CSS_SELECTOR, 'meta[name="description"]')
        meta_desc = meta.get_attribute("content") or ""
    except Exception:
        pass

    # Extract headings
    h1s = [el.text.strip() for el in driver.find_elements(By.CSS_SELECTOR, "h1") if el.text.strip()]
    h2s = [el.text.strip() for el in driver.find_elements(By.CSS_SELECTOR, "h2") if el.text.strip()]
    h3s = [el.text.strip() for el in driver.find_elements(By.CSS_SELECTOR, "h3") if el.text.strip()]

    # Extract visible text
    try:
        body = driver.find_element(By.CSS_SELECTOR, "main, #__next, body")
        text = body.text
    except Exception:
        text = driver.find_element(By.TAG_NAME, "body").text

    # Extract course slug if applicable
    parsed = urlparse(url)
    path_parts = parsed.path.strip("/").split("/")
    course_slug = path_parts[-1] if path_parts else None

    return {
        "title": title,
        "url": url,
        "type": page_type,
        "course_slug": course_slug,
        "scraped_at": now,
        "meta_description": meta_desc,
        "headings_h1": h1s,
        "headings_h2": h2s,
        "headings_h3": h3s,
        "body_text": text,
    }


def save_page(data: dict, output_dir: Path) -> dict:
    """Save extracted page data as Markdown with YAML frontmatter."""
    parsed = urlparse(data["url"])
    domain = parsed.netloc

    # Determine subdirectory
    page_type = data["type"]
    slug = data["course_slug"] or "index"

    if domain == "scrimba.helpscoutdocs.com":
        path_parts = parsed.path.strip("/").split("/")
        slug = "/".join(path_parts) if path_parts and path_parts[0] else "index"
        subdir = output_dir / domain / "help" / slug
    elif page_type == "course":
        subdir = output_dir / domain / "course" / slug
    elif page_type == "topic":
        subdir = output_dir / domain / "topic" / slug
    else:
        subdir = output_dir / domain / "marketing" / slug

    subdir.mkdir(parents=True, exist_ok=True)

    # Build YAML frontmatter
    h1_yaml = "\n".join(f'  - "{h}"' for h in data["headings_h1"])
    h2_yaml = "\n".join(f'  - "{h}"' for h in data["headings_h2"])
    h3_yaml = "\n".join(f'  - "{h}"' for h in data["headings_h3"])

    frontmatter = f"""---
title: "{data['title']}"
url: "{data['url']}"
domain: "{urlparse(data['url']).netloc}"
type: "{data['type']}"
course_slug: {data['course_slug'] if data['course_slug'] else 'null'}
scraped_at: "{data['scraped_at']}"
meta_description: "{data['meta_description']}"
headings_h1:
{h1_yaml or '  []'}
headings_h2:
{h2_yaml or '  []'}
headings_h3:
{h3_yaml or '  []'}
screenshot: "screenshot.png"
---

{data['body_text']}
"""

    md_path = subdir / "index.md"
    md_path.write_text(frontmatter, encoding="utf-8")

    # Return index entry
    rel_path = str(md_path.relative_to(output_dir))
    screenshot_path = str((subdir / "screenshot.png").relative_to(output_dir))

    return {
        "path": rel_path,
        "screenshot": screenshot_path,
        "title": data["title"],
        "url": data["url"],
        "type": data["type"],
    }


def take_screenshot(driver: webdriver.Chrome, output_dir: Path, data: dict) -> None:
    """Save a full-page screenshot."""
    parsed = urlparse(data["url"])
    domain = parsed.netloc
    page_type = data["type"]
    slug = data["course_slug"] or "index"

    if domain == "scrimba.helpscoutdocs.com":
        path_parts = parsed.path.strip("/").split("/")
        slug = "/".join(path_parts) if path_parts and path_parts[0] else "index"
        subdir = output_dir / domain / "help" / slug
    elif page_type == "course":
        subdir = output_dir / domain / "course" / slug
    elif page_type == "topic":
        subdir = output_dir / domain / "topic" / slug
    else:
        subdir = output_dir / domain / "marketing" / slug

    screenshot_path = subdir / "screenshot.png"
    try:
        driver.save_screenshot(str(screenshot_path))
    except Exception:
        pass  # non-critical


# ── Main ─────────────────────────────────────────────────────────

def create_driver() -> webdriver.Chrome:
    """Create a headless Chrome driver."""
    opts = ChromeOptions()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1280,900")
    opts.add_argument("--disable-extensions")
    opts.add_argument(
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return webdriver.Chrome(options=opts)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Scrimba public pages")
    parser.add_argument("--urls", type=Path, help="Text file with URLs to scrape (one per line)")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR, help="Output directory")
    parser.add_argument("--type", choices=["course", "topic", "marketing", "help"], help="Only scrape this page type")
    parser.add_argument("--skip-private", action="store_true", default=True, help="Skip private lesson pages (default)")
    parser.add_argument("--no-screenshots", action="store_true", help="Skip screenshots")
    parser.add_argument("--resume", action="store_true", help="Skip already-scraped URLs")
    args = parser.parse_args()

    output_dir = args.output.resolve()
    logger = setup_logging(output_dir)

    # Load existing index for resume
    index_path = output_dir / "index.json"
    existing_urls: set[str] = set()
    existing_index: list[dict] = []
    if args.resume and index_path.exists():
        existing_index = json.loads(index_path.read_text())
        existing_urls = {entry["url"] for entry in existing_index}
        logger.info("Resume mode: %d URLs already scraped", len(existing_urls))

    driver = create_driver()

    try:
        # Discover URLs
        if args.urls:
            all_urls = load_urls_from_file(args.urls)
            logger.info("Loaded %d URLs from %s", len(all_urls), args.urls)
        else:
            sitemap_urls = discover_urls_from_sitemap(driver, logger)
            help_urls = discover_help_urls(driver, logger)
            all_urls = sorted(set(sitemap_urls + help_urls))
            logger.info("Total discovered: %d URLs", len(all_urls))

        # Classify and filter
        url_tasks: list[tuple[str, str]] = []
        skipped = 0
        for url in all_urls:
            page_type = classify_url(url)
            if page_type is None:
                skipped += 1
                continue
            if args.type and page_type != args.type:
                continue
            if url in existing_urls:
                continue
            url_tasks.append((url, page_type))

        if args.skip_private and skipped:
            logger.info("--skip-private: filtered %d -> %d URLs (dropped %d private lesson pages)",
                        len(all_urls), len(url_tasks) + len(existing_urls), skipped)

        logger.info("Starting scraper: %d URLs, output -> %s", len(url_tasks), output_dir)

        # Scrape
        index = list(existing_index)
        success = 0
        errors = 0

        for i, (url, page_type) in enumerate(url_tasks, 1):
            try:
                logger.info("[%d/%d] %s -> %s", i, len(url_tasks), page_type, url)
                driver.get(url)

                # Wait for page to load
                WebDriverWait(driver, PAGE_LOAD_TIMEOUT).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                time.sleep(SCREENSHOT_WAIT)

                data = extract_page(driver, url, page_type)
                entry = save_page(data, output_dir)

                if not args.no_screenshots:
                    take_screenshot(driver, output_dir, data)

                index.append(entry)
                success += 1

            except Exception as e:
                logger.error("[%d/%d] FAILED %s: %s", i, len(url_tasks), url, e)
                errors += 1

        # Write index
        index.sort(key=lambda x: x["url"])
        index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")

        logger.info("Done: %d success, %d errors out of %d unique URLs", success, errors, len(url_tasks))
        logger.info("Index written with %d entries -> %s", len(index), index_path)

    finally:
        driver.quit()

    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
