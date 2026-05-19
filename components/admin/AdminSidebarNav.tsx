'use client';

import { ADMIN_USERS_NAV } from '@/lib/constants/adminUsersNav';
import { roleBadgeClasses } from '@/utils/adminUserUi';
import { useAdminReportsTotal } from '@/hooks/useAdminReports';
import { useAdminUsersTotalsByRole } from '@/hooks/useAdminUsers';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Landmark,
  LayoutDashboard,
  Leaf,
  Map,
  Shield,
  Tags,
  UserCircle,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
type AdminUsersNavCollapsibleProps = {
  pathname: string;
  defaultOpen: boolean;
  countQueries: ReturnType<typeof useAdminUsersTotalsByRole>;
};

function AdminUsersNavCollapsible({
  pathname,
  defaultOpen,
  countQueries,
}: AdminUsersNavCollapsibleProps) {
  const [manualOpen, setManualOpen] = useState(false);

  const usersOpen = defaultOpen || manualOpen;

  return (
    <div className="rounded-lg border-border/60 bg-muted/20">
      <button
        type="button"
        onClick={() => setManualOpen(o => !o)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-semibold text-foreground transition hover:bg-muted/80"
        aria-expanded={usersOpen}
      >
        <Users className="size-4 shrink-0 text-emerald-700" aria-hidden />
        <span className="flex-1">Người dùng</span>

        {usersOpen ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>

      {usersOpen && (
        <div className="relative pb-2 pl-4 pr-2">
          <div className="absolute bottom-2 left-[1.15rem] top-0 w-px bg-border" aria-hidden />

          <ul className="relative space-y-0.5">
            {ADMIN_USERS_NAV.map((item, index) => {
              const isActive =
                item.href === '/admin/users'
                  ? pathname === '/admin/users'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              const q = countQueries[index];
              const total = q?.data;
              const showBadge = typeof total === 'number';
              const pending = q?.isPending;

              return (
                <li key={item.href} className="relative">
                  <span
                    className="absolute left-[-13px] top-[50%] h-px w-3 bg-border"
                    aria-hidden
                  />

                  <Link
                    href={item.href}
                    className={cn(
                      'ml-4 flex items-center gap-2 rounded-lg py-2 pl-5 pr-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-emerald-600/10 text-emerald-800'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>

                    {pending ? (
                      <span
                        className="inline-block size-4 shrink-0 animate-pulse rounded bg-muted"
                        aria-hidden
                      />
                    ) : showBadge ? (
                      <span
                        className={cn(
                          'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                          item.apiRole
                            ? roleBadgeClasses(item.apiRole)
                            : 'bg-emerald-100 text-emerald-900'
                        )}
                      >
                        {total}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  const usersSectionActive = pathname === '/admin/users' || pathname.startsWith('/admin/users/');

  const roleKeys = useMemo(() => ADMIN_USERS_NAV.map(n => n.apiRole), []);

  const countQueries = useAdminUsersTotalsByRole(roleKeys);
  const { data: reportsTotal, isPending: reportsCountPending } = useAdminReportsTotal();

  const dashboardActive = pathname === '/admin';
  const reportsActive = pathname === '/admin/reports' || pathname.startsWith('/admin/reports/');
  const officesActive =
    pathname === '/admin/offices' ||
    pathname.startsWith('/admin/offices/') ||
    pathname === '/admin/organization' ||
    pathname.startsWith('/admin/organization/');
  const profileActive = pathname.startsWith('/admin/profile');
  const categoriesActive =
    pathname === '/admin/pollution-categories' ||
    pathname.startsWith('/admin/pollution-categories/');
  const departmentsActive =
    pathname === '/admin/departments' || pathname.startsWith('/admin/departments/');
  const teamsActive = pathname === '/admin/teams' || pathname.startsWith('/admin/teams/');

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <Leaf className="size-7 text-emerald-600" aria-hidden />

        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-emerald-700">GreenLens</p>

          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Admin Console
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 text-sm">
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tổng quan
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
                  dashboardActive
                    ? 'bg-emerald-600/10 text-emerald-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <LayoutDashboard className="size-4 shrink-0" />
                Tổng quan
              </Link>
            </li>
            <li>
              <Link
                href="/admin/reports"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
                  reportsActive
                    ? 'bg-emerald-600/10 text-emerald-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Shield className="size-4 shrink-0" />
                Báo cáo ô nhiễm
                {reportsCountPending ? (
                  <span className="ml-auto inline-block size-4 animate-pulse rounded bg-muted" />
                ) : typeof reportsTotal === 'number' ? (
                  <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                    {reportsTotal > 999 ? '999+' : reportsTotal}
                  </span>
                ) : null}
              </Link>
            </li>
            <li>
              <Link
                href="/admin/departments"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
                  departmentsActive
                    ? 'bg-emerald-600/10 text-emerald-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Landmark className="size-4 shrink-0" />
                Ủy ban (Sở)
              </Link>
            </li>
            <li>
              <Link
                href="/admin/offices"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
                  officesActive
                    ? 'bg-emerald-600/10 text-emerald-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Users className="size-4 shrink-0" />
                Văn phòng địa phương
              </Link>
            </li>
            <li>
              <Link
                href="/admin/teams"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
                  teamsActive
                    ? 'bg-emerald-600/10 text-emerald-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <UsersRound className="size-4 shrink-0" />
                Đội môi trường
              </Link>
            </li>
            <li>
              <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
                <Map className="size-4 shrink-0" />
                Bản đồ quản trị
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cộng đồng
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin/pollution-categories"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
                  categoriesActive
                    ? 'bg-emerald-600/10 text-emerald-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Tags className="size-4 shrink-0" />
                Danh mục ô nhiễm
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Người dùng
          </p>
          <AdminUsersNavCollapsible
            pathname={pathname}
            defaultOpen={usersSectionActive}
            countQueries={countQueries}
          />
        </div>

        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tài khoản
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin/profile"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
                  profileActive
                    ? 'bg-emerald-600/10 text-emerald-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <UserCircle className="size-4 shrink-0" />
                Hồ sơ
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
