import { ENGINE_VERSION } from "../types";
import type { FUGResult, McCabeResult } from "../types";
import { parseNumeric } from "../validation";
import { calculateWithProfile } from "./profile";
import {
  OUTPUT_KEYS,
  RESEARCH_CASES,
  RESEARCH_DATASET_VERSION,
  RESEARCH_REFERENCE_VERSION,
  REFERENCE_PROVENANCE,
  analyticRefluxMinimum,
  compareResearchOutput,
  independentResearchReference,
} from "./protocol";
import type {
  OutputComparison,
  ResearchCase,
  ResearchOutput,
} from "./protocol";

export type ResearchRecord =
  | {
      caseId: string;
      input: ResearchCase["input"];
      refluxFactor: number;
      status: "computed";
      output: ResearchOutput;
      comparisons: OutputComparison[];
      mt: McCabeResult;
      fug: FUGResult;
    }
  | {
      caseId: string;
      input: ResearchCase["input"];
      refluxFactor: number;
      status: "failed";
      errorCode: string;
      error: string;
    };
export interface BoundaryResult {
  caseId: string;
  label: string;
  expectedCode: string;
  actualCode: string;
  message: string;
  passed: boolean;
}
export interface ResearchRun {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  finishedAt: string;
  appVersion: string;
  engineVersion: string;
  datasetVersion: string;
  referenceVersion: string;
  referenceProvenance: string;
  execution: "application-engine";
  executionEnvironment: "android" | "ios" | "web" | "desktop-test";
  systemVersion: string;
  status: "completed" | "cancelled";
  records: ResearchRecord[];
  boundaries: BoundaryResult[];
}
export interface ResearchProgress {
  completed: number;
  total: number;
  activeCaseId: string;
  latest?: ResearchRecord;
}

const errorData = (error: unknown): { code: string; message: string } => ({
  code:
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "CALCULATION_ERROR",
  message: error instanceof Error ? error.message : "Perhitungan gagal.",
});

export function runResearchCase(entry: ResearchCase): ResearchRecord {
  try {
    const input = { ...entry.input };
    const mt = calculateWithProfile(
      "mccabe",
      input,
      "research",
    ) as McCabeResult;
    const fug = calculateWithProfile("fug", input, "research") as FUGResult;
    if (!mt.balance) throw new Error("Neraca massa penelitian tidak tersedia.");
    const output: ResearchOutput = {
      D: mt.balance.D,
      B: mt.balance.B,
      Rmin: fug.Rmin,
      Nmin: fug.Nmin,
      N_MT: mt.Nceil,
      N_FUG: fug.N,
    };
    const reference = independentResearchReference(entry);
    return {
      caseId: entry.caseId,
      input,
      refluxFactor: entry.refluxFactor,
      status: "computed",
      output,
      mt,
      fug,
      comparisons: compareResearchOutput(output, reference.output),
    };
  } catch (error) {
    const detail = errorData(error);
    return {
      caseId: entry.caseId,
      input: { ...entry.input },
      refluxFactor: entry.refluxFactor,
      status: "failed",
      errorCode: detail.code,
      error: detail.message,
    };
  }
}

