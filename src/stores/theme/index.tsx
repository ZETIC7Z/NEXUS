import { ReactNode, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { allThemes } from "../../../themes/all";

export interface ThemeStore {
  theme: string | null;
  setTheme(v: string | null): void;
}

const currentDate = new Date();
const is420 = currentDate.getMonth() + 1 === 4 && currentDate.getDate() === 20;
const isHalloween =
  currentDate.getMonth() + 1 === 10 && currentDate.getDate() === 31;
// Make default theme green if its 4/20 (bc the marijauna plant is green :3)
// Make default theme autumn if its Halloween (spooky autumn vibes 🎃)
export const useThemeStore = create(
  persist(
    immer<ThemeStore>((set) => ({
      theme: is420 ? "green" : isHalloween ? "autumn" : "ember",
      setTheme(v) {
        set((s) => {
          s.theme = v;
        });
      },
    })),
    {
      name: "__MW::theme",
    },
  ),
);

export interface PreviewThemeStore {
  previewTheme: string | null;
  setPreviewTheme(v: string | null): void;
}

export const usePreviewThemeStore = create(
  immer<PreviewThemeStore>((set) => ({
    previewTheme: null,
    setPreviewTheme(v) {
      set((s) => {
        s.previewTheme = v;
      });
    },
  })),
);

export function ThemeProvider(props: {
  children?: ReactNode;
  applyGlobal?: boolean;
}) {
  const previewTheme = usePreviewThemeStore((s) => s.previewTheme);
  const theme = useThemeStore((s) => s.theme);

  const themeToDisplay = previewTheme ?? theme;
  const themeSelector = themeToDisplay ? `theme-${themeToDisplay}` : undefined;

  // Inject CSS variables for mobile navbar theme colors
  useEffect(() => {
    const root = document.documentElement;

    const currentTheme = allThemes.find((t) => t.name === themeToDisplay);

    if (currentTheme?.extend?.colors) {
      const colors = currentTheme.extend.colors as any;

      // Helper to convert hex to HSL values (returns "h s% l%")
      const hexToHSL = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return "0 0% 50%";

        const r = parseInt(result[1], 16) / 255;
        const g = parseInt(result[2], 16) / 255;
        const b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

          switch (max) {
            case r:
              h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
              break;
            case g:
              h = ((b - r) / d + 2) / 6;
              break;
            case b:
              h = ((r - g) / d + 4) / 6;
              break;
            default:
              break;
          }
        }

        const hDeg = Math.round(h * 360);
        const sPercent = Math.round(s * 100);
        const lPercent = Math.round(l * 100);

        return `${hDeg} ${sPercent}% ${lPercent}%`;
      };

      // Get theme-appropriate colors for navbar
      // --colors-primary: The main theme accent (e.g., Purple in Blue theme)
      // --colors-active: The active highlight color (e.g., Blue in Blue theme, matches Settings)
      const primaryColor =
        colors.global?.accentA || colors.themePreview?.primary || "#FF6B35";
      const activeColor =
        colors.settings?.sidebar?.type?.iconActivated || primaryColor;
      const inactiveColor =
        colors.type?.dimmed || colors.type?.secondary || "#666666";
      const bgMain = colors.background?.main || "#0d0d0d";
      const typeText = colors.type?.text || "#f0f0f0";

      root.style.setProperty("--colors-primary", hexToHSL(primaryColor));
      root.style.setProperty("--colors-active", hexToHSL(activeColor));
      root.style.setProperty("--colors-buttons-list", hexToHSL(inactiveColor));
      root.style.setProperty("--colors-buttons-active", hexToHSL(activeColor));
      root.style.setProperty("--colors-background-main", hexToHSL(bgMain));
      root.style.setProperty("--colors-type-text", hexToHSL(typeText));
    } else {
      // Fallback if theme not found
      root.style.setProperty("--colors-primary", "25 95% 53%");
      root.style.setProperty("--colors-active", "25 95% 53%");
      root.style.setProperty("--colors-buttons-list", "0 0% 55%");
      root.style.setProperty("--colors-buttons-active", "25 95% 53%");
      root.style.setProperty("--colors-background-main", "0 0% 5%");
      root.style.setProperty("--colors-type-text", "0 0% 95%");
    }
  }, [themeToDisplay]);

  return (
    <div className={themeSelector}>
      {props.applyGlobal ? (
        <Helmet>
          <body className={themeSelector} />
        </Helmet>
      ) : null}
      {props.children}
    </div>
  );
}
