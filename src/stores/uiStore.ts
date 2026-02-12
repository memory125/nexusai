import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Page = 'chat' | 'agents' | 'skills' | 'models' | 'project' | 'settings';

export interface UIState {
  currentPage: Page;
  sidebarOpen: boolean;
  isGenerating: boolean;
  setCurrentPage: (page: Page) => void;
  toggleSidebar: () => void;
  setIsGenerating: (generating: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentPage: 'chat',
      sidebarOpen: true,
      isGenerating: false,
      
      setCurrentPage: (page) => set({ currentPage: page }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
    }),
    {
      name: 'nexusai-ui',
      partialize: (state) => ({ currentPage: state.currentPage, sidebarOpen: state.sidebarOpen }),
    }
  )
);
