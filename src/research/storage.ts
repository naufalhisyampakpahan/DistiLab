import AsyncStorage from "@react-native-async-storage/async-storage";
import { isStudy } from "../storage";
import {
  OUTPUT_KEYS,
  RESEARCH_CASES,
  RESEARCH_DATASET_VERSION,
  RESEARCH_REFERENCE_VERSION,
  compareResearchOutput,
  independentResearchReference,
} from "./protocol";
import type { ResearchRun } from "./runner";

export const RESEARCH_STORAGE_KEY = "distilab:research-runs:v1";
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const iso = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const fail = (): never => {
  throw new Error(
    "Data paket verifikasi tidak valid atau memakai versi protokol yang tidak didukung. Data tersimpan tidak ditimpa.",
  );
};

export function validateResearchRun(value: unknown): ResearchRun {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    typeof value.id !== "string" ||
    !value.id ||
    !iso(value.createdAt) ||
    !iso(value.finishedAt) ||
    typeof value.appVersion !== "string" ||
    typeof value.engineVersion !== "string" ||
    value.datasetVersion !== RESEARCH_DATASET_VERSION ||
    value.referenceVersion !== RESEARCH_REFERENCE_VERSION ||
    typeof value.referenceProvenance !== "string" ||
    value.execution !== "application-engine" ||
    !["android", "ios", "web", "desktop-test"].includes(
      String(value.executionEnvironment),
    ) ||
    typeof value.systemVersion !== "string" ||
    !["completed", "cancelled"].includes(String(value.status)) ||
    !Array.isArray(value.records) ||
    value.records.length > 27 ||
    !Array.isArray(value.boundaries)
  )
    fail();
  const run = value as unknown as ResearchRun;
  if (
    run.status === "completed" &&
    (run.records.length !== 27 || run.boundaries.length !== 9)
  )
    fail();
  if (run.status === "cancelled" && run.boundaries.length !== 0) fail();
  for (const [index, record] of run.records.entries()) {
    const entry = RESEARCH_CASES[index]!;
    if (
      !object(record) ||
      !entry ||
      record.caseId !== entry.caseId ||
      !object(record.input) ||
      record.refluxFactor !== entry.refluxFactor
    )
      fail();
    for (const key of ["F", "zF", "xD", "xB", "q", "alpha", "R"] as const)
      if (record.input[key] !== entry.input[key]) fail();
    if (record.status === "failed") {
      if (
        typeof record.errorCode !== "string" ||
        typeof record.error !== "string"
      )
        fail();
      continue;
    }
    if (
      record.status !== "computed" ||
      !object(record.output) ||
      !Array.isArray(record.comparisons)
    )
      fail();
    for (const key of OUTPUT_KEYS)
      if (!Number.isFinite(record.output[key]) || record.output[key] <= 0)
        fail();
    const study = {
      id: record.caseId,
      name: record.caseId,
      createdAt: run.createdAt,
      engineVersion: run.engineVersion,
    };
    if (
      !isStudy({ ...study, result: record.mt }) ||
      !isStudy({ ...study, result: record.fug })
    )
      fail();
    for (const key of ["F", "zF", "xD", "xB", "q", "alpha", "R"] as const)
      if (
        record.mt.input[key] !== record.input[key] ||
        record.fug.input[key] !== record.input[key]
      )
        fail();
    if (
      record.mt.method !== "mccabe" ||
      record.fug.method !== "fug" ||
      record.output.D !== record.mt.balance?.D ||
      record.output.B !== record.mt.balance?.B ||
      record.output.N_MT !== record.mt.Nceil ||
      record.output.N_FUG !== record.fug.N ||
      record.output.Rmin !== record.fug.Rmin ||
      record.output.Nmin !== record.fug.Nmin
    )
      fail();
    const expected = compareResearchOutput(
      record.output,
      independentResearchReference(entry).output,
    );
    if (JSON.stringify(record.comparisons) !== JSON.stringify(expected)) fail();
  }
  run.boundaries.forEach((boundary, index) => {
    if (
      !object(boundary) ||
      boundary.caseId !== `T${String(index + 1).padStart(2, "0")}` ||
      typeof boundary.label !== "string" ||
      typeof boundary.message !== "string" ||
      typeof boundary.expectedCode !== "string" ||
      typeof boundary.actualCode !== "string" ||
      boundary.passed !== (boundary.expectedCode === boundary.actualCode)
    )
      fail();
  });
  return run;
}

let writes: Promise<unknown> = Promise.resolve();
async function readRuns(): Promise<ResearchRun[]> {
  const raw = await AsyncStorage.getItem(RESEARCH_STORAGE_KEY);
  if (raw === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return fail();
  }
  if (
    !object(data) ||
    data.version !== 1 ||
    !Array.isArray(data.runs) ||
    data.runs.length > 3
  )
    return fail();
  const runs = data.runs.map(validateResearchRun);
  if (new Set(runs.map((run) => run.id)).size !== runs.length) return fail();
  return runs;
}

export async function loadResearchRuns(): Promise<ResearchRun[]> {
  await writes.catch(() => undefined);
  return readRuns();
}

export function saveResearchRun(run: ResearchRun): Promise<void> {
  // Snapshot before joining the queue so subsequent UI edits cannot alter it.
  let snapshot: ResearchRun;
  try {
    snapshot = validateResearchRun(JSON.parse(JSON.stringify(run)) as unknown);
  } catch (error) {
    return Promise.reject(error);
  }
  const action = writes
    .catch(() => undefined)
    .then(async () => {
      const existing = await readRuns();
      const next = [
        snapshot,
        ...existing.filter((item) => item.id !== snapshot.id),
      ]
        .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
        .slice(0, 3);
      await AsyncStorage.setItem(
        RESEARCH_STORAGE_KEY,
        JSON.stringify({ version: 1, runs: next }),
      );
    });
  writes = action;
  return action;
}
