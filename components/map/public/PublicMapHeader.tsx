'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  PublicMapSearchBar,
  type PublicMapProvincePick,
} from '@/components/map/public/PublicMapSearchBar';
import type { PublicMapProvinceCount } from '@/lib/api/services/fetchMap';
import { APP_NAME } from '@/lib/constants/brand';
import { CITIZEN_HOME_PATH } from '@/lib/auth/citizenAccess';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import {
  ANDROID_APK_HREF,
  ANDROID_APK_LABEL,
  PUBLIC_SITE_NAV,
} from '@/lib/constants/publicSite';
import { GreenLensLogo } from '@/components/auth/GreenLensLogo';
import { useAuthStore } from '@/lib/store/authStore';

const MAP_LOGIN_HREF = '/login?from=%2Fmap';

const apkExternal = /^https?:\/\//i.test(ANDROID_APK_HREF);

function MapAuthControl() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);

  const handleLogout = useCallback(() => {
    logout();
    router.replace(CITIZEN_HOME_PATH);
  }, [logout, router]);

  if (!isAuthenticated || !user) {
    return (
      <Link
        href={MAP_LOGIN_HREF}
        className="flex min-w-13 flex-col items-center gap-0.5 rounded-md px-2 py-1 text-white transition-colors hover:text-white/85 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
      >
        <User
          className="size-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="text-[10px] font-semibold tracking-[0.12em] text-white uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          Log in
        </span>
      </Link>
    );
  }

  const portalHref = getDashboardPathByRole(user.role);
  const isCitizen = user.role === 'citizen';

  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-1">
      <User
        className="size-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
        strokeWidth={1.75}
        aria-hidden
      />
      {isCitizen ? (
        <button
          type="button"
          onClick={handleLogout}
          className="text-[10px] font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:text-white/85 focus-visible:outline-none"
        >
          Đăng xuất
        </button>
      ) : (
        <Link
          href={portalHref}
          className="max-w-20 truncate text-[10px] font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:text-white/85 focus-visible:outline-none"
        >
          Cổng
        </Link>
      )}
    </div>
  );
}

function MapNavSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);
  const router = useRouter();
  const isCitizen = isAuthenticated && user?.role === 'citizen';

  const navItems = isCitizen
    ? PUBLIC_SITE_NAV.filter(item => item.id === 'map')
    : PUBLIC_SITE_NAV;

  const close = () => onOpenChange(false);

  const handleLogout = () => {
    logout();
    close();
    router.replace(CITIZEN_HOME_PATH);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-md text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
          aria-label="Mở menu"
        >
          <Menu className="size-6" strokeWidth={2} aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(100vw-2rem,20rem)] border-slate-800 bg-slate-950 text-slate-100"
      >
        <SheetHeader className="border-b border-white/10 pb-4 text-left">
          <SheetTitle className="text-base font-semibold text-white">Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1" aria-label="Điều hướng bản đồ">
          {navItems.map(item => (
            <Link
              key={item.id}
              href={item.href}
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          {!isCitizen ? (
            <a
              href={ANDROID_APK_HREF}
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              {...(apkExternal
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : { download: true })}
            >
              {ANDROID_APK_LABEL}
            </a>
          ) : null}
        </nav>
        {isAuthenticated ? (
          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="mt-6 border-t border-white/10 pt-4">
            <Link
              href={MAP_LOGIN_HREF}
              onClick={close}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <User className="size-4" aria-hidden />
              Đăng nhập
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface PublicMapHeaderProps {
  provinces?: PublicMapProvinceCount[];
  onProvinceSelect?: (province: PublicMapProvincePick) => void;
}

/**
 * Flightradar-style map chrome — no header bar bg; centered wordmark + search pill + auth + menu.
 */
export function PublicMapHeader({ provinces = [], onProvinceSelect }: PublicMapHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const logoHref = '/';

  const handleProvinceSelect = useCallback(
    (province: PublicMapProvincePick) => {
      onProvinceSelect?.(province);
    },
    [onProvinceSelect]
  );

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="pointer-events-auto grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <div aria-hidden />

        <Link
          href={logoHref}
          className="rounded-sm focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:outline-none"
          aria-label={`${APP_NAME} — về trang chủ`}
        >
          <GreenLensLogo
            variant="map"
            className="text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-xl"
          />
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {onProvinceSelect ? (
            <PublicMapSearchBar
              provinces={provinces}
              onSelect={handleProvinceSelect}
              className="hidden min-w-0 max-w-md flex-1 sm:block"
            />
          ) : null}
          <MapAuthControl />
          <MapNavSheet open={menuOpen} onOpenChange={setMenuOpen} />
        </div>
      </div>

      {onProvinceSelect ? (
        <div className="pointer-events-auto mt-2 sm:hidden">
          <PublicMapSearchBar provinces={provinces} onSelect={handleProvinceSelect} />
        </div>
      ) : null}
    </header>
  );
}
