import React from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { isBlogListPath } from './schemaUtils';
import { blogBreadcrumbSchema, blogBreadcrumbTrail } from '../utils/blogBreadcrumbs';
import styles from './BlogPostBreadcrumbs.module.css';

interface Props {
  title: string;
  permalink: string;
}

/**
 * Visible breadcrumbs plus the page's one BreadcrumbList, for blog post pages.
 * Mounted only by the swizzled BlogPostPage; the list-path guard keeps it off
 * /blog/, /blog/page/N/, tags, authors and the archive even if it is ever
 * mounted somewhere that renders per excerpt.
 */
export default function BlogPostBreadcrumbs({ title, permalink }: Props): React.ReactElement | null {
  const { pathname } = useLocation();
  if (isBlogListPath(pathname) || isBlogListPath(permalink)) return null;

  const trail = blogBreadcrumbTrail(title, permalink);
  const lastIndex = trail.length - 1;

  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(blogBreadcrumbSchema(trail))}</script>
      </Head>
      <nav className={`blog-post-breadcrumbs ${styles.container}`} aria-label="Breadcrumbs">
        <ul className="breadcrumbs">
          {trail.map((crumb, index) =>
            index === lastIndex ? (
              <li key={crumb.path} className="breadcrumbs__item breadcrumbs__item--active">
                <span className="breadcrumbs__link" aria-current="page">
                  {crumb.label}
                </span>
              </li>
            ) : (
              <li key={crumb.path} className="breadcrumbs__item">
                <Link className="breadcrumbs__link" to={crumb.path}>
                  {crumb.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
    </>
  );
}
