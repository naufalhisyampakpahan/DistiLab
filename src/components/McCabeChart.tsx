import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import type { GestureResponderEvent } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { colors } from "../theme";
import type { McCabeResult, Point } from "../types";

type CurveKey =
  "diagonal" | "equilibrium" | "rectifying" | "stripping" | "q" | "stages";
const CURVES: { key: CurveKey; label: string; color: string; dash?: string }[] =
  [
    { key: "diagonal", label: "Diagonal", color: "#8B949E", dash: "5 4" },
    { key: "equilibrium", label: "Kesetimbangan", color: colors.primary },
    { key: "rectifying", label: "Rectifying", color: colors.accent },
    { key: "stripping", label: "Stripping", color: "#A66A19" },
    { key: "q", label: "Garis q", color: "#6871A3", dash: "6 3" },
    { key: "stages", label: "Tahap", color: colors.error },
  ];
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Native presses use local coordinates; web click events use viewport coordinates. */
export function chartPressCoordinates(event: {
  nativeEvent?: unknown;
  currentTarget?: unknown;
}): Point | null {
  if (!event.nativeEvent || typeof event.nativeEvent !== "object") return null;
  const native = event.nativeEvent as {
    locationX?: unknown;
    locationY?: unknown;
    clientX?: unknown;
    clientY?: unknown;
    offsetX?: unknown;
    offsetY?: unknown;
  };
  if (finite(native.locationX) && finite(native.locationY))
    return { x: native.locationX, y: native.locationY };

  const target = event.currentTarget as
    | { getBoundingClientRect?: () => { left?: unknown; top?: unknown } }
    | null
    | undefined;
  if (
    finite(native.clientX) &&
    finite(native.clientY) &&
    typeof target?.getBoundingClientRect === "function"
  ) {
    try {
      const rect = target.getBoundingClientRect();
      if (finite(rect.left) && finite(rect.top)) {
        const x = native.clientX - rect.left;
        const y = native.clientY - rect.top;
        if (finite(x) && finite(y)) return { x, y };
      }
    } catch {
      // A stale web target may no longer expose its bounds; try local offsets below.
    }
  }
  if (finite(native.offsetX) && finite(native.offsetY))
    return { x: native.offsetX, y: native.offsetY };
  return null;
}

export interface McCabeChartProps {
  result: McCabeResult;
  selectedStage?: number | null;
  onStageSelect?: (stage: number) => void;
  /** Null shows every step; otherwise this many horizontal/vertical segments. */
  playbackStep?: number | null;
}

/** Distance to the actual numerical step, not to a sampled/illustrative curve. */
export function nearestStage(
  result: McCabeResult,
  point: Point,
): number | null {
  let closest: number | null = null,
    distance = Infinity;
  for (const stage of result.stages) {
    for (const [a, b] of [
      [stage.start, stage.equilibrium],
      [stage.equilibrium, stage.end],
    ] as const) {
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const t =
        dx === 0 && dy === 0
          ? 0
          : clamp(
              ((point.x - a.x) * dx + (point.y - a.y) * dy) /
                (dx * dx + dy * dy),
              0,
              1,
            );
      const d = Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
      if (d < distance) {
        distance = d;
        closest = stage.number;
      }
    }
  }
  return closest;
}

export function stepPoints(
  result: McCabeResult,
  segmentCount: number,
): Point[] {
  const count = Math.max(0, Math.floor(segmentCount));
  const points: Point[] = [];
  for (const stage of result.stages) {
    if (!points.length) points.push(stage.start);
    if (2 * (stage.number - 1) >= count) break;
    points.push(stage.equilibrium);
    if (2 * stage.number > count) break;
    // The terminal stage reaches xB on the horizontal move; there is no
    // subsequent operating-line segment in the engine's staircase.
    if (
      stage.end.x !== stage.equilibrium.x ||
      stage.end.y !== stage.equilibrium.y
    )
      points.push(stage.end);
  }
  return points;
}

