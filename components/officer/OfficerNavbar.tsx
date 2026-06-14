'use client';

import * as React from 'react';
import { Bell, LogOut, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AnimatedTabs from '@/components/common/AnimatedTabs';
import { getOfficerNavTabsForRole, OFFICER_AVATAR_MENU } from '@/lib/constants/officerNav';
import { useAuthStore } from '@/lib/store/authStore';

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

const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'GreenLens';
const APP_LOGO_SRC = '/images/logo.png';

export function OfficerNavbar() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);

  const displayName = user?.name?.trim();
  const displayEmail = user?.email?.trim();
  const initials = initialsFromUser(user?.name, user?.email);
  const showProfileText = Boolean(displayName || displayEmail);
  const navTabs = getOfficerNavTabsForRole(user?.systemRole);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setAvatarOpen(false);
    logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 bg-white shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-6 py-3">
        {/* Desktop layout */}
        <div className="flex items-center justify-between relative">
          <div className="flex shrink-0 items-center">
            <Link
              href="/officer/dashboard"
              className="relative block size-9 shrink-0 overflow-hidden rounded-xl"
              aria-label={appName}
            >
              <Image
                src={APP_LOGO_SRC}
                alt=""
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Center — Animated nav tabs (true center via absolute) */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <AnimatedTabs tabs={navTabs} />
          </div>

          {/* Right — Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Notification */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(v => !v);
                  setAvatarOpen(false);
                }}
                className="relative inline-flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Thông báo"
              >
                <Bell className="size-4" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                  <p className="text-sm font-semibold text-gray-800">Thông báo</p>
                  <p className="mt-2 text-xs text-gray-400">Đang phát triển</p>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Cài đặt"
            >
              <Settings className="size-4" />
            </button>

            {/* Avatar dropdown */}
            <div ref={avatarRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setAvatarOpen(v => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {user?.avatarUrl ? (
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-600/20">
                    <Image src={user.avatarUrl} alt="" fill sizes="32px" className="object-cover" />
                  </div>
                ) : (
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 ring-2 ring-emerald-600/20"
                    aria-hidden
                  >
                    <span className="text-xs font-bold text-emerald-700">{initials}</span>
                  </div>
                )}
                {showProfileText && (
                  <div className="hidden min-w-0 max-w-40 flex-col items-start lg:flex">
                    {displayName ? (
                      <span className="truncate text-xs font-semibold text-gray-800">
                        {displayName}
                      </span>
                    ) : null}
                    {displayEmail ? (
                      <span className="truncate text-[10px] text-gray-400">{displayEmail}</span>
                    ) : null}
                  </div>
                )}
                <ChevronDown
                  className={`size-3 text-gray-400 transition-transform ${avatarOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-12 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                  {OFFICER_AVATAR_MENU.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      <item.icon className="size-4 text-gray-400" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
