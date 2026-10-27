import { calculate, calculateFUG, calculateMcCabe } from "../calculations";
import type { BinaryInput, CalculationResult, Method } from "../types";
import { CalculationError, validateInput } from "../validation";

export type CalculationProfile = "research" | "general";
export const RESEARCH_PROFILE = {
  id: "research-v1",
  label: "Penelitian · cair jenuh",
  q: 1,
  maxStages: 60,
} as const;

export function validateResearchInput(input: BinaryInput): void {
  if (input.q !== 1)
    throw new CalculationError(
      "Profil penelitian memakai umpan cair jenuh q = 1. Gunakan profil umum untuk kondisi q lainnya.",
      "RESEARCH_Q",
    );
  if (input.F === undefined || !Number.isFinite(input.F) || input.F <= 0)
    throw new CalculationError(
      "Profil penelitian memerlukan laju umpan F yang hingga dan lebih besar dari 0 kmol/jam.",
      "RESEARCH_FLOW",
    );
  validateInput(input);
}

export function calculateWithProfile(
  method: Method,
  input: BinaryInput,
  profile: CalculationProfile = "research",
): CalculationResult {
  if (profile === "general") return calculate(method, input);
  validateResearchInput(input);
  return method === "mccabe"
    ? calculateMcCabe(input, { maxStages: RESEARCH_PROFILE.maxStages })
    : calculateFUG(input);
}
