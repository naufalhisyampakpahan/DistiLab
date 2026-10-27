import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import Result from "../app/result";
import Home from "../app/(tabs)/index";
import { calculateFUG, calculateMcCabe } from "../src/calculations";
import { ChoiceGroup } from "../src/components/ui";
import type { CalculationResult } from "../src/types";
import { DEMO_INPUT, ENGINE_VERSION } from "../src/types";
import { fmt } from "../src/utils/format";
import { router } from "expo-router";

jest.mock("@expo/vector-icons/Ionicons", () => () => null);
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock("../src/utils/export", () => ({ shareCSV: jest.fn() }));
jest.mock("../src/state/AppContext", () => ({ useApp: () => mockApp }));
const mockApp = {
  result: calculateMcCabe({ ...DEMO_INPUT, F: 100 }) as CalculationResult,
  resultEngineVersion: ENGINE_VERSION,
  computedAt: "2026-10-25T00:00:00.000Z",
  profile: "general",
  ready: true,
  fields: { zF: "", xD: "", xB: "", q: "1", F: "100", alpha: "", R: "" },
  studies: [],
  newCase: jest.fn(),
  setMethod: jest.fn(),
};

test.each([calculateMcCabe, calculateFUG])(
  "summary and steps preserve model output while audit details stay optional",
  async (calculate) => {
    mockApp.result = calculate({ ...DEMO_INPUT, F: 100 });
    const screen = await render(<Result />);
    expect(
      screen.getByText(/N hasil model ≈/).props.children.join(""),
    ).toContain(fmt(mockApp.result.N));
    expect(
      screen.getByText(/Jumlah tray aktual memerlukan efisiensi tray/),
    ).toBeTruthy();
    expect(screen.queryByText("Toleransi algoritma")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Detail numerik & ketelitian"));
    expect(screen.getByText("Toleransi algoritma")).toBeTruthy();
    expect(
      screen.getByLabelText("Detail numerik & ketelitian").props
        .accessibilityState.expanded,
    ).toBe(true);
    await fireEvent.press(screen.getByText("Perhitungan"));
    expect(screen.queryByText("SUBSTITUSI")).toBeNull();
    const step = screen.getByRole("button", {
      name:
        mockApp.result.method === "mccabe"
          ? /Garis operasi bagian atas/
          : /Fenske · tahap minimum/,
    });
    await fireEvent.press(step);
    expect(screen.getByText("SUBSTITUSI")).toBeTruthy();
    expect(screen.getByText("Arti simbol")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name:
          mockApp.result.method === "mccabe"
            ? /Garis operasi bagian atas/
            : /Fenske · tahap minimum/,
      }).props.accessibilityState.expanded,
    ).toBeTruthy();
    await screen.unmount();
  },
);

test("a newly calculated result returns from equation details to its summary", async () => {
  mockApp.result = calculateMcCabe({ ...DEMO_INPUT, F: 100 });
  const screen = await render(<Result />);
  await fireEvent.press(screen.getByText("Perhitungan"));
  expect(screen.getByText("Persamaan & substitusi")).toBeTruthy();
  mockApp.result = calculateFUG({ ...DEMO_INPUT, F: 100 });
  await screen.rerender(<Result />);
  expect(screen.queryByText("Persamaan & substitusi")).toBeNull();
  expect(screen.getByText(/N hasil model ≈/)).toBeTruthy();
  expect(screen.getByText("Kurva tahap operasi")).toBeTruthy();
  await screen.unmount();
});

test("entry opens the worksheet without a promotional homepage", async () => {
  const screen = await render(<Home />);
  expect(screen.queryByLabelText("Lanjutkan kasus aktif")).toBeNull();
  expect(screen.queryByLabelText("Mulai perhitungan")).toBeNull();
  expect(screen.getByText("Data kasus")).toBeTruthy();
  expect(screen.getByLabelText("Umpan")).toBeTruthy();
  expect(screen.getAllByLabelText("Hitung kolom")).toHaveLength(1);
  expect(screen.queryByLabelText("Isi data demonstrasi")).toBeNull();
  await fireEvent.press(
    screen.getByLabelText("Pengaturan model & data contoh"),
  );
  expect(screen.getByLabelText("Isi data demonstrasi")).toBeTruthy();
  await screen.unmount();
});

test("editing a computed case marks its output as needing recalculation", async () => {
  mockApp.result = calculateMcCabe({ ...DEMO_INPUT, F: 100 });
  const screen = await render(<Home />);
  mockApp.result = null as unknown as CalculationResult;
  await screen.rerender(<Home />);
  expect(screen.getByText(/Data berubah · perlu dihitung ulang/)).toBeTruthy();
  expect(
    screen.getByLabelText("Hasil, hitung data terlebih dahulu").props
      .accessibilityState.disabled,
  ).toBe(true);
  mockApp.result = calculateMcCabe({ ...DEMO_INPUT, F: 100 });
  await screen.unmount();
});

test("mode selection exposes selected state separately from an action button", async () => {
  const change = jest.fn();
  const screen = await render(
    <ChoiceGroup
      label="Mode"
      value="a"
      options={[
        { value: "a", label: "Mode A" },
        { value: "b", label: "Mode B" },
      ]}
      onChange={change}
    />,
  );
  expect(
    screen.getByRole("radio", { name: "Mode A" }).props.accessibilityState
      .checked,
  ).toBe(true);
  await fireEvent.press(screen.getByRole("radio", { name: "Mode B" }));
  expect(change).toHaveBeenCalledWith("b");
  await screen.unmount();
});
