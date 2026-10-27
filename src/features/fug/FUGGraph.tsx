import { useMemo } from "react";
import { Text, View } from "react-native";
import { runSensitivity } from "../../calculations";
import { SeriesChart } from "../../components/SeriesChart";
import { styles } from "../../components/ui";
import type { FUGResult } from "../../types";
export function FUGGraph({ result }: { result: FUGResult }) {
  const run = useMemo(
    () =>
      runSensitivity(
        "fug",
        result.input,
        "R",
        result.Rmin + (result.input.R - result.Rmin) * 0.1,
        Math.min(
          Number.MAX_VALUE,
          Math.max(result.input.R * 2, result.Rmin + 2),
        ),
        31,
      ),
    [result],
  );
  return (
    <View style={{ gap: 12 }}>
      <SeriesChart
        title="Tahap operasi terhadap rasio refluks"
        xLabel="R (tanpa satuan)"
        yLabel="N (tahap)"
        points={run.points.map((p) => ({
          x: p.value,
          y: p.valid ? p.N : null,
        }))}
      />
      <Text style={styles.caption}>
        Kurva dihitung ulang dengan Fenske–Underwood–Gilliland pada 31 nilai R.
        Parameter lain mengikuti input. N mendekati Nmin ketika R meningkat.
      </Text>
    </View>
  );
}
