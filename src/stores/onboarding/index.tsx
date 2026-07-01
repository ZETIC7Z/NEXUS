import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface OnboardingStore {
  completed: boolean;
  useZeticuzPlayer: boolean;
  useDefaultSetup: boolean;
  setCompleted(v: boolean): void;
  setUseZeticuzPlayer(v: boolean): void;
  setUseDefaultSetup(v: boolean): void;
}

export const useOnboardingStore = create(
  persist(
    immer<OnboardingStore>((set) => ({
      completed: false,
      useZeticuzPlayer: false,
      useDefaultSetup: false,
      setCompleted(v) {
        set((s) => {
          s.completed = v;
        });
      },
      setUseZeticuzPlayer(v) {
        set((s) => {
          s.useZeticuzPlayer = v;
        });
      },
      setUseDefaultSetup(v) {
        set((s) => {
          s.useDefaultSetup = v;
        });
      },
    })),
    { name: "__MW::onboarding" },
  ),
);
