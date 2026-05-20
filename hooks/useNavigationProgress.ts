'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationProgressState {
  isNavigating: boolean;
  progress: number;
  startNavigation: () => void;
  completeNavigation: () => void;
}

export function useNavigationProgress(): NavigationProgressState {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);

  const completeNavigation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
    }
    isNavigatingRef.current = false;
    setProgress(100);
    completionTimerRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 400);
  }, []);

  const startNavigation = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);
    setProgress(0);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      let increment: number;
      if (step < 3) increment = 15 + Math.random() * 10;
      else if (step < 8) increment = 5 + Math.random() * 8;
      else increment = 2 + Math.random() * 3;
      setProgress(prev => Math.min(prev + increment, 90));
    }, 150);
  }, []);

  // Sync completeNavigation into a ref so the pathname effect never captures a stale closure
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
    const handleUnload = () => {
      if (isNavigatingRef.current) completeRef.current();
    };

    document.addEventListener('click', handleClick, { passive: true });
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [shouldTrackNavigation, startNavigation]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  return { isNavigating, progress, startNavigation, completeNavigation };
}
