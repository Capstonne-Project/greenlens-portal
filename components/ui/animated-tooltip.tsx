'use client';

import React, { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';

import { cn } from '@/lib/utils';

export type AnimatedTooltipItem = {
  id: number;
  name: string;
  designation: string;
  /** Optional photo URL — khi thiếu sẽ hiện initials. */
  image?: string;
  initials?: string;
  fallbackClassName?: string;
};

export type AnimatedTooltipProps = {
  items: AnimatedTooltipItem[];
  /** Avatar size classes — mặc định khớp officer card (`size-7`). */
  avatarClassName?: string;
  className?: string;
  /**
   * Chỉ hiện N avatar đầu; phần còn lại thành chip `+N`.
   * Không set = hiện tất cả.
   */
  maxVisible?: number;
  /** Prefixed onto overflow chip tooltip (vd. teamName). */
  groupLabel?: string;
};

type TooltipBubbleProps = {
  name: string;
  designation?: string;
  translateX: ReturnType<typeof useSpring>;
  rotate: ReturnType<typeof useSpring>;
  className?: string;
  style?: React.CSSProperties;
  /** Cho phép xuống dòng (tooltip giải thích dài). */
  wrap?: boolean;
};

function TooltipBubble({
  name,
  designation,
  translateX,
  rotate,
  className,
  style,
  wrap = false,
}: TooltipBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 140,
          damping: 22,
          mass: 0.9,
        },
      }}
      exit={{
        opacity: 0,
        y: 6,
        scale: 0.97,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      style={{
        translateX,
        rotate,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        ...style,
      }}
      className={cn(
        'z-100 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs shadow-xl',
        wrap && 'max-w-[min(18rem,calc(100vw-2rem))] items-start text-left',
        className
      )}
      role="tooltip"
    >
      <div className="absolute inset-x-8 -bottom-px z-30 h-px w-[20%] bg-linear-to-r from-transparent via-emerald-500 to-transparent" />
      <div className="absolute -bottom-px left-6 z-30 h-px w-[40%] bg-linear-to-r from-transparent via-sky-500 to-transparent" />
      <div className="relative z-30 text-xs font-bold text-white">{name}</div>
      {designation ? (
        <div className={cn('mt-0.5 whitespace-pre-line text-[10px] leading-snug text-white/90')}>
          {designation}
        </div>
      ) : null}
    </motion.div>
  );
}

function useTooltipMotion() {
  const springConfig = { stiffness: 80, damping: 22, mass: 0.85 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);
  const rotate = useSpring(useTransform(x, [-100, 100], [-12, 12]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-20, 20]), springConfig);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    // Capture before rAF — React nullifies event.currentTarget after the sync handler.
    const target = event.currentTarget;
    const offsetX = event.nativeEvent.offsetX;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!target) return;
      const halfWidth = target.offsetWidth / 2;
      x.set(offsetX - halfWidth);
    });
  };

  return { rotate, translateX, handleMouseMove };
}

/**
 * Hover tooltip for truncated / overflow text.
 * Bubble portal → `document.body` để `position:fixed` không bị lệch khi ancestor có `transform`
 * (vd. `-translate-y-1/2` trên badge cluster).
 */
export type AnimatedHoverTooltipProps = {
  name: string;
  designation?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Cho phép nội dung tooltip xuống dòng. */
  wrap?: boolean;
};

