'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStoreHydrated } from '@/hooks/useAuthSession';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import { APP_LOGO_MARK_SRC, APP_NAME } from '@/lib/constants/brand';
import {
  ANDROID_APK_HREF,
  ANDROID_APK_LABEL,
  PUBLIC_SITE_CTA,
  PUBLIC_SITE_NAV,
} from '@/lib/constants/publicSite';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

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

export type PublicSiteChromeTone = 'light' | 'forest';

interface PublicSiteHeaderProps {
  activePath?: string;
  /** `forest` — cream/glass chrome over Sylva Living World (home only). */
  tone?: PublicSiteChromeTone;
}

function PublicNavLink({
  href,
  label,
  active,
  onClick,
  compact = false,
  forest = false,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  compact?: boolean;
  forest?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center px-3 text-sm font-medium transition-colors duration-200',
        compact ? 'py-2.5' : 'h-16',
        forest
          ? active
            ? 'text-stone-50'
            : 'text-stone-300/80 hover:text-stone-50'
          : active
            ? 'text-slate-900'
            : 'text-slate-600 hover:text-slate-900'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative">
        {label}
        <span
          aria-hidden
          className={cn(
            'absolute top-[calc(100%+0.375rem)] left-0 h-0.5 w-full rounded-full',
            forest ? 'bg-lime-200/85' : 'bg-emerald-500',
            'origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none',
            'group-hover:scale-x-100 group-focus-visible:scale-x-100',
            active && 'scale-x-100'
          )}
        />
      </span>
    </Link>
  );
}

function PublicSiteHeaderAuthSkeleton({
  forest,
  compact = false,
}: {
  forest: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'size-9 shrink-0 rounded-full motion-safe:animate-pulse',
        compact ? 'inline-flex' : 'hidden sm:inline-flex',
        forest ? 'bg-white/10' : 'bg-slate-200'
      )}
      aria-hidden
    />
  );
}

function PublicSiteHeaderAuth({
  forest,
  compact = false,
  onNavigate,
}: {
  forest: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const hydrated = useAuthStoreHydrated();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const initials = initialsFromUser(user?.name, user?.email);
  const profileHref = user ? getDashboardPathByRole(user.role) : PUBLIC_SITE_CTA.login.href;

  if (!hydrated) {
    return <PublicSiteHeaderAuthSkeleton forest={forest} compact={compact} />;
  }

  if (isAuthenticated && user) {
    return (
      <Link
        href={profileHref}
        onClick={onNavigate}
        className={cn(
          'rounded-full focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none',
          compact ? 'inline-flex' : 'hidden sm:inline-flex'
        )}
        aria-label={`Tài khoản ${user.name}`}
      >
        <Avatar className="size-9 ring-2 ring-white/10">
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
      </Link>
    );
  }

  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className={cn(
        compact ? 'inline-flex' : 'hidden sm:inline-flex',
        forest
          ? 'border-white/14 bg-white/8 text-stone-50 hover:bg-white/12 hover:text-stone-50'
          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
      )}
    >
      <Link href={PUBLIC_SITE_CTA.login.href} onClick={onNavigate}>
        {PUBLIC_SITE_CTA.login.label}
      </Link>
    </Button>
  );
}

export function PublicSiteHeader({ activePath, tone = 'light' }: PublicSiteHeaderProps) {
  const forest = tone === 'forest';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const apkExternal = isExternalHref(ANDROID_APK_HREF);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const apkProps = {
    href: ANDROID_APK_HREF,
    download: apkExternal ? undefined : true,
    ...(apkExternal ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {}),
  };

  return (
    <>
      <header
        className={cn(
          'landing-hit fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200',
          forest
            ? scrolled
              ? 'border-b border-white/8 bg-[#252820]/72 shadow-[0_1px_16px_0_rgb(0_0_0/0.12)] backdrop-blur-xl'
              : 'border-b border-transparent bg-[#252820]/38 backdrop-blur-md'
            : scrolled
              ? 'border-b border-black/[0.04] bg-white/75 shadow-[0_1px_1px_0_rgb(15_23_42/0.03)] backdrop-blur-xl supports-backdrop-filter:bg-white/70'
              : 'border-b border-transparent bg-white/90 backdrop-blur-sm'
        )}
      >
        <div className="landing-shell flex h-16 items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="flex h-16 shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:outline-none"
            onClick={() => setOpen(false)}
            aria-label={`${APP_NAME} — trang chủ`}
          >
            <Image
              src={APP_LOGO_MARK_SRC}
              alt=""
              width={48}
              height={48}
              priority
              className="size-12 object-contain"
            />
            <span
              className={cn(
                'text-lg font-semibold tracking-tight sm:text-xl',
                forest ? 'text-[rgb(230_245_220/0.92)]' : 'text-emerald-800'
              )}
            >
              {APP_NAME}
            </span>
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden h-16 items-center md:flex">
            {PUBLIC_SITE_NAV.map(item => {
              const active = Boolean(
                activePath === item.href || activePath?.startsWith(`${item.href}/`)
              );
              return (
                <PublicNavLink
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  active={active}
                  forest={forest}
                />
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <PublicSiteHeaderAuth forest={forest} />
            <Button
              asChild
              size="sm"
              variant="outline"
              className={cn(
                'hidden sm:inline-flex',
                forest
                  ? 'border-white/14 bg-white/8 text-stone-50 hover:bg-white/12 hover:text-stone-50'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              )}
            >
              <a {...apkProps}>
                <Download className="size-3.5" aria-hidden />
                {ANDROID_APK_LABEL}
              </a>
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                'md:hidden',
                forest && 'text-stone-100 hover:bg-white/10 hover:text-stone-50'
              )}
              aria-expanded={open}
              aria-controls="public-mobile-nav"
              aria-label={open ? 'Đóng menu' : 'Mở menu'}
              onClick={() => setOpen(v => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        <div
          id="public-mobile-nav"
          className={cn(
            'backdrop-blur-md md:hidden',
            forest
              ? 'border-t border-white/8 bg-[#252820]/88'
              : 'border-t border-black/[0.04] bg-white/95',
            open ? 'block' : 'hidden'
          )}
        >
          <nav aria-label="Menu di động" className="landing-shell flex flex-col gap-1 py-3">
            {PUBLIC_SITE_NAV.map(item => {
              const active = Boolean(
                activePath === item.href || activePath?.startsWith(`${item.href}/`)
              );
              return (
                <PublicNavLink
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  active={active}
                  compact
                  forest={forest}
                  onClick={() => setOpen(false)}
                />
              );
            })}
            <PublicSiteHeaderAuth
              forest={forest}
              compact
              onNavigate={() => setOpen(false)}
            />
            <a
              {...apkProps}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium',
                forest ? 'text-stone-100 hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
              )}
              onClick={() => setOpen(false)}
            >
              <Download className="size-3.5" aria-hidden />
              {ANDROID_APK_LABEL} (APK)
            </a>
          </nav>
        </div>
      </header>

      <div className="h-16 shrink-0" aria-hidden />
    </>
  );
}
