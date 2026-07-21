'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationProgressState {
  isNavigating: boolean;
  /** Kept for API compat — bar animation lives in NavigationProgressAdvanced only. */
  progress: number;
  startNavigation: () => void;
  completeNavigation: () => void;
}

/**
 * Tracks in-app link navigations. Intentionally does NOT drive the bar width —
 * that is owned by NavigationProgressAdvanced to avoid duplicate timers and
 * setState-during-Router-render (completeNavigation must never sync-setState).
 */
export function useNavigationProgress(): NavigationProgressState {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);

  const completeNavigation = useCallback(() => {
    if (!isNavigatingRef.current) return;
    isNavigatingRef.current = false;
    // Defer past Router render — never setState sync in Router's stack
    queueMicrotask(() => {
      startTransition(() => setIsNavigating(false));
    });
  }, []);

  const startNavigation = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    queueMicrotask(() => {
      startTransition(() => setIsNavigating(true));
    });
  }, []);

  const completeRef = useRef(completeNavigation);
  useEffect(() => {
    completeRef.current = completeNavigation;
  }, [completeNavigation]);

  // Complete when the route actually changes
  useEffect(() => {
    if (isNavigatingRef.current) {
      completeRef.current();
    }
  }, [pathname]);

  const shouldTrackNavigation = useCallback(
    (link: HTMLAnchorElement): boolean => {
      const href = link.getAttribute('href');
      if (!href) return false;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))
        return false;
      if (href.startsWith('#')) return false;
      if (href === pathname) return false;
      if (link.getAttribute('target') === '_blank') return false;
      if (link.getAttribute('download')) return false;
      return true;
    },
    [pathname]
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (link && shouldTrackNavigation(link)) {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        clickTimerRef.current = setTimeout(() => startNavigation(), 10);
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleClick);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, [shouldTrackNavigation, startNavigation]);

  return { isNavigating, progress: 0, startNavigation, completeNavigation };
}
