import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import Result from "../app/result";
import { calculateMcCabe } from "../src/calculations";
import { DEMO_INPUT, ENGINE_VERSION } from "../src/types";
import { shareCSV } from "../src/utils/export";

jest.mock("@expo/vector-icons/Ionicons", () => () => null);
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
jest.mock("../src/utils/export", () => ({
  shareCSV: jest.fn(() => Promise.resolve()),
}));
jest.mock("../src/state/AppContext", () => ({ useApp: () => mockApp }));

const mockApp = {
  result: calculateMcCabe({ ...DEMO_INPUT, F: 100 }),
  resultEngineVersion: "1.0.0",
  profile: "general",
  computedAt: "2026-10-14T00:00:00.000Z",
  save: jest.fn(() => Promise.resolve()),
};

test("restored result header and CSV keep the original engine version", async () => {
  const screen = await render(<Result />);
  await fireEvent.press(screen.getByLabelText("Detail numerik & ketelitian"));
  expect(screen.getByText(/mesin 1\.0\.0 · profil umum/)).toBeTruthy();
  if (String(ENGINE_VERSION) !== "1.0.0")
    expect(
      screen.getByText(/pembanding dihitung sekarang dengan mesin/),
    ).toBeTruthy();
  await act(async()=>{await fireEvent.press(screen.getByLabelText("Ekspor hasil CSV"));await Promise.resolve();});
  const csv = jest.mocked(shareCSV).mock.calls[0]![0];
  expect(csv).toContain("versi_mesin,1.0.0\r\n");
});

test("a reflux preview cannot silently export the unchanged base result", async () => {
  const screen = await render(<Result />);
  await fireEvent.press(screen.getByText("Eksplorasi"));
  expect(screen.queryByLabelText("Ekspor hasil CSV")).toBeNull();
  expect(screen.queryByLabelText("Simpan studi")).toBeNull();
  expect(
    screen.getByText(/Untuk menyimpan atau mengekspor pratinjau/),
  ).toBeTruthy();
});
