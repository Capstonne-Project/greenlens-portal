'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface NavigationProgressProps {
  isNavigating: boolean;
  className?: string;
}

/** Slow asymptotic crawl (feels busy without racing to the end). */
const CRAWL_TRANSITION = 'width 10s cubic-bezier(0.05, 0.4, 0.2, 1)';
/** Snap to done after route is ready. */
const DONE_TRANSITION = 'width 320ms ease-out';
/** Even fast navigations stay visible this long so the bar does not flash. */
const MIN_VISIBLE_MS = 520;
const HIDE_AFTER_DONE_MS = 320;

/**
 * Owns the progress bar UX/animation only.
 * - CSS width transition (no setInterval → fewer React re-renders)
 * - Minimum visible time so quick route changes still feel smooth
 * - Deferred state updates via rAF (no sync setState-in-effect)
 */
export function NavigationProgressAdvanced({ isNavigating, className }: NavigationProgressProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [widthPct, setWidthPct] = React.useState(0);
  const [transition, setTransition] = React.useState(CRAWL_TRANSITION);

  const startedAtRef = React.useRef(0);
  const wasActiveRef = React.useRef(false);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = React.useRef(0);

  const clearTimers = React.useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (minTimerRef.current) {
      clearTimeout(minTimerRef.current);
      minTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  React.useEffect(() => {
    clearTimers();

    if (isNavigating) {
      wasActiveRef.current = true;
      startedAtRef.current = performance.now();

      rafRef.current = requestAnimationFrame(() => {
        setTransition('none');
        setWidthPct(0);
        setIsVisible(true);
        // Next frame: begin slow crawl toward ~78% (CSS does the work)
        rafRef.current = requestAnimationFrame(() => {
          setTransition(CRAWL_TRANSITION);
          setWidthPct(78);
        });
      });

      return clearTimers;
    }

    // Idle mount / no prior start — do nothing
    if (!wasActiveRef.current) return clearTimers;
    wasActiveRef.current = false;

    // Navigation finished — respect minimum visible time, then finish + hide
    const elapsed = performance.now() - startedAtRef.current;
    const waitMs = Math.max(0, MIN_VISIBLE_MS - elapsed);

    minTimerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        setTransition(DONE_TRANSITION);
        setWidthPct(100);
        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          setWidthPct(0);
          setTransition('none');
        }, HIDE_AFTER_DONE_MS);
      });
    }, waitMs);

    return clearTimers;
  }, [isNavigating, clearTimers]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-0 right-0 left-0 z-9999 h-0.5 bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div
        className="relative h-full overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"
        style={{ width: `${widthPct}%`, transition }}
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-emerald-500/70 to-transparent" />
      </div>
    </div>
  );
}
