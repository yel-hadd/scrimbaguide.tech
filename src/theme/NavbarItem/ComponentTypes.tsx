/**
 * Adds `custom-affiliateCta`: a stock default navbar item that also sends
 * `affiliate_link_clicked`. It delegates to DefaultNavbarItem so the desktop
 * `<a>` and the drawer's `li.menu__list-item > a.menu__link` render exactly as
 * before; only the click handler is added. The drawer passes its own onClick
 * (close the sidebar), which still runs after the tracking call.
 */
import React, { type MouseEvent, type ReactNode } from 'react';
import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import type { Props as DefaultNavbarItemProps } from '@theme/NavbarItem/DefaultNavbarItem';
import { trackAffiliateClick } from '@site/src/components/AffiliateLink';
import { navbarCtaPayload } from '@site/src/utils/navbarCtaPayload';

type AffiliateCtaProps = DefaultNavbarItemProps & {
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

function AffiliateCtaNavbarItem(props: AffiliateCtaProps): ReactNode {
  const { onClick, mobile = false, href, label } = props;
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (href && typeof label === 'string') {
      trackAffiliateClick(navbarCtaPayload({ href, label }, mobile));
    }
    onClick?.(e);
  };
  return <DefaultNavbarItem {...props} onClick={handleClick} />;
}

export default {
  ...ComponentTypes,
  'custom-affiliateCta': AffiliateCtaNavbarItem,
};
