'use client';

import React, { createContext, useContext, ReactNode, Suspense } from 'react';
import { NavigationProgressAdvanced } from '@/components/common/navigation-progress';
import { useNavigationProgress } from '@/hooks/useNavigationProgress';

interface NavigationProgressContextType {
  isNavigating: boolean;
  progress: number;
  startNavigation: () => void;
  completeNavigation: () => void;
}

const NavigationProgressContext = createContext<NavigationProgressContextType | undefined>(
  undefined
);

export function useNavigationProgressContext() {
  const context = useContext(NavigationProgressContext);
  if (context === undefined) {
    throw new Error(
      'useNavigationProgressContext must be used within a NavigationProgressProvider'
    );
  }
  return context;
}

interface NavigationProgressProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function NavigationProgressProvider({
  children,
  enabled = true,
}: NavigationProgressProviderProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={null}>
      <NavigationProgressProviderContent>{children}</NavigationProgressProviderContent>
    </Suspense>
  );
}

function NavigationProgressProviderContent({ children }: { children: ReactNode }) {
  const navigationState = useNavigationProgress();

  return (
    <NavigationProgressContext.Provider value={navigationState}>
      <NavigationProgressAdvanced isNavigating={navigationState.isNavigating} />
      {children}
    </NavigationProgressContext.Provider>
  );
}
