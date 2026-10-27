import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { colors } from "../theme";
import type { BinaryInput, CalculationResult } from "../types";
import { fmt } from "../utils/format";

export type ColumnPart =
  "feed" | "column" | "reflux" | "distillate" | "bottom" | "reboiler";
export const COLUMN_LABELS: Record<ColumnPart, string> = {
  feed: "Umpan",
  column: "Kolom",
  reflux: "Kondensor / refluks",
  distillate: "Distilat",
  bottom: "Produk bawah",
  reboiler: "Reboiler",
};
export function ColumnDiagram({
  input,
  result,
  selectedStage,
  selectedPart,
  onSelect,
}: {
  input: Partial<BinaryInput>;
  result?: CalculationResult | null;
  selectedStage?: number | null;
  selectedPart?: ColumnPart;
  onSelect?: (part: ColumnPart) => void;
}) {
  const number = (n: number | undefined, precision = 3) =>
    n === undefined || !Number.isFinite(n) ? "—" : fmt(n, precision);
  const balance =
    result?.balance ??
    (input.F !== undefined &&
    input.F > 0 &&
    input.xB !== undefined &&
    input.zF !== undefined &&
    input.xD !== undefined &&
    input.xB > 0 &&
    input.xB < input.zF &&
    input.zF < input.xD &&
    input.xD < 1
      ? {
          D: (input.F * (input.zF - input.xB)) / (input.xD - input.xB),
          B: (input.F * (input.xD - input.zF)) / (input.xD - input.xB),
        }
      : undefined);
  const count = result?.Nceil;
  const stageY =
    selectedStage && count
      ? 101 + (169 * (selectedStage - 1)) / Math.max(1, count - 1)
      : null;
  const node = (part: ColumnPart, detail: string, position: object) => (
    <Pressable
      key={part}
      accessibilityRole={onSelect ? "button" : "text"}
      accessibilityLabel={`${COLUMN_LABELS[part]}. ${detail}${onSelect ? ". Buka data terkait" : ""}`}
      accessibilityState={{ selected: selectedPart === part }}
      onPress={onSelect ? () => onSelect(part) : undefined}
      style={[
        s.node,
        position,
        selectedPart === part && {
          borderColor: colors.accent,
          backgroundColor: colors.accentLight,
        },
      ]}
    >
      <Text style={s.label}>{COLUMN_LABELS[part]}</Text>
      <Text style={s.detail}>{detail}</Text>
    </Pressable>
  );
  return (
    <View style={s.diagram}>
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        viewBox="0 0 560 410"
        preserveAspectRatio="none"
        accessible={false}
      >
        <Path
          d="M140 198 H214 M280 83 V42 H399 V98 M399 42 H455 V112 M399 75 H348 V113 M280 305 V370 H400 V296 M400 340 H468 V308"
          fill="none"
          stroke={colors.primary}
          strokeWidth={2}
        />
        <Path
          d="M203 193 L214 198 L203 203 M449 103 L455 112 L461 103 M342 104 L348 113 L354 104 M462 317 L468 308 L474 317"
          fill="none"
          stroke={colors.primary}
          strokeWidth={2}
        />
        {Array.from({ length: 9 }, (_, index) => (
          <Line
            key={index}
            x1="228"
            y1={110 + index * 20}
            x2="332"
            y2={110 + index * 20}
            stroke={colors.border}
            strokeWidth={2}
          />
        ))}
        {stageY !== null && (
          <Line
            x1="224"
            x2="336"
            y1={stageY}
            y2={stageY}
            stroke={colors.accent}
            strokeWidth={5}
          />
        )}
      </Svg>
      {node("feed", `F ${number(input.F)} kmol/jam\nzF ${number(input.zF)}`, {
        left: "0%",
        top: 143,
        width: "29%",
      })}
      {node("reflux", `R ${number(input.R)}`, {
        left: "49%",
        top: 0,
        width: "49%",
      })}
      {node(
        "distillate",
        `xD ${number(input.xD)}\nD ${number(balance?.D)} kmol/jam`,
        { right: 0, top: 109, width: "29%" },
      )}
      {node(
        "bottom",
        `xB ${number(input.xB)}\nB ${number(balance?.B)} kmol/jam`,
        { right: 0, top: 260, width: "29%" },
      )}
      {node("reboiler", "Termasuk tahap", {
        left: "34%",
        top: 335,
        width: "33%",
      })}
      <Pressable
        accessibilityRole={onSelect ? "button" : "text"}
        accessibilityLabel={`Kolom. ${count ? `${count} tahap kesetimbangan` : "Spesifikasi kolom"}`}
        onPress={onSelect ? () => onSelect("column") : undefined}
        style={[
          s.column,
          selectedPart === "column" && { borderColor: colors.accent },
        ]}
      >
        <Text style={s.label}>KOLOM</Text>
        <Text style={[s.detail, { marginTop: 12 }]}>
          {selectedStage
            ? `Tahap ${selectedStage}`
            : count
              ? `${count} tahap`
              : "α konstan"}
        </Text>
        <Text style={[s.detail, { marginTop: 8 }]}>
          {result?.method === "mccabe" && result.feedStage
            ? `Umpan: ${result.feedStage}`
            : `q ${number(input.q, 2)}`}
        </Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  diagram: { height: 410, width: "100%", position: "relative" },
  node: {
    position: "absolute",
    minHeight: 68,
    paddingHorizontal: 7,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    gap: 5,
  },
  column: {
    position: "absolute",
    left: "37%",
    width: "26%",
    top: 89,
    height: 216,
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    backgroundColor: "rgba(237,243,246,0.78)",
  },
  label: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
    textAlign: "center",
  },
  detail: {
    fontSize: 12,
    color: colors.text,
    textAlign: "center",
    lineHeight: 19,
  },
});
