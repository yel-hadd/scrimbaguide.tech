import React, { useEffect, useRef } from 'react';
import SearchBarOriginal from '@theme-original/SearchBar';

type SearchBarProps = React.ComponentProps<typeof SearchBarOriginal>;

/**
 * Wraps the local-search SearchBar to patch two ARIA gaps in the underlying
 * autocomplete.js combobox that axe-core flags as critical:
 *   - aria-required-attr: a `role="combobox"` needs `aria-controls`; the widget
 *     only sets the ARIA 1.0 `aria-owns`, so we mirror it.
 *   - aria-required-children: a `role="listbox"` must own `role="option"`
 *     children; the widget renders suggestion <div>s with no role, so we add it
 *     (and reflect the active row via aria-selected).
 *
 * The dropdown DOM is created imperatively at runtime, so we patch it with a
 * MutationObserver. Everything is feature-detected and guarded — if the widget
 * markup changes upstream, this silently no-ops rather than throwing. The
 * observer's attributeFilter deliberately omits the attributes we write
 * (role/aria-selected/aria-controls/id) so our own writes can't re-trigger it.
 */
export default function SearchBar(props: SearchBarProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof MutationObserver === 'undefined') {
      return;
    }

    let optionSeq = 0;

    const enhance = (): void => {
      // Mirror aria-owns -> aria-controls on the combobox input.
      const input = root.querySelector<HTMLInputElement>('input[role="combobox"]');
      if (input) {
        const owns = input.getAttribute('aria-owns');
        if (owns && input.getAttribute('aria-controls') !== owns) {
          input.setAttribute('aria-controls', owns);
        }
      }

      const listbox = root.querySelector<HTMLElement>('[role="listbox"]');
      if (!listbox) {
        return;
      }

      // Generic wrappers between the listbox and its options would break
      // listbox -> option ownership; mark them presentational.
      listbox
        .querySelectorAll<HTMLElement>('[class*="suggestions"], [class*="dataset"]')
        .forEach((el) => {
          if (!el.getAttribute('role')) {
            el.setAttribute('role', 'presentation');
          }
        });

      // Each suggestion row becomes a real option. Note [class*="suggestion"]
      // also matches the "suggestions" container, so skip that one.
      listbox
        .querySelectorAll<HTMLElement>('[class*="suggestion"]')
        .forEach((el) => {
          if (el.matches('[class*="suggestions"]')) {
            return;
          }
          if (el.getAttribute('role') !== 'option') {
            el.setAttribute('role', 'option');
          }
          if (!el.id) {
            el.id = `sg-search-opt-${optionSeq++}`;
          }
          const want = el.className.includes('cursor') ? 'true' : 'false';
          if (el.getAttribute('aria-selected') !== want) {
            el.setAttribute('aria-selected', want);
          }
        });

      // The "See all results" footer link sits inside the listbox. A listbox may
      // only own option/group children, so an interactive <a> there trips
      // aria-required-children (and, caught mid-render, link-name). Reclassify it
      // as the final option — it stays a real, clickable navigation target.
      listbox.querySelectorAll<HTMLElement>('[class*="hitFooter"]').forEach((el) => {
        if (!el.getAttribute('role')) {
          el.setAttribute('role', 'presentation');
        }
      });
      listbox.querySelectorAll<HTMLAnchorElement>('[class*="hitFooter"] a').forEach((a) => {
        if (a.getAttribute('role') !== 'option') {
          a.setAttribute('role', 'option');
        }
        if (!a.id) {
          a.id = `sg-search-opt-${optionSeq++}`;
        }
        if (a.getAttribute('aria-selected') !== 'false') {
          a.setAttribute('aria-selected', 'false');
        }
      });
    };

    const observer = new MutationObserver(enhance);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-owns', 'style'],
    });
    enhance();

    return () => observer.disconnect();
  }, []);

  // display: contents keeps the wrapper out of the navbar layout flow.
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <SearchBarOriginal {...props} />
    </div>
  );
}
