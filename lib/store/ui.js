import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useUI = create(devtools((set) => ({
  sidebarOpen: true,
  setSidebar: (v) => set({ sidebarOpen: v }),
  toast: null,
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null })
})));
