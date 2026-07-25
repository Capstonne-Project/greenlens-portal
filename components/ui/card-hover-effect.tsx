'use client';

import {
  Card as ShadcnCard,
  CardDescription as ShadcnCardDescription,
  CardTitle as ShadcnCardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type HTMLAttributes, type ReactNode } from 'react';

export type HoverEffectItem = {
  title: string;
  description: string;
  /** External URL — renders as `<a rel="noopener noreferrer">`. */
  link?: string;
  /** Stable React key (defaults to `link` or `title-index`). */
  key?: string;
  /** Custom card body — when set, skips default title/description Card. */
  content?: ReactNode;
  /** Click handler when there is no `link` (e.g. open report detail). */
  onClick?: () => void;
};

export type HoverEffectProps = {
  items: HoverEffectItem[];
  className?: string;
  /** Unique layoutId when multiple HoverEffect grids share a page. */
  layoutId?: string;
};

/**
 * Aceternity Hover Effect — shared sliding highlight across a card grid.
 * Default cards compose shadcn `Card` / `CardTitle` / `CardDescription`.
 */
export function HoverEffect({ items, className, layoutId = 'hoverBackground' }: HoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn('grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item, idx) => {
        const itemKey = item.key ?? item.link ?? `${item.title}-${idx}`;
        const sharedClassName =
          'group relative block h-full w-full p-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

        const hoverLayer = (
          <AnimatePresence>
            {hoveredIndex === idx ? (
              <motion.span
                className="absolute inset-0 block h-full w-full rounded-3xl bg-neutral-200/80 dark:bg-slate-800/80"
                layoutId={layoutId}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            ) : null}
          </AnimatePresence>
        );

        const body = item.content ? (
          <div className="relative z-20 h-full w-full">{item.content}</div>
        ) : (
          <Card>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        );

        if (item.link) {
          return (
            <a
              key={itemKey}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={sharedClassName}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoverLayer}
              {body}
            </a>
          );
        }

        return (
          <button
            key={itemKey}
            type="button"
            className={cn(sharedClassName, 'cursor-pointer')}
            onClick={item.onClick}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label={item.title}
          >
            {hoverLayer}
            {body}
          </button>
        );
      })}
    </div>
  );
}

/** Hover-effect card shell — shadcn Card + Aceternity hover chrome. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ShadcnCard
      className={cn(
        'relative z-20 h-full w-full overflow-hidden rounded-2xl border border-transparent bg-card p-0 shadow-sm group-hover:border-border dark:border-white/10',
        className
      )}
    >
      <div className="relative z-50 flex h-full flex-col">{children}</div>
    </ShadcnCard>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <ShadcnCardTitle
      className={cn('text-base font-semibold tracking-tight text-foreground', className)}
      {...props}
    >
      {children}
    </ShadcnCardTitle>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <ShadcnCardDescription
      className={cn('mt-2 text-sm leading-relaxed text-muted-foreground', className)}
      {...props}
    >
      {children}
    </ShadcnCardDescription>
  );
}
