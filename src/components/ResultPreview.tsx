import { Text, View } from "react-native";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";
import type { McCabeResult, Point } from "../types";
import { useTheme } from "../theme";
export function ResultPreview({ result }: { result: McCabeResult }) {
  const { colors } = useTheme();
  const x = (v: number) => 34 + 230 * v,
    y = (v: number) => 246 - 230 * v;
  const path = (p: Point[]) =>
    p
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .map((p, i) => `${i ? "L" : "M"} ${x(p.x)} ${y(p.y)}`)
      .join(" ");
  return (
    <View>
      <Text
        style={{
          color: colors.text,
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 10,
        }}
      >
        Diagram McCabe–Thiele
      </Text>
      <Svg
        viewBox="0 0 280 280"
        width="100%"
        height={280}
        accessibilityLabel="Pratinjau diagram kesetimbangan dan tahap hasil perhitungan"
      >
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
          <ViewGrid key={t} value={t} />
        ))}
        <Line
          x1={x(0)}
          y1={y(0)}
          x2={x(1)}
          y2={y(1)}
          stroke={colors.muted}
          strokeDasharray="4 4"
        />
        <Path
          d={path(result.equilibriumCurve)}
          stroke={colors.accent}
          fill="none"
          strokeWidth={2}
        />
        <Path
          d={path([
            { x: result.input.xD, y: result.input.xD },
            result.intersection,
            { x: result.input.xB, y: result.input.xB },
          ])}
          stroke={colors.blue}
          fill="none"
          strokeWidth={1.5}
        />
        <Path
          d={path(result.staircase)}
          stroke={colors.amber}
          fill="none"
          strokeWidth={1.5}
        />
      </Svg>
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {[
          [colors.accent, "Kesetimbangan"],
          [colors.blue, "Operasi"],
          [colors.amber, "Tahap"],
        ].map(([color, label]) => (
          <View
            key={label}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <View style={{ width: 12, height: 3, backgroundColor: color }} />
            <Text style={{ fontSize: 11, color: colors.muted }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  function ViewGrid({ value: t }: { value: number }) {
    return (
      <>
        <Line x1={x(t)} y1={y(0)} x2={x(t)} y2={y(1)} stroke={colors.border} />
        <Line x1={x(0)} y1={y(t)} x2={x(1)} y2={y(t)} stroke={colors.border} />
        <SvgText
          x={x(t)}
          y={264}
          textAnchor="middle"
          fontSize={10}
          fill={colors.muted}
        >
          {t.toFixed(1)}
        </SvgText>
        <SvgText
          x={25}
          y={y(t) + 3}
          textAnchor="end"
          fontSize={10}
          fill={colors.muted}
        >
          {t.toFixed(1)}
        </SvgText>
      </>
    );
  }
}