export function runResearchBoundaries(): BoundaryResult[] {
  const base = {
    F: 100,
    zF: 0.5,
    xD: 0.95,
    xB: 0.05,
    q: 1,
    alpha: 2.5,
    R: 2.5,
  };
  const rmin = analyticRefluxMinimum(base.zF, base.xD, base.alpha);
  const definitions = [
    {
      caseId: "T01",
      label: "Angka tidak terbaca",
      expectedCode: "INVALID_INPUT",
      run: () => parseNumeric("bukan angka", "R"),
    },
    {
      caseId: "T02",
      label: "Angka tidak hingga",
      expectedCode: "INVALID_INPUT",
      run: () => calculateWithProfile("mccabe", { ...base, R: Infinity }),
    },
    {
      caseId: "T03",
      label: "F = 0",
      expectedCode: "RESEARCH_FLOW",
      run: () => calculateWithProfile("mccabe", { ...base, F: 0 }),
    },
    {
      caseId: "T04",
      label: "α = 1",
      expectedCode: "INVALID_INPUT",
      run: () => calculateWithProfile("mccabe", { ...base, alpha: 1 }),
    },
    {
      caseId: "T05",
      label: "Urutan komposisi salah",
      expectedCode: "INVALID_INPUT",
      run: () => calculateWithProfile("mccabe", { ...base, zF: 0.96 }),
    },
    {
      caseId: "T06",
      label: "R = Rmin",
      expectedCode: "REFLUX_LIMIT",
      run: () => calculateWithProfile("mccabe", { ...base, R: rmin }),
    },
    {
      caseId: "T07",
      label: "R < Rmin",
      expectedCode: "REFLUX_LIMIT",
      run: () => calculateWithProfile("mccabe", { ...base, R: 0.8 }),
    },
    {
      caseId: "T08",
      label: "q di luar profil penelitian",
      expectedCode: "RESEARCH_Q",
      run: () => calculateWithProfile("mccabe", { ...base, q: 0.5 }),
    },
    {
      caseId: "T09",
      label: "Target belum tercapai dalam 60 tahap",
      expectedCode: "MCCABE_NONCONVERGENCE",
      run: () =>
        calculateWithProfile("mccabe", { ...base, alpha: 1.05, R: 50 }),
    },
  ];
  return definitions.map(({ caseId, label, expectedCode, run }) => {
    try {
      run();
      return {
        caseId,
        label,
        expectedCode,
        actualCode: "NOT_REJECTED",
        message: "Kondisi batas tidak ditolak.",
        passed: false,
      };
    } catch (error) {
      const detail = errorData(error);
      return {
        caseId,
        label,
        expectedCode,
        actualCode: detail.code,
        message: detail.message,
        passed: detail.code === expectedCode,
      };
    }
  });
}

export async function runResearchVerification(
  options: {
    appVersion?: string;
    executionEnvironment?: ResearchRun["executionEnvironment"];
    systemVersion?: string;
    onProgress?: (progress: ResearchProgress) => void;
    isCancelled?: () => boolean;
    yieldControl?: () => Promise<void>;
  } = {},
): Promise<ResearchRun> {
  const createdAt = new Date().toISOString();
  const records: ResearchRecord[] = [];
  const yieldControl =
    options.yieldControl ??
    (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  let cancelled = false;
  for (const entry of RESEARCH_CASES) {
    if (options.isCancelled?.()) {
      cancelled = true;
      break;
    }
    options.onProgress?.({
      completed: records.length,
      total: RESEARCH_CASES.length,
      activeCaseId: entry.caseId,
    });
    await yieldControl();
    if (options.isCancelled?.()) {
      cancelled = true;
      break;
    }
    const record = runResearchCase(entry);
    records.push(record);
    options.onProgress?.({
      completed: records.length,
      total: RESEARCH_CASES.length,
      activeCaseId: entry.caseId,
      latest: record,
    });
    await yieldControl();
  }
  return {
    schemaVersion: 1,
    id: `research-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt,
    finishedAt: new Date().toISOString(),
    appVersion: options.appVersion ?? ENGINE_VERSION,
    engineVersion: ENGINE_VERSION,
    datasetVersion: RESEARCH_DATASET_VERSION,
    referenceVersion: RESEARCH_REFERENCE_VERSION,
    referenceProvenance: REFERENCE_PROVENANCE,
    execution: "application-engine",
    executionEnvironment: options.executionEnvironment ?? "desktop-test",
    systemVersion: options.systemVersion ?? "tidak dicatat",
    status: cancelled ? "cancelled" : "completed",
    records,
    boundaries: cancelled ? [] : runResearchBoundaries(),
  };
}

export function researchSummary(run: ResearchRun) {
  const computed = run.records.filter((r) => r.status === "computed");
  const comparisons = computed.flatMap((r) => r.comparisons);
  return {
    computed: computed.length,
    failed: run.records.length - computed.length,
    compared: comparisons.length,
    passed: comparisons.filter((r) => r.passed).length,
    maxAbsoluteError: Math.max(0, ...comparisons.map((r) => r.absoluteError)),
    boundaryPassed: run.boundaries.filter((r) => r.passed).length,
  };
}

export function canExportResearchRun(run: ResearchRun): boolean {
  return (
    run.status === "completed" &&
    run.records.length === 27 &&
    run.records.every(
      (record, index) =>
        record.status === "computed" &&
        record.caseId === RESEARCH_CASES[index]?.caseId &&
        OUTPUT_KEYS.every(
          (key) =>
            Number.isFinite(record.output[key]) && record.output[key] > 0,
        ) &&
        Number.isInteger(record.output.N_MT),
    )
  );
}
