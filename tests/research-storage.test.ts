import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadResearchRuns,
  RESEARCH_STORAGE_KEY,
  saveResearchRun,
  validateResearchRun,
} from "../src/research/storage";
import { runResearchVerification } from "../src/research/runner";
import type { ResearchRun } from "../src/research/runner";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
let complete: ResearchRun;
beforeAll(async () => {
  complete = await runResearchVerification({
    yieldControl: () => Promise.resolve(),
  });
});
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test("research runs survive storage and only the newest three are retained", async () => {
  await Promise.all(
    [1, 2, 3, 4].map((i) =>
      saveResearchRun({
        ...complete,
        id: `run-${i}`,
        finishedAt: `2026-10-21T10:00:0${i}.000Z`,
      }),
    ),
  );
  const saved = await loadResearchRuns();
  expect(saved.map((r) => r.id)).toEqual(["run-4", "run-3", "run-2"]);
  expect(saved[0]?.records).toHaveLength(27);
  expect(saved[0]?.records[13]).toMatchObject({
    caseId: "C14",
    output: { N_MT: 12 },
  });
});

test.each([
  "{broken",
  JSON.stringify({ version: 9, runs: [] }),
  JSON.stringify({ version: 1, runs: [{ id: "bad" }] }),
])("corrupt run storage is reported and preserved", async (raw) => {
  await AsyncStorage.setItem(RESEARCH_STORAGE_KEY, raw);
  await expect(loadResearchRuns()).rejects.toThrow("tidak valid");
  await expect(saveResearchRun(complete)).rejects.toThrow("tidak valid");
  expect(await AsyncStorage.getItem(RESEARCH_STORAGE_KEY)).toBe(raw);
});

test("changed IDs, input snapshots, outputs, comparisons and nonfinite values cannot be saved", async () => {
  for (const mutate of [
    (r: ResearchRun) => {
      r.records[0]!.caseId = "C99";
    },
    (r: ResearchRun) => {
      r.records[0]!.input.R = 999;
    },
    (r: ResearchRun) => {
      const first = r.records[0]!;
      if (first.status === "computed") first.output.N_MT = 999;
    },
    (r: ResearchRun) => {
      const first = r.records[0]!;
      if (first.status === "computed") first.comparisons[0]!.passed = false;
    },
    (r: ResearchRun) => {
      const first = r.records[0]!;
      if (first.status === "computed") first.output.N_FUG = NaN;
    },
  ]) {
    const altered = JSON.parse(JSON.stringify(complete)) as ResearchRun;
    mutate(altered);
    await expect(saveResearchRun(altered)).rejects.toThrow();
  }
  expect(await loadResearchRuns()).toEqual([]);
});

test("run validation does not confuse duplicated IDs with additional completed cases", () => {
  const altered = JSON.parse(JSON.stringify(complete)) as ResearchRun;
  altered.records[1] = altered.records[0]!;
  expect(() => validateResearchRun(altered)).toThrow("tidak valid");
});
