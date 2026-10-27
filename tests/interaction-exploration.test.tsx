import React, { useState } from "react";
import { AccessibilityInfo, PanResponder } from "react-native";
import type {
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { calculateFUG, calculateMcCabe } from "../src/calculations";
import { DEMO_INPUT } from "../src/types";
import {
  McCabeChart,
  nearestStage,
  stepPoints,
} from "../src/components/McCabeChart";
import { StageExplorer } from "../src/components/StageExplorer";
import { RefluxExplorer } from "../src/components/RefluxExplorer";
import { SeriesChart } from "../src/components/SeriesChart";
import { StageTable } from "../src/features/mccabe-thiele/StageTable";

jest.mock("@expo/vector-icons/Ionicons", () => () => null);
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const result = calculateMcCabe({ ...DEMO_INPUT, F: 100 });

beforeEach(() => {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("step playback reveals horizontal then vertical coordinates from the engine", () => {
  const first = result.stages[0]!;
  expect(stepPoints(result, 0)).toEqual([first.start]);
  expect(stepPoints(result, 1)).toEqual([first.start, first.equilibrium]);
  expect(stepPoints(result, 2)).toEqual([
    first.start,
    first.equilibrium,
    first.end,
  ]);
  expect(stepPoints(result, result.stages.length * 2).at(-1)).toEqual(
    result.stages.at(-1)!.end,
  );
  expect(stepPoints(result, result.staircase.length - 1)).toEqual(
    result.staircase,
  );
});

test("stage selection follows the actual segment nearest the touched composition", () => {
  const chosen = result.stages[3]!;
  expect(
    nearestStage(result, {
      x: (chosen.start.x + chosen.equilibrium.x) / 2,
      y: chosen.start.y,
    }),
  ).toBe(chosen.number);
});

test("pinch-to-pan transitions preserve zoom when a finger is lifted or added", async () => {
  let gestures: Parameters<typeof PanResponder.create>[0] | undefined;
  jest.spyOn(PanResponder, "create").mockImplementation((config) => {
    gestures = config;
    return { panHandlers: {} } as ReturnType<typeof PanResponder.create>;
  });
  const screen = await render(<McCabeChart result={result} />);
  const touches = (distance: number | null) =>
    ({
      nativeEvent: {
        touches:
          distance === null
            ? [{ pageX: 0, pageY: 0 }]
            : [
                { pageX: 0, pageY: 0 },
                { pageX: distance, pageY: 0 },
              ],
      },
    }) as unknown as GestureResponderEvent;
  const movement = (dx: number) => ({ dx, dy: 0 }) as PanResponderGestureState;
  await act(async () => {
    gestures!.onPanResponderGrant?.(touches(100), movement(0));
    gestures!.onPanResponderMove?.(touches(200), movement(0));
  });
  expect(
    screen.getByLabelText("Pembesaran 2 kali").props.accessibilityState
      .selected,
  ).toBe(true);
  await act(async () => {
    gestures!.onPanResponderMove?.(touches(null), movement(10));
  });
  expect(
    screen.getByLabelText("Pembesaran 2 kali").props.accessibilityState
      .selected,
  ).toBe(true);
  await act(async () => {
    gestures!.onPanResponderMove?.(touches(null), movement(25));
  });
  expect(
    screen.getByLabelText("Pembesaran 2 kali").props.accessibilityState
      .selected,
  ).toBe(true);
  await act(async () => {
    gestures!.onPanResponderMove?.(touches(50), movement(25));
  });
  await act(async () => {
    gestures!.onPanResponderMove?.(touches(100), movement(25));
  });
  expect(
    screen.getByLabelText("Pembesaran 4 kali").props.accessibilityState
      .selected,
  ).toBe(true);
});

test("table selection changes the same selected-stage detail and graph", async () => {
  function Connected() {
    const [selected, setSelected] = useState(1);
    return (
      <StageExplorer
        result={result}
        selectedStage={selected}
        onStageSelect={setSelected}
      />
    );
  }
  const screen = await render(<Connected />);
  await fireEvent.press(screen.getByLabelText("Pilih tahap 2, rectifying"));
  expect(screen.getByText("Tahap terpilih 2")).toBeTruthy();
  expect(
    screen.getByLabelText("Pilih tahap 2, rectifying").props.accessibilityState
      .selected,
  ).toBe(true);
});

test("playback can advance by one numerical segment and remains paused", async () => {
  jest.useFakeTimers();
  function Connected() {
    const [selected, setSelected] = useState(1);
    return (
      <StageExplorer
        result={result}
        selectedStage={selected}
        onStageSelect={setSelected}
      />
    );
  }
  const screen = await render(<Connected />);
  await fireEvent.press(screen.getByLabelText("Berikutnya"));
  expect(screen.getByText(/Langkah 1\/19: tahap 1, horizontal/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Putar"));
  await act(async () => {
    jest.advanceTimersByTime(750);
  });
  expect(screen.getByText(/Langkah 2\/19: tahap 1, vertikal/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Jeda"));
  await act(async () => {
    jest.advanceTimersByTime(2250);
  });
  expect(screen.getByText(/Langkah 2\/19: tahap 1, vertikal/)).toBeTruthy();
  await screen.unmount();
});

test("selected stages beyond the first page remain available in the table", async () => {
  const many = calculateMcCabe({ ...DEMO_INPUT, alpha: 1.15, R: 50 });
  expect(many.stages.length).toBeGreaterThan(35);
  const screen = await render(<StageTable result={many} selectedStage={35} />);
  expect(screen.getByLabelText(/Pilih tahap 35,/)).toBeTruthy();
});

test("a terminal first stage stops at its horizontal segment", async () => {
  const single = calculateMcCabe({
    ...DEMO_INPUT,
    F: 100,
    xD: 0.6,
    xB: 0.4,
    q: 0,
    R: 1.2,
  });
  expect(single.stages.length).toBe(1);
  function Connected() {
    const [selected, setSelected] = useState(1);
    return (
      <StageExplorer
        result={single}
        selectedStage={selected}
        onStageSelect={setSelected}
      />
    );
  }
  const screen = await render(<Connected />);
  await fireEvent.press(screen.getByLabelText("Berikutnya"));
  expect(screen.getByText(/Langkah 1\/1: tahap 1, horizontal/)).toBeTruthy();
  expect(
    screen.getByLabelText("Berikutnya").props.accessibilityState.disabled,
  ).toBe(true);
  expect(screen.getByText("y pada titik terminal")).toBeTruthy();
  expect(screen.queryByText(/vertikal menuju garis operasi/)).toBeNull();
});

test("reduced motion disables autoplay, preserves manual stepping, and removes its listener", async () => {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
  const remove = jest.fn();
  jest
    .spyOn(AccessibilityInfo, "addEventListener")
    .mockReturnValue({ remove } as unknown as ReturnType<
      typeof AccessibilityInfo.addEventListener
    >);
  const screen = await render(
    <StageExplorer
      result={result}
      selectedStage={1}
      onStageSelect={jest.fn()}
    />,
  );
  await act(async()=>{await Promise.resolve();});
  expect(screen.getByLabelText("Putar").props.accessibilityState.disabled).toBe(
    true,
  );
  await fireEvent.press(screen.getByLabelText("Berikutnya"));
  expect(screen.getByText(/Langkah 1\/19: tahap 1, horizontal/)).toBeTruthy();
  await screen.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

test("large finite reflux never produces infinite native slider bounds", async () => {
  const large = calculateFUG({
    ...DEMO_INPUT,
    F: 100,
    R: Number.MAX_VALUE / 1.5,
  });
  const screen = await render(
    <RefluxExplorer result={large} profile="general" onApply={jest.fn()} />,
  );
  const bounds = screen.getByLabelText("Slider rasio refluks").props
    .accessibilityValue;
  expect(Number.isFinite(bounds.max)).toBe(true);
  expect(Number.isFinite(bounds.now)).toBe(true);
});

test("touching a failed sensitivity sample preserves its failure rather than interpolating it", async () => {
  const select = jest.fn();
  const screen = await render(
    <SeriesChart
      title="Sensitivitas"
      xLabel="R"
      yLabel="N"
      points={[
        { x: 1, y: 12 },
        { x: 2, y: null },
        { x: 3, y: 8 },
      ]}
      onPointSelect={select}
    />,
  );
  await fireEvent.press(screen.getByRole("image"), {
    nativeEvent: { locationX: 177, locationY: 140 },
  });
  expect(select).toHaveBeenCalledWith(1);
  expect(screen.getByText(/Tidak layak — lihat alasan/)).toBeTruthy();
});

test("invalid reflux removes the previous preview and cannot be adopted", async () => {
  jest.useFakeTimers();
  const apply = jest.fn();
  const screen = await render(
    <RefluxExplorer result={result} profile="research" onApply={apply} />,
  );
  expect(screen.getByLabelText("Jadikan skenario baru")).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText("Refluks yang dicoba · R"),
    "0.8",
  );
  expect(screen.queryByText("N pratinjau")).toBeNull();
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
  expect(screen.queryByLabelText("Jadikan skenario baru")).toBeNull();
  expect(screen.queryByRole("image")).toBeNull();
  expect(
    screen.getByText(/Grafik dan keluaran untuk input ini belum tersedia/),
  ).toBeTruthy();
  expect(apply).not.toHaveBeenCalled();
  await screen.unmount();
});

test("a valid reflux preview becomes a new scenario only on explicit action", async () => {
  jest.useFakeTimers();
  const apply = jest.fn(),
    before = JSON.stringify(result);
  const screen = await render(
    <RefluxExplorer result={result} profile="research" onApply={apply} />,
  );
  await fireEvent.changeText(
    screen.getByLabelText("Refluks yang dicoba · R"),
    "3,125",
  );
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
  expect(apply).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText("Jadikan skenario baru"));
  expect(apply).toHaveBeenCalledWith({ ...result.input, R: 3.125 });
  expect(JSON.stringify(result)).toBe(before);
  await screen.unmount();
});
