import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import Compare from "../app/compare";
import { useApp } from "../src/state/AppContext";
import { calculateMcCabe } from "../src/calculations";
import { DEMO_INPUT } from "../src/types";
import type { Study } from "../src/types";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock("../src/state/AppContext", () => ({ useApp: jest.fn() }));
jest.mock("../src/components/ComparisonChart", () => ({
  ComparisonChart: () => null,
}));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");

const a: Study = {
  id: "a",
  name: "Dasar",
  createdAt: "2026-10-21T02:00:00Z",
  engineVersion: "1.1.0",
  result: calculateMcCabe({ ...DEMO_INPUT, F: 100 }),
};
const b: Study = {
  ...a,
  id: "b",
  name: "Refluks tinggi",
  parentStudyId: "a",
  projectId: "a",
  result: calculateMcCabe({ ...DEMO_INPUT, F: 100, R: 4 }),
};
const restore = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({ left: "a", right: "b" });
  jest
    .mocked(useApp)
    .mockReturnValue({
      studies: [a, b],
      ready: true,
      storageError: "",
      restore,
    } as unknown as ReturnType<typeof useApp>);
});
afterEach(cleanup);

test("route-selected real scenarios can be swapped and duplicated without editing saved inputs", async () => {
  const screen = render(<Compare />);
  await waitFor(() => expect(screen.getByText("Perubahan input")).toBeTruthy());
  expect(
    screen.getByText("Kedua skenario berada dalam proyek yang sama.", {
      exact: false,
    }),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Tukar A dan B"));
  fireEvent.press(screen.getByLabelText("Buat skenario dari A"));
  expect(restore).toHaveBeenCalledWith(b, true);
  expect(router.push).toHaveBeenCalledWith("/input");
  expect(a.result.input.R).toBe(2.5);
  expect(b.result.input.R).toBe(4);
});

test("stale route selection is cleared so valid cases can still be selected", async () => {
  jest
    .mocked(useLocalSearchParams)
    .mockReturnValue({ left: "deleted-one", right: "deleted-two" });
  const screen = render(<Compare />);
  await waitFor(() =>
    expect(screen.getByLabelText("Pilih Dasar")).not.toBeDisabled(),
  );
  fireEvent.press(screen.getByLabelText("Pilih Dasar"));
  fireEvent.press(screen.getByLabelText("Pilih Refluks tinggi"));
  expect(screen.getByText("Perubahan hasil")).toBeTruthy();
});
