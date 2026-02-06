/**
 * Client module to fix accessibility issues in Docusaurus-generated markup.
 *
 * 1. Blog post TOC sidebar: wraps .col--2 content in a <nav> landmark
 * 2. Blog list page: injects a visually-hidden <h1> inside <main>
 */
import type { ClientModule } from '@docusaurus/types';

function fixBlogTocLandmark() {
  if (!document.querySelector('.blog-post-page')) return;

  const toc = document.querySelector<HTMLElement>('.col.col--2');
  if (!toc || toc.closest('nav')) return;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Table of contents');

  while (toc.firstChild) {
    nav.appendChild(toc.firstChild);
  }
  toc.appendChild(nav);
}

function fixBlogListHeading() {
  if (!document.querySelector('.blog-list-page')) return;

  const main = document.querySelector('main');
  if (!main || main.querySelector('h1')) return;

  const h1 = document.createElement('h1');
  h1.className = 'sr-only';
  h1.textContent = 'ScrimbAGuide Blog';
  main.prepend(h1);
}

const module: ClientModule = {
  onRouteDidUpdate() {
    setTimeout(() => {
      fixBlogTocLandmark();
      fixBlogListHeading();
    }, 100);
  },
};

export default module;
