'use client';

import * as React from 'react';
import {
  Bell,
  BarChart3,
  MessageSquare,
  User,
  LogOut,
  Settings,
  Search,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedTabs, { AnimatedTabItem } from '@/components/common/AnimatedTabs';
import { useAuthStore } from '@/lib/store/authStore';

const OFFICER_TABS: AnimatedTabItem[] = [
  { name: 'Bản đồ điều hành', value: 'map', link: '/officer/map' },
  { name: 'Tổng quan', value: 'dashboard', link: '/officer/dashboard', badge: 12 },
  { name: 'Xác minh', value: 'verify', link: '/officer/verify', badge: 48 },
  { name: 'Phân công', value: 'assign', link: '/officer/assign', badge: 9 },
  { name: 'Theo dõi xử lý', value: 'tracking', link: '/officer/tracking', badge: 6 },
];

const AVATAR_MENU = [
  { label: 'KPI & Thống kê', href: '/officer/kpi', icon: BarChart3 },
  { label: 'Bình luận', href: '/officer/comments', icon: MessageSquare },
  { label: 'Hồ sơ', href: '/officer/profile', icon: User },
];

export function OfficerNavbar() {
  const router = useRouter();
  const logout = useAuthStore(s => s.logout);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 bg-white shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-6 py-3">
        {/* Desktop layout */}
        <div className="flex items-center justify-between relative">
          {/* Left — Logo */}
          <div className="flex shrink-0 items-center">
            <Link href="/officer/dashboard" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
                <span className="text-sm font-bold text-white">G</span>
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-bold leading-none text-gray-900">GreenLens</span>
                <span className="text-[10px] leading-none text-gray-400">Officer Console</span>
              </div>
            </Link>
          </div>

          {/* Center — Animated nav tabs (true center via absolute) */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <AnimatedTabs tabs={OFFICER_TABS} />
          </div>

          {/* Right — Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Search */}
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Tìm kiếm"
            >
              <Search className="size-4" />
            </button>

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
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
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
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-600/10 ring-2 ring-emerald-600/20">
                  <span className="text-xs font-bold text-emerald-700">TN</span>
                </div>
                <div className="hidden flex-col items-start lg:flex">
                  <span className="text-xs font-semibold text-gray-800">Trần Ngọc</span>
                  <span className="text-[10px] text-gray-400">Environmental Officer</span>
                </div>
                <ChevronDown
                  className={`size-3 text-gray-400 transition-transform ${avatarOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-12 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                  {AVATAR_MENU.map(item => (
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
