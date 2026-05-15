'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UiLocale = 'vi' | 'en';

interface UiState {
  theme: 'light' | 'dark';
  locale: UiLocale;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleLocale: () => void;
  setLocale: (locale: UiLocale) => void;
  setSidebar: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      locale: 'vi',
      sidebarOpen: false,

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
      },

      setTheme: theme => set({ theme }),

      toggleLocale: () => {
        const next = get().locale === 'vi' ? 'en' : 'vi';
        set({ locale: next });
      },

      setLocale: locale => set({ locale }),

      setSidebar: open => set({ sidebarOpen: open }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ theme: state.theme, locale: state.locale }),
    }
  )
);
