import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clampRules, DEFAULT_RULES, TEST_RULES, type RuleConfig } from "@/lib/nukida/rules";

type RulesState = RuleConfig & {
  patch: (p: Partial<RuleConfig>) => void;
  reset: () => void;
  useTest: () => void;
};

export const useRules = create<RulesState>()(
  persist(
    (set) => ({
      ...DEFAULT_RULES,
      patch: (p) => set(clampRules(p)),
      reset: () => set({ ...DEFAULT_RULES }),
      useTest: () => set({ ...TEST_RULES }),
    }),
    {
      name: "nukida-rules",
      skipHydration: true,
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2 && persisted && typeof persisted === "object") {
          return { ...(persisted as RuleConfig), minRr: 1, requireHtf: false };
        }
        return persisted as RuleConfig;
      },
    },
  ),
);

export function currentRules(): RuleConfig {
  const s = useRules.getState();
  return {
    minRr: s.minRr,
    minQuality: s.minQuality,
    fundingFilter: s.fundingFilter,
    fundingWindowMin: s.fundingWindowMin,
    requireHtf: s.requireHtf,
    blockExhausted: s.blockExhausted,
    autoAllWatch: s.autoAllWatch,
    sensitivity: s.sensitivity,
  };
}
