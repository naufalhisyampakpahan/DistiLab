import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import { AppProvider, inputFields, useApp } from "../src/state/AppContext";
import { calculateFUG, calculateMcCabe } from "../src/calculations";
import { loadDraft, loadStudies, saveDraft, saveStudy } from "../src/storage";
import { DEMO_INPUT, ENGINE_VERSION } from "../src/types";
import type { Study } from "../src/types";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function Wrapper({ children }: React.PropsWithChildren) {
  return <AppProvider>{children}</AppProvider>;
}
async function hydrate() {
  const hook = await renderHook(() => useApp(), { wrapper: Wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return hook;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
afterEach(async () => {
  await cleanup();
});

test("first launch hydrates to blank input and never silently loads demonstration data", async () => {
  const { result } = await hydrate();
  expect(result.current.method).toBe("mccabe");
  expect(result.current.fields).toEqual({
    zF: "",
    xD: "",
    xB: "",
    q: "",
    alpha: "",
    R: "",
    F: "",
  });
  expect(result.current.result).toBeNull();
  expect(result.current.studies).toEqual([]);
  expect(() => result.current.compute()).toThrow();
  expect(result.current.fields.zF).toBe("");
});

test("hydration restores the selected method and incomplete draft without inventing missing values", async () => {
  await saveDraft({ method: "fug", fields: { zF: "0,45", R: "3,5", F: "" } });
  const { result } = await hydrate();
  expect(result.current.method).toBe("fug");
  expect(result.current.fields.zF).toBe("0,45");
  expect(result.current.fields.R).toBe("3,5");
  expect(result.current.fields.alpha).toBe("");
  expect(result.current.result).toBeNull();
});

test("decimal comma reaches the real numerical engine and field edits invalidate prior results", async () => {
  const { result } = await hydrate();
  await act(async () => {
    result.current.setMethod("fug");
    result.current.demo();
  });
  await act(async () => {
    result.current.setField("zF", "0,50");
    result.current.setField("R", "2,50");
  });
  await act(async () => {
    result.current.compute();
  });
  expect(result.current.result?.input).toEqual(DEMO_INPUT);
  expect(result.current.result?.method).toBe("fug");
  if (result.current.result?.method !== "fug")
    throw new Error("FUG was not computed");
  expect(result.current.result.Nmin).toBeCloseTo(6.42698, 3);
  expect(result.current.result.Rmin).toBeCloseTo(1.1, 8);
  expect(result.current.result.N).toBeCloseTo(calculateFUG(DEMO_INPUT).N, 10);
  expect(Number.isFinite(Date.parse(result.current.computedAt))).toBe(true);
  await act(async () => {
    result.current.setField("R", "3,5");
  });
  expect(result.current.result).toBeNull();
  expect(result.current.fields.R).toBe("3,5");
  await waitFor(() =>
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@distilab/draft:v1",
      expect.stringContaining('"R":"3,5"'),
    ),
  );
  expect((await loadDraft())?.fields.R).toBe("3,5");
});

test("invalid input errors retain all user fields and never produce a calculation result", async () => {
  const { result } = await hydrate();
  await act(async () => {
    result.current.demo();
  });
  await act(async () => {
    result.current.setField("alpha", "bukan angka");
  });
  const snapshot = { ...result.current.fields };
  expect(() => result.current.compute()).toThrow(/angka/i);
  expect(result.current.fields).toEqual(snapshot);
  expect(result.current.result).toBeNull();
  await expect(result.current.save("Invalid")).rejects.toThrow(
    "Jalankan perhitungan",
  );
  expect(await loadStudies()).toEqual([]);
});

test("explicit demonstration computes McCabe stages from the actual engine", async () => {
  const { result } = await hydrate();
  await act(async () => {
    result.current.demo();
  });
  expect(result.current.fields).toEqual(inputFields(DEMO_INPUT));
  expect(result.current.result).toBeNull();
  await act(async () => {
    result.current.compute();
  });
  expect(result.current.result).toEqual(calculateMcCabe(DEMO_INPUT));
  if (result.current.result?.method !== "mccabe")
    throw new Error("McCabe was not computed");
  expect(result.current.result.stages.length).toBeGreaterThan(1);
  expect(result.current.result.staircase.length).toBeGreaterThan(
    result.current.result.stages.length,
  );
});

test("opening and duplicating history preserves every parameter, including optional feed flow", async () => {
  const record: Study = {
    id: "saved-fug",
    name: "Studi tersimpan",
    createdAt: "2026-10-14T00:00:00Z",
    engineVersion: ENGINE_VERSION,
    result: calculateFUG({ ...DEMO_INPUT, F: 100 }),
  };
  await saveStudy(record);
  const { result } = await hydrate();
  expect(result.current.studies).toHaveLength(1);
  await act(async () => {
    result.current.restore(record);
  });
  expect(result.current.method).toBe("fug");
  expect(result.current.fields).toEqual(inputFields(record.result.input));
  expect(result.current.result).toEqual(record.result);
  expect(result.current.computedAt).toBe(record.createdAt);
  await act(async () => {
    result.current.restore(record, true);
  });
  expect(result.current.fields).toEqual(inputFields(record.result.input));
  expect(result.current.fields.F).toBe("100");
  expect(result.current.result).toBeNull();
});

test("save and delete refresh the provider and persist across a new application session", async () => {
  const first = await hydrate();
  await act(async () => {
    first.result.current.demo();
  });
  await act(async () => {
    first.result.current.compute();
  });
  const computedAt = first.result.current.computedAt;
  await act(async () => {
    await first.result.current.save("  Studi demonstrasi  ");
  });
  expect(first.result.current.studies).toHaveLength(1);
  const saved = first.result.current.studies[0];
  if (!saved) throw new Error("Study was not saved");
  expect(saved.name).toBe("Studi demonstrasi");
  expect(saved.createdAt).toBe(computedAt);
  expect(saved.engineVersion).toBe(ENGINE_VERSION);
  expect(saved.result).toEqual(calculateMcCabe(DEMO_INPUT));
  await first.unmount();
  const second = await hydrate();
  expect(second.result.current.studies).toEqual([saved]);
  await act(async () => {
    await second.result.current.remove(saved.id);
  });
  expect(second.result.current.studies).toEqual([]);
  expect(await loadStudies()).toEqual([]);
  await second.unmount();
  const third = await hydrate();
  expect(third.result.current.studies).toEqual([]);
});
