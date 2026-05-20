'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface AnimatedTabItem {
  name: string;
  value: string;
  link: string;
  badge?: number;
  exact?: boolean;
}

interface AnimatedTabsProps {
  tabs: AnimatedTabItem[];
  underlineColor?: string;
}

const AnimatedTabs = ({ tabs, underlineColor = 'bg-emerald-600' }: AnimatedTabsProps) => {
  const pathname = usePathname();
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [underlineStyle, setUnderlineStyle] = React.useState({ left: 0, width: 0 });

  const activeTab = React.useMemo(() => {
    if (!pathname) return tabs[0]?.value ?? '';
    const active = tabs.find(tab =>
      tab.exact
        ? pathname === tab.link || pathname === tab.link + '/'
        : pathname.startsWith(tab.link)
    );
    return active?.value || tabs[0]?.value || '';
  }, [pathname, tabs]);

  React.useLayoutEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.value === activeTab);
    const el = tabRefs.current[activeIndex];
    if (el) {
      setUnderlineStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab, tabs]);

  return (
    <Tabs value={activeTab} className="gap-4">
      <TabsList className="relative rounded-none bg-transparent p-0">
        {tabs.map((tab, index) => (
          <Link href={tab.link} key={tab.value}>
            <TabsTrigger
              value={tab.value}
              ref={el => {
                tabRefs.current[index] = el;
              }}
              className="relative z-10 flex items-center gap-1.5 rounded-none border-0 bg-transparent font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {tab.name}
              {tab.badge !== undefined && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          </Link>
        ))}

        <motion.div
          className={`absolute bottom-0 z-20 h-0.5 ${underlineColor}`}
          layoutId="underline"
          style={{ left: underlineStyle.left, width: underlineStyle.width }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        />
      </TabsList>
    </Tabs>
  );
};

export default AnimatedTabs;
