import React, { useId, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { chartPressCoordinates } from "./McCabeChart";

export interface SeriesPoint {
  x: number;
  y: number | null;
}
export interface SeriesChartProps {
  points: SeriesPoint[];
  xLabel: string;
  yLabel: string;
  title: string;
  selectedIndex?: number | null;
  onPointSelect?: (index: number) => void;
}

// Invalid points break a series rather than implying a feasible continuous curve.
export function splitSeries(
  points: SeriesPoint[],
): { x: number; y: number }[][] {
  const segments: { x: number; y: number }[][] = [];
  let segment: { x: number; y: number }[] = [];
  for (const point of points) {
    if (
      !Number.isFinite(point.x) ||
      point.y === null ||
      !Number.isFinite(point.y)
    ) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push({ x: point.x, y: point.y });
  }
  if (segment.length) segments.push(segment);
  return segments;
}

function range(values: number[]): [number, number] {
  let min = Math.min(...values),
    max = Math.max(...values);
  const padding =
    min === max ? Math.max(Math.abs(min) * 0.1, 0.1) : max / 20 - min / 20;
  min = Math.max(-Number.MAX_VALUE, min - padding);
  max = Math.min(Number.MAX_VALUE, max + padding);
  return [min, max];
}
function fraction(value: number, min: number, max: number) {
  // Normalize first so subtracting two finite but extreme values cannot overflow.
  const scale = Math.max(Math.abs(min), Math.abs(max), 1);
  return (value / scale - min / scale) / (max / scale - min / scale);
}
function tick(value: number) {
  if (
    Math.abs(value) >= 10000 ||
    (Math.abs(value) > 0 && Math.abs(value) < 0.001)
  )
    return value.toExponential(1);
  return Number(value.toPrecision(4)).toString();
}

export function SeriesChart({
  points,
  xLabel,
  yLabel,
  title,
  selectedIndex,
  onPointSelect,
}: SeriesChartProps) {
  const [width, setWidth] = useState(320);
  const [localSelection, setLocalSelection] = useState<number | null>(null);
  const segments = useMemo(() => splitSeries(points), [points]);
  const valid = segments.flat();
  const clipId = `series-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  if (valid.length === 0)
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>
          Belum ada titik yang layak untuk ditampilkan. Periksa rentang
          parameter dan pesan pada tabel.
        </Text>
      </View>
    );
  const [minX, maxX] = range(
    points.filter((point) => Number.isFinite(point.x)).map((point) => point.x),
  );
  const [minY, maxY] = range(valid.map((point) => point.y));
  const left = 56,
    top = 18,
    side = Math.max(140, width - 78),
    height = side + 75;
  const px = (x: number) => left + fraction(x, minX, maxX) * side;
  const py = (y: number) => top + side - fraction(y, minY, maxY) * side;
  const ticks = Array.from({ length: 6 }, (_, i) => i / 5);
  const activeIndex =
    selectedIndex === undefined ? localSelection : selectedIndex;
  const active = activeIndex === null ? undefined : points[activeIndex];
  return (
    <View
      style={styles.container}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Text style={styles.title}>{title}</Text>
      <Pressable
        accessibilityRole="image"
        accessibilityLabel={`${title}; ketuk kurva untuk memilih titik.`}
        onPress={(event) => {
          const location = chartPressCoordinates(event);
          if (
            !location ||
            location.x < left ||
            location.x > left + side ||
            location.y < top ||
            location.y > top + side
          )
            return;
          const target = (location.x - left) / side;
          let index = -1,
            distance = Infinity;
          points.forEach((point, i) => {
            if (!Number.isFinite(point.x)) return;
            const d = Math.abs(fraction(point.x, minX, maxX) - target);
            if (d < distance) {
              index = i;
              distance = d;
            }
          });
          if (index >= 0) {
            setLocalSelection(index);
            onPointSelect?.(index);
          }
        }}
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
          {ticks.map((t, i) => (
            <G key={i}>
              <Line
                x1={left + t * side}
                y1={top}
                x2={left + t * side}
                y2={top + side}
                stroke={colors.border}
                strokeWidth={0.65}
              />
              <Line
                x1={left}
                y1={top + side - t * side}
                x2={left + side}
                y2={top + side - t * side}
                stroke={colors.border}
                strokeWidth={0.65}
              />
              <SvgText
                x={left + t * side}
                y={top + side + 18}
                textAnchor="middle"
                fontSize={10}
                fill={colors.muted}
              >
                {tick((1 - t) * minX + t * maxX)}
              </SvgText>
              <SvgText
                x={left - 7}
                y={top + side - t * side + 3.5}
                textAnchor="end"
                fontSize={10}
                fill={colors.muted}
              >
                {tick((1 - t) * minY + t * maxY)}
              </SvgText>
            </G>
          ))}
          <G clipPath={`url(#${clipId})`}>
            {segments.map((segment, index) => (
              <Path
                key={index}
                d={segment
                  .map(
                    (point, i) =>
                      `${i ? "L" : "M"}${px(point.x).toFixed(3)},${py(point.y).toFixed(3)}`,
                  )
                  .join(" ")}
                stroke={colors.accent}
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
              />
            ))}
            {valid.map((point, index) => (
              <Circle
                key={index}
                cx={px(point.x)}
                cy={py(point.y)}
                r={2.5}
                fill={colors.accent}
              />
            ))}
            {active && Number.isFinite(active.x) && (
              <G>
                <Line
                  x1={px(active.x)}
                  y1={top}
                  x2={px(active.x)}
                  y2={top + side}
                  stroke={colors.primary}
                  strokeDasharray="5 3"
                />
                {active.y !== null && Number.isFinite(active.y) && (
                  <Circle
                    cx={px(active.x)}
                    cy={py(active.y)}
                    r={6}
                    fill={colors.primary}
                    stroke={colors.surface}
                    strokeWidth={2}
                  />
                )}
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
            {xLabel}
          </SvgText>
          <SvgText
            x={13}
            y={top + side / 2}
            transform={`rotate(-90 13 ${top + side / 2})`}
            textAnchor="middle"
            fontSize={12}
            fill={colors.text}
          >
            {yLabel}
          </SvgText>
        </Svg>
      </Pressable>
      {active && (
        <Text accessibilityLiveRegion="polite" style={styles.caption}>
          Titik {(activeIndex ?? 0) + 1}: {xLabel} = {tick(active.x)};{" "}
          {active.y === null
            ? "Tidak layak — lihat alasan pada tabel."
            : `${yLabel} = ${tick(active.y)}`}
        </Text>
      )}
      <Text style={styles.caption}>
        {valid.length} dari {points.length} titik layak. Titik gagal atau tidak
        valid tidak dihubungkan. Nilai sumbu disesuaikan dengan data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", gap: 8 },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  empty: {
    paddingVertical: 18,
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
});

export default SeriesChart;
