/**
 * The `affiliate_link_clicked` payload for the navbar's monetised CTA item
 * (`type: 'custom-affiliateCta'` in docusaurus.config.ts). Pure, so Node tests
 * can check it without rendering the navbar.
 */
export interface NavbarCtaItem {
  href: string;
  label: string;
}

export interface NavbarCtaPayload {
  url: string;
  ctaType: 'navbar';
  location: 'navbar-demo' | 'navbar-drawer-demo';
  linkText: string;
}

export function navbarCtaPayload(item: NavbarCtaItem, mobile: boolean): NavbarCtaPayload {
  return {
    url: item.href,
    ctaType: 'navbar',
    location: mobile ? 'navbar-drawer-demo' : 'navbar-demo',
    linkText: item.label,
  };
}
