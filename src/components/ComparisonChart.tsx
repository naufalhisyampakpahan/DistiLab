import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";
import type { Point, Study } from "../types";
import { colors } from "../theme";
import { styles } from "./ui";

export function ComparisonChart({ a, b }: { a: Study; b: Study }) {
  const [width, setWidth] = useState(340);
  if (a.result.method !== "mccabe" || b.result.method !== "mccabe") return null;
  const margin = { left: 48, top: 22, right: 18, bottom: 48 };
  const size = Math.max(200, width - margin.left - margin.right);
  const height = size + margin.top + margin.bottom;
  const x = (v: number) => margin.left + v * size;
  const y = (v: number) => margin.top + (1 - v) * size;
  const path = (points: readonly Point[]) =>
    points.map((p, i) => `${i ? "L" : "M"}${x(p.x)},${y(p.y)}`).join(" ");
  const curves = [
    { study: a, result: a.result, color: colors.primary, dash: undefined },
    { study: b, result: b.result, color: colors.accent, dash: "7 4" },
  ];
  return (
    <View
      onLayout={(event) =>
        setWidth(Math.max(240, event.nativeEvent.layout.width))
      }
      style={{ gap: 10 }}
    >
      <Text style={styles.sectionTitle}>Penahapan dua skenario</Text>
      <Text style={styles.caption}>
        Garis penuh: A · garis putus: B. Kurva kesetimbangan mengikuti α
        masing-masing skenario.
      </Text>
      <View
        accessibilityRole="image"
        accessibilityLabel={`Diagram x-y dengan penahapan A ${a.name} dan B ${b.name}. A ${a.result.Nceil} tahap bulat; B ${b.result.Nceil} tahap bulat.`}
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <ViewGrid key={v} value={v} x={x} y={y} />
          ))}
          <Line
            x1={x(0)}
            y1={y(0)}
            x2={x(1)}
            y2={y(1)}
            stroke={colors.muted}
            strokeDasharray="3 4"
            strokeWidth={1}
          />
          {curves.map(({ study, result, color, dash }) => (
            <Path
              key={`eq-${study.id}`}
              d={path(result.equilibriumCurve)}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeDasharray={dash}
              opacity={0.55}
            />
          ))}
          {curves.map(({ study, result, color, dash }) => (
            <Path
              key={`steps-${study.id}`}
              d={path(result.staircase)}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={dash}
            />
          ))}
          <SvgText
            x={margin.left + size / 2}
            y={height - 6}
            textAnchor="middle"
            fill={colors.text}
            fontSize={12}
          >
            x · fraksi mol cair
          </SvgText>
          <SvgText
            x={12}
            y={margin.top + size / 2}
            textAnchor="middle"
            rotation={-90}
            origin={`12,${margin.top + size / 2}`}
            fill={colors.text}
            fontSize={12}
          >
            y · fraksi mol uap
          </SvgText>
        </Svg>
      </View>
      <Text style={[styles.caption, { color: colors.primary }]}>
        A — {a.name}
      </Text>
      <Text style={[styles.caption, { color: colors.accent }]}>
        B — {b.name}
      </Text>
    </View>
  );
}

function ViewGrid({
  value,
  x,
  y,
}: {
  value: number;
  x: (v: number) => number;
  y: (v: number) => number;
}) {
  return (
    <>
      <Line
        x1={x(value)}
        y1={y(0)}
        x2={x(value)}
        y2={y(1)}
        stroke={colors.border}
        strokeWidth={1}
      />
      <Line
        x1={x(0)}
        y1={y(value)}
        x2={x(1)}
        y2={y(value)}
        stroke={colors.border}
        strokeWidth={1}
      />
      <SvgText
        x={x(value)}
        y={y(0) + 20}
        textAnchor="middle"
        fill={colors.muted}
        fontSize={12}
      >
        {value}
      </SvgText>
      <SvgText
        x={x(0) - 9}
        y={y(value) + 4}
        textAnchor="end"
        fill={colors.muted}
        fontSize={12}
      >
        {value}
      </SvgText>
    </>
  );
}
