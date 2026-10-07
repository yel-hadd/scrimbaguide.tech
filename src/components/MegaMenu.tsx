import React, { useRef, useEffect, useCallback, useId } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import {
  BookOpen,
  Scale,
  Tag,
  CircleHelp,
  LayoutGrid,
  Compass,
  Calculator,
  Map,
  Sparkles,
  PlayCircle,
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
  Sparkles,
  PlayCircle,
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
// A toggle click this soon after a hover-open is the same gesture, not a close.
const HOVER_CLICK_WINDOW = 1000;

export default function MegaMenu({ label, items, isOpen, menuId, onToggle, onClose }: MegaMenuProps) {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Set when hovering opened the panel. The click that usually follows the
  // hover must not toggle it shut again: with hover-to-open, a mouse user who
  // moves to the toggle and clicks would otherwise see the panel flash open
  // and close (how much depends on whether React re-rendered in between).
  const hoverOpenedAt = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const { pathname } = useLocation();

  // Highlight the trigger when the current page lives under one of its items, so
  // pages inside the Learn/Tools dropdowns get the same "you are here" wayfinding
  // that Paths/Courses/Blog already receive from Infima's navbar__link--active.
  const isActive = items.some((item) => {
    const to = item.to.replace(/\/$/, '');
    return to !== '' && (pathname === to || pathname.startsWith(`${to}/`));
  });

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
      hoverOpenedAt.current = Date.now();
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
    if (Date.now() - hoverOpenedAt.current < HOVER_CLICK_WINDOW) {
      // Keep the hover-opened panel open; a later click closes it.
      hoverOpenedAt.current = 0;
      if (!isOpen) onToggle();
      return;
    }
    onToggle();
  }, [isOpen, onToggle, cancelCloseTimer]);

  // Any close (outside click, Escape, link, mouse leave) ends the hover state.
  useEffect(() => {
    if (!isOpen) hoverOpenedAt.current = 0;
  }, [isOpen]);

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

    // Keyboard users tabbing past the last panel link would otherwise leave the
    // panel open over the page (mouse users get click-outside; keyboard got nothing).
    const handleFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (containerRef.current && next && !containerRef.current.contains(next)) {
        onClose(menuId);
      }
    };
    const el = containerRef.current;
    el?.addEventListener('focusout', handleFocusOut);
    return () => el?.removeEventListener('focusout', handleFocusOut);
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
        className={`navbar__link mega-menu__toggle clean-btn${isActive ? ' navbar__link--active' : ''}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={handleToggleClick}
        onKeyDown={handleKeyDown}
      >
        {label}
      </button>
      {isOpen && (
        <div
          id={panelId}
          className="mega-menu__panel"
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
