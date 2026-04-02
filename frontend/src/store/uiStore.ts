import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  currentMonth: number;
  currentYear: number;

  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
}

function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const now = new Date();

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: true,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        applyThemeToDocument(newTheme);
        set({ theme: newTheme });
      },

      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setMonth: (month) => {
        set({ currentMonth: month });
      },

      setYear: (year) => {
        set({ currentYear: year });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDocument(state.theme);
        }
      },
    },
  ),
);
