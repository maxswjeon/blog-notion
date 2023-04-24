"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type MainStore = {
  language: "en-US" | "ko-KR";
  setLanguage: (language: "en-US" | "ko-KR") => void;
};

const useMainStore = create<MainStore>()(
  persist<MainStore>(
    (set) => ({
      language: "ko-KR",
      setLanguage: (language) => set({ language }),
    }),
    { name: "main" }
  )
);

export const useLanguage = () => useMainStore((state) => state.language);
export const useMutations = () =>
  useMainStore((state) => ({ setLanguage: state.setLanguage }));
