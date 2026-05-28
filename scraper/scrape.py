#!/usr/bin/env python3
"""
Scrimba content scraper (fast path).

Strategy:
  1. Discover URLs via sitemap.xml + Help Centre crawl.
  2. Fast pass: httpx async fetches every URL's raw HTML. For Scrimba pages
     we extract the embedded JSON-LD Course schema; for Help Centre we parse
     the server-rendered article HTML directly. This gives us metadata for
     every URL in minutes instead of hours.
  3. Modules pass: course/path pages need module data which only renders
     client-side. The curriculum is public (no login) but hydrates late,
     inside <toc-group> web components, so we render with Selenium and read
     the rendered table-of-contents. We use a small concurrent pool, only
     for the ~80 course/path URLs and only when their JSON-LD dateModified
     has advanced since the last run (incremental).
  4. Disk layout and index.json shape are unchanged so scripts/build-data.mjs
     keeps working without edits.

Usage:
    python scraper/scrape.py                        # full scrape (incremental)
    python scraper/scrape.py --urls urls.txt        # specific URLs
    python scraper/scrape.py --type course          # only courses
    python scraper/scrape.py --no-modules           # JSON-LD only, skip Selenium
    python scraper/scrape.py --full                 # ignore incremental cache
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import httpx

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "output"

SCRIMBA_BASE = "https://scrimba.com"
HELP_BASE = "https://scrimba.helpscoutdocs.com"
SITEMAP_URL = f"{SCRIMBA_BASE}/sitemap.xml"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

PRIVATE_PATTERNS = [
    re.compile(r"/learn/[^/]+/[^/]+$"),
    re.compile(r"/learn/[^/]+/[^/]+/[^/]+"),
    re.compile(r"/~"),
    re.compile(r"/playground"),
    re.compile(r"/dashboard"),
    re.compile(r"/settings"),
    re.compile(r"/auth"),
    re.compile(r"/login"),
    re.compile(r"/signup"),
    re.compile(r"/certificate/"),
    re.compile(r"\.(jpg|png|gif|webp|svg)$"),
    re.compile(r"/embed"),
    re.compile(r"/playlist/"),
]

MARKETING_SLUGS = {
    "", "/teams", "/topics", "/security-policy", "/privacy-policy",
    "/terms-of-service", "/affiliate", "/accessibility-statement",
    "/roadmap", "/talents", "/about", "/project-hints",
    "/github-education", "/help", "/null",
    "/courses", "/paths", "/blog", "/pricing", "/our-pricing", "/jobs",
}

JSONLD_RE = re.compile(
    r'<script type="application/ld\+json">(.*?)</script>',
    re.DOTALL,
)

ISO_DURATION_RE = re.compile(
    r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
)

# Concurrency knobs
HTTP_POOL_LIMIT = 20
HTTP_TIMEOUT = 20.0
PER_HOST_LIMITS = {
    # Help Scout's CDN throttles aggressively at >6 concurrent connections.
    "scrimba.helpscoutdocs.com": 4,
}
SELENIUM_WORKERS = 4
SELENIUM_PAGE_TIMEOUT = 45
SELENIUM_MODULE_WAIT = 20  # seconds to wait for the toc to hydrate
SELENIUM_RETRY_MODULE_WAIT = 35  # bumped wait on retry pass


# ── Logging ─────────────────────────────────────────────────────────

def setup_logging(output_dir: Path) -> logging.Logger:
    output_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("scraper")
    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter(
        "%(asctime)s  %(levelname)-8s %(message)s", datefmt="%H:%M:%S"
    )
    fh = logging.FileHandler(output_dir / "scrape.log", mode="w", encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger


# ── URL classification ─────────────────────────────────────────────

def classify_url(url: str) -> str | None:
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")
    for pattern in PRIVATE_PATTERNS:
        if pattern.search(path):
            return None
    if parsed.netloc == "scrimba.helpscoutdocs.com":
        return "help"
    if parsed.netloc != "scrimba.com":
        return None
    if re.match(r"^/t/", path):
        return "topic"
    if path in MARKETING_SLUGS:
        return "marketing"
    if re.match(r"^/[a-z]", path):
        return "course"
    return "marketing"


# ── ISO 8601 duration → "15.1 hrs" / "86 min" ──────────────────────

def format_duration(iso: str) -> str:
    if not iso:
        return ""
    m = ISO_DURATION_RE.fullmatch(iso)
    if not m:
        return ""
    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    seconds = int(m.group(3) or 0)
    total_min = hours * 60 + minutes + (seconds / 60)
    if total_min >= 60:
        return f"{total_min / 60:.1f} hrs"
    return f"{int(round(total_min))} min"


# ── JSON-LD extraction ─────────────────────────────────────────────

def extract_jsonld_course(html: str) -> dict | None:
    """Return the Course-typed JSON-LD entry, or None."""
    for match in JSONLD_RE.finditer(html):
        try:
            payload = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        entries = payload if isinstance(payload, list) else [payload]
        for entry in entries:
            if isinstance(entry, dict) and entry.get("@type") == "Course":
                return entry
    return None


def extract_breadcrumb_name(html: str) -> str:
    """Return the clean course name from BreadcrumbList position 3, or ''.

    Scrimba's breadcrumb is Home > Courses > <Clean Name>, so position 3 is
    the human course title without the marketing tail in Course.name.
    """
    for match in JSONLD_RE.finditer(html):
        try:
            payload = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        entries = payload if isinstance(payload, list) else [payload]
        if isinstance(payload, dict) and isinstance(payload.get("@graph"), list):
            entries = payload["@graph"]
        for entry in entries:
            if not isinstance(entry, dict) or entry.get("@type") != "BreadcrumbList":
                continue
            for el in entry.get("itemListElement", []):
                if not isinstance(el, dict) or el.get("position") != 3:
                    continue
                item = el.get("item")
                name = item.get("name") if isinstance(item, dict) else el.get("name")
                return (name or "").strip()
    return ""


def extract_og_meta(html: str) -> dict[str, str]:
    """Pull OpenGraph + meta description as a fallback for non-course pages."""
    meta: dict[str, str] = {}
    for prop, attr in [
        ("og:title", "title"),
        ("og:description", "description"),
        ("og:url", "url"),
    ]:
        m = re.search(
            rf'<meta property="{re.escape(prop)}" content="([^"]+)"',
            html,
        )
        if m:
            meta[attr] = m.group(1)
    m = re.search(
        r'<meta name="description" content="([^"]+)"',
        html,
    )
    if m:
        meta.setdefault("description", m.group(1))
    m = re.search(r"<title>([^<]+)</title>", html)
    if m:
        meta.setdefault("title", m.group(1).strip())
    return meta


# ── Help Centre HTML parsing (server-rendered, no JS) ──────────────

HELP_TITLE_RE = re.compile(r"<title>([^<]+)</title>")
HELP_DESC_RE = re.compile(r'<meta name="description" content="([^"]+)"')
HELP_BODY_RE = re.compile(
    r'<article[^>]*class="[^"]*article[^"]*"[^>]*>(.*?)</article>',
    re.DOTALL,
)
HELP_TAG_RE = re.compile(r"<[^>]+>")
HELP_LINKS_RE = re.compile(r'href="([^"]+)"')


def parse_help_html(url: str, html: str) -> dict:
    title = ""
    if m := HELP_TITLE_RE.search(html):
        title = m.group(1).strip()
    description = ""
    if m := HELP_DESC_RE.search(html):
        description = m.group(1).strip()

    body_text = ""
    if m := HELP_BODY_RE.search(html):
        body_text = HELP_TAG_RE.sub("\n", m.group(1))
        body_text = re.sub(r"\n{3,}", "\n\n", body_text).strip()
    if not body_text:
        # Fallback: strip everything outside <main>
        m = re.search(r"<main[^>]*>(.*?)</main>", html, re.DOTALL)
        if m:
            body_text = HELP_TAG_RE.sub("\n", m.group(1))
            body_text = re.sub(r"\n{3,}", "\n\n", body_text).strip()

    return {
        "title": title,
        "url": url,
        "type": "help",
        "course_slug": urlparse(url).path.strip("/").split("/")[-1] or "index",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "meta_description": description,
        "headings_h1": [],
        "headings_h2": [],
        "headings_h3": [],
        "body_text": body_text,
        "date_modified": "",
    }


_HELP_ASSET_RE = re.compile(
    r"(?:^|/)(?:s3\.amazonaws\.com|d3eto7onm69fcz\.cloudfront\.net)/"
    r"|\.(?:css|js|png|jpe?g|gif|svg|ico|woff2?|ttf)(?:$|\?)"
)


def discover_help_urls_from_index(html: str) -> set[str]:
    urls: set[str] = set()
    for m in HELP_LINKS_RE.finditer(html):
        href = m.group(1)
        if href.startswith("/"):
            href = HELP_BASE + href
        if not href.startswith(HELP_BASE):
            continue
        clean = href.split("?")[0].split("#")[0]
        # Drop CDN assets, stylesheets, scripts, images, and double-slash paths
        if "//" in clean[len(HELP_BASE):]:
            continue
        if _HELP_ASSET_RE.search(clean):
            continue
        urls.add(clean)
    return urls


# ── Page extraction ────────────────────────────────────────────────

@dataclass
class PageData:
    title: str
    url: str
    page_type: str
    course_slug: str
    scraped_at: str
    meta_description: str
    headings_h1: list[str] = field(default_factory=list)
    headings_h2: list[str] = field(default_factory=list)
    headings_h3: list[str] = field(default_factory=list)
    body_text: str = ""
    date_modified: str = ""
    # Rich course facts pulled from the Course JSON-LD (course/path pages only).
    course_meta: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "type": self.page_type,
            "course_slug": self.course_slug,
            "scraped_at": self.scraped_at,
            "meta_description": self.meta_description,
            "headings_h1": self.headings_h1,
            "headings_h2": self.headings_h2,
            "headings_h3": self.headings_h3,
            "body_text": self.body_text,
            "date_modified": self.date_modified,
        }


def page_from_scrimba_html(url: str, page_type: str, html: str) -> PageData:
    """Build a PageData from raw HTML of a scrimba.com page."""
    now = datetime.now(timezone.utc).isoformat()
    parsed = urlparse(url)
    course_slug = parsed.path.strip("/").split("/")[-1] if parsed.path.strip("/") else "index"

    course = extract_jsonld_course(html) if page_type in {"course", "topic"} else None

    if course:
        title = course.get("name", "") or ""
        description = course.get("description", "") or ""
        duration = format_duration(course.get("timeRequired", ""))
        level = course.get("educationalLevel", "") or ""
        is_free = bool(course.get("isAccessibleForFree"))
        offers = course.get("offers") or []
        if not is_free and offers:
            first_offer = offers[0] if isinstance(offers, list) else offers
            if isinstance(first_offer, dict) and first_offer.get("category") == "Free":
                is_free = True
        access = "Free" if is_free else "Pro"
        instructors = course.get("instructor") or []
        if isinstance(instructors, dict):
            instructors = [instructors]
        instructor_names = [
            (i.get("name") or "").strip()
            for i in instructors
            if isinstance(i, dict) and i.get("name")
        ]
        num_lessons = course.get("numberOfLessons", "")
        date_modified = course.get("dateModified", "") or ""

        # Capture instructor profile URLs alongside names.
        instructor_pairs = [
            {"name": (i.get("name") or "").strip(), "url": (i.get("url") or "").strip()}
            for i in instructors
            if isinstance(i, dict) and i.get("name")
        ]
        teaches = course.get("teaches", "")
        if isinstance(teaches, list):
            teaches = ", ".join(str(t).strip() for t in teaches if t)
        keywords = course.get("keywords", "")
        if isinstance(keywords, list):
            keywords = ", ".join(str(k).strip() for k in keywords if k)

        course_meta = {
            "clean_name": extract_breadcrumb_name(html) or title,
            "num_lessons": str(num_lessons) if num_lessons not in (None, "") else "",
            "time_required": course.get("timeRequired", "") or "",
            "course_level": level,
            "course_access": access,
            "teaches": teaches or "",
            "keywords": keywords or "",
            "date_published": course.get("datePublished", "") or "",
            "instructor_name": instructor_pairs[0]["name"] if instructor_pairs else "",
            "instructor_url": instructor_pairs[0]["url"] if instructor_pairs else "",
        }

        # Synthesize a body text that build-data.mjs can mine for duration/level/access.
        # It looks for: ^digits hrs|min$, ^Beginner|Intermediate|Advanced$, ^Free|Community$.
        body_lines = []
        if duration:
            body_lines.append(duration)
        if level:
            body_lines.append(level)
        body_lines.append(access)
        if num_lessons:
            body_lines.append(f"{num_lessons} lessons")
        if instructor_names:
            body_lines.append("Instructor: " + ", ".join(instructor_names))
        if description:
            body_lines.append("")
            body_lines.append(description)

        return PageData(
            title=title,
            url=url,
            page_type=page_type,
            course_slug=course_slug,
            scraped_at=now,
            meta_description=description,
            headings_h1=[title] if title else [],
            headings_h2=[],  # filled in by the optional Selenium modules pass
            headings_h3=[],
            body_text="\n".join(body_lines),
            date_modified=date_modified,
            course_meta=course_meta,
        )

    # Non-course page: use OG meta
    og = extract_og_meta(html)
    return PageData(
        title=og.get("title", ""),
        url=url,
        page_type=page_type,
        course_slug=course_slug,
        scraped_at=now,
        meta_description=og.get("description", ""),
        body_text=og.get("description", ""),
    )


# ── Async HTTP fetching ────────────────────────────────────────────

async def fetch_one(client: httpx.AsyncClient, url: str, page_type: str,
                    logger: logging.Logger, attempts: int = 3) -> PageData | None:
    last_err: Exception | None = None
    for attempt in range(attempts):
        try:
            resp = await client.get(url, follow_redirects=True)
            if resp.status_code == 429:
                # Honor Retry-After if present, else exponential backoff
                wait = float(resp.headers.get("Retry-After", 2 * (attempt + 1)))
                await asyncio.sleep(min(wait, 10))
                continue
            resp.raise_for_status()
            break
        except Exception as e:
            last_err = e
            await asyncio.sleep(0.5 * (attempt + 1))
    else:
        logger.warning("HTTP fail %s: %s", url, last_err)
        return None

    html = resp.text
    if page_type == "help":
        d = parse_help_html(url, html)
        return PageData(
            title=d["title"], url=d["url"], page_type="help",
            course_slug=d["course_slug"], scraped_at=d["scraped_at"],
            meta_description=d["meta_description"], body_text=d["body_text"],
        )
    return page_from_scrimba_html(url, page_type, html)


async def fetch_many(url_tasks: list[tuple[str, str]],
                     logger: logging.Logger) -> list[PageData]:
    limits = httpx.Limits(
        max_connections=HTTP_POOL_LIMIT,
        max_keepalive_connections=HTTP_POOL_LIMIT,
    )
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en"}
    pages: list[PageData] = []
    completed = 0
    total = len(url_tasks)

    # Per-host semaphores throttle origins that rate-limit (Help Scout CDN).
    global_sem = asyncio.Semaphore(HTTP_POOL_LIMIT)
    host_sems: dict[str, asyncio.Semaphore] = {
        host: asyncio.Semaphore(limit)
        for host, limit in PER_HOST_LIMITS.items()
    }

    async with httpx.AsyncClient(
        headers=headers, limits=limits, timeout=HTTP_TIMEOUT, http2=False,
    ) as client:
        async def worker(url: str, ptype: str) -> PageData | None:
            host = urlparse(url).netloc
            host_sem = host_sems.get(host)
            async with global_sem:
                if host_sem is not None:
                    async with host_sem:
                        return await fetch_one(client, url, ptype, logger)
                return await fetch_one(client, url, ptype, logger)

        tasks = [asyncio.create_task(worker(u, t)) for u, t in url_tasks]
        for coro in asyncio.as_completed(tasks):
            page = await coro
            completed += 1
            if completed % 25 == 0 or completed == total:
                logger.info("fast pass: %d/%d", completed, total)
            if page:
                pages.append(page)
    return pages


# ── URL discovery ──────────────────────────────────────────────────

LOC_RE = re.compile(r"<loc>(https?://[^<]+)</loc>")


def discover_urls_sync(logger: logging.Logger) -> tuple[list[str], list[str]]:
    """Fetch sitemap + help index synchronously (small, one-shot)."""
    sitemap_urls: list[str] = []
    help_urls: set[str] = set()
    headers = {"User-Agent": USER_AGENT}
    with httpx.Client(headers=headers, timeout=HTTP_TIMEOUT) as client:
        try:
            r = client.get(SITEMAP_URL, follow_redirects=True)
            r.raise_for_status()
            sitemap_urls = LOC_RE.findall(r.text)
            logger.info("sitemap: %d urls", len(sitemap_urls))
        except Exception as e:
            logger.error("sitemap fetch failed: %s", e)

        try:
            r = client.get(HELP_BASE, follow_redirects=True)
            r.raise_for_status()
            help_urls = discover_help_urls_from_index(r.text)
            # Crawl one level: category pages
            categories = [u for u in list(help_urls) if "/category/" in u]
            for cat in categories:
                try:
                    cr = client.get(cat, follow_redirects=True)
                    cr.raise_for_status()
                    help_urls |= discover_help_urls_from_index(cr.text)
                except Exception as e:
                    logger.debug("help category %s: %s", cat, e)
            logger.info("help centre: %d urls", len(help_urls))
        except Exception as e:
            logger.error("help index fetch failed: %s", e)

    return sitemap_urls, sorted(help_urls)


# ── Selenium concurrent modules pass ───────────────────────────────

# JS run in-page to read the rendered table of contents. Scrimba renders the
# curriculum into <toc-group> web components; the top-level modules carry the
# class token `l0`. Inside each module head the pieces sit in dedicated slots:
# `%name` (title), `%stat` (duration), plus spans that spell out the lesson
# counter. We grab name and duration from their slots and derive the lesson
# total from the head text, so a title ending in a digit can't be mis-split.
_TOC_MODULE_JS = r"""
const groups = Array.from(document.querySelectorAll('toc-group.l0'));
return groups.map(function (g) {
  const head = g.querySelector('toc-item-head') || g;
  // Read the rendered text directly rather than per-slot class tokens, which
  // Scrimba renames periodically. The module head renders as three lines:
  //   <name>\n<duration>\n<done>/<total>
  const text = (head.innerText || head.textContent || '').replace(/ /g, ' ');
  const lines = text.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  const name = lines.length ? lines[0] : '';
  let duration = '';
  for (let i = 1; i < lines.length; i++) {
    if (/^\d+(?:\.\d+)?\s*(?:hrs?|min)$/i.test(lines[i])) { duration = lines[i]; break; }
  }
  const headText = lines.join(' ');
  return [name, duration, headText];
});
"""

_DURATION_RE = re.compile(r"^\d+(?:\.\d+)?\s*(?:hrs?|min)$", re.IGNORECASE)
_PROGRESS_RE = re.compile(r"(\d+)\s*/\s*(\d+)")


def _module_string(name: str, duration: str, head_text: str) -> str | None:
    """Rebuild the legacy multi-line module entry: name / duration / done/total.

    build-data.mjs's parser reads line 0 as the name and picks out a duration
    line (e.g. "2.4 hrs") and a progress line (e.g. "0/22") for the lesson count.
    The lesson total is read from the "done/total" counter specifically, not from
    any stray digit, so a duration like "108 min" can't be mistaken for a count.
    """
    name = (name or "").strip()
    if not name:
        return None
    parts = [name]
    duration = (duration or "").strip()
    if duration and _DURATION_RE.match(duration):
        parts.append(duration)
    progress = _PROGRESS_RE.search(head_text or "")
    if progress:
        parts.append(f"0/{progress.group(2)}")
    return "\n".join(parts)


def fetch_modules_selenium(url: str, module_wait: int = SELENIUM_MODULE_WAIT) -> tuple[list[str], list[str]]:
    """Render a course/path page, return (headings_h2, headings_h3).

    headings_h2 holds one multi-line entry per top-level module (name,
    duration, lesson counter) so build-data.mjs's existing parser handles it.
    A page that renders its table of contents but has no module grouping
    returns an empty list (not an error).
    """
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.support.ui import WebDriverWait

    opts = ChromeOptions()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1280,1600")
    opts.add_argument("--disable-extensions")
    # Block images + media + fonts to cut renderer load on big course pages
    opts.add_experimental_option(
        "prefs",
        {
            "profile.managed_default_content_settings.images": 2,
            "profile.managed_default_content_settings.media_stream": 2,
            "profile.managed_default_content_settings.fonts": 2,
        },
    )
    opts.add_argument(f"--user-agent={USER_AGENT}")
    driver = webdriver.Chrome(options=opts)
    try:
        driver.set_page_load_timeout(SELENIUM_PAGE_TIMEOUT)
        try:
            driver.get(url)
        except Exception:
            # Page-load timeout can fire even though the DOM is usable.
            # Stop the page and continue to the readiness wait below.
            driver.execute_script("window.stop();")
        # Readiness: the curriculum hydrates inside <toc-root>; wait for the
        # table of contents to actually populate (toc-item-head elements), not
        # just for a bare <h2> (the sidebar's static "Popular" heading).
        WebDriverWait(driver, module_wait).until(
            lambda d: d.execute_script(
                "return !!document.querySelector('toc-root') && "
                "document.querySelectorAll('toc-item-head').length > 0"
            )
        )
        # Let remaining top-level groups settle in.
        time.sleep(2)
        rows = driver.execute_script(_TOC_MODULE_JS) or []
        h2s: list[str] = []
        for row in rows:
            name = row[0] if len(row) > 0 else ""
            duration = row[1] if len(row) > 1 else ""
            head_text = row[2] if len(row) > 2 else ""
            entry = _module_string(name, duration, head_text)
            if entry:
                h2s.append(entry)
        return h2s, []
    finally:
        driver.quit()


def run_modules_pass(pages: dict[str, PageData], logger: logging.Logger) -> None:
    """In-place fill headings_h2/h3 for course/path pages, with a retry pass."""
    # Only course pages carry a curriculum; topic hubs (/t/*) have no toc and
    # would just time out and log spurious failures.
    targets = [
        (url, p) for url, p in pages.items()
        if p.page_type == "course"
    ]
    if not targets:
        return

    def run_pool(urls: list[tuple[str, PageData]], module_wait: int, label: str) -> list[tuple[str, PageData]]:
        failed: list[tuple[str, PageData]] = []
        logger.info("modules pass (%s): %d urls, %d workers, wait=%ds",
                    label, len(urls), SELENIUM_WORKERS, module_wait)
        completed = 0
        with ThreadPoolExecutor(max_workers=SELENIUM_WORKERS) as pool:
            futures = {
                pool.submit(fetch_modules_selenium, url, module_wait): (url, page)
                for url, page in urls
            }
            for future in as_completed(futures):
                url, page = futures[future]
                completed += 1
                try:
                    # An empty list is a valid result: the toc rendered but the
                    # course has no module grouping (a flat list of lessons).
                    # Genuine render failures raise inside fetch_modules_selenium
                    # (readiness timeout) and are retried below.
                    h2s, h3s = future.result()
                    page.headings_h2 = h2s
                    page.headings_h3 = h3s
                    if completed % 5 == 0 or completed == len(urls):
                        logger.info("modules pass (%s): %d/%d", label, completed, len(urls))
                except Exception as e:
                    logger.warning("modules fail (%s) %s: %s", label, url, e)
                    failed.append((url, page))
        return failed

    failed = run_pool(targets, SELENIUM_MODULE_WAIT, "main")
    if failed:
        logger.info("retrying %d failed module extractions with longer waits", len(failed))
        # Retry serially to avoid contention on the same heavy pages.
        retry_failed: list[tuple[str, PageData]] = []
        for url, page in failed:
            try:
                h2s, h3s = fetch_modules_selenium(url, SELENIUM_RETRY_MODULE_WAIT)
                if h2s:
                    page.headings_h2 = h2s
                    page.headings_h3 = h3s
                else:
                    retry_failed.append((url, page))
            except Exception as e:
                logger.warning("modules retry fail %s: %s", url, e)
                retry_failed.append((url, page))
        if retry_failed:
            logger.warning(
                "%d course/topic pages still missing module data after retry",
                len(retry_failed),
            )


# ── Disk layout ────────────────────────────────────────────────────

def page_subdir(output_dir: Path, page: PageData) -> Path:
    parsed = urlparse(page.url)
    domain = parsed.netloc
    slug = page.course_slug or "index"
    if domain == "scrimba.helpscoutdocs.com":
        path_parts = parsed.path.strip("/").split("/")
        slug = "/".join(path_parts) if path_parts and path_parts[0] else "index"
        return output_dir / domain / "help" / slug
    if page.page_type == "course":
        return output_dir / domain / "course" / slug
    if page.page_type == "topic":
        return output_dir / domain / "topic" / slug
    return output_dir / domain / "marketing" / slug


def yaml_quote(s: str) -> str:
    """Quote a single-line value for YAML frontmatter."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def yaml_list(items: list[str]) -> str:
    """Render a YAML list, preserving multi-line entries verbatim (matches the
    legacy Selenium scraper output that build-data.mjs already parses)."""
    if not items:
        return "  []"
    out = []
    for item in items:
        # Multi-line entries: keep newlines, just wrap in quotes
        if "\n" in item:
            escaped = item.replace("\\", "\\\\").replace('"', '\\"')
            out.append(f'  - "{escaped}"')
        else:
            out.append(f"  - {yaml_quote(item)}")
    return "\n".join(out)


