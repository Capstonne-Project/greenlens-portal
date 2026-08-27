'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Users, UsersRound } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';

import { MembersTab } from './MembersTab';
import { TeamTab } from './TeamTab';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOfficeStaffList } from '@/hooks/useLeoOffices';
import { useTeamsList } from '@/hooks/useTeams';
import { cn } from '@/lib/utils';

export type WorkforceTab = 'teams' | 'members';

const TAB_ORDER: Record<WorkforceTab, number> = {
  teams: 0,
  members: 1,
};

/** Ease-out mềm — đồng bộ hub Sau xử lý / ui-ux-pro-max. */
const EASE_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function parseTab(value: string | null): WorkforceTab {
  return value === 'members' ? 'members' : 'teams';
}

export function LeoWorkforcePageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const activeTab = parseTab(searchParams.get('tab'));

  const [prevTab, setPrevTab] = useState(activeTab);
  const [slideDir, setSlideDir] = useState(0);
  const [mounted, setMounted] = useState<Record<WorkforceTab, boolean>>(() => ({
    teams: activeTab === 'teams',
    members: activeTab === 'members',
  }));

  // Sync hướng slide + mount khi URL đổi (back/forward / replace).
  if (activeTab !== prevTab) {
    setSlideDir(TAB_ORDER[activeTab] - TAB_ORDER[prevTab]);
    setMounted(prev => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
    setPrevTab(activeTab);
  }

  const { data: teamsData } = useTeamsList({ page: 1, pageSize: 1 });
  const { data: staffData } = useOfficeStaffList({ page: 1, pageSize: 1 });

  const teamsCount = teamsData?.pagination.totalItems;
  const membersCount = staffData?.pagination.totalItems;

  const setTab = useCallback(
    (tab: WorkforceTab) => {
      setMounted(prev => (prev[tab] ? prev : { ...prev, [tab]: true }));

      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'teams') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const tabItems = useMemo(
    () =>
      [
        {
          value: 'teams' as const,
          label: 'Đội nhóm',
          Icon: UsersRound,
          count: teamsCount,
        },
        {
          value: 'members' as const,
          label: 'Nhân sự',
          Icon: Users,
          count: membersCount,
        },
      ] as const,
    [membersCount, teamsCount]
  );

  const panelTransition = reduceMotion ? { duration: 0.01 } : { duration: 0.28, ease: EASE_SOFT };

  const pillTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.85 };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
              <UsersRound className="size-7" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Đội ngũ</h1>
              <p className="text-xs font-normal text-slate-500">
                Quản lý đội nhóm và nhân sự thuộc văn phòng môi trường.
              </p>
            </div>
          </div>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={value => setTab(parseTab(value))}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <LayoutGroup id="leo-workforce-tabs">
          <TabsList className="inline-flex h-auto w-fit shrink-0 items-stretch gap-0 overflow-hidden rounded-md bg-slate-100 p-0">
            {tabItems.map((tab, index) => {
              const isActive = activeTab === tab.value;
              const isFirst = index === 0;
              const isLast = index === tabItems.length - 1;
              const Icon = tab.Icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'relative box-border h-8 cursor-pointer gap-1.5 rounded-none border-0 px-3 text-xs font-medium shadow-none ring-offset-0',
                    'bg-transparent transition-colors duration-200',
                    'focus-visible:ring-1 focus-visible:ring-[#7BA86A] focus-visible:ring-offset-0',
                    'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                    isActive
                      ? 'z-10 text-slate-800 data-[state=active]:text-slate-800'
                      : 'text-slate-500 data-[state=inactive]:bg-transparent'
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="leo-workforce-tab-pill"
                      className={cn(
                        'absolute inset-0 border border-[#7BA86A] bg-[#EAF3E6]',
                        isFirst && 'rounded-l-md',
                        isLast && 'rounded-r-md',
                        !isFirst && !isLast && 'rounded-none'
                      )}
                      transition={pillTransition}
                    />
                  ) : null}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <Icon
                      className={cn(
                        'size-3.5 shrink-0',
                        isActive ? 'text-[#5C8F4C]' : 'text-slate-500'
                      )}
                      aria-hidden
                    />
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' ? (
                      <span
                        className={cn(
                          'inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold leading-none',
                          isActive ? 'bg-[#7BA86A] text-white' : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </LayoutGroup>

        <div className="relative mt-0 min-h-0 flex-1 overflow-hidden">
          {mounted.teams ? (
            <WorkforceTabPanel
              tab="teams"
              activeTab={activeTab}
              slideDir={slideDir}
              reduceMotion={Boolean(reduceMotion)}
              transition={panelTransition}
            >
              <TeamTab />
            </WorkforceTabPanel>
          ) : null}

          {mounted.members ? (
            <WorkforceTabPanel
              tab="members"
              activeTab={activeTab}
              slideDir={slideDir}
              reduceMotion={Boolean(reduceMotion)}
              transition={panelTransition}
            >
              <MembersTab />
            </WorkforceTabPanel>
          ) : null}
        </div>
      </Tabs>
    </div>
  );
}

type WorkforceTabPanelProps = {
  tab: WorkforceTab;
  activeTab: WorkforceTab;
  slideDir: number;
  reduceMotion: boolean;
  transition: { duration: number; ease?: [number, number, number, number] };
  children: ReactNode;
};

/** Keep-mounted panel: crossfade + slide nhẹ — giữ filter/state từng tab. */
function WorkforceTabPanel({
  tab,
  activeTab,
  slideDir,
  reduceMotion,
  transition,
  children,
}: WorkforceTabPanelProps) {
  const isActive = activeTab === tab;
  const parkedX = reduceMotion ? 0 : slideDir >= 0 ? -14 : 14;

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isActive ? 1 : 0,
        x: isActive ? 0 : parkedX,
      }}
      transition={transition}
      className={cn(
        'absolute inset-0 flex min-h-0 w-full flex-col overflow-hidden',
        isActive ? 'z-10' : 'pointer-events-none invisible z-0'
      )}
      aria-hidden={!isActive}
      {...(!isActive ? { inert: true } : {})}
    >
      {children}
    </motion.div>
  );
}
