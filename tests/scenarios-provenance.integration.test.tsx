import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import { AppProvider, useApp } from "../src/state/AppContext";
import { loadStudies, STORAGE_KEYS } from "../src/storage";
import { DEMO_INPUT } from "../src/types";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
function Wrapper({ children }: React.PropsWithChildren) {
  return <AppProvider>{children}</AppProvider>;
}
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
afterEach(async () => {
  await cleanup();
});

test("a pending save does not reparent a different case loaded before storage completes", async () => {
  const hook = renderHook(() => useApp(), { wrapper: Wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  await act(async () => {
    hook.result.current.loadInput({ ...DEMO_INPUT, F: 100 }, "mccabe", {
      profile: "research",
    });
  });
  await act(async () => {
    hook.result.current.compute();
  });
  const setter = jest.mocked(AsyncStorage.setItem);
  const original = setter.getMockImplementation()!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let blocked = false;
  setter.mockImplementation((key, value, callback) => {
    if (key === STORAGE_KEYS.studies) {
      blocked = true;
      return gate.then(() => original(key, value, callback));
    }
    return original(key, value, callback);
  });
  let pending!: Promise<void>;
  try {
    await act(async () => {
      pending = hook.result.current.save("First snapshot");
    });
    await waitFor(() => expect(blocked).toBe(true));
    await act(async () => {
      hook.result.current.loadInput({ ...DEMO_INPUT, F: 100, R: 6 }, "mccabe", {
        profile: "research",
        projectId: "different-project",
        parentStudyId: "different-parent",
      });
    });
    await act(async () => {
      release();
      await pending;
    });
    expect(hook.result.current.fields.R).toBe("6");
    expect(hook.result.current.result).toBeNull();
    expect(hook.result.current.projectId).toBe("different-project");
    expect(hook.result.current.parentStudyId).toBe("different-parent");
    const saved = (await loadStudies()).find(
      (study) => study.name === "First snapshot",
    );
    expect(saved?.result.input.R).toBe(2.5);
    expect(saved?.projectId).not.toBe("different-project");
  } finally {
    release();
    setter.mockImplementation(original);
  }
});
