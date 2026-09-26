import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import inventory  # noqa: E402

ROUTE_CASES = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                            '__tests__', 'fixtures', 'route-cases.json')


class TestFrontmatter(unittest.TestCase):
    def test_parses_basic_fields(self):
        text = '---\ntitle: "Hello World"\ndraft: true\nslug: /custom/\n---\nBody\n## A heading\n'
        fm, body = inventory.frontmatter(text)
        self.assertEqual(fm['title'], 'Hello World')
        self.assertTrue(fm['draft'])
        self.assertEqual(fm['slug'], '/custom/')
        self.assertIn('## A heading', body)

    def test_draft_capital_true(self):
        fm, _ = inventory.frontmatter('---\ndraft: True\n---\nbody')
        self.assertTrue(fm['draft'])

    def test_no_frontmatter(self):
        fm, body = inventory.frontmatter('just a body, no frontmatter')
        self.assertEqual(fm, {})

    def test_last_update_date_and_reviewed(self):
        text = '---\ntitle: X\nreviewed: "2026-09-01"\nlast_update:\n  date: 2026-09-20\n---\nbody'
        fm, _ = inventory.frontmatter(text)
        self.assertEqual(fm['reviewed'], '2026-09-01')
        self.assertEqual(fm['last_update_date'], '2026-09-20')


