import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from '@docusaurus/Link';
import {
  BookOpen,
  Scale,
  Tag,
  CircleHelp,
  LayoutGrid,
  Compass,
  Calculator,
  Map,
} from 'lucide-react';

const ICON_MAP = {
  BookOpen,
  Scale,
  Tag,
  CircleHelp,
  LayoutGrid,
  Compass,
  Calculator,
  Map,
} as const;

interface MegaMenuItem {
  to: string;
  label: string;
  icon?: keyof typeof ICON_MAP;
  description?: string;
}

interface MegaMenuProps {
  label: string;
  items: MegaMenuItem[];
}

const CLOSE_DELAY = 200;

export default function MegaMenu({ label, items }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    closeTimer.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      open();
    }
  }, [isOpen, open]);

  const handleLinkClick = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`mega-menu${isOpen ? ' mega-menu--open' : ''}`}
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <span
        className="navbar__link mega-menu__toggle"
        onClick={toggle}
        onFocus={open}
        onBlur={close}
      >
        {label}
      </span>
      <div className="mega-menu__panel" onMouseEnter={open} onMouseLeave={close}>
        <div className="mega-menu__inner">
          {items.map((item) => {
            const Icon = item.icon ? ICON_MAP[item.icon] : null;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="mega-menu__link"
                onClick={handleLinkClick}
              >
                {Icon && (
                  <div className="mega-menu__link-icon">
                    <Icon size={18} />
                  </div>
                )}
                <div className="mega-menu__link-text">
                  <div className="mega-menu__link-title">{item.label}</div>
                  {item.description && (
                    <div className="mega-menu__link-desc">{item.description}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
