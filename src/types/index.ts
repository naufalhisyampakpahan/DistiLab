export type Method = "mccabe" | "fug";
export type CalculationProfile = "research" | "general";
export interface BinaryInput {
  zF: number;
  xD: number;
  xB: number;
  q: number;
  alpha: number;
  R: number;
  F?: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface Line {
  slope: number;
  intercept: number;
}
export interface Balance {
  D: number;
  B: number;
  totalResidual: number;
  componentResidual: number;
}
export interface Convergence {
  converged: true;
  iterations: number;
  tolerance: number;
}
export interface Stage {
  number: number;
  start: Point;
  equilibrium: Point;
  end: Point;
  section: "rectifying" | "stripping";
  fraction: number;
}
export interface McCabeResult {
  method: "mccabe";
  input: BinaryInput;
  N: number;
  Nceil: number;
  Rmin: number;
  pinch: Point;
  intersection: Point;
  rectifying: Line;
  stripping: Line;
  qLine: Point[];
  equilibriumCurve: Point[];
  staircase: Point[];
  stages: Stage[];
  feedStage: number | null;
  balance?: Balance;
  convergence: Convergence;
  RminPinch?: number;
  Rflow?: number;
}
export interface FUGResult {
  method: "fug";
  input: BinaryInput;
  Nmin: number;
  Rmin: number;
  N: number;
  Nceil: number;
  theta: number;
  X: number;
  Y: number;
  balance?: Balance;
  convergence: Convergence;
  underwoodRawRmin?: number;
}
export type CalculationResult = McCabeResult | FUGResult;
export type SensitivityParameter = "R" | "zF" | "xD" | "alpha" | "q";
export type SensitivityPoint =
  | { value: number; valid: true; N: number; Rmin: number; Nmin?: number }
  | { value: number; valid: false; error: string };
export interface SensitivityRun {
  method: Method;
  input: BinaryInput;
  parameter: SensitivityParameter;
  min: number;
  max: number;
  count: number;
  points: SensitivityPoint[];
  createdAt: string;
}
export interface Study {
  id: string;
  name: string;
  createdAt: string;
  engineVersion: string;
  result: CalculationResult;
  profile?: CalculationProfile;
  projectId?: string;
  parentStudyId?: string;
  caseId?: string;
  protocolVersion?: string;
}
export const ENGINE_VERSION = "1.1.0";
export const DEMO_INPUT: BinaryInput = {
  zF: 0.5,
  xD: 0.95,
  xB: 0.05,
  q: 1,
  alpha: 2.5,
  R: 2.5,
};
export const ASSUMPTIONS = [
  "Distilasi biner kontinu; fraksi mol komponen ringan (light key).",
  "Volatilitas relatif konstan; heavy key memiliki volatilitas relatif 1.",
  "Constant molar overflow; 0 ≤ q ≤ 1.",
  "Total condenser tidak dihitung; reboiler kesetimbangan termasuk tahap.",
  "Tahap teoritis, tanpa efisiensi tray, hidraulika, atau neraca energi rigorous.",
];
