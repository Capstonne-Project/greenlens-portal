'use client';

import React, { useRef, useState, type MouseEvent } from 'react';
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

export function AnimatedTooltip({
  items,
  avatarClassName = 'h-7 w-7',
  className,
}: AnimatedTooltipProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const target = event.currentTarget;
      const halfWidth = target.offsetWidth / 2;
      x.set(event.nativeEvent.offsetX - halfWidth);
    });
  };

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
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: 'nowrap',
                }}
                className="absolute -top-14 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs shadow-xl"
              >
                <div className="absolute inset-x-8 -bottom-px z-30 h-px w-[20%] bg-linear-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px left-6 z-30 h-px w-[40%] bg-linear-to-r from-transparent via-sky-500 to-transparent" />
                <div className="relative z-30 text-xs font-bold text-white">{item.name}</div>
                <div className="text-[10px] text-white/90">{item.designation}</div>
              </motion.div>
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
