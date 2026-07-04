'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useState } from 'react';

export type AceternityTab = {
  title: string;
  value: string;
  content?: ReactNode;
};

type AceternityTabsProps = {
  tabs: AceternityTab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  onActiveChange?: (value: string) => void;
};

/** Animated tabs (Aceternity UI) — tách file riêng để không ghi đè shadcn `tabs.tsx`. */
export function AceternityTabs({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
  onActiveChange,
}: AceternityTabsProps) {
  const [active, setActive] = useState<AceternityTab>(propTabs[0]);

  const handleTabClick = (tab: AceternityTab) => {
    setActive(tab);
    onActiveChange?.(tab.value);
  };

  return (
    <>
      <div
        className={cn(
          'no-visible-scrollbar relative flex w-full max-w-full flex-row items-center justify-center gap-1 overflow-auto [perspective:1000px] sm:overflow-visible',
          containerClassName
        )}
      >
        {propTabs.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabClick(tab)}
            className={cn('relative rounded-full px-4 py-2 text-sm font-medium', tabClassName)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {active.value === tab.value && (
              <motion.div
                layoutId="aceternity-tab-pill"
                transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                className={cn(
                  'absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-950/60',
                  activeTabClassName
                )}
              />
            )}
            <span className="relative block text-foreground">{tab.title}</span>
          </button>
        ))}
      </div>

      <FadeInDiv className={contentClassName} tabs={propTabs} active={active} />
    </>
  );
}

type FadeInDivProps = {
  className?: string;
  tabs: AceternityTab[];
  active: AceternityTab;
};

function FadeInDiv({ className, tabs, active }: FadeInDivProps) {
  const activeTab = tabs.find(tab => tab.value === active.value) ?? tabs[0];

  return (
    <div className={cn('relative w-full', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab.value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full"
        >
          {activeTab.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
