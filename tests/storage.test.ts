import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteStudy,
  loadDraft,
  loadStudies,
  saveDraft,
  saveStudy,
  STORAGE_KEYS,
  StorageError,
} from "../src/storage";
import type { FUGResult, Study } from "../src/types";
import { DEMO_INPUT } from "../src/types";
import { calculateFUG, calculateMcCabe } from "../src/calculations";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const result: FUGResult = {
  method: "fug",
  input: { zF: 0.5, xD: 0.95, xB: 0.05, q: 1, alpha: 2.5, R: 2.5 },
  Nmin: 6.43,
  Rmin: 1.1,
  N: 10.2,
  Nceil: 11,
  theta: 1.5,
  X: 0.4,
  Y: 0.33,
  convergence: { converged: true, iterations: 40, tolerance: 1e-10 },
};
function study(id: string, createdAt = "2026-10-14T10:00:00.000Z"): Study {
  return { id, name: `Studi ${id}`, createdAt, engineVersion: "1.0.0", result };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test("concurrent saves and deletion are serialized without losing later studies", async () => {
  await Promise.all([
    saveStudy(study("a")),
    saveStudy(study("b", "2026-10-15T10:00:00.000Z")),
    deleteStudy("a"),
    saveStudy(study("c")),
  ]);
  expect((await loadStudies()).map((item) => item.id)).toEqual(["b", "c"]);
});

test("replacing an id updates one record and snapshots fields before waiting", async () => {
  const first = study("a");
  const pending = saveStudy(first);
  first.name = "Edited after submission";
  await pending;
  expect((await loadStudies())[0]?.name).toBe("Studi a");
  await saveStudy({ ...study("a"), name: "Updated" });
  expect(await loadStudies()).toHaveLength(1);
  expect((await loadStudies())[0]?.name).toBe("Updated");
});

test.each([
  "{invalid-json",
  JSON.stringify({ version: 1, studies: [study("a"), { id: "bad" }] }),
  JSON.stringify({ version: 9, studies: [] }),
])("corrupt history is reported and is never overwritten: %s", async (raw) => {
  await AsyncStorage.setItem(STORAGE_KEYS.studies, raw);
  await expect(loadStudies()).rejects.toMatchObject({ code: "corrupt" });
  await expect(saveStudy(study("b"))).rejects.toBeInstanceOf(StorageError);
  await expect(deleteStudy("a")).rejects.toMatchObject({ code: "corrupt" });
  expect(await AsyncStorage.getItem(STORAGE_KEYS.studies)).toBe(raw);
});

test("nonfinite or structurally invalid results cannot be stored", async () => {
  await expect(
    saveStudy({ ...study("a"), result: { ...result, N: Infinity } }),
  ).rejects.toMatchObject({ code: "invalid" });
  expect(await loadStudies()).toEqual([]);
});

test("actual numerical results for both methods survive round-trip storage", async () => {
  for (const calculated of [
    calculateMcCabe(DEMO_INPUT),
    calculateFUG(DEMO_INPUT),
    calculateMcCabe({ ...DEMO_INPUT, q: 0, R: 5 }),
  ]) {
    const record = {
      ...study(`actual-${calculated.method}-${calculated.input.q}`),
      result: calculated,
    };
    await saveStudy(record);
    expect(
      (await loadStudies()).find((item) => item.id === record.id)?.result,
    ).toEqual(JSON.parse(JSON.stringify(calculated)));
  }
});

test("storage failure produces an actionable error and does not poison subsequent writes", async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("full"));
  await expect(saveStudy(study("a"))).rejects.toMatchObject({
    code: "unavailable",
  });
  await saveStudy(study("b"));
  expect((await loadStudies()).map((item) => item.id)).toEqual(["b"]);
});

test("draft preserves incomplete strings and commits the latest queued input", async () => {
  expect(await loadDraft()).toBeNull();
  await Promise.all([
    saveDraft({ method: "mccabe", fields: { zF: "", R: "2,5" } }),
    saveDraft({ method: "fug", fields: { zF: "0.5", R: "3" } }),
  ]);
  expect(await loadDraft()).toEqual({
    method: "fug",
    fields: { zF: "0.5", R: "3" },
  });
});

test("corrupt draft remains available for recovery instead of being silently reset", async () => {
  const raw = JSON.stringify({
    version: 1,
    draft: { method: "unknown", fields: {} },
  });
  await AsyncStorage.setItem(STORAGE_KEYS.draft, raw);
  await expect(loadDraft()).rejects.toMatchObject({ code: "corrupt" });
  await expect(
    saveDraft({ method: "mccabe", fields: {} }),
  ).rejects.toMatchObject({ code: "corrupt" });
  expect(await AsyncStorage.getItem(STORAGE_KEYS.draft)).toBe(raw);
});
