'use client';

import { SidebarCollapseToggle } from '@/components/common/SidebarCollapseToggle';
import { ADMIN_USERS_NAV } from '@/lib/constants/adminUsersNav';
import { roleBadgeClasses } from '@/utils/adminUserUi';
import { useAdminReportsTotal } from '@/hooks/useAdminReports';
import { useAdminUsersTotalsByRole } from '@/hooks/useAdminUsers';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Gavel,
  Landmark,
  LayoutDashboard,
  Leaf,
  Map,
  Shield,
  Recycle,
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
  collapsed: boolean;
  countQueries: ReturnType<typeof useAdminUsersTotalsByRole>;
};

function AdminUsersNavCollapsible({
  pathname,
  defaultOpen,
  collapsed,
  countQueries,
}: AdminUsersNavCollapsibleProps) {
  const [manualOpen, setManualOpen] = useState(false);

  const usersOpen = defaultOpen || manualOpen;

  if (collapsed) {
    const usersActive = pathname === '/admin/users' || pathname.startsWith('/admin/users/');
    return (
      <Link
        href="/admin/users"
        title="Người dùng"
        className={cn(
          'flex items-center justify-center rounded-lg p-2.5 transition',
          usersActive
            ? 'bg-emerald-600/10 text-emerald-800'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Users className="size-4 shrink-0" aria-hidden />
      </Link>
    );
  }

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

export function AdminSidebarNav({ collapsed = false }: { collapsed?: boolean }) {
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
  const wasteTagsActive =
    pathname === '/admin/waste-tags' || pathname.startsWith('/admin/waste-tags/');
  const penaltyActive =
    pathname === '/admin/penalty-frameworks' || pathname.startsWith('/admin/penalty-frameworks/');
  const departmentsActive =
    pathname === '/admin/departments' || pathname.startsWith('/admin/departments/');
  const teamsActive = pathname === '/admin/teams' || pathname.startsWith('/admin/teams/');

  const navLinkClass = (active: boolean) =>
    cn(
      'flex items-center rounded-lg font-medium transition',
      collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2',
      active
        ? 'bg-emerald-600/10 text-emerald-800'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  return (
    <>
      <div
        className={cn(
          'relative flex shrink-0 items-center border-b border-border',
          collapsed ? 'flex-col justify-center gap-1 px-1 py-2' : 'h-16 gap-2 px-4'
        )}
      >
        <Leaf
          className={cn('shrink-0 text-emerald-600', collapsed ? 'size-5' : 'size-7')}
          aria-hidden
        />

        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-bold tracking-tight text-emerald-700">GreenLens</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Console
            </p>
          </div>
        )}

        <SidebarCollapseToggle />
      </div>

      <nav
        className={cn(
          'flex flex-1 flex-col gap-6 overflow-y-auto text-sm',
          collapsed ? 'p-2' : 'p-4'
        )}
      >
        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tổng quan
            </p>
          )}
          <ul className="space-y-1">
            <li>
              <Link href="/admin" title="Tổng quan" className={navLinkClass(dashboardActive)}>
                <LayoutDashboard className="size-4 shrink-0" />
                {!collapsed && <span>Tổng quan</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/admin/reports"
                title="Báo cáo ô nhiễm"
                className={navLinkClass(reportsActive)}
              >
                <Shield className="size-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">Báo cáo ô nhiễm</span>
                    {reportsCountPending ? (
                      <span className="ml-auto inline-block size-4 animate-pulse rounded bg-muted" />
                    ) : typeof reportsTotal === 'number' ? (
                      <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                        {reportsTotal > 999 ? '999+' : reportsTotal}
                      </span>
                    ) : null}
                  </>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/admin/departments"
                title="Sở TNMT"
                className={navLinkClass(departmentsActive)}
              >
                <Landmark className="size-4 shrink-0" />
                {!collapsed && <span>Sở TNMT</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/admin/offices"
                title="Văn phòng địa phương"
                className={navLinkClass(officesActive)}
              >
                <Users className="size-4 shrink-0" />
                {!collapsed && <span>Văn phòng địa phương</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/admin/teams"
                title="Đội môi trường"
                className={navLinkClass(teamsActive)}
              >
                <UsersRound className="size-4 shrink-0" />
                {!collapsed && <span>Đội môi trường</span>}
              </Link>
            </li>
            <li>
              <span
                title="Bản đồ quản trị"
                className={cn(
                  navLinkClass(false),
                  'cursor-default opacity-60',
                  collapsed && 'justify-center'
                )}
              >
                <Map className="size-4 shrink-0" />
                {!collapsed && <span>Bản đồ quản trị</span>}
              </span>
            </li>
          </ul>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cộng đồng
            </p>
          )}
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin/pollution-categories"
                title="Danh mục ô nhiễm"
                className={navLinkClass(categoriesActive)}
              >
                <Tags className="size-4 shrink-0" />
                {!collapsed && <span>Danh mục ô nhiễm</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/admin/waste-tags"
                title="Thẻ rác thải"
                className={navLinkClass(wasteTagsActive)}
              >
                <Recycle className="size-4 shrink-0" />
                {!collapsed && <span>Thẻ rác thải</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/admin/penalty-frameworks"
                title="Khung xử phạt"
                className={navLinkClass(penaltyActive)}
              >
                <Gavel className="size-4 shrink-0" />
                {!collapsed && <span>Khung xử phạt</span>}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Người dùng
            </p>
          )}
          <AdminUsersNavCollapsible
            pathname={pathname}
            defaultOpen={usersSectionActive}
            collapsed={collapsed}
            countQueries={countQueries}
          />
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tài khoản
            </p>
          )}
          <ul className="space-y-1">
            <li>
              <Link href="/admin/profile" title="Hồ sơ" className={navLinkClass(profileActive)}>
                <UserCircle className="size-4 shrink-0" />
                {!collapsed && <span>Hồ sơ</span>}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
