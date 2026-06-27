import React, { useRef, useEffect, useCallback } from 'react';
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
  isOpen: boolean;
  menuId: string;
  onToggle: () => void;
  onClose: (id: string) => void;
}

const CLOSE_DELAY = 200;

export default function MegaMenu({ label, items, isOpen, menuId, onToggle, onClose }: MegaMenuProps) {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const cancelCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelCloseTimer();
    closeTimer.current = setTimeout(() => {
      onClose(menuId);
    }, CLOSE_DELAY);
  }, [onClose, menuId, cancelCloseTimer]);

  const handleMouseEnter = useCallback(() => {
    cancelCloseTimer();
    if (!isOpen) {
      onToggle();
    }
  }, [isOpen, onToggle, cancelCloseTimer]);

  const handleMouseLeave = useCallback(() => {
    if (isOpen) {
      scheduleClose();
    }
  }, [isOpen, scheduleClose]);

  const handleToggleClick = useCallback(() => {
    cancelCloseTimer();
    onToggle();
  }, [onToggle, cancelCloseTimer]);

  const handleLinkClick = useCallback(() => {
    cancelCloseTimer();
    onClose(menuId);
  }, [onClose, menuId, cancelCloseTimer]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        if ((target as HTMLElement).closest('.mega-menu__toggle')) {
          return;
        }
        onClose(menuId);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, menuId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(menuId);
        buttonRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, menuId, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleClick();
    }
    if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const firstLink = containerRef.current?.querySelector('.mega-menu__link') as HTMLElement;
      firstLink?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`mega-menu${isOpen ? ' mega-menu--open' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        className="navbar__link mega-menu__toggle clean-btn"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={handleToggleClick}
        onKeyDown={handleKeyDown}
      >
        {label}
      </button>
      {isOpen && (
        <div 
          className="mega-menu__panel" 
          role="menu"
          aria-label={`${label} menu`}
          onMouseEnter={cancelCloseTimer}
          onMouseLeave={handleMouseLeave}
        >
          <div className="mega-menu__inner">
            {items.map((item) => {
              const Icon = item.icon ? ICON_MAP[item.icon] : null;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="mega-menu__link"
                  role="menuitem"
                  onClick={handleLinkClick}
                >
                  {Icon && (
                    <div className="mega-menu__link-icon" aria-hidden="true">
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
      )}
    </div>
  );
}
