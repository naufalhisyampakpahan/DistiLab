import { useEffect, useState } from "react";
import { Keyboard, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { runSensitivity } from "../src/calculations";
import { calculateWithProfile } from "../src/research/profile";
import { SeriesChart } from "../src/components/SeriesChart";
import {
  Button,
  Empty,
  Field,
  Heading,
  Note,
  Row,
  Screen,
  Section,
  styles,
} from "../src/components/ui";
import { useApp } from "../src/state/AppContext";
import { colors } from "../src/theme";
import type { SensitivityParameter, SensitivityRun } from "../src/types";
import { sensitivityCSV } from "../src/utils/csv";
import { shareCSV } from "../src/utils/export";
import { fmt, methodName } from "../src/utils/format";
import { parseNumeric } from "../src/validation";
const params: Array<{ key: SensitivityParameter; label: string }> = [
  { key: "R", label: "Refluks · R" },
  { key: "zF", label: "Umpan · zF" },
  { key: "xD", label: "Distilat · xD" },
  { key: "alpha", label: "Volatilitas · α" },
  { key: "q", label: "Termal · q" },
];
const suggestedValue = (value: number): string =>
  String(Number(value.toPrecision(8)));
export default function Sensitivity() {
  const app = useApp(),
    result = app.result;
  const [parameter, setParameter] = useState<SensitivityParameter>("R"),
    [min, setMin] = useState(result ? suggestedValue(result.Rmin * 1.05) : ""),
    [max, setMax] = useState(result ? suggestedValue(result.input.R * 2) : ""),
    [count, setCount] = useState("21"),
    [run, setRun] = useState<SensitivityRun | null>(null),
    [selectedIndex, setSelectedIndex] = useState<number | null>(null),
    [metric, setMetric] = useState<"N" | "Rmin" | "Nmin">("N"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [exporting, setExporting] = useState(false);
  useEffect(() => {
    setRun(null);
    setSelectedIndex(null);
    setParameter("R");
    setMetric("N");
    setError("");
    setNotice("");
    if (result) {
      setMin(suggestedValue(result.Rmin * 1.05));
      setMax(suggestedValue(result.input.R * 2));
    }
  }, [result, app.profile]);
  if (!result)
    return (
      <Screen>
        <Empty
          title="Pilih hasil dasar"
          description="Jalankan perhitungan sebelum memvariasikan parameter."
        />
        <Button
          label="Buka parameter"
          onPress={() => router.replace("/input")}
        />
      </Screen>
    );
  const select = (key: SensitivityParameter) => {
    setParameter(key);
    setRun(null);
    setSelectedIndex(null);
    setError("");
    const base = result.input[key];
    setMin(
      suggestedValue(
        key === "q"
          ? 0
          : key === "zF"
            ? Math.max(result.input.xB + 0.01, base - 0.15)
            : key === "xD"
              ? Math.max(result.input.zF + 0.01, base - 0.15)
              : key === "alpha"
                ? Math.max(1.01, base * 0.75)
                : result.Rmin * 1.05,
      ),
    );
    setMax(
      suggestedValue(
        key === "q"
          ? 1
          : key === "zF"
            ? Math.min(result.input.xD - 0.01, base + 0.15)
            : key === "xD"
              ? Math.min(0.999, base + 0.04)
              : base * 1.5,
      ),
    );
  };
  const calculateRun = () => {
    Keyboard.dismiss();
    setNotice("");
    setRun(null);
    setSelectedIndex(null);
    try {
      const value = runSensitivity(
        result.method,
        result.input,
        parameter,
        parseNumeric(min, "Nilai minimum"),
        parseNumeric(max, "Nilai maksimum"),
        parseNumeric(count, "Jumlah titik"),
      );
      const checked =
        app.profile === "research"
          ? {
              ...value,
              points: value.points.map((point) => {
                try {
                  const calculated = calculateWithProfile(
                    result.method,
                    { ...result.input, [parameter]: point.value },
                    app.profile,
                  );
                  return {
                    value: point.value,
                    valid: true as const,
                    N: calculated.N,
                    Rmin: calculated.Rmin,
                    ...(calculated.method === "fug"
                      ? { Nmin: calculated.Nmin }
                      : {}),
                  };
                } catch (e) {
                  return {
                    value: point.value,
                    valid: false as const,
                    error:
                      e instanceof Error
                        ? e.message
                        : "Perhitungan titik gagal.",
                  };
                }
              }),
            }
          : value;
      setRun(checked);
      setSelectedIndex(0);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analisis gagal.");
    }
  };
  const invalid = run?.points.filter((p) => !p.valid).length ?? 0;
  const selected =
    selectedIndex === null ? undefined : run?.points[selectedIndex];
  return (
    <Screen>
      <Heading
        title="Uji perubahan parameter"
        description={`${methodName(result.method)} · satu variabel bebas, parameter lainnya mengikuti hasil dasar.`}
      />
      <Section title="Parameter yang divariasikan">
        <View style={styles.horizontal}>
          {params
            .filter((p) => app.profile !== "research" || p.key !== "q")
            .map((p) => (
              <Pressable
                key={p.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: parameter === p.key }}
                onPress={() => select(p.key)}
                style={{
                  minHeight: 48,
                  padding: 12,
                  borderRadius: 6,
                  backgroundColor:
                    parameter === p.key ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: parameter === p.key ? colors.surface : colors.text,
                    fontSize: 13,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
        </View>
        <Field
          label="Nilai minimum"
          value={min}
          onChange={(v) => {
            setMin(v);
            setRun(null);
          }}
        />
        <Field
          label="Nilai maksimum"
          value={max}
          onChange={(v) => {
            setMax(v);
            setRun(null);
          }}
        />
        <Field
          label="Jumlah titik"
          value={count}
          onChange={(v) => {
            setCount(v);
            setRun(null);
          }}
          help="Bilangan bulat 2–201. Setiap titik dihitung ulang dan divalidasi."
        />
        <Button
          label="Jalankan analisis"
          icon="analytics-outline"
          onPress={calculateRun}
        />
        {error && <Note error>{error}</Note>}
      </Section>
      {run && (
        <>
          <Section title="Hasil analisis">
            <Note>
              {run.count - invalid} titik layak dari {run.count}.{" "}
              {invalid > 0
                ? `${invalid} titik tidak layak; garis grafik terputus pada titik tersebut.`
                : "Semua titik memenuhi validasi model."}
            </Note>
            <View style={styles.horizontal}>
              {(
                [
                  "N",
                  "Rmin",
                  ...(result.method === "fug" ? ["Nmin" as const] : []),
                ] as const
              ).map((key) => (
                <Button
                  key={key}
                  variant={metric === key ? "primary" : "secondary"}
                  label={key}
                  onPress={() => setMetric(key)}
                />
              ))}
            </View>
            <SeriesChart
              selectedIndex={selectedIndex}
              onPointSelect={setSelectedIndex}
              title={`${metric} terhadap ${run.parameter === "alpha" ? "α" : run.parameter}`}
              xLabel={`${run.parameter === "alpha" ? "α" : run.parameter} (tanpa satuan)`}
              yLabel={
                metric === "Rmin" ? "Rmin (tanpa satuan)" : `${metric} (tahap)`
              }
              points={run.points.map((p) => ({
                x: p.value,
                y: p.valid ? (p[metric] ?? null) : null,
              }))}
            />
            {selected && (
              <View style={styles.panel}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Titik terpilih {(selectedIndex ?? 0) + 1}
                </Text>
                <Row
                  label={run.parameter === "alpha" ? "α" : run.parameter}
                  value={String(selected.value)}
                />
                {selected.valid ? (
                  <>
                    <Row label="N (tahap)" value={fmt(selected.N, 8)} />
                    <Row label="Rmin" value={fmt(selected.Rmin, 8)} />
                    {selected.Nmin !== undefined && (
                      <Row label="Nmin" value={fmt(selected.Nmin, 8)} />
                    )}
                    <Button
                      label="Gunakan titik sebagai skenario baru"
                      icon="copy-outline"
                      onPress={() => {
                        app.loadInput(
                          { ...run.input, [run.parameter]: selected.value },
                          run.method,
                          {
                            profile: app.profile,
                            projectId: app.projectId,
                            parentStudyId: app.parentStudyId,
                          },
                        );
                        router.push("/input");
                      }}
                    />
                  </>
                ) : (
                  <Note error>{selected.error}</Note>
                )}
              </View>
            )}
            <Text style={styles.caption}>
              Model biner, α konstan pada setiap titik; constant molar overflow;
              total condenser tidak dihitung; reboiler termasuk. R operasi
              divalidasi kembali pada setiap titik.
            </Text>
          </Section>
          <Section title="Tabel hasil">
            <ScrollView horizontal>
              <View>
                <View style={{ flexDirection: "row", paddingVertical: 10 }}>
                  {[
                    run.parameter,
                    "N",
                    "Nmin",
                    "Rmin",
                    "Status / penyebab",
                  ].map((h, i) => (
                    <Text
                      key={h}
                      style={[
                        styles.tableHeader,
                        { width: i === 4 ? 260 : 84 },
                      ]}
                    >
                      {h}
                    </Text>
                  ))}
                </View>
                {run.points.map((p, i) => (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Pilih titik sensitivitas ${i + 1}, ${run.parameter} ${String(p.value)}, ${p.valid ? "layak" : "tidak layak"}`}
                    accessibilityState={{ selected: selectedIndex === i }}
                    onPress={() => setSelectedIndex(i)}
                    style={{
                      flexDirection: "row",
                      minHeight: 48,
                      backgroundColor:
                        selectedIndex === i
                          ? colors.accentLight
                          : colors.surface,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingVertical: 10,
                    }}
                  >
                    {[
                      fmt(p.value),
                      p.valid ? fmt(p.N) : "—",
                      p.valid && p.Nmin !== undefined ? fmt(p.Nmin) : "—",
                      p.valid ? fmt(p.Rmin) : "—",
                      p.valid ? "Layak" : p.error,
                    ].map((v, j) => (
                      <Text
                        key={j}
                        selectable
                        style={[
                          styles.tableCell,
                          {
                            width: j === 4 ? 260 : 84,
                            color:
                              !p.valid && j === 4 ? colors.error : colors.text,
                          },
                        ]}
                      >
                        {v}
                      </Text>
                    ))}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Section>
          <Button
            variant="secondary"
            label="Ekspor analisis CSV"
            icon="share-outline"
            busy={exporting}
            onPress={() => {
              setExporting(true);
              setError("");
              void shareCSV(sensitivityCSV(run), "distilab-sensitivitas")
                .then(() =>
                  setNotice("CSV analisis siap dibagikan atau diunduh."),
                )
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Ekspor gagal."),
                )
                .finally(() => setExporting(false));
            }}
          />
          {notice && (
            <View style={{ marginTop: 12 }}>
              <Note>{notice}</Note>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