export function AnimatedHoverTooltip({
  name,
  designation,
  children,
  className,
  disabled = false,
  wrap = false,
}: AnimatedHoverTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  /** Client-only portal target — tránh SSR `document` và không setState trong effect. */
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { rotate, translateX, handleMouseMove } = useTooltipMotion();

  const show = hovered && !disabled;

  const updateAnchor = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setAnchor({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  };

  const bubble = mounted
    ? createPortal(
        <AnimatePresence>
          {show ? (
            <TooltipBubble
              key="hover-tip"
              name={name}
              designation={designation}
              translateX={translateX}
              rotate={rotate}
              wrap={wrap}
              className="pointer-events-none fixed -translate-y-full"
              style={{ top: anchor.top, left: anchor.left }}
            />
          ) : null}
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <span
      ref={triggerRef}
      className={cn('relative inline-flex min-w-0 max-w-full', className)}
      onMouseEnter={() => {
        if (disabled) return;
        updateAnchor();
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={event => {
        if (disabled) return;
        handleMouseMove(event);
      }}
    >
      {children}
      {bubble}
    </span>
  );
}

/**
 * Stacked avatar tooltips.
 * Uses `fixed` so overflow parents (cards with overflow-hidden) do not clip the bubble.
 */
export function AnimatedTooltip({
  items,
  avatarClassName = 'h-7 w-7',
  className,
  maxVisible,
  groupLabel,
}: AnimatedTooltipProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  const { rotate, translateX, handleMouseMove } = useTooltipMotion();

  const limit =
    typeof maxVisible === 'number' && Number.isFinite(maxVisible) && maxVisible >= 0
      ? Math.floor(maxVisible)
      : items.length;
  const visibleItems = items.slice(0, limit);
  const overflowItems = items.slice(limit);
  const overflowCount = overflowItems.length;
  const overflowDesignation = overflowItems
    .map(item => item.designation?.trim() || item.name)
    .filter(Boolean)
    .join('\n');
  const overflowTitle = groupLabel?.trim() || `+${overflowCount} thành viên`;

  const updateAnchor = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setAnchor({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  };

  return (
    <div className={cn('flex min-w-0 flex-row items-center', className)}>
      {visibleItems.map(item => (
        <div
          className="group relative -mr-2 shrink-0"
          key={item.id}
          onMouseEnter={e => {
            updateAnchor(e.currentTarget);
            setHoveredIndex(item.id);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === item.id ? (
              <TooltipBubble
                name={item.name}
                designation={item.designation}
                translateX={translateX}
                rotate={rotate}
                className="pointer-events-none fixed z-100 -translate-y-full"
                style={{ top: anchor.top, left: anchor.left }}
              />
            ) : null}
          </AnimatePresence>

          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- Aceternity tooltip needs mouse offset on the element
            <img
              onMouseMove={handleMouseMove}
              height={28}
              width={28}
              src={item.image}
              alt={item.designation || item.name}
              className={cn(
                'relative m-0 rounded-full border-2 border-white object-cover object-top p-0 transition duration-500 group-hover:z-30 group-hover:scale-105',
                avatarClassName
              )}
            />
          ) : (
            <span
              onMouseMove={handleMouseMove}
              className={cn(
                'relative m-0 flex items-center justify-center rounded-full border-2 border-white p-0 text-[10px] font-semibold transition duration-500 group-hover:z-30 group-hover:scale-105',
                avatarClassName,
                item.fallbackClassName ?? 'bg-muted text-foreground'
              )}
              aria-label={item.designation || item.name}
            >
              {item.initials ?? item.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      ))}

      {overflowCount > 0 ? (
        <div
          className="group relative -mr-2 shrink-0"
          onMouseEnter={e => {
            updateAnchor(e.currentTarget);
            setHoveredIndex(-1);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === -1 ? (
              <TooltipBubble
                name={overflowTitle}
                designation={overflowDesignation}
                translateX={translateX}
                rotate={rotate}
                wrap
                className="pointer-events-none fixed z-100 -translate-y-full"
                style={{ top: anchor.top, left: anchor.left }}
              />
            ) : null}
          </AnimatePresence>
          <span
            onMouseMove={handleMouseMove}
            className={cn(
              'relative m-0 flex items-center justify-center rounded-full border-2 border-white bg-slate-200 p-0 text-[9px] font-semibold text-slate-700 transition duration-500 group-hover:z-30 group-hover:scale-105',
              avatarClassName
            )}
            aria-label={`Còn ${overflowCount} thành viên`}
          >
            +{overflowCount}
          </span>
        </div>
      ) : null}
    </div>
  );
}