class TestInventoryTmpTree(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = self.tmp.name
        os.makedirs(os.path.join(root, 'docs', 'courses', 'react'))
        os.makedirs(os.path.join(root, 'blog'))
        os.makedirs(os.path.join(root, 'src', 'pages'))

        # numeric-prefix doc
        with open(os.path.join(root, 'docs', 'courses', 'react', '01-learn-react.mdx'), 'w') as f:
            f.write('---\ntitle: Learn React\ndraft: false\n---\n## Module 1\n')

        # slug override doc
        with open(os.path.join(root, 'docs', '05-pricing-page.mdx'), 'w') as f:
            f.write('---\ntitle: Pricing\nslug: /docs/pricing/pro-vs-free\n---\nbody\n')

        # index.mdx
        os.makedirs(os.path.join(root, 'docs', 'paths'))
        with open(os.path.join(root, 'docs', 'paths', 'index.mdx'), 'w') as f:
            f.write('---\ntitle: Paths\n---\nbody\n')

        # draft stub
        with open(os.path.join(root, 'docs', '99-draft-stub.mdx'), 'w') as f:
            f.write('---\ntitle: Draft\ndraft: true\n---\nbody\n')

        # blog post with no slug
        with open(os.path.join(root, 'blog', '2026-05-01-no-slug-post.mdx'), 'w') as f:
            f.write('---\ntitle: No Slug Post\n---\nbody\n')

        # RULES_PATH stays pointed at the real repo's contentGroupRules.json
        # (computed at import time from the real ROOT); only the tree walked
        # by inventory() moves to the tmp dir.
        self._orig = (inventory.ROOT, inventory.DOCS_DIR, inventory.BLOG_DIR, inventory.PAGES_DIR)
        inventory.ROOT = root
        inventory.DOCS_DIR = os.path.join(root, 'docs')
        inventory.BLOG_DIR = os.path.join(root, 'blog')
        inventory.PAGES_DIR = os.path.join(root, 'src', 'pages')

    def tearDown(self):
        inventory.ROOT, inventory.DOCS_DIR, inventory.BLOG_DIR, inventory.PAGES_DIR = self._orig
        self.tmp.cleanup()

    def test_drafts_excluded(self):
        inv = inventory.inventory()
        routes = {p['route'] for p in inv}
        self.assertNotIn('/docs/draft-stub/', routes)

    def test_numeric_prefix_stripped(self):
        inv = inventory.inventory()
        routes = {p['route'] for p in inv}
        self.assertIn('/docs/courses/react/learn-react/', routes)

    def test_slug_override_used(self):
        inv = inventory.inventory()
        routes = {p['route'] for p in inv}
        self.assertIn('/docs/pricing/pro-vs-free/', routes)

    def test_index_mdx_route(self):
        inv = inventory.inventory()
        routes = {p['route'] for p in inv}
        self.assertIn('/docs/paths/', routes)

    def test_blog_post_missing_slug_falls_back_to_filename(self):
        inv = inventory.inventory()
        blog_routes = {p['route'] for p in inv if p['kind'] == 'blog'}
        self.assertIn('/blog/no-slug-post/', blog_routes)
        self.assertNotIn('/blog/None/', blog_routes)


class TestTsxPagesIncluded(unittest.TestCase):
    """Runs against the real repo tree (no ROOT/PAGES_DIR override): the TSX
    pages under src/pages must show up in the inventory alongside the MDX
    ones."""

    def test_home_and_tool_tsx_pages_present(self):
        inv = inventory.inventory()
        routes = {p['route'] for p in inv}
        self.assertIn('/', routes)
        self.assertIn('/tools/bootcamp-cost-calculator/', routes)

    def test_tsx_page_kind_is_page(self):
        inv = inventory.inventory()
        by_route = {p['route']: p for p in inv}
        self.assertEqual(by_route['/tools/bootcamp-cost-calculator/']['kind'], 'page')


class TestRoutesForFiles(unittest.TestCase):
    def test_maps_files_to_routes(self):
        inv = [{'file': 'docs/courses/react/learn-react.mdx', 'route': '/docs/courses/react/learn-react/'}]
        import types
        fake = types.SimpleNamespace(inventory=lambda: inv)
        orig = inventory.inventory
        inventory.inventory = lambda: inv
        try:
            routes = inventory.routes_for_files(['docs/courses/react/learn-react.mdx', 'nope.mdx'])
            self.assertEqual(routes, ['/docs/courses/react/learn-react/'])
        finally:
            inventory.inventory = orig

    def test_courses_json_maps_to_all_course_routes_only_with_include_catalog(self):
        inv = [
            {'file': 'docs/courses/react/learn-react.mdx', 'route': '/docs/courses/react/learn-react/'},
            {'file': 'docs/pricing/pro.mdx', 'route': '/docs/pricing/pro/'},
        ]
        orig = inventory.inventory
        inventory.inventory = lambda: inv
        try:
            self.assertEqual(inventory.routes_for_files(['data/courses.json']), [])
            self.assertEqual(inventory.routes_for_files(['data/courses.json'], include_catalog=True),
                             ['/docs/courses/react/learn-react/'])
        finally:
            inventory.inventory = orig


class TestRedirectSources(unittest.TestCase):
    def test_parses_from_to_pairs(self):
        with tempfile.TemporaryDirectory() as d:
            config = os.path.join(d, 'docusaurus.config.ts')
            with open(config, 'w') as f:
                f.write(
                    "redirects: [\n  {\n    from: '/blog/old-post',\n    to: '/docs/new-post',\n  },\n"
                    "  { from: '/blog/old-single-line', to: '/docs/new-single-line/' },\n]"
                )
            redirects_json = os.path.join(d, 'course-redirects.json')
            with open(redirects_json, 'w') as f:
                json.dump([{'from': '/docs/courses/x/old', 'to': '/docs/courses/x/'}], f)
            orig = (inventory.CONFIG_PATH, inventory.COURSE_REDIRECTS_PATH)
            inventory.CONFIG_PATH = config
            inventory.COURSE_REDIRECTS_PATH = redirects_json
            try:
                out = inventory.redirect_sources()
                self.assertIn({'from': '/blog/old-post', 'to': '/docs/new-post'}, out)
                self.assertIn({'from': '/docs/courses/x/old', 'to': '/docs/courses/x/'}, out)
                self.assertIn({'from': '/blog/old-single-line', 'to': '/docs/new-single-line/'}, out)
            finally:
                inventory.CONFIG_PATH, inventory.COURSE_REDIRECTS_PATH = orig


class TestContentGroupAndMoneyPageParity(unittest.TestCase):
    def test_matches_route_cases_fixture(self):
        cases = json.load(open(ROUTE_CASES))
        self.assertGreaterEqual(len(cases), 30)
        for c in cases:
            self.assertEqual(inventory.content_group(c['route']), c['content_group'], c['route'])
            self.assertEqual(inventory.money_page(c['route']), c['money_page'], c['route'])


if __name__ == '__main__':
    unittest.main()
