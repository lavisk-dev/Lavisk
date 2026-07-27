"use client";

import { create } from "zustand";

interface UIState {
  isMobileNavOpen: boolean;
  quickViewProductId: string | null;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  openQuickView: (productId: string) => void;
  closeQuickView: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  quickViewProductId: null,
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  openQuickView: (productId) => set({ quickViewProductId: productId }),
  closeQuickView: () => set({ quickViewProductId: null }),
}));
