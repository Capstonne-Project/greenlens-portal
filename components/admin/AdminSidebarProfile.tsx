'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { LogOut, MoreVertical, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

export function AdminSidebarProfile() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const title = user?.name?.trim() || 'Quản trị viên';
  const subtitle = user?.email?.trim() || 'Hệ thống GreenLens';
  const initials = initialsFromUser(user?.name, user?.email);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    if (!menuOpen) return;

    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2">
        {user?.avatarUrl ? (
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-600/25">
            <Image src={user.avatarUrl} alt="" fill sizes="36px" className="object-cover" />
          </div>
        ) : (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
            aria-hidden
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-sm font-medium leading-tight">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div className="relative shrink-0" ref={wrapRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="rounded-lg p-1.5 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Tùy chọn tài khoản"
          >
            <MoreVertical className="size-5" aria-hidden />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 z-50 mb-1 min-w-[11rem] rounded-lg border border-border bg-card py-1 shadow-lg ring-1 ring-black/5"
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/admin/profile');
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground outline-none transition hover:bg-muted focus:bg-muted"
              >
                <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                Hồ sơ
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground outline-none transition hover:bg-muted focus:bg-muted"
              >
                <LogOut className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
