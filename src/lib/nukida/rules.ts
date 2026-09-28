export type RuleConfig = {
  minRr: number;
  minQuality: number;
  fundingFilter: boolean;
  fundingWindowMin: number;
  requireHtf: boolean;
  blockExhausted: boolean;
  autoAllWatch: boolean;
  /** 1 = đúng rule gốc, 1.6 = vừa, 2.4 = rộng vùng vào */
  sensitivity: number;
};

export const DEFAULT_RULES: RuleConfig = {
  minRr: 1,
  minQuality: 70,
  fundingFilter: true,
  fundingWindowMin: 15,
  requireHtf: false,
  blockExhausted: true,
  autoAllWatch: false,
  sensitivity: 1,
};

export const TEST_RULES: RuleConfig = {
  minRr: 1,
  minQuality: 45,
  fundingFilter: false,
  fundingWindowMin: 15,
  requireHtf: false,
  blockExhausted: false,
  autoAllWatch: true,
  sensitivity: 2.4,
};

export function clampRules(p: Partial<RuleConfig>): Partial<RuleConfig> {
  const out: Partial<RuleConfig> = { ...p };
  if (out.minRr != null) out.minRr = clamp(out.minRr, 0.8, 3);
  if (out.minQuality != null) out.minQuality = Math.round(clamp(out.minQuality, 40, 90));
  if (out.fundingWindowMin != null) out.fundingWindowMin = Math.round(clamp(out.fundingWindowMin, 0, 60));
  if (out.sensitivity != null) {
    out.sensitivity = out.sensitivity >= 2 ? 2.4 : out.sensitivity >= 1.3 ? 1.6 : 1;
  }
  return out;
}

function clamp(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
