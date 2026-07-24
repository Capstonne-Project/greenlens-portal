'use client';

import { MembersTab } from './MembersTab';
import { TeamTab } from './TeamTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { useOfficeStaffList } from '@/hooks/useLeoOffices';
import { useTeamsList } from '@/hooks/useTeams';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { CircleHelp, Users, UsersRound } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export type WorkforceTab = 'teams' | 'members';

function parseTab(value: string | null): WorkforceTab {
  return value === 'members' ? 'members' : 'teams';
}

export function LeoWorkforcePageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get('tab'));

  const user = useAuthStore(s => s.user);
  const fullName = user?.name?.trim() || 'Người dùng';

  const { data: teamsData } = useTeamsList({ page: 1, pageSize: 1 });
  const { data: staffData } = useOfficeStaffList({ page: 1, pageSize: 1 });

  const teamsCount = teamsData?.pagination.totalItems;
  const membersCount = staffData?.pagination.totalItems;

  const setTab = useCallback(
    (tab: WorkforceTab) => {
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

  return (
    <>
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-[0.35rem]">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Đội ngũ</h1>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
                aria-label="Thông tin quản lý đội ngũ"
              >
                <CircleHelp className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          <TypewriterEffectSmooth
            words={[
              { text: 'Welcome', className: 'font-normal text-slate-500' },
              { text: 'back,', className: 'font-normal text-slate-500' },
              {
                text: fullName,
                className: 'font-medium text-slate-800 dark:text-slate-100',
              },
            ]}
            className="mt-1 my-0"
            textClassName="text-sm font-normal sm:text-sm md:text-sm lg:text-sm xl:text-sm"
            cursorClassName="h-3.5 w-0.5 bg-slate-400 sm:h-3.5 xl:h-3.5"
            hideCursorOnComplete
          />
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={value => setTab(parseTab(value))}
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        <TabsList className="inline-flex h-auto w-fit items-stretch gap-0 bg-transparent p-0">
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
                  'box-border h-8 cursor-pointer gap-1.5 rounded-none border px-3 text-xs font-medium shadow-none ring-offset-0',
                  'focus-visible:ring-1 focus-visible:ring-[#7BA86A] focus-visible:ring-offset-0',
                  isFirst && 'rounded-l-md',
                  isLast && 'rounded-r-md',
                  isActive
                    ? 'relative z-10 border-[#7BA86A] bg-[#EAF3E6] text-slate-800 data-[state=active]:bg-[#EAF3E6] data-[state=active]:text-slate-800 data-[state=active]:shadow-none'
                    : 'border-transparent bg-slate-100 text-slate-500 data-[state=inactive]:bg-slate-100'
                )}
              >
                <Icon
                  className={cn(
                    'size-3.5 shrink-0',
                    isActive ? 'text-[#5C8F4C]' : 'text-slate-500'
                  )}
                  aria-hidden
                />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold leading-none',
                      isActive ? 'bg-[#7BA86A] text-white' : 'bg-slate-200 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent
          value="teams"
          className="mt-0 flex min-h-0 flex-1 flex-col focus-visible:ring-0"
        >
          <TeamTab />
        </TabsContent>
        <TabsContent
          value="members"
          className="mt-0 flex min-h-0 flex-1 flex-col focus-visible:ring-0"
        >
          <MembersTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