export function McCabeChart({
  result,
  selectedStage,
  onStageSelect,
  playbackStep = null,
}: McCabeChartProps) {
  const [width, setWidth] = useState(320);
  const [zoom, setZoom] = useState<number>(1);
  const [center, setCenter] = useState<Point>({ x: 0.5, y: 0.5 });
  const [inspect, setInspect] = useState<Point | null>(null);
  const [visible, setVisible] = useState<Record<CurveKey, boolean>>({
    diagonal: true,
    equilibrium: true,
    rectifying: true,
    stripping: true,
    q: true,
    stages: true,
  });
  const clipId = `plot-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const left = 44,
    top = 18,
    side = Math.max(160, width - 64),
    height = side + 72;
  const span = 1 / zoom;
  // The two composition axes always span the same interval on a square plotting area.
  const minX = clamp(center.x - span / 2, 0, 1 - span);
  const minY = clamp(center.y - span / 2, 0, 1 - span);
  const px = (x: number) => left + ((x - minX) / span) * side;
  const py = (y: number) => top + side - ((y - minY) / span) * side;
  const data = useMemo<Record<CurveKey, Point[]>>(
    () => ({
      diagonal: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      equilibrium: result.equilibriumCurve,
      rectifying: [
        result.intersection,
        { x: 1, y: result.rectifying.slope + result.rectifying.intercept },
      ],
      stripping: [{ x: 0, y: result.stripping.intercept }, result.intersection],
      q: result.qLine,
      stages:
        playbackStep === null
          ? result.staircase
          : stepPoints(result, playbackStep),
    }),
    [result, playbackStep],
  );
  const path = (points: Point[]) => {
    let drawing = false;
    return points
      .map((point) => {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          drawing = false;
          return "";
        }
        const command = drawing ? "L" : "M";
        drawing = true;
        return `${command}${px(point.x).toFixed(3)},${py(point.y).toFixed(3)}`;
      })
      .join(" ");
  };
  const inspectPoint = (event: GestureResponderEvent) => {
    const point = chartPressCoordinates(event);
    if (!point) return;
    const { x: locationX, y: locationY } = point;
    if (
      locationX < left ||
      locationX > left + side ||
      locationY < top ||
      locationY > top + side
    )
      return;
    const composition = {
      x: minX + ((locationX - left) / side) * span,
      y: minY + ((top + side - locationY) / side) * span,
    };
    setInspect(composition);
    const number = nearestStage(result, composition);
    if (number !== null) onStageSelect?.(number);
  };
  const pan = (dx: number, dy: number) =>
    setCenter((current) => ({
      x: clamp(current.x + (dx * span) / 4, span / 2, 1 - span / 2),
      y: clamp(current.y + (dy * span) / 4, span / 2, 1 - span / 2),
    }));
  const focus = (value: number) => {
    const bounded = clamp(value, span / 2, 1 - span / 2);
    setCenter({ x: bounded, y: bounded });
    setInspect(null);
  };
  const changeZoom = (level: 1 | 2 | 4) => {
    const halfSpan = 0.5 / level;
    setZoom(level);
    setCenter((current) => ({
      x: clamp(current.x, halfSpan, 1 - halfSpan),
      y: clamp(current.y, halfSpan, 1 - halfSpan),
    }));
    setInspect(null);
  };
  const gesture = useRef({
    zoom: 1,
    center: { x: 0.5, y: 0.5 },
    distance: 0,
    dx: 0,
    dy: 0,
  });
  const currentView = useRef({ zoom, center, side });
  currentView.current = { zoom, center, side };
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (event, movement) =>
          (event.nativeEvent.touches?.length ?? 0) >= 2 ||
          (currentView.current.zoom > 1 &&
            (Math.abs(movement.dx) > 8 || Math.abs(movement.dy) > 8)),
        onMoveShouldSetPanResponderCapture: (event) =>
          (event.nativeEvent.touches?.length ?? 0) >= 2,
        onPanResponderGrant: (event) => {
          const [a, b] = event.nativeEvent.touches ?? [];
          gesture.current = {
            zoom: currentView.current.zoom,
            center: currentView.current.center,
            distance:
              a && b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0,
            dx: 0,
            dy: 0,
          };
        },
        onPanResponderMove: (event, movement) => {
          const [a, b] = event.nativeEvent.touches ?? [];
          const distance =
            a && b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0;
          // Adding or lifting a finger starts a fresh basis. Otherwise a
          // released pinch would multiply the original zoom by 1 and jump back.
          if (distance > 0 !== gesture.current.distance > 0) {
            gesture.current = {
              zoom: currentView.current.zoom,
              center: currentView.current.center,
              distance,
              dx: movement.dx,
              dy: movement.dy,
            };
          }
          const scale =
            a && b && gesture.current.distance > 0
              ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) /
                gesture.current.distance
              : 1;
          const nextZoom = clamp(gesture.current.zoom * scale, 1, 8),
            half = 0.5 / nextZoom;
          setZoom(nextZoom);
          setCenter({
            x: clamp(
              gesture.current.center.x -
                (movement.dx - gesture.current.dx) /
                  currentView.current.side /
                  gesture.current.zoom,
              half,
              1 - half,
            ),
            y: clamp(
              gesture.current.center.y +
                (movement.dy - gesture.current.dy) /
                  currentView.current.side /
                  gesture.current.zoom,
              half,
              1 - half,
            ),
          });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );
  useEffect(() => {
    setInspect(null);
  }, [result]);
  const activeStage = result.stages.find(
    (stage) => stage.number === selectedStage,
  );
  useEffect(() => {
    if (!activeStage || zoom <= 1) return;
    const point = activeStage.equilibrium;
    if (
      point.x < minX ||
      point.x > minX + span ||
      point.y < minY ||
      point.y > minY + span
    )
      setCenter({
        x: clamp(point.x, span / 2, 1 - span / 2),
        y: clamp(point.y, span / 2, 1 - span / 2),
      });
    // Recenter a newly selected step; ordinary dragging still controls the view.
  }, [selectedStage, result]);
  const ticks = Array.from({ length: 6 }, (_, i) => i / 5);
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.container}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Diagram McCabe–Thiele</Text>
        <Text style={styles.caption}>Skala x = y</Text>
      </View>
      <View style={styles.controls}>
        <Text style={styles.caption}>Pembesaran</Text>
        {([1, 2, 4] as const).map((level) => (
          <Pressable
            key={level}
            accessibilityRole="button"
            accessibilityLabel={`Pembesaran ${level} kali`}
            accessibilityState={{ selected: zoom === level }}
            onPress={() => changeZoom(level)}
            style={({ pressed }) => [
              styles.control,
              zoom === level && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.controlText,
                zoom === level && styles.selectedText,
              ]}
            >
              {level}×
            </Text>
          </Pressable>
        ))}
      </View>
      {zoom > 1 && (
        <View style={styles.controls}>
          <Text style={styles.caption}>Fokus</Text>
          {[
            { label: "xB", value: result.input.xB },
            { label: "zF", value: result.input.zF },
            { label: "xD", value: result.input.xD },
          ].map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={`Fokus pada ${item.label}`}
              onPress={() => focus(item.value)}
              style={({ pressed }) => [
                styles.control,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.controlText}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geser ke kiri"
            onPress={() => pan(-1, 0)}
            style={styles.control}
          >
            <Text style={styles.controlText}>←</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geser ke kanan"
            onPress={() => pan(1, 0)}
            style={styles.control}
          >
            <Text style={styles.controlText}>→</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geser ke bawah"
            onPress={() => pan(0, -1)}
            style={styles.control}
          >
            <Text style={styles.controlText}>↓</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geser ke atas"
            onPress={() => pan(0, 1)}
            style={styles.control}
          >
            <Text style={styles.controlText}>↑</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.caption}>
        Cubit untuk memperbesar; geser saat diperbesar. Ketuk untuk memilih
        tahap. Tombol pembesaran dan geser tetap tersedia.
      </Text>
      <View {...panResponder.panHandlers}>
        <Pressable
          onPress={inspectPoint}
          accessibilityRole="image"
          accessibilityLabel={`Diagram McCabe Thiele dengan ${result.N.toFixed(3)} tahap; ketuk area grafik untuk membaca koordinat dan memilih tahap.`}
        >
          <Svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            pointerEvents="none"
          >
            <Defs>
              <ClipPath id={clipId}>
                <Rect x={left} y={top} width={side} height={side} />
              </ClipPath>
            </Defs>
            <Rect
              x={left}
              y={top}
              width={side}
              height={side}
              fill={colors.surface}
              stroke={colors.border}
            />
            {ticks.map((tick, i) => (
              <G key={i}>
                <Line
                  x1={left + tick * side}
                  y1={top}
                  x2={left + tick * side}
                  y2={top + side}
                  stroke={colors.border}
                  strokeWidth={0.65}
                />
                <Line
                  x1={left}
                  y1={top + side - tick * side}
                  x2={left + side}
                  y2={top + side - tick * side}
                  stroke={colors.border}
                  strokeWidth={0.65}
                />
                <SvgText
                  x={left + tick * side}
                  y={top + side + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill={colors.muted}
                >
                  {(minX + tick * span).toFixed(2)}
                </SvgText>
                <SvgText
                  x={left - 7}
                  y={top + side - tick * side + 3.5}
                  textAnchor="end"
                  fontSize={10}
                  fill={colors.muted}
                >
                  {(minY + tick * span).toFixed(2)}
                </SvgText>
              </G>
            ))}
            <G clipPath={`url(#${clipId})`} pointerEvents="none">
              {CURVES.filter((curve) => visible[curve.key]).map((curve) => (
                <Path
                  key={curve.key}
                  d={path(data[curve.key])}
                  fill="none"
                  stroke={curve.color}
                  strokeWidth={curve.key === "stages" ? 1.6 : 2}
                  strokeDasharray={curve.dash}
                  strokeLinejoin="round"
                />
              ))}
              {activeStage &&
                visible.stages &&
                (playbackStep === null ||
                  playbackStep > 2 * (activeStage.number - 1)) && (
                  <G>
                    <Path
                      d={path(
                        playbackStep === 2 * activeStage.number - 1
                          ? [activeStage.start, activeStage.equilibrium]
                          : [
                              activeStage.start,
                              activeStage.equilibrium,
                              activeStage.end,
                            ],
                      )}
                      stroke={colors.primary}
                      strokeWidth={4}
                      fill="none"
                    />
                    <Circle
                      cx={px(activeStage.equilibrium.x)}
                      cy={py(activeStage.equilibrium.y)}
                      r={5}
                      fill={colors.primary}
                      stroke={colors.surface}
                      strokeWidth={1.5}
                    />
                    <SvgText
                      x={px(activeStage.equilibrium.x) + 8}
                      y={py(activeStage.equilibrium.y) - 8}
                      fontSize={12}
                      fill={colors.text}
                    >
                      {activeStage.number}
                    </SvgText>
                  </G>
                )}
              {[
                { label: "xB", value: result.input.xB },
                { label: "zF", value: result.input.zF },
                { label: "xD", value: result.input.xD },
              ].map((item) => (
                <G key={item.label}>
                  <Circle
                    cx={px(item.value)}
                    cy={py(item.value)}
                    r={3}
                    fill={colors.text}
                    stroke={colors.surface}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={px(item.value) + (item.label === "xD" ? -7 : 7)}
                    y={py(item.value) - 7}
                    textAnchor={item.label === "xD" ? "end" : "start"}
                    fontSize={10}
                    fill={colors.text}
                  >
                    {item.label}
                  </SvgText>
                </G>
              ))}
              {inspect && (
                <G>
                  <Line
                    x1={left}
                    y1={py(inspect.y)}
                    x2={left + side}
                    y2={py(inspect.y)}
                    stroke={colors.muted}
                    strokeDasharray="3 3"
                  />
                  <Line
                    x1={px(inspect.x)}
                    y1={top}
                    x2={px(inspect.x)}
                    y2={top + side}
                    stroke={colors.muted}
                    strokeDasharray="3 3"
                  />
                  <Circle
                    cx={px(inspect.x)}
                    cy={py(inspect.y)}
                    r={4}
                    fill={colors.primary}
                  />
                </G>
              )}
            </G>
            <SvgText
              x={left + side / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={12}
              fill={colors.text}
            >
              x — fraksi mol cair
            </SvgText>
            <SvgText
              x={12}
              y={top + side / 2}
              transform={`rotate(-90 12 ${top + side / 2})`}
              textAnchor="middle"
              fontSize={12}
              fill={colors.text}
            >
              y — fraksi mol uap
            </SvgText>
          </Svg>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.readout}>
        {inspect
          ? `Koordinat: x = ${inspect.x.toFixed(4)}; y = ${inspect.y.toFixed(4)}`
          : "Ketuk grafik untuk memeriksa koordinat x dan y."}
      </Text>
      <View style={styles.legend}>
        {CURVES.map((curve) => (
          <Pressable
            key={curve.key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: visible[curve.key] }}
            accessibilityLabel={`Tampilkan ${curve.label}`}
            onPress={() =>
              setVisible((current) => ({
                ...current,
                [curve.key]: !current[curve.key],
              }))
            }
            style={({ pressed }) => [
              styles.legendItem,
              !visible[curve.key] && styles.hidden,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: curve.color }]} />
            <Text style={styles.legendText}>{curve.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.caption}>
        {result.N.toFixed(3)} tahap teoritis; {result.Nceil} tahap bulat.
        Reboiler termasuk, total condenser tidak dihitung. Titik xB, zF, dan xD
        ditandai pada diagonal.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", gap: 8 },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  caption: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  control: {
    minWidth: 42,
    minHeight: 48,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  controlText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectedText: { color: colors.surface },
  pressed: { opacity: 0.7 },
  readout: { fontSize: 12, color: colors.primary, minHeight: 18 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 7,
    gap: 6,
    borderRadius: 6,
  },
  swatch: { width: 16, height: 3, borderRadius: 2 },
  legendText: { fontSize: 12, color: colors.text },
  hidden: { opacity: 0.35 },
});

export default McCabeChart;
