'use client';

import React, { useRef, useState, type MouseEvent, type ReactNode } from 'react';
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
};

type TooltipBubbleProps = {
  name: string;
  designation?: string;
  translateX: ReturnType<typeof useSpring>;
  rotate: ReturnType<typeof useSpring>;
  className?: string;
  style?: React.CSSProperties;
};

function TooltipBubble({
  name,
  designation,
  translateX,
  rotate,
  className,
  style,
}: TooltipBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.6 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 260,
          damping: 10,
        },
      }}
      exit={{ opacity: 0, y: 20, scale: 0.6 }}
      style={{
        translateX,
        rotate,
        whiteSpace: 'nowrap',
        ...style,
      }}
      className={cn(
        'z-100 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs shadow-xl',
        className
      )}
      role="tooltip"
    >
      <div className="absolute inset-x-8 -bottom-px z-30 h-px w-[20%] bg-linear-to-r from-transparent via-emerald-500 to-transparent" />
      <div className="absolute -bottom-px left-6 z-30 h-px w-[40%] bg-linear-to-r from-transparent via-sky-500 to-transparent" />
      <div className="relative z-30 text-xs font-bold text-white">{name}</div>
      {designation ? <div className="text-[10px] text-white/90">{designation}</div> : null}
    </motion.div>
  );
}

function useTooltipMotion() {
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

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
 * Uses `fixed` so overflow parents (sidebar) do not clip the bubble.
 */
export type AnimatedHoverTooltipProps = {
  name: string;
  designation?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function AnimatedHoverTooltip({
  name,
  designation,
  children,
  className,
  disabled = false,
}: AnimatedHoverTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { rotate, translateX, handleMouseMove } = useTooltipMotion();

  const show = hovered && !disabled;

  const updateAnchor = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setAnchor({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  };

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
      <AnimatePresence>
        {show ? (
          <TooltipBubble
            name={name}
            designation={designation}
            translateX={translateX}
            rotate={rotate}
            className="pointer-events-none fixed -translate-y-full"
            style={{ top: anchor.top, left: anchor.left }}
          />
        ) : null}
      </AnimatePresence>
    </span>
  );
}

export function AnimatedTooltip({
  items,
  avatarClassName = 'h-7 w-7',
  className,
}: AnimatedTooltipProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { rotate, translateX, handleMouseMove } = useTooltipMotion();

  return (
    <div className={cn('flex flex-row items-center', className)}>
      {items.map(item => (
        <div
          className="group relative -mr-2"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === item.id ? (
              <TooltipBubble
                name={item.name}
                designation={item.designation}
                translateX={translateX}
                rotate={rotate}
                className="absolute -top-14 left-1/2"
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
              alt={item.name}
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
              aria-label={item.name}
            >
              {item.initials ?? item.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
