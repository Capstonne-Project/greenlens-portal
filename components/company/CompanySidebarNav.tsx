'use client';

import { SidebarCollapseToggle } from '@/components/common/SidebarCollapseToggle';
import { useCompanyQueueCount } from '@/hooks/useCompany';
import { cn } from '@/lib/utils';
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  LineChart,
  ScrollText,
  Target,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function CompanySidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { data: queueCount, isPending: queuePending } = useCompanyQueueCount();

  const dashboardActive = pathname === '/company';
  const queueActive = pathname === '/company/queue' || pathname.startsWith('/company/queue/');
  const assignmentsActive =
    pathname === '/company/assignments' || pathname.startsWith('/company/assignments/');
  const staffActive = pathname === '/company/staff' || pathname.startsWith('/company/staff/');
  const teamsActive = pathname === '/company/teams' || pathname.startsWith('/company/teams/');
  const contractHistoryActive =
    pathname === '/company/contract-history' || pathname.startsWith('/company/contract-history/');
  const notificationsActive =
    pathname === '/company/notifications' || pathname.startsWith('/company/notifications/');
  const kpiActive = pathname === '/company/kpi' || pathname.startsWith('/company/kpi/');

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center rounded-lg font-medium transition',
      collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2',
      active
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-900 dark:hover:bg-emerald-950/40'
    );

  return (
    <>
      <div
        className={cn(
          'relative flex shrink-0 border-b border-emerald-100/80 dark:border-border',
          collapsed ? 'flex-col items-center gap-1 px-1 py-2' : 'h-16 items-center gap-2.5 px-4'
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm',
            collapsed ? 'size-8' : 'size-9'
          )}
        >
          <Leaf className={collapsed ? 'size-4' : 'size-5'} aria-hidden />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
              GreenLens
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cổng công ty
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
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700/70">
              Vận hành
            </p>
          )}
          <ul className="space-y-1">
            <li>
              <Link href="/company" title="Tổng quan" className={linkClass(dashboardActive)}>
                <LayoutDashboard className="size-4 shrink-0" />
                {!collapsed && <span>Tổng quan</span>}
              </Link>
            </li>
            <li>
              <Link href="/company/kpi" title="KPI công ty" className={linkClass(kpiActive)}>
                <Target className="size-4 shrink-0" />
                {!collapsed && <span>KPI công ty</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/company/queue"
                title="Điều phối báo cáo"
                className={linkClass(queueActive)}
              >
                <ClipboardList className="size-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">Điều phối báo cáo</span>
                    {queuePending ? (
                      <span className="size-4 animate-pulse rounded bg-white/30" aria-hidden />
                    ) : typeof queueCount === 'number' && queueCount > 0 ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                          queueActive ? 'bg-white/20 text-white' : 'bg-emerald-600 text-white'
                        )}
                      >
                        {queueCount > 99 ? '99+' : queueCount}
                      </span>
                    ) : null}
                  </>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/company/assignments"
                title="Theo dõi phân công"
                className={linkClass(assignmentsActive)}
              >
                <LineChart className="size-4 shrink-0" />
                {!collapsed && <span>Theo dõi phân công</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/company/notifications"
                title="Thông báo"
                className={linkClass(notificationsActive)}
              >
                <Bell className="size-4 shrink-0" />
                {!collapsed && <span>Thông báo</span>}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700/70">
              Nguồn lực
            </p>
          )}
          <ul className="space-y-1">
            <li>
              <Link href="/company/staff" title="Nhân sự" className={linkClass(staffActive)}>
                <Users className="size-4 shrink-0" />
                {!collapsed && <span>Nhân sự</span>}
              </Link>
            </li>
            <li>
              <Link href="/company/teams" title="Đội dọn dẹp" className={linkClass(teamsActive)}>
                <UsersRound className="size-4 shrink-0" />
                {!collapsed && <span>Đội dọn dẹp</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/company/contract-history"
                title="Lịch sử hợp đồng"
                className={linkClass(contractHistoryActive)}
              >
                <ScrollText className="size-4 shrink-0" />
                {!collapsed && <span>Lịch sử hợp đồng</span>}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
