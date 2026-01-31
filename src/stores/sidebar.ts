import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  setExpanded: (expanded: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: false,
      isMobileOpen: false,
      toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      toggleMobile: () =>
        set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setMobileOpen: (open) => set({ isMobileOpen: open }),
    }),
    {
      name: "nexus-sidebar-state",
    },
  ),
);
