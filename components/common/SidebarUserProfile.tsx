'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faGear,
  faRightFromBracket,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useSidebar } from '@/components/ui/sidebar';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import { PROFILE_ROUTES } from '@/lib/constants/profilePortal';

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

type SidebarUserProfileProps = {
  expanded: boolean;
  /** Account page — `/{role}/settings/account`. */
  profileHref?: string;
  /** Settings shell — `/{role}/settings`. */
  settingsHref?: string;
};

function isPointerOverDesktopSidebar(): boolean {
  const el = document.querySelector('[data-sidebar-desktop]');
  return !!el?.matches(':hover');
}

export function MapSidebarUserProfile({
  expanded,
  profileHref = PROFILE_ROUTES.officer,
  settingsHref = '/officer/settings',
}: SidebarUserProfileProps) {
  const router = useRouter();
  const { setOpen, setHoverLocked } = useSidebar();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [nameTruncated, setNameTruncated] = useState(false);

  const displayName = user?.name?.trim() || 'Người dùng';
  const initials = initialsFromUser(user?.name, user?.email);

  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el || !expanded) {
      setNameTruncated(false);
      return;
    }
    const measure = () => setNameTruncated(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, displayName]);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const triggerRect = trigger.getBoundingClientRect();
    const menu = menuRef.current;
    const left = triggerRect.right + 4;
    let top = triggerRect.top;
    if (menu) {
      const menuHeight = menu.offsetHeight;
      top = triggerRect.top + (triggerRect.height - menuHeight) / 2;
      const maxTop = window.innerHeight - menuHeight - 8;
      top = Math.max(8, Math.min(top, maxTop));
    }
    setMenuPos({ top, left });
  }, []);

  /** All sidebar lock/unlock/collapse happens here — never sync setState inside effects. */
  const closeMenu = useCallback(() => {
    const over = isPointerOverDesktopSidebar();
    setMenuOpen(false);
    setHoverLocked(false);
    if (!over) setOpen(false);
  }, [setHoverLocked, setOpen]);

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger) {
      const r = trigger.getBoundingClientRect();
      setMenuPos({ top: r.top, left: r.right + 4 });
    }
    setOpen(true);
    setHoverLocked(true);
    setMenuOpen(true);
  }, [setHoverLocked, setOpen]);

  const handleLogout = () => {
    closeMenu();
    logout();
    router.push('/login');
    router.refresh();
  };

  // Position follow during width tween — setState only in rAF callback (external frame), not effect body.
  useEffect(() => {
    if (!menuOpen) return;
    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      updateMenuPosition();
      if (now - started < 400) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [menuOpen, expanded, updateMenuPosition]);

  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => updateMenuPosition();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'group/sidebar flex w-full cursor-pointer items-center gap-2 rounded-full border border-transparent bg-transparent px-2.5 py-2 text-left text-neutral-700 transition-colors',
          expanded && 'hover:bg-white/60'
        )}
        onClick={() => {
          if (menuOpen) closeMenu();
          else openMenu();
        }}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title={expanded ? undefined : displayName}
      >
        {/* size-5 slot matches nav/logo icon column; size-8 circle is centered so collapsed align stays true */}
        <span className="relative flex size-5 shrink-0 items-center justify-center">
          {user?.avatarUrl ? (
            <span className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-neutral-200">
              <Image src={user.avatarUrl} alt="" fill sizes="32px" className="object-cover" />
            </span>
          ) : (
            <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">
              {initials}
            </span>
          )}
        </span>
        <AnimatedHoverTooltip
          name={displayName}
          disabled={!expanded || !nameTruncated || menuOpen}
          className={cn('min-w-0 flex-1', expanded && 'ml-1')}
        >
          <motion.span
            ref={nameRef}
            initial={false}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={cn(
              'block w-full min-w-0 truncate text-sm font-medium whitespace-pre text-neutral-800',
              !expanded && 'pointer-events-none'
            )}
          >
            {displayName}
          </motion.span>
        </AnimatedHoverTooltip>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={cn(
            'size-2.5 shrink-0 text-neutral-500 transition-transform duration-150',
            menuOpen && 'rotate-180',
            !expanded && 'pointer-events-none opacity-0'
          )}
        />
      </button>

      {menuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] min-w-52 rounded-lg border border-slate-900/8 bg-white p-1.5 shadow-[0_8px_24px_rgb(0_0_0/18%),0_0_0_1px_rgb(0_0_0/6%)]"
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {settingsHref ? (
              <Link
                href={settingsHref}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-700 no-underline hover:bg-gray-100"
                role="menuitem"
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faGear} className="size-3.5 text-gray-500" />
                Cài đặt
              </Link>
            ) : null}
            <Link
              href={profileHref}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-700 no-underline hover:bg-gray-100"
              role="menuitem"
              onClick={closeMenu}
            >
              <FontAwesomeIcon icon={faUser} className="size-3.5 text-gray-500" />
              Tài khoản của tôi
            </Link>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50"
              role="menuitem"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="size-3.5 text-red-600" />
              Đăng xuất
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
