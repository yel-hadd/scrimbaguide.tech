import email.message
import os
import sys
import tempfile
import unittest
from unittest import mock
from urllib.error import HTTPError

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import links  # noqa: E402


def _http_error(url, code, location=None):
    headers = email.message.Message()
    if location:
        headers['Location'] = location
    return HTTPError(url, code, 'err', headers, None)


class FakeHTTPResponse:
    def __init__(self, status, url):
        self.status = status
        self._url = url

    def getcode(self):
        return self.status

    def geturl(self):
        return self._url

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def _write(tmp, rel, text):
    path = os.path.join(tmp, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    return path


class TestExtractOutbound(unittest.TestCase):
    def test_keeps_only_allowed_hosts_and_dedupes_query_string(self):
        with tempfile.TemporaryDirectory() as tmp:
            f1 = _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://scrimba.com/learn-react-c0e?via=x'>Start</AffiliateLink>\n")
            f2 = _write(tmp, 'docs/b.mdx', "<AffiliateLink href='https://scrimba.com/learn-react-c0e?via=y'>Start</AffiliateLink>\n<a href='https://example.com/other'>nope</a>\n")
            f3 = _write(tmp, 'docs/c.mdx', "<ComparisonTable competitorUrl='https://www.udemy.com/course/x/' />\n")

            links_map = links.extract_outbound_links(files=[f1, f2, f3])

        self.assertEqual(len(links_map), 1)
        entry = next(iter(links_map.values()))
        self.assertEqual(entry['url'], 'https://scrimba.com/learn-react-c0e')
        self.assertEqual({os.path.basename(f) for f in entry['files']}, {'a.mdx', 'b.mdx'})

    def test_docs_scrimba_and_trk_udemy_hosts_are_kept(self):
        with tempfile.TemporaryDirectory() as tmp:
            f1 = _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://docs.scrimba.com/handbook' location='companion-docs'>Handbook</AffiliateLink>\n")
            f2 = _write(tmp, 'docs/b.mdx', "<AffiliateLink href='https://trk.udemy.com/abc123'>Deal</AffiliateLink>\n")
            links_map = links.extract_outbound_links(files=[f1, f2])
        hosts = {links.urlsplit(v['url']).netloc for v in links_map.values()}
        self.assertEqual(hosts, {'docs.scrimba.com', 'trk.udemy.com'})


class TestCheckOutbound(unittest.TestCase):
    def test_flags_bad_status(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://scrimba.com/dead-course-c0e'>Start</AffiliateLink>\n")
            with mock.patch.object(links, '_scan_files', return_value=[os.path.join(tmp, 'docs/a.mdx')]):
                def opener(req, timeout=15):
                    return FakeHTTPResponse(404, req.full_url)
                out = links.check_outbound(opener=opener, sleep=lambda s: None)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]['status'], 404)
        self.assertIn('bad status', out[0]['issue'])

    def test_flags_scrimba_slug_rename(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://scrimba.com/old-slug-c0e'>Start</AffiliateLink>\n")
            with mock.patch.object(links, '_scan_files', return_value=[os.path.join(tmp, 'docs/a.mdx')]):
                def opener(req, timeout=15):
                    return FakeHTTPResponse(200, 'https://scrimba.com/new-slug-c0e')
                out = links.check_outbound(opener=opener, sleep=lambda s: None)
        self.assertIn('renamed', out[0]['issue'])

    def test_flags_udemy_link_landing_on_search(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://trk.udemy.com/abc'>Deal</AffiliateLink>\n")
            with mock.patch.object(links, '_scan_files', return_value=[os.path.join(tmp, 'docs/a.mdx')]):
                def opener(req, timeout=15):
                    return FakeHTTPResponse(200, 'https://www.udemy.com/courses/search/?q=x')
                out = links.check_outbound(opener=opener, sleep=lambda s: None)
        self.assertIn('search', out[0]['issue'])

    def test_explain_urls_are_exempt(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://scrimba.com/explain/some-topic'>Try</AffiliateLink>\n")
            with mock.patch.object(links, '_scan_files', return_value=[os.path.join(tmp, 'docs/a.mdx')]):
                def opener(req, timeout=15):
                    raise AssertionError('should not fetch /explain URLs')
                out = links.check_outbound(opener=opener, sleep=lambda s: None)
        self.assertEqual(out, [])

    def test_udemy_blocked_by_www_udemy_403_is_unverifiable_not_bad_status(self):
        # Hop 1: trk.udemy.com redirects to an impact.com tracking URL
        # carrying the real destination in `u=`. Hop 2: fetching that URL
        # 403s (www.udemy.com blocking a scripted client), so the check
        # falls back to the `u=` destination instead of reporting the 403.
        dest = 'https://www.udemy.com/course/python-bootcamp/'
        impact_url = 'https://impact.com/redirect?u=' + dest.replace(':', '%3A').replace('/', '%2F')
        calls = []

        def opener(req, timeout=15):
            calls.append(req.full_url)
            if req.full_url == 'https://trk.udemy.com/abc':
                raise _http_error(req.full_url, 302, location=impact_url)
            raise _http_error(req.full_url, 403)

        with tempfile.TemporaryDirectory() as tmp:
            _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://trk.udemy.com/abc'>Deal</AffiliateLink>\n")
            with mock.patch.object(links, '_scan_files', return_value=[os.path.join(tmp, 'docs/a.mdx')]):
                out = links.check_outbound(opener=opener, sleep=lambda s: None)

        self.assertEqual(len(calls), 2)
        self.assertEqual(out[0]['issue'], 'unverifiable')
        self.assertNotIn('bad status', out[0].get('issue') or '')

    def test_udemy_u_param_landing_on_search_is_still_flagged(self):
        dest = 'https://www.udemy.com/courses/search/?q=x'
        impact_url = 'https://impact.com/redirect?u=' + dest.replace(':', '%3A').replace('/', '%2F')

        def opener(req, timeout=15):
            if req.full_url == 'https://trk.udemy.com/abc':
                raise _http_error(req.full_url, 302, location=impact_url)
            raise _http_error(req.full_url, 403)

        with tempfile.TemporaryDirectory() as tmp:
            _write(tmp, 'docs/a.mdx', "<AffiliateLink href='https://trk.udemy.com/abc'>Deal</AffiliateLink>\n")
            with mock.patch.object(links, '_scan_files', return_value=[os.path.join(tmp, 'docs/a.mdx')]):
                out = links.check_outbound(opener=opener, sleep=lambda s: None)

        self.assertIn('search', out[0]['issue'])

    def test_throttle_applies_to_each_attempt_not_just_between_links(self):
        # A HEAD that always fails should still force a wait before the GET
        # fallback and before the next link to the same host.
        waits = []

        def sleep(s):
            waits.append(s)

        def opener(req, timeout=15):
            if req.get_method() == 'HEAD':
                raise HTTPError(req.full_url, 500, 'err', None, None)
            return FakeHTTPResponse(200, req.full_url)

        with tempfile.TemporaryDirectory() as tmp:
            _write(
                tmp, 'docs/a.mdx',
                "<AffiliateLink href='https://scrimba.com/course-a-c0a'>A</AffiliateLink>\n"
                "<AffiliateLink href='https://scrimba.com/course-b-c0b'>B</AffiliateLink>\n",
            )
            with mock.patch.object(links, '_scan_files', return_value=[os.path.join(tmp, 'docs/a.mdx')]):
                links.check_outbound(opener=opener, sleep=sleep)

        # 4 attempts total (HEAD+GET per link) after the first; each of the
        # 3 attempts after the very first one waited.
        self.assertEqual(len(waits), 3)

    def test_limit_caps_number_of_network_checks(self):
        with tempfile.TemporaryDirectory() as tmp:
            f = _write(
                tmp, 'docs/a.mdx',
                "<AffiliateLink href='https://scrimba.com/course-a-c0a'>A</AffiliateLink>\n"
                "<AffiliateLink href='https://scrimba.com/course-b-c0b'>B</AffiliateLink>\n"
                "<AffiliateLink href='https://scrimba.com/course-c-c0c'>C</AffiliateLink>\n",
            )
            calls = []
            with mock.patch.object(links, '_scan_files', return_value=[f]):
                def opener(req, timeout=15):
                    calls.append(req.full_url)
                    return FakeHTTPResponse(200, req.full_url)
                links.check_outbound(limit=1, opener=opener, sleep=lambda s: None)
        self.assertEqual(len(calls), 1)


class TestCheckInternal(unittest.TestCase):
    def test_flags_missing_trailing_slash_and_unknown_route(self):
        fake_inventory_rows = [{'route': '/docs/courses/react/'}, {'route': '/docs/paths/frontend-developer-path/'}]
        fake_map_text = (
            "export const relatedGuidesMap = {\n"
            "  '/docs/courses/react': [\n"
            "    { href: '/docs/paths/frontend-developer-path/' },\n"
            "    { href: '/docs/courses/does-not-exist/' },\n"
            "  ],\n"
            "};\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            content_dir = os.path.join(tmp, 'src', 'content')
            os.makedirs(content_dir)
            rg_path = os.path.join(content_dir, 'relatedGuidesMap.ts')
            with open(rg_path, 'w') as f:
                f.write(fake_map_text)

            with mock.patch.object(links, 'ROOT', tmp), \
                 mock.patch.object(links.inventory, 'inventory', return_value=fake_inventory_rows), \
                 mock.patch.object(links.inventory, 'redirect_sources', return_value=[]):
                out = links.check_internal()

        by_url = {(row['url'], row['issue']) for row in out}
        self.assertIn(('/docs/courses/does-not-exist/', 'route not in inventory'), by_url)
        # the known-good href route is not flagged
        self.assertNotIn('/docs/paths/frontend-developer-path/', {u for u, _ in by_url})
        # a slashless map key is by design (resolveRelatedGuides strips the
        # trailing slash before lookup) and is checked for existence only,
        # never flagged as "missing trailing slash"
        self.assertNotIn('/docs/courses/react', {u for u, _ in by_url})

    def test_key_is_checked_for_existence_only(self):
        fake_inventory_rows = [{'route': '/docs/courses/react/'}]
        fake_map_text = (
            "export const relatedGuidesMap = {\n"
            "  '/docs/courses/does-not-exist': [\n"
            "    { href: '/docs/courses/react/' },\n"
            "  ],\n"
            "};\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            content_dir = os.path.join(tmp, 'src', 'content')
            os.makedirs(content_dir)
            rg_path = os.path.join(content_dir, 'relatedGuidesMap.ts')
            with open(rg_path, 'w') as f:
                f.write(fake_map_text)

            with mock.patch.object(links, 'ROOT', tmp), \
                 mock.patch.object(links.inventory, 'inventory', return_value=fake_inventory_rows), \
                 mock.patch.object(links.inventory, 'redirect_sources', return_value=[]):
                out = links.check_internal()

        by_url = {(row['url'], row['issue']) for row in out}
        self.assertIn(('/docs/courses/does-not-exist', 'route not in inventory'), by_url)

    def test_includes_and_startswith_literals_are_not_scanned(self):
        fake_map_text = (
            "export const relatedGuidesMap = {\n"
            "  '/docs/courses/react': [\n"
            "    { href: '/docs/paths/frontend-developer-path/' },\n"
            "  ],\n"
            "};\n"
            "\n"
            "export function resolveRelatedGuides(slug) {\n"
            "  if (slug.includes('/comparisons/')) return [];\n"
            "  if (slug.startsWith('/docs/courses/')) return [];\n"
            "  return [];\n"
            "}\n"
        )
        fake_inventory_rows = [{'route': '/docs/paths/frontend-developer-path/'}, {'route': '/docs/courses/react/'}]
        with tempfile.TemporaryDirectory() as tmp:
            content_dir = os.path.join(tmp, 'src', 'content')
            os.makedirs(content_dir)
            rg_path = os.path.join(content_dir, 'relatedGuidesMap.ts')
            with open(rg_path, 'w') as f:
                f.write(fake_map_text)

            with mock.patch.object(links, 'ROOT', tmp), \
                 mock.patch.object(links.inventory, 'inventory', return_value=fake_inventory_rows), \
                 mock.patch.object(links.inventory, 'redirect_sources', return_value=[]):
                out = links.check_internal()

        self.assertEqual(out, [])

    def test_blog_index_is_a_known_route(self):
        fake_map_text = (
            "export const relatedGuidesMap = {\n"
            "  '/docs/courses/react': [\n"
            "    { href: '/blog/' },\n"
            "  ],\n"
            "};\n"
        )
        fake_inventory_rows = [{'route': '/docs/courses/react/'}]
        with tempfile.TemporaryDirectory() as tmp:
            content_dir = os.path.join(tmp, 'src', 'content')
            os.makedirs(content_dir)
            rg_path = os.path.join(content_dir, 'relatedGuidesMap.ts')
            with open(rg_path, 'w') as f:
                f.write(fake_map_text)

            with mock.patch.object(links, 'ROOT', tmp), \
                 mock.patch.object(links.inventory, 'inventory', return_value=fake_inventory_rows), \
                 mock.patch.object(links.inventory, 'redirect_sources', return_value=[]):
                out = links.check_internal()

        self.assertEqual(out, [])

    def test_flags_redirect_target_not_in_inventory(self):
        with tempfile.TemporaryDirectory() as tmp:
            content_dir = os.path.join(tmp, 'src', 'content')
            os.makedirs(content_dir)
            with open(os.path.join(content_dir, 'relatedGuidesMap.ts'), 'w') as f:
                f.write('export const relatedGuidesMap = {};\n')

            with mock.patch.object(links, 'ROOT', tmp), \
                 mock.patch.object(links.inventory, 'inventory', return_value=[]), \
                 mock.patch.object(links.inventory, 'redirect_sources', return_value=[{'from': '/x', 'to': '/docs/gone/'}]):
                out = links.check_internal()

        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]['issue'], 'route not in inventory')
        self.assertEqual(out[0]['url'], '/docs/gone/')


if __name__ == '__main__':
    unittest.main()
