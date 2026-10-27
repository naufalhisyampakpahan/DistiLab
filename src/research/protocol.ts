import type { BinaryInput } from "../types";

export const RESEARCH_DATASET_VERSION = "chat-protocol-20261021-v1";
export const RESEARCH_REFERENCE_VERSION = "independent-q1-algebra-v1";
export const REFERENCE_PROVENANCE =
  "Acuan kode independen: aljabar q=1 dan penahapan terpisah. Parameter berasal dari chat Rancang Aplikasi Distilasi; urutan ID belum dicocokkan dengan workbook 27 kasus asli.";
export const RESEARCH_HEADERS = [
  "case_id",
  "D",
  "B",
  "Rmin",
  "Nmin",
  "N_MT",
  "N_FUG",
] as const;
export const OUTPUT_KEYS = ["D", "B", "Rmin", "Nmin", "N_MT", "N_FUG"] as const;
export type OutputKey = (typeof OUTPUT_KEYS)[number];
export type ResearchOutput = Record<OutputKey, number>;
export interface ResearchCase {
  caseId: string;
  input: BinaryInput & { F: number };
  refluxFactor: number;
}

// This input definition is independent from the application solver. For q=1,
// the feed pinch lies at x=zF and Rmin follows directly from the VLE geometry.
export function analyticRefluxMinimum(
  zF: number,
  xD: number,
  alpha: number,
): number {
  const yFeed = (alpha * zF) / (1 + (alpha - 1) * zF);
  return (xD - yFeed) / (yFeed - zF);
}

export const RESEARCH_CASES: readonly ResearchCase[] = Object.freeze(
  [2, 2.5, 3]
    .flatMap((alpha) =>
      [0.3, 0.5, 0.7].flatMap((zF) =>
        [1.2, 1.5, 2].map((refluxFactor) => ({ alpha, zF, refluxFactor })),
      ),
    )
    .map(({ alpha, zF, refluxFactor }, index) =>
      Object.freeze({
        caseId: `C${String(index + 1).padStart(2, "0")}`,
        refluxFactor,
        input: Object.freeze({
          F: 100,
          zF,
          xD: 0.95,
          xB: 0.05,
          q: 1,
          alpha,
          R: refluxFactor * analyticRefluxMinimum(zF, 0.95, alpha),
        }),
      }),
    ),
);

export interface ResearchReference {
  output: ResearchOutput;
  theta: number;
  feedStage: number | null;
  fractionalMT: number;
  firstSteps: Array<{ number: number; x: number; y: number }>;
}

/** Independent reference: closed-form Underwood root and direct tray counting.
 * Deliberately does not import the application's calculation implementation.
 */
export function independentResearchReference(
  entry: ResearchCase,
): ResearchReference {
  const p = entry.input;
  const D = (p.F * (p.zF - p.xB)) / (p.xD - p.xB);
  const B = p.F - D;
  const theta = p.alpha / (1 + p.zF * (p.alpha - 1));
  const Rmin =
    (p.alpha * p.xD) / (p.alpha - theta) + (1 - p.xD) / (1 - theta) - 1;
  const Nmin =
    Math.log((p.xD / (1 - p.xD)) * ((1 - p.xB) / p.xB)) / Math.log(p.alpha);
  const X = (p.R - Rmin) / (p.R + 1);
  const Y =
    1 -
    Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X)));
  const N_FUG = (Nmin + Y) / (1 - Y);
  const rectM = p.R / (p.R + 1);
  const rectB = p.xD / (p.R + 1);
  const feedY = rectM * p.zF + rectB;
  const stripM = (feedY - p.xB) / (p.zF - p.xB);
  const stripB = p.xB * (1 - stripM);
  let y = p.xD;
  let previousX = p.xD;
  let feedStage: number | null = null;
  const firstSteps: ResearchReference["firstSteps"] = [];
  for (let number = 1; number <= 60; number++) {
    const x = y / (p.alpha - (p.alpha - 1) * y);
    if (firstSteps.length < 2) firstSteps.push({ number, x, y });
    if (x < p.zF && feedStage === null) feedStage = number;
    if (x <= p.xB) {
      return {
        output: { D, B, Rmin, Nmin, N_MT: number, N_FUG },
        theta,
        feedStage,
        fractionalMT: number - 1 + (previousX - p.xB) / (previousX - x),
        firstSteps,
      };
    }
    y = x >= p.zF ? rectM * x + rectB : stripM * x + stripB;
    previousX = x;
  }
  throw new Error(`Acuan ${entry.caseId} belum mencapai xB dalam 60 langkah.`);
}

export interface OutputComparison {
  metric: OutputKey;
  actual: number;
  reference: number;
  absoluteError: number;
  relativeError: number;
  tolerance: number;
  passed: boolean;
}

export function compareResearchOutput(
  actual: ResearchOutput,
  reference: ResearchOutput,
): OutputComparison[] {
  return OUTPUT_KEYS.map((metric) => {
    const absoluteError = Math.abs(actual[metric] - reference[metric]);
    const tolerance =
      metric === "N_MT" ? 0 : 1e-8 + 1e-6 * Math.abs(reference[metric]);
    return {
      metric,
      actual: actual[metric],
      reference: reference[metric],
      absoluteError,
      relativeError:
        reference[metric] === 0
          ? absoluteError
          : absoluteError / Math.abs(reference[metric]),
      tolerance,
      passed: Number.isFinite(actual[metric]) && absoluteError <= tolerance,
    };
  });
}
