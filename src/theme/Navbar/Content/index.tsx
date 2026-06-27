import React, {type ReactNode, useState, useCallback} from 'react';
import clsx from 'clsx';
import {
  useThemeConfig,
  ErrorCauseBoundary,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {
  splitNavbarItems,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarItem, {type Props as NavbarItemConfig} from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '@theme/Navbar/Search';
import MegaMenu from '@site/src/components/MegaMenu';
import styles from './styles.module.css';

function useNavbarItems() {
  return useThemeConfig().navbar.items as NavbarItemConfig[];
}

interface NavbarItemsProps {
  items: NavbarItemConfig[];
  openMegaMenu: string | null;
  onOpenMegaMenu: (id: string | null) => void;
  onCloseMegaMenu: (id: string) => void;
}

function NavbarItems({items, openMegaMenu, onOpenMegaMenu, onCloseMegaMenu}: NavbarItemsProps): ReactNode {
  return (
    <>
      {items.map((item, i) => {
        const itemAny = item as any;
        if (itemAny.type === 'dropdown' && itemAny.items?.[0]?.icon) {
          const menuId = `mega-${itemAny.label.toLowerCase()}`;
          const isOpen = openMegaMenu === menuId;
          return (
            <MegaMenu
              key={i}
              label={itemAny.label}
              items={itemAny.items}
              isOpen={isOpen}
              menuId={menuId}
              onToggle={() => onOpenMegaMenu(isOpen ? null : menuId)}
              onClose={onCloseMegaMenu}
            />
          );
        }
        return (
          <ErrorCauseBoundary
            key={i}
            onError={(error) =>
              new Error(
                `A theme navbar item failed to render.
Please double-check the following navbar item (themeConfig.navbar.items) of your Docusaurus config:
${JSON.stringify(item, null, 2)}`,
                {cause: error},
              )
            }>
            <NavbarItem {...item} />
          </ErrorCauseBoundary>
        );
      })}
    </>
  );
}

function NavbarContentLayout({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="navbar__inner">
      <div
        className={clsx(
          ThemeClassNames.layout.navbar.containerLeft,
          'navbar__items',
        )}>
        {left}
      </div>
      <div
        className={clsx(
          ThemeClassNames.layout.navbar.containerRight,
          'navbar__items navbar__items--right',
        )}>
        {right}
      </div>
    </div>
  );
}

export default function NavbarContent(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();
  const [leftItems, rightItems] = splitNavbarItems(items);
  const searchBarItem = items.find((item) => item.type === 'search');

  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null);

  const handleOpenMegaMenu = useCallback((id: string | null) => {
    setOpenMegaMenu(id);
  }, []);

  const handleCloseMegaMenu = useCallback((id: string) => {
    setOpenMegaMenu((prev) => (prev === id ? null : prev));
  }, []);

  return (
    <NavbarContentLayout
      left={
        <>
          {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
          <NavbarLogo />
          <NavbarItems
            items={leftItems}
            openMegaMenu={openMegaMenu}
            onOpenMegaMenu={handleOpenMegaMenu}
            onCloseMegaMenu={handleCloseMegaMenu}
          />
        </>
      }
      right={
        <>
          <NavbarItems
            items={rightItems}
            openMegaMenu={openMegaMenu}
            onOpenMegaMenu={handleOpenMegaMenu}
            onCloseMegaMenu={handleCloseMegaMenu}
          />
          <NavbarColorModeToggle className={styles.colorModeToggle} />
          {!searchBarItem && (
            <NavbarSearch>
              <SearchBar />
            </NavbarSearch>
          )}
        </>
      }
    />
  );
}
