import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import { AppProvider, inputFields, useApp } from "../src/state/AppContext";
import { calculateMcCabe } from "../src/calculations";
import { loadDraft, loadStudies, saveDraft, saveStudy } from "../src/storage";
import { DEMO_INPUT, ENGINE_VERSION } from "../src/types";
import type { Study } from "../src/types";
import { inspectFields } from "../src/utils/draft";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
const Wrapper = ({ children }: React.PropsWithChildren) => (
  <AppProvider>{children}</AppProvider>
);
async function hydrate() {
  const hook = renderHook(() => useApp(), { wrapper: Wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return hook;
}
beforeEach(async () => {
  await AsyncStorage.clear();
});
afterEach(async () => {
  await cleanup();
});

test("legacy drafts remain general and retain q rather than being converted into research input", async () => {
  await saveDraft({
    method: "mccabe",
    fields: inputFields({ ...DEMO_INPUT, q: 0.5 }),
  });
  const { result } = await hydrate();
  expect(result.current.profile).toBe("general");
  expect(result.current.fields.q).toBe("0.5");
  await act(async () => {
    result.current.newCase("research");
  });
  expect(result.current.fields).toMatchObject({
    q: "1",
    F: "100",
    zF: "",
    alpha: "",
  });
  expect(() => result.current.compute()).toThrow(/belum diisi/);
});

test("atomic case loading, calculation and editing keep results aligned and persist provenance", async () => {
  const { result } = await hydrate();
  const input = { ...DEMO_INPUT, R: 1.65, F: 100 };
  await act(async () => {
    result.current.loadInput(input, "mccabe", {
      profile: "research",
      projectId: "p1",
      parentStudyId: "base",
      caseId: "C14",
      protocolVersion: "chat-protocol-20261021-v1",
    });
  });
  await act(async () => {
    result.current.compute();
  });
  expect(result.current.result?.Nceil).toBe(12);
  expect(result.current.result?.input).toEqual(input);
  await act(async () => {
    await result.current.save("C14 audit");
  });
  const saved = (await loadStudies())[0]!;
  expect(saved).toMatchObject({
    profile: "research",
    projectId: "p1",
    parentStudyId: "base",
    caseId: "C14",
  });
  await act(async () => {
    result.current.setField("R", "2,5");
  });
  expect(result.current.result).toBeNull();
  expect(result.current.computedAt).toBe("");
  expect(result.current.caseId).toBeUndefined();
  expect(result.current.projectId).toBe("p1");
  expect((await loadStudies())[0]!.result.input.R).toBe(1.65);
  await waitFor(() =>
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@distilab/draft:v1",
      expect.stringContaining('"R":"2,5"'),
    ),
  );
  expect((await loadDraft())?.profile).toBe("research");
});

test("adopting results and duplicating a study never changes the original scenario", async () => {
  const { result } = await hydrate();
  const computed = calculateMcCabe({ ...DEMO_INPUT, F: 100 });
  await act(async () => {
    result.current.adoptResult(computed, { profile: "research" });
    await Promise.resolve();
  });
  await act(async () => {
    await result.current.save("Original");
  });
  const original = (await loadStudies())[0]!;
  await act(async () => {
    result.current.restore(original, true);
  });
  expect(result.current.result).toBeNull();
  expect(result.current.parentStudyId).toBe(original.id);
  expect(result.current.projectId).toBe(original.id);
  await act(async () => {
    result.current.setField("R", "3");
  });
  await act(async () => {
    result.current.compute();
  });
  await act(async () => {
    await result.current.save("Refluks tinggi");
  });
  const studies = await loadStudies();
  expect(studies).toHaveLength(2);
  expect(studies.find((s) => s.id === original.id)).toEqual(original);
  expect(studies.find((s) => s.id !== original.id)?.result.input.R).toBe(3);
});

test("research profile cannot be bypassed by programmatic input changes", async () => {
  const { result } = await hydrate();
  await act(async () => {
    result.current.loadInput({ ...DEMO_INPUT, q: 0.5, F: 100 }, "mccabe", {
      profile: "research",
    });
  });
  expect(() => result.current.compute()).toThrow(/q = 1/);
  expect(result.current.result).toBeNull();
  const fields = inputFields({ ...DEMO_INPUT, F: 100, R: 0.8 });
  expect(inspectFields(fields, "research").R).toMatch(/Rmin/);
  expect(
    inspectFields({ ...fields, R: "2,50", zF: "0,50" }, "research"),
  ).toEqual({});
});

test("saving a restored legacy calculation retains its source engine version", async () => {
  const original: Study = {
    id: "legacy",
    name: "Asli",
    createdAt: "2026-10-14T00:00:00Z",
    engineVersion: "1.0.0",
    result: calculateMcCabe(DEMO_INPUT),
  };
  await saveStudy(original);
  const { result } = await hydrate();
  await act(async () => {
    result.current.restore(original);
  });
  expect(result.current.resultEngineVersion).toBe("1.0.0");
  await act(async () => {
    await result.current.save("Salinan hasil lama");
  });
  expect(
    (await loadStudies()).find((s) => s.id !== "legacy")?.engineVersion,
  ).toBe("1.0.0");
});

test("saving then directly editing retains a project without requiring history duplication", async () => {
  const { result } = await hydrate();
  await act(async () => {
    result.current.loadInput({ ...DEMO_INPUT, F: 100 }, "mccabe", {
      profile: "research",
    });
  });
  await act(async () => {
    result.current.compute();
  });
  await act(async () => {
    await result.current.save("Dasar");
  });
  const first = (await loadStudies())[0]!;
  expect(result.current.projectId).toBe(first.id);
  expect(result.current.parentStudyId).toBe(first.id);
  await act(async () => {
    result.current.setField("R", "3");
  });
  await act(async () => {
    result.current.compute();
  });
  await act(async () => {
    await result.current.save("Naikkan R");
  });
  const second = (await loadStudies()).find((s) => s.id !== first.id)!;
  expect(second.projectId).toBe(first.id);
  expect(second.parentStudyId).toBe(first.id);
});

test("protocol version survives draft hydration", async () => {
  await saveDraft({
    method: "mccabe",
    fields: inputFields({ ...DEMO_INPUT, F: 100 }),
    profile: "research",
    caseId: "C14",
    protocolVersion: "chat-protocol-20261021-v1",
  });
  const { result } = await hydrate();
  await act(async () => {
    result.current.compute();
  });
  await act(async () => {
    await result.current.save("Audit pulih");
  });
  expect((await loadStudies())[0]?.protocolVersion).toBe(
    "chat-protocol-20261021-v1",
  );
});
