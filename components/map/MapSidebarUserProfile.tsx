'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronRight,
  faLanguage,
  faRightFromBracket,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/lib/store/authStore';
import { useUiStore } from '@/lib/store/uiStore';
import {
  mapNavItemIconRailClass,
  mapProfileInfoClass,
  mapProfileSurfaceClass,
  mapProfileTriggerClass,
} from '@/lib/map/mapShellStyles';
import { cn } from '@/lib/utils';

function initialsFromUser(name: string | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'GL';
}

type MapSidebarUserProfileProps = {
  expanded: boolean;
};

export function MapSidebarUserProfile({ expanded }: MapSidebarUserProfileProps) {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const locale = useUiStore(s => s.locale);
  const setLocale = useUiStore(s => s.setLocale);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [languagePos, setLanguagePos] = useState({ top: 0, left: 0 });

  const displayName = user?.name?.trim() || 'Người dùng';
  const displayEmail = user?.email?.trim() || '';
  const initials = initialsFromUser(user?.name, user?.email);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const sidebar = trigger.closest('[data-map-sidebar]');
    const triggerRect = trigger.getBoundingClientRect();
    const sidebarRect = sidebar?.getBoundingClientRect();
    const menu = menuRef.current;

    const left = (sidebarRect?.right ?? triggerRect.right) + 4;
    let top = triggerRect.top;

    if (menu) {
      const menuHeight = menu.offsetHeight;
      top = triggerRect.top + (triggerRect.height - menuHeight) / 2;

      const maxTop = window.innerHeight - menuHeight - 8;
      top = Math.max(8, Math.min(top, maxTop));
    }

    setMenuPos({ top, left });
  }, []);

  const updateLanguagePosition = useCallback(() => {
    const languageRow = languageRef.current;
    const menu = menuRef.current;
    if (!languageRow || !menu) return;
    const rowRect = languageRow.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    setLanguagePos({
      top: rowRect.top,
      left: menuRect.right + 4,
    });
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    setLanguageOpen(false);
    logout();
    router.push('/login');
    router.refresh();
  };

  useLayoutEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
  }, [menuOpen, expanded, updateMenuPosition]);

  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => {
      updateMenuPosition();
      if (languageOpen) updateLanguagePosition();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen, languageOpen, expanded, updateMenuPosition, updateLanguagePosition]);

  useEffect(() => {
    if (!languageOpen) return;
    updateLanguagePosition();
  }, [languageOpen, updateLanguagePosition]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target) ||
        languageRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
      setLanguageOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  return (
    <div className="relative mt-0 w-full">
      <button
        ref={triggerRef}
        type="button"
        className={mapProfileTriggerClass(expanded)}
        onClick={() => {
          if (!menuOpen) updateMenuPosition();
          setLanguageOpen(false);
          setMenuOpen(open => !open);
        }}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title={expanded ? undefined : displayName}
      >
        <span className={mapProfileSurfaceClass(expanded, menuOpen)}>
          {user?.avatarUrl ? (
            <span className={mapNavItemIconRailClass()}>
              <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-[rgba(220,226,236,0.92)]">
                <Image src={user.avatarUrl} alt="" fill sizes="32px" className="object-cover" />
              </span>
            </span>
          ) : (
            <span className={mapNavItemIconRailClass()} aria-hidden>
              <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-[rgba(220,226,236,0.92)] text-[0.6875rem] font-bold tracking-wide text-gray-700/95">
                {initials}
              </span>
            </span>
          )}
          <span className={mapProfileInfoClass(expanded)} aria-hidden={!expanded}>
            <span className="flex w-full min-w-0 items-center gap-[0.35rem]">
              <span className="min-w-0 flex-1 overflow-hidden text-[0.8125rem] leading-[1.15] font-bold text-ellipsis whitespace-nowrap text-white">
                {displayName}
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={cn(
                  'size-2.5 shrink-0 text-[0.625rem] text-white/65 transition-transform duration-150 ease-out',
                  menuOpen && 'rotate-180'
                )}
              />
            </span>
            {displayEmail ? (
              <span className="w-full overflow-hidden text-[0.625rem] leading-[1.2] text-ellipsis whitespace-nowrap text-white/55">
                {displayEmail}
              </span>
            ) : null}
          </span>
        </span>
      </button>

      {menuOpen ? (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[11.75rem] rounded-lg border border-slate-900/[0.08] bg-white py-[0.35rem] shadow-[0_8px_24px_rgb(15_23_42/18%)]"
          role="menu"
          style={{
            top: menuPos.top,
            left: menuPos.left,
          }}
        >
          <Link
            href="/officer/profile"
            className="flex w-full cursor-pointer items-center gap-[0.65rem] border-none bg-transparent px-[0.85rem] py-[0.55rem] text-left text-[0.8125rem] font-medium text-gray-700 no-underline hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setLanguageOpen(false);
            }}
          >
            <FontAwesomeIcon icon={faUser} className="size-3.5 shrink-0 text-sm text-gray-500" />
            My account
          </Link>
          <div className="my-1 h-px bg-gray-200" role="separator" />
          <div ref={languageRef} className="relative">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-[0.65rem] border-none bg-transparent px-[0.85rem] py-[0.55rem] text-left text-[0.8125rem] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
              aria-expanded={languageOpen}
              onClick={() => {
                if (!languageOpen) updateLanguagePosition();
                setLanguageOpen(open => !open);
              }}
            >
              <span className="inline-flex min-w-0 items-center gap-[0.65rem]">
                <FontAwesomeIcon
                  icon={faLanguage}
                  className="size-3.5 shrink-0 text-sm text-gray-500"
                />
                Language
              </span>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="size-2.5 shrink-0 text-[0.625rem] text-gray-400"
              />
            </button>
            {languageOpen ? (
              <div
                className="fixed z-[51] min-w-[8.5rem] rounded-lg border border-slate-900/[0.08] bg-white py-[0.35rem] shadow-[0_8px_24px_rgb(15_23_42/18%)]"
                role="menu"
                style={{ top: languagePos.top, left: languagePos.left }}
              >
                <button
                  type="button"
                  className={cn(
                    'block w-full cursor-pointer border-none bg-transparent px-[0.85rem] py-2 text-left text-[0.8125rem] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    locale === 'vi' &&
                      'font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                  )}
                  role="menuitem"
                  onClick={() => {
                    setLocale('vi');
                    setMenuOpen(false);
                    setLanguageOpen(false);
                  }}
                >
                  Tiếng Việt
                </button>
                <button
                  type="button"
                  className={cn(
                    'block w-full cursor-pointer border-none bg-transparent px-[0.85rem] py-2 text-left text-[0.8125rem] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    locale === 'en' &&
                      'font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                  )}
                  role="menuitem"
                  onClick={() => {
                    setLocale('en');
                    setMenuOpen(false);
                    setLanguageOpen(false);
                  }}
                >
                  English
                </button>
              </div>
            ) : null}
          </div>
          <div className="my-1 h-px bg-gray-200" role="separator" />
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-[0.65rem] border-none bg-transparent px-[0.85rem] py-[0.55rem] text-left text-[0.8125rem] font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
            role="menuitem"
            onClick={handleLogout}
          >
            <FontAwesomeIcon
              icon={faRightFromBracket}
              className="size-3.5 shrink-0 text-sm text-red-600"
            />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
