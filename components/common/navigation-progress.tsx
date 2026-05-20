'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface NavigationProgressProps {
  isNavigating: boolean;
  className?: string;
}

export function NavigationProgressAdvanced({ isNavigating, className }: NavigationProgressProps) {
  const [{ isVisible, internalProgress }, setAnim] = React.useState({
    isVisible: false,
    internalProgress: 0,
  });

  React.useEffect(() => {
    if (isNavigating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnim(() => ({ isVisible: true, internalProgress: 0 }));

      const interval = setInterval(() => {
        setAnim(prev => ({
          ...prev,
          internalProgress:
            prev.internalProgress >= 90
              ? prev.internalProgress
              : prev.internalProgress + Math.random() * 15,
        }));
      }, 100);

      return () => clearInterval(interval);
    }

    setAnim(prev => ({ ...prev, internalProgress: 100 }));
    const timer = setTimeout(() => {
      setAnim({ isVisible: false, internalProgress: 0 });
    }, 500);
    return () => clearTimeout(timer);
  }, [isNavigating]);

  if (!isVisible) return null;

  const displayProgress = isNavigating ? Math.min(internalProgress, 90) : 100;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div
        className="relative h-full overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 transition-all duration-300 ease-out"
        style={{ width: `${displayProgress}%` }}
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-emerald-500/70 to-transparent" />
      </div>
    </div>
  );
}
