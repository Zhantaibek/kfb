import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      theme: 'light',
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },
      initTheme: () => {
        document.documentElement.classList.toggle('dark', get().theme === 'dark');
      },
    }),
    { name: 'educrm-ui' },
  ),
);
