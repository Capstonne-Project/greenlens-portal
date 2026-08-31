'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Download, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_LOGO_MARK_SRC, APP_NAME } from '@/lib/constants/brand';
import {
  ANDROID_APK_HREF,
  ANDROID_APK_LABEL,
  PUBLIC_SITE_CTA,
  PUBLIC_SITE_NAV,
} from '@/lib/constants/publicSite';
import { cn } from '@/lib/utils';

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

interface PublicSiteHeaderProps {
  activePath?: string;
}

function PublicNavLink({
  href,
  label,
  active,
  onClick,
  compact = false,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center px-3 text-sm font-medium transition-colors duration-200',
        compact ? 'py-2.5' : 'h-16',
        active ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative">
        {label}
        <span
          aria-hidden
          className={cn(
            'absolute top-[calc(100%+0.375rem)] left-0 h-0.5 w-full rounded-full bg-emerald-500',
            'origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none',
            'group-hover:scale-x-100 group-focus-visible:scale-x-100',
            active && 'scale-x-100'
          )}
        />
      </span>
    </Link>
  );
}

export function PublicSiteHeader({ activePath }: PublicSiteHeaderProps) {
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
          scrolled
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
            <span className="text-lg font-semibold tracking-tight text-emerald-800 sm:text-xl">
              {APP_NAME}
            </span>
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden h-16 items-center md:flex">
            {PUBLIC_SITE_NAV.map(item => {
              const active = Boolean(
                activePath === item.href || activePath?.startsWith(`${item.href}/`)
              );
              return (
                <PublicNavLink key={item.id} href={item.href} label={item.label} active={active} />
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="hidden border-slate-200 bg-white text-slate-800 hover:bg-slate-50 sm:inline-flex"
            >
              <a {...apkProps}>
                <Download className="size-3.5" aria-hidden />
                {ANDROID_APK_LABEL}
              </a>
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden bg-emerald-600 text-white hover:bg-emerald-500 sm:inline-flex"
            >
              <Link href={PUBLIC_SITE_CTA.openMap.href}>
                {PUBLIC_SITE_CTA.openMap.label}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="md:hidden"
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
            'border-t border-black/[0.04] bg-white/95 backdrop-blur-md md:hidden',
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
                  onClick={() => setOpen(false)}
                />
              );
            })}
            <a
              {...apkProps}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              <Download className="size-3.5" aria-hidden />
              {ANDROID_APK_LABEL} (APK)
            </a>
            <Button asChild className="mt-1 bg-emerald-600 text-white hover:bg-emerald-500">
              <Link href={PUBLIC_SITE_CTA.openMap.href} onClick={() => setOpen(false)}>
                {PUBLIC_SITE_CTA.openMap.label}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="h-16 shrink-0" aria-hidden />
    </>
  );
}