def save_page(page: PageData, output_dir: Path) -> dict:
    subdir = page_subdir(output_dir, page)
    subdir.mkdir(parents=True, exist_ok=True)

    # Rich course facts (one quoted key per line so build-data.mjs's simple
    # frontmatter parser reads them directly).
    meta_lines = "".join(
        f"{key}: {yaml_quote(str(value))}\n"
        for key, value in (page.course_meta or {}).items()
        if value not in (None, "")
    )

    frontmatter = (
        "---\n"
        f"title: {yaml_quote(page.title)}\n"
        f"url: {yaml_quote(page.url)}\n"
        f"domain: {yaml_quote(urlparse(page.url).netloc)}\n"
        f"type: {yaml_quote(page.page_type)}\n"
        f"course_slug: {page.course_slug or 'null'}\n"
        f"scraped_at: {yaml_quote(page.scraped_at)}\n"
        f"date_modified: {yaml_quote(page.date_modified)}\n"
        f"meta_description: {yaml_quote(page.meta_description)}\n"
        f"{meta_lines}"
        f"headings_h1:\n{yaml_list(page.headings_h1)}\n"
        f"headings_h2:\n{yaml_list(page.headings_h2)}\n"
        f"headings_h3:\n{yaml_list(page.headings_h3)}\n"
        "---\n\n"
        f"{page.body_text}\n"
    )
    md_path = subdir / "index.md"
    md_path.write_text(frontmatter, encoding="utf-8")
    return {
        "path": str(md_path.relative_to(output_dir)),
        "screenshot": "",
        "title": page.title,
        "url": page.url,
        "type": page.page_type,
    }


