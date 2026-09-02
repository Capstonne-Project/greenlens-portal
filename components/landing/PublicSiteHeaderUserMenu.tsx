'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import { PROFILE_ROUTES } from '@/lib/constants/profilePortal';
import { PUBLIC_SITE_NAV } from '@/lib/constants/publicSite';
import type { AuthUser } from '@/lib/store/authStore';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

function initialsFromUser(name: string | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'GL';
}

const PORTAL_LABELS: Record<Exclude<AuthUser['role'], 'citizen'>, string> = {
  admin: 'Cổng quản trị',
  officer: 'Cổng cán bộ',
  company: 'Cổng công ty',
  cleanup: 'Cổng dọn dẹp',
};

function getPortalNavItem(user: AuthUser): { href: string; label: string } | null {
  if (user.role === 'citizen') return null;
  return {
    href: getDashboardPathByRole(user.role),
    label: PORTAL_LABELS[user.role],
  };
}

function getAccountHref(role: AuthUser['role']): string | null {
  if (role === 'admin') return PROFILE_ROUTES.admin;
  if (role === 'company') return PROFILE_ROUTES.company;
  if (role === 'officer') return PROFILE_ROUTES.officer;
  return null;
}

type PublicSiteHeaderUserMenuProps = {
  user: AuthUser;
  activePath?: string;
  forest?: boolean;
  /** Mobile sheet — mở bằng click thay vì hover. */
  compact?: boolean;
  onNavigate?: () => void;
};

export function PublicSiteHeaderUserMenu({
  user,
  activePath,
  forest = false,
  compact = false,
  onNavigate,
}: PublicSiteHeaderUserMenuProps) {
  const router = useRouter();
  const logout = useAuthStore(s => s.logout);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = user.name?.trim() || 'Người dùng';
  const initials = initialsFromUser(user.name, user.email);
  const portalItem = getPortalNavItem(user);
  const accountHref = getAccountHref(user.role);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 140);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const handleLogout = useCallback(() => {
    closeMenu();
    onNavigate?.();
    logout();
    router.push('/login');
    router.refresh();
  }, [closeMenu, logout, onNavigate, router]);

  useEffect(() => {
    if (!compact || !open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
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
  }, [compact, open, closeMenu]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const menuItemClass = cn(
    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    forest
      ? 'text-stone-100 hover:bg-white/10'
      : 'text-slate-700 hover:bg-slate-100'
  );

  const menuPanel = (
    <div
      role="menu"
      className={cn(
        'min-w-[13.5rem] overflow-hidden rounded-lg border p-1.5 shadow-lg',
        forest
          ? 'border-white/10 bg-[#2a2e28]/96 text-stone-100 backdrop-blur-xl'
          : 'border-slate-200/90 bg-white text-slate-800 shadow-[0_8px_24px_rgb(15_23_42/0.12)]'
      )}
    >
      <div
        className={cn(
          'border-b px-3 py-2.5',
          forest ? 'border-white/8' : 'border-slate-100'
        )}
      >
        <p className="truncate text-sm font-semibold">{displayName}</p>
        {user.email ? (
          <p
            className={cn(
              'truncate text-xs',
              forest ? 'text-stone-400' : 'text-slate-500'
            )}
          >
            {user.email}
          </p>
        ) : null}
      </div>

      <div className="py-1">
        {PUBLIC_SITE_NAV.map(item => {
          const active = Boolean(
            activePath === item.href || activePath?.startsWith(`${item.href}/`)
          );
          return (
            <Link
              key={item.id}
              href={item.href}
              role="menuitem"
              className={cn(
                menuItemClass,
                active && (forest ? 'bg-white/8 text-stone-50' : 'bg-emerald-50 text-emerald-900')
              )}
              onClick={() => {
                closeMenu();
                onNavigate?.();
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {(portalItem || accountHref) && (
        <div
          className={cn(
            'border-t py-1',
            forest ? 'border-white/8' : 'border-slate-100'
          )}
        >
          {portalItem ? (
            <Link
              href={portalItem.href}
              role="menuitem"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onNavigate?.();
              }}
            >
              <LayoutDashboard className="size-4 shrink-0 opacity-70" aria-hidden />
              {portalItem.label}
            </Link>
          ) : null}
          {accountHref ? (
            <Link
              href={accountHref}
              role="menuitem"
              className={menuItemClass}
              onClick={() => {
                closeMenu();
                onNavigate?.();
              }}
            >
              <User className="size-4 shrink-0 opacity-70" aria-hidden />
              Tài khoản của tôi
            </Link>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          'border-t pt-1',
          forest ? 'border-white/8' : 'border-slate-100'
        )}
      >
        <button
          type="button"
          role="menuitem"
          className={cn(
            menuItemClass,
            'cursor-pointer border-none bg-transparent text-left',
            forest ? 'text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
          )}
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn('relative', compact ? 'inline-flex w-full' : 'hidden sm:inline-flex')}
      onMouseEnter={compact ? undefined : openMenu}
      onMouseLeave={compact ? undefined : scheduleClose}
    >
      <button
        type="button"
        className={cn(
          'cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none',
          compact
            ? cn(
                'flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                forest ? 'text-stone-50 hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
              )
            : 'rounded-full'
        )}
        aria-label={`Menu tài khoản ${displayName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          if (compact) setOpen(v => !v);
        }}
      >
        <Avatar className={cn('size-9 shrink-0 ring-2 ring-white/10', compact && 'size-8')}>
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback
            className={cn(
              'text-xs font-semibold',
              forest ? 'bg-emerald-900/80 text-lime-100' : 'bg-emerald-100 text-emerald-800'
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {compact ? (
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayName}</span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            'absolute z-50 pt-2',
            compact ? 'top-full left-0 w-full min-w-[13.5rem]' : 'top-full right-0'
          )}
          onMouseEnter={compact ? undefined : openMenu}
          onMouseLeave={compact ? undefined : scheduleClose}
        >
          {menuPanel}
        </div>
      ) : null}
    </div>
  );
}
