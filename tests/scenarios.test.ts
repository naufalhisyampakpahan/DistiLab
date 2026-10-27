import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateFUG, calculateMcCabe } from "../src/calculations";
import {
  isStudy,
  loadDraft,
  loadStudies,
  saveDraft,
  saveStudy,
  STORAGE_KEYS,
} from "../src/storage";
import {
  projectKey,
  projectTitle,
  scenarioDifferences,
} from "../src/storage/scenarios";
import { DEMO_INPUT } from "../src/types";
import type { Study } from "../src/types";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function record(id: string, R = 2.5): Study {
  return {
    id,
    name: `Skenario ${id}`,
    createdAt: "2026-10-21T02:00:00.000Z",
    engineVersion: "1.0.0",
    result: calculateMcCabe({ ...DEMO_INPUT, F: 100, R }),
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test("v1 studies and drafts without project metadata remain unchanged and readable", async () => {
  const old = record("old");
  const raw = JSON.stringify({ version: 1, studies: [old] });
  await AsyncStorage.setItem(STORAGE_KEYS.studies, raw);
  await AsyncStorage.setItem(
    STORAGE_KEYS.draft,
    JSON.stringify({
      version: 1,
      draft: { method: "mccabe", fields: { q: "0", F: "" } },
    }),
  );
  expect(await loadStudies()).toEqual([old]);
  expect(await AsyncStorage.getItem(STORAGE_KEYS.studies)).toBe(raw);
  expect(await loadDraft()).toEqual({
    method: "mccabe",
    fields: { q: "0", F: "" },
  });
  expect(projectKey(old)).toBe("old");
});

test("research scenario links and draft metadata survive storage without sharing mutable inputs", async () => {
  const base = {
    ...record("base"),
    profile: "research" as const,
    projectId: "project-one",
    caseId: "C14",
    protocolVersion: "grid-27-v1",
  };
  const child = {
    ...record("child", 4),
    profile: "research" as const,
    projectId: "project-one",
    parentStudyId: "base",
  };
  await saveStudy(base);
  const saving = saveStudy(child);
  child.result.input.R = 9;
  child.projectId = "edited-after-save";
  await saving;
  const loaded = await loadStudies();
  expect(loaded.find((s) => s.id === "base")).toEqual(base);
  expect(loaded.find((s) => s.id === "child")).toMatchObject({
    projectId: "project-one",
    parentStudyId: "base",
    result: { input: { R: 4 } },
  });
  await saveDraft({
    method: "mccabe",
    fields: { q: "1", R: "4", F: "100" },
    profile: "research",
    projectId: "project-one",
    parentStudyId: "base",
    caseId: "C14",
  });
  expect(await loadDraft()).toMatchObject({
    profile: "research",
    projectId: "project-one",
    parentStudyId: "base",
    caseId: "C14",
  });
});

test.each([
  { profile: "unknown" },
  { projectId: "" },
  { parentStudyId: 12 },
  { caseId: null },
  { protocolVersion: "" },
  { parentStudyId: "base" },
])("invalid optional scenario metadata is rejected: %o", async (bad) => {
  const value = { ...record("base"), ...bad };
  expect(isStudy(value)).toBe(false);
  await expect(saveStudy(value as Study)).rejects.toMatchObject({
    code: "invalid",
  });
});

test("corrupt metadata is reported without overwriting legacy storage", async () => {
  const raw = JSON.stringify({
    version: 1,
    studies: [{ ...record("bad"), profile: "other" }],
  });
  await AsyncStorage.setItem(STORAGE_KEYS.studies, raw);
  await expect(loadStudies()).rejects.toMatchObject({ code: "corrupt" });
  await expect(saveStudy(record("new"))).rejects.toMatchObject({
    code: "corrupt",
  });
  expect(await AsyncStorage.getItem(STORAGE_KEYS.studies)).toBe(raw);
  await expect(
    saveDraft({ method: "mccabe", fields: {}, profile: "wrong" } as never),
  ).rejects.toMatchObject({ code: "invalid" });
});

test("research profile cannot mislabel a q=0 result or a result without F", () => {
  expect(
    isStudy({
      ...record("q0"),
      profile: "research",
      result: calculateMcCabe({ ...DEMO_INPUT, F: 100, q: 0, R: 5 }),
    }),
  ).toBe(false);
  expect(
    isStudy({
      ...record("no-flow"),
      profile: "research",
      result: calculateMcCabe(DEMO_INPUT),
    }),
  ).toBe(false);
  expect(
    isStudy({
      ...record("general"),
      profile: "general",
      result: calculateMcCabe({ ...DEMO_INPUT, q: 0, R: 5 }),
    }),
  ).toBe(true);
});

test("comparison returns B minus A without converting missing values to zero", () => {
  const a = record("a");
  const b = { ...record("b", 4), projectId: "a", parentStudyId: "a" };
  const comparison = scenarioDifferences(a, b);
  expect(comparison.inputs.find((row) => row.key === "R")?.delta).toBe(1.5);
  expect(comparison.outputs.find((row) => row.key === "N")?.delta).toBeCloseTo(
    b.result.N - a.result.N,
    12,
  );
  expect(comparison.outputs.find((row) => row.key === "D")?.delta).toBe(0);
  expect(comparison.outputs.find((row) => row.key === "Nmin")).toMatchObject({
    a: undefined,
    b: undefined,
    delta: undefined,
  });
  expect(comparison.warnings).toEqual([]);
  expect(projectKey(b)).toBe(projectKey(a));
  expect(projectTitle(b, [b, a])).toBe(a.name);
});

test("unavailable flow and mixed method/version/profile assumptions remain explicit", () => {
  const a: Study = {
    ...record("a"),
    profile: "research",
    protocolVersion: "v1",
  };
  const b: Study = {
    ...record("b"),
    engineVersion: "1.1.0",
    profile: "general",
    protocolVersion: "v2",
    result: calculateFUG({ ...DEMO_INPUT, q: 0, R: 5 }),
  };
  const comparison = scenarioDifferences(a, b);
  expect(comparison.outputs.find((row) => row.key === "D")).toMatchObject({
    a: 50.000000000000014,
    b: undefined,
    delta: undefined,
  });
  expect(comparison.warnings).toHaveLength(5);
});

test("deleting a project ancestor does not detach siblings or give each a different project label", () => {
  const a: Study = {
    ...record("a"),
    projectId: "deleted-base",
    parentStudyId: "deleted-base",
  };
  const b: Study = {
    ...record("b"),
    projectId: "deleted-base",
    parentStudyId: "a",
  };
  expect(projectKey(a)).toBe(projectKey(b));
  expect(projectTitle(a, [b, a])).toBe(projectTitle(b, [b, a]));
  expect(projectTitle(a, [a, b])).toBe(projectTitle(a, [b, a]));
});
