import { splitSeries } from "../src/components/SeriesChart";
import {
  chartPressCoordinates,
  McCabeChart,
} from "../src/components/McCabeChart";
import { createElement } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { calculateMcCabe } from "../src/calculations";
import { DEMO_INPUT } from "../src/types";

test("invalid sensitivity points split the numerical plot into separate segments", () => {
  expect(
    splitSeries([
      { x: 1, y: 12 },
      { x: 2, y: null },
      { x: 3, y: 8 },
      { x: 4, y: 7 },
      { x: 5, y: NaN },
      { x: 6, y: 6 },
    ]),
  ).toEqual([
    [{ x: 1, y: 12 }],
    [
      { x: 3, y: 8 },
      { x: 4, y: 7 },
    ],
    [{ x: 6, y: 6 }],
  ]);
});

test("nonfinite independent variables are not plotted or bridged", () => {
  expect(
    splitSeries([
      { x: 1, y: 12 },
      { x: Infinity, y: 10 },
      { x: 3, y: 8 },
    ]),
  ).toEqual([[{ x: 1, y: 12 }], [{ x: 3, y: 8 }]]);
});

test("no valid points produces no plot segments", () => {
  expect(
    splitSeries([
      { x: 1, y: null },
      { x: 2, y: Infinity },
    ]),
  ).toEqual([]);
  expect(splitSeries([])).toEqual([]);
});

test("native chart presses retain their finite local coordinates", () => {
  expect(
    chartPressCoordinates({ nativeEvent: { locationX: 172, locationY: 146 } }),
  ).toEqual({ x: 172, y: 146 });
});

test("web clicks are relative to the press target rather than the viewport", () => {
  expect(
    chartPressCoordinates({
      nativeEvent: { clientX: 222, clientY: 246 },
      currentTarget: {
        getBoundingClientRect: () => ({ left: 50, top: 100 }),
      },
    }),
  ).toEqual({ x: 172, y: 146 });
});

test("finite web offsets remain available when viewport bounds cannot be read", () => {
  expect(
    chartPressCoordinates({
      nativeEvent: { offsetX: 172, offsetY: 146 },
    }),
  ).toEqual({ x: 172, y: 146 });
});

test.each([
  {},
  { nativeEvent: {} },
  { nativeEvent: { locationX: NaN, locationY: 146 } },
  { nativeEvent: { locationX: 172, locationY: Infinity } },
  {
    nativeEvent: { clientX: 222, clientY: 246 },
    currentTarget: { getBoundingClientRect: () => ({ left: NaN, top: 100 }) },
  },
])(
  "malformed chart presses do not yield nonfinite coordinates: %p",
  (event) => {
    expect(chartPressCoordinates(event)).toBeNull();
  },
);

test("web inspection displays the computed composition and ignores invalid follow-up events", async () => {
  const chart = await render(
    createElement(McCabeChart, { result: calculateMcCabe(DEMO_INPUT) }),
  );
  await fireEvent.press(chart.getByRole("image"), {
    nativeEvent: { clientX: 222, clientY: 246 },
    currentTarget: {
      getBoundingClientRect: () => ({ left: 50, top: 100 }),
    },
  });
  expect(chart.getByText("Koordinat: x = 0.5000; y = 0.5000")).toBeTruthy();
  await fireEvent.press(chart.getByRole("image"), { nativeEvent: {} });
  expect(chart.getByText("Koordinat: x = 0.5000; y = 0.5000")).toBeTruthy();
  expect(chart.queryByText(/NaN/)).toBeNull();
});

test("a missing coordinate event cannot replace the initial inspector message", async () => {
  const chart = await render(
    createElement(McCabeChart, { result: calculateMcCabe(DEMO_INPUT) }),
  );
  await fireEvent.press(chart.getByRole("image"), { nativeEvent: {} });
  expect(
    chart.getByText("Ketuk grafik untuk memeriksa koordinat x dan y."),
  ).toBeTruthy();
  expect(chart.queryByText(/NaN/)).toBeNull();
});