# ── Incremental cache ──────────────────────────────────────────────

def load_prior_dates(index_path: Path, output_dir: Path) -> dict[str, str]:
    """Map url -> date_modified from the previous run, for incremental skip."""
    out: dict[str, str] = {}
    if not index_path.exists():
        return out
    try:
        index = json.loads(index_path.read_text())
    except Exception:
        return out
    for entry in index:
        md_path = output_dir / entry.get("path", "")
        if not md_path.exists():
            continue
        try:
            text = md_path.read_text(encoding="utf-8")
        except Exception:
            continue
        m = re.search(r'^date_modified:\s*"([^"]*)"', text, re.MULTILINE)
        if m and m.group(1):
            out[entry["url"]] = m.group(1)
    return out


# ── Main ───────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Scrimba public pages")
    parser.add_argument("--urls", type=Path, help="Text file with URLs to scrape (one per line)")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR, help="Output directory")
    parser.add_argument(
        "--type",
        choices=["course", "topic", "marketing", "help"],
        help="Only scrape this page type",
    )
    parser.add_argument(
        "--no-modules", action="store_true",
        help="Skip the Selenium modules pass (course pages will have empty headings_h2)",
    )
    parser.add_argument(
        "--full", action="store_true",
        help="Ignore incremental cache; re-scrape everything",
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Skip URLs already present in index.json (legacy, prefer incremental default)",
    )
    args = parser.parse_args()

    output_dir = args.output.resolve()
    logger = setup_logging(output_dir)
    started = time.time()

    # ── Discover ─────────────────────────────────────────────────
    if args.urls:
        all_urls = [
            line.strip()
            for line in args.urls.read_text().splitlines()
            if line.strip() and not line.startswith("#")
        ]
        logger.info("loaded %d urls from %s", len(all_urls), args.urls)
    else:
        sitemap_urls, help_urls = discover_urls_sync(logger)
        all_urls = sorted(set(sitemap_urls) | set(help_urls))
        logger.info("discovered total: %d urls", len(all_urls))

    # ── Classify + filter ────────────────────────────────────────
    url_tasks: list[tuple[str, str]] = []
    for url in all_urls:
        ptype = classify_url(url)
        if ptype is None:
            continue
        if args.type and ptype != args.type:
            continue
        url_tasks.append((url, ptype))
    logger.info(
        "after classify: %d urls (%d courses, %d topics, %d marketing, %d help)",
        len(url_tasks),
        sum(1 for _, t in url_tasks if t == "course"),
        sum(1 for _, t in url_tasks if t == "topic"),
        sum(1 for _, t in url_tasks if t == "marketing"),
        sum(1 for _, t in url_tasks if t == "help"),
    )

    # ── Fast pass (JSON-LD via httpx) ────────────────────────────
    pages_list = asyncio.run(fetch_many(url_tasks, logger))
    pages: dict[str, PageData] = {p.url: p for p in pages_list}
    logger.info("fast pass complete: %d/%d pages", len(pages), len(url_tasks))

    # ── Incremental cache: prune unchanged course/topic pages ────
    index_path = output_dir / "index.json"
    needs_modules: dict[str, PageData] = {}
    skipped_modules = 0
    if not args.no_modules:
        prior_dates = {} if args.full else load_prior_dates(index_path, output_dir)
        for url, page in pages.items():
            if page.page_type not in {"course", "topic"}:
                continue
            prior = prior_dates.get(url, "")
            if prior and page.date_modified and prior == page.date_modified:
                md_path = output_dir / page_subdir(output_dir, page).relative_to(output_dir) / "index.md"
                if md_path.exists():
                    text = md_path.read_text(encoding="utf-8")
                    prior_h2 = _read_yaml_list(text, "headings_h2")
                    prior_h3 = _read_yaml_list(text, "headings_h3")
                    # Only trust the cache when the prior run actually captured modules.
                    # An empty h2 list means the previous Selenium pass failed; redo it.
                    if prior_h2:
                        page.headings_h2 = prior_h2
                        page.headings_h3 = prior_h3
                        skipped_modules += 1
                        continue
            needs_modules[url] = page
        if skipped_modules:
            logger.info(
                "incremental: %d course/topic pages unchanged, %d to re-render",
                skipped_modules, len(needs_modules),
            )

        if needs_modules:
            run_modules_pass(needs_modules, logger)

    # ── Save ─────────────────────────────────────────────────────
    index: list[dict] = []
    for page in pages.values():
        index.append(save_page(page, output_dir))
    index.sort(key=lambda x: x["url"])
    index_path.write_text(
        json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    elapsed = time.time() - started
    logger.info("wrote %d entries -> %s", len(index), index_path)
    logger.info("done in %.1fs", elapsed)


def _read_yaml_list(text: str, key: str) -> list[str]:
    """Tolerant reader for the multi-line YAML list we emit ourselves."""
    pattern = rf"^{key}:\s*\n((?:  - .*(?:\n(?!\w+:)(?!---).*)*\n)*)"
    m = re.search(pattern, text, re.MULTILINE)
    if not m:
        return []
    block = m.group(1)
    items: list[str] = []
    current: list[str] = []
    for line in block.splitlines():
        if line.startswith("  - "):
            if current:
                items.append("\n".join(current))
                current = []
            current.append(line[4:].lstrip())
        elif line.startswith("    ") and current:
            current.append(line.lstrip())
    if current:
        items.append("\n".join(current))
    # Strip wrapping quotes
    cleaned = []
    for item in items:
        if item.startswith('"') and item.endswith('"'):
            item = item[1:-1].replace('\\"', '"').replace("\\\\", "\\")
        cleaned.append(item)
    return [c for c in cleaned if c and c != "[]"]


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        sys.exit(130)
