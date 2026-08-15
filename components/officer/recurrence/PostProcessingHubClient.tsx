'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, History } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';

import { InspectionsPageClient } from '@/components/officer/inspections/InspectionsPageClient';
import { RecurrencePageClient } from '@/components/officer/recurrence/RecurrencePageClient';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type PostProcessingTab = 'recurrence' | 'inspections';

const TAB_QUERY = 'tab';

const TAB_ORDER: Record<PostProcessingTab, number> = {
  recurrence: 0,
  inspections: 1,
};

const HUB_META: Record<
  PostProcessingTab,
  { subtitle: string; icon: typeof History; tabLabel: string }
> = {
  recurrence: {
    tabLabel: 'Tái diễn',
    subtitle: 'Xem xét các báo cáo nghi bị ô nhiễm tái diễn sau khi đã xử lý xong',
    icon: History,
  },
  inspections: {
    tabLabel: 'Hồ sơ xử phạt',
    subtitle: 'Quản lý hồ sơ xử phạt và theo dõi kết quả thanh tra',
    icon: FileText,
  },
};

/** Ease-out mềm — ui-ux-pro-max: enter ease-out, tránh linear. */
const EASE_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HUB_TAB_TRIGGER = cn(
  'relative h-auto cursor-pointer gap-1.5 rounded-none border-0 bg-transparent px-0.5 pb-2.5 pt-0',
  'text-sm font-medium text-slate-500 shadow-none transition-colors duration-200',
  'hover:text-slate-900',
  'focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-0',
  'data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-none'
);

function parseTab(raw: string | null): PostProcessingTab {
  return raw === 'inspections' ? 'inspections' : 'recurrence';
}

/**
 * Hub 「Sau xử lý」 — gộp Tái diễn + Hồ sơ xử phạt.
 * Mỗi tab giữ filter/data riêng: panel mount lần đầu rồi ẩn (opacity + inert), không unmount.
 * Chuyển tab: crossfade + slide nhẹ theo hướng + underline layoutId (reduced-motion safe).
 */
export function PostProcessingHubClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const activeTab = parseTab(searchParams.get(TAB_QUERY));

  const [prevTab, setPrevTab] = useState(activeTab);
  /** +1 → sang phải (inspections), −1 → sang trái (recurrence). */
  const [slideDir, setSlideDir] = useState(0);

  /** Mount lazy per tab — sau lần mở đầu tiên giữ mounted để preserve filter. */
  const [mounted, setMounted] = useState<Record<PostProcessingTab, boolean>>(() => {
    const initial = parseTab(searchParams.get(TAB_QUERY));
    return {
      recurrence: initial === 'recurrence',
      inspections: initial === 'inspections',
    };
  });

  // Sync hướng slide + mount khi URL đổi (back/forward / replace).
  if (activeTab !== prevTab) {
    setSlideDir(TAB_ORDER[activeTab] - TAB_ORDER[prevTab]);
    setMounted(prev => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
    setPrevTab(activeTab);
  }

  const setTab = useCallback(
    (next: string) => {
      const tab = parseTab(next);
      setMounted(prev => (prev[tab] ? prev : { ...prev, [tab]: true }));

      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'recurrence') {
        params.delete(TAB_QUERY);
      } else {
        params.set(TAB_QUERY, 'inspections');
      }
      const qs = params.toString();
      router.replace(qs ? `/officer/recurrence?${qs}` : '/officer/recurrence', { scroll: false });
    },
    [router, searchParams]
  );

  const meta = HUB_META[activeTab];
  const HubIcon = meta.icon;

  const panelTransition = reduceMotion ? { duration: 0.01 } : { duration: 0.28, ease: EASE_SOFT };

  const subtitleTransition = reduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: EASE_SOFT };

  const underlineTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.85 };

  return (
    <Tabs value={activeTab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0">
        <div className="pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-emerald-700">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={activeTab}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.88 }}
                  transition={subtitleTransition}
                  className="inline-flex"
                >
                  <HubIcon className="size-7" aria-hidden />
                </motion.span>
              </AnimatePresence>
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Tái diễn</h1>
              <div className="relative min-h-4.5">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={activeTab}
                    initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={subtitleTransition}
                    className="text-xs font-normal text-slate-500"
                  >
                    {meta.subtitle}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <LayoutGroup id="sau-xu-ly-tabs">
          <TabsList
            className={cn(
              'h-auto w-full justify-start gap-6 overflow-x-auto rounded-none bg-transparent',
              'px-0 pb-0 pt-4',
              'border-b border-slate-200'
            )}
            aria-label="Chế độ Tái diễn"
          >
            <TabsTrigger value="recurrence" className={HUB_TAB_TRIGGER}>
              <History className="size-3.5 shrink-0" aria-hidden />
              {HUB_META.recurrence.tabLabel}
              {activeTab === 'recurrence' ? (
                <motion.span
                  layoutId="sau-xu-ly-tab-ink"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand"
                  transition={underlineTransition}
                />
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="inspections" className={HUB_TAB_TRIGGER}>
              <FileText className="size-3.5 shrink-0" aria-hidden />
              {HUB_META.inspections.tabLabel}
              {activeTab === 'inspections' ? (
                <motion.span
                  layoutId="sau-xu-ly-tab-ink"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand"
                  transition={underlineTransition}
                />
              ) : null}
            </TabsTrigger>
          </TabsList>
        </LayoutGroup>
      </header>

      <div className="relative mt-6 min-h-0 flex-1">
        {mounted.recurrence ? (
          <HubTabPanel
            tab="recurrence"
            activeTab={activeTab}
            slideDir={slideDir}
            reduceMotion={Boolean(reduceMotion)}
            transition={panelTransition}
          >
            <RecurrencePageClient embedded />
          </HubTabPanel>
        ) : null}

        {mounted.inspections ? (
          <HubTabPanel
            tab="inspections"
            activeTab={activeTab}
            slideDir={slideDir}
            reduceMotion={Boolean(reduceMotion)}
            transition={panelTransition}
          >
            <InspectionsPageClient embedded />
          </HubTabPanel>
        ) : null}
      </div>
    </Tabs>
  );
}

type HubTabPanelProps = {
  tab: PostProcessingTab;
  activeTab: PostProcessingTab;
  slideDir: number;
  reduceMotion: boolean;
  transition: { duration: number; ease?: [number, number, number, number] };
  children: ReactNode;
};

/** Panel keep-mounted: active relative; inactive absolute + faded (giữ filter state). */
function HubTabPanel({
  tab,
  activeTab,
  slideDir,
  reduceMotion,
  transition,
  children,
}: HubTabPanelProps) {
  const isActive = activeTab === tab;
  /** Inactive park: đối hướng với lần chuyển gần nhất (slide nhẹ 14px). */
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
        'flex w-full min-h-0 flex-col',
        isActive ? 'relative z-10' : 'pointer-events-none absolute inset-x-0 top-0 z-0'
      )}
      aria-hidden={!isActive}
      {...(!isActive ? { inert: true } : {})}
    >
      {children}
    </motion.div>
  );
}
