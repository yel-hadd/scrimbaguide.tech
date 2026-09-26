/**
 * GA4 `content_group` for a pathname. The first matching rule wins.
 *
 * The rules live in JSON so `plugins/analytics` can inline the same list into
 * the <head> script that labels the first page_view (it goes out before React
 * runs). Patterns are JS regex source strings matched against the path with a
 * trailing slash.
 */
import RULES from './contentGroupRules.json';

export const CONTENT_GROUP_RULES: ReadonlyArray<readonly string[]> = RULES;

export function contentGroup(pathname: string): string {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  for (const [pattern, group] of CONTENT_GROUP_RULES) {
    if (new RegExp(pattern).test(path)) return group;
  }
  return 'other';
}
