import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Empty,
  Heading,
  Note,
  Screen,
  Section,
  styles,
} from "../src/components/ui";
import { ComparisonChart } from "../src/components/ComparisonChart";
import { useApp } from "../src/state/AppContext";
import type { Study } from "../src/types";
import { projectKey, scenarioDifferences } from "../src/storage/scenarios";
import type { ScenarioDifference } from "../src/storage/scenarios";
import { dateTime, fmt, methodName } from "../src/utils/format";
import { colors } from "../src/theme";

const scalar = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function Compare() {
  const app = useApp();
  const params = useLocalSearchParams<{ left?: string; right?: string }>();
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    const fromRoute = [scalar(params.left), scalar(params.right)].filter(
      (id): id is string => !!id,
    );
    setSelected(Array.from(new Set(fromRoute)).slice(0, 2));
  }, [params.left, params.right]);
  useEffect(() => {
    if (!app.ready) return;
    setSelected((prev) =>
      prev.filter((id) => app.studies.some((study) => study.id === id)),
    );
  }, [app.ready, app.studies]);
  const a = app.studies.find((s) => s.id === selected[0]);
  const b = app.studies.find((s) => s.id === selected[1]);
  const comparison = useMemo(
    () => (a && b ? scenarioDifferences(a, b) : null),
    [a, b],
  );
  const toggle = (study: Study) => {
    setSelected((prev) =>
      prev.includes(study.id)
        ? prev.filter((id) => id !== study.id)
        : prev.length < 2
          ? [...prev, study.id]
          : prev,
    );
  };
  const makeScenario = (study: Study) => {
    app.restore(study, true);
    router.push("/input");
  };
  return (
    <Screen>
      <Heading
        title="Bandingkan skenario"
        description="Pilih dua studi tersimpan. Nilai Δ menunjukkan B − A, bukan galat terhadap Excel."
      />
      {app.storageError && <Note error>{app.storageError}</Note>}
      {app.studies.length < 2 && (
        <Empty
          title="Simpan dua skenario"
          description="Hitung dan simpan kasus pertama, lalu gandakan parameternya untuk membuat skenario pembanding."
        />
      )}
      <Section title={`Pilihan ${[a, b].filter(Boolean).length}/2`}>
        {app.studies.map((study) => {
          const chosen = selected.includes(study.id);
          const position = selected.indexOf(study.id);
          return (
            <View
              key={study.id}
              style={[
                styles.panel,
                {
                  gap: 6,
                  borderColor: chosen ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.sectionTitle}>
                {chosen ? `${position === 0 ? "A" : "B"} · ` : ""}
                {study.name}
              </Text>
              <Text style={styles.caption}>
                {methodName(study.result.method)} · {dateTime(study.createdAt)}{" "}
                · mesin {study.engineVersion}
              </Text>
              <Button
                label={chosen ? `Lepas ${study.name}` : `Pilih ${study.name}`}
                variant={chosen ? "primary" : "secondary"}
                disabled={!chosen && selected.length >= 2}
                onPress={() => toggle(study)}
              />
            </View>
          );
        })}
      </Section>
      {a && b && comparison && (
        <>
          <Note>
            A: {a.name}
            {"\n"}B: {b.name}
            {"\n"}
            {projectKey(a) === projectKey(b)
              ? "Kedua skenario berada dalam proyek yang sama."
              : "Skenario berasal dari proyek berbeda; periksa perubahan inputnya."}
          </Note>
          {comparison.warnings.map((warning) => (
            <Note key={warning}>{warning}</Note>
          ))}
          <Section title="Perubahan input">
            {comparison.inputs.map((row) => (
              <ComparisonRow
                key={row.key}
                row={row}
                changed={row.delta !== 0}
              />
            ))}
          </Section>
          <Section title="Perubahan hasil">
            {comparison.outputs.map((row) => (
              <ComparisonRow key={row.key} row={row} />
            ))}
            <Text style={styles.caption}>
              — berarti hasil tidak tersedia pada metode atau input terkait. N
              tanpa pembulatan dan tahap bulat ditampilkan terpisah. Indeks
              umpan merupakan penanda penahapan, bukan jumlah tray aktual.
            </Text>
          </Section>
          {a.result.method === "mccabe" && b.result.method === "mccabe" ? (
            <Section title="Grafik perbandingan">
              <ComparisonChart a={a} b={b} />
            </Section>
          ) : (
            <Note>
              Overlay penahapan tersedia jika kedua studi memakai McCabe–Thiele.
              Perbandingan nilai di atas tetap mengikuti metode masing-masing.
            </Note>
          )}
          <View style={styles.actions}>
            <Button
              label="Buat skenario dari A"
              icon="copy-outline"
              variant="secondary"
              onPress={() => makeScenario(a)}
            />
            <Button
              label="Buat skenario dari B"
              icon="copy-outline"
              variant="secondary"
              onPress={() => makeScenario(b)}
            />
            <Button
              label="Tukar A dan B"
              variant="quiet"
              onPress={() => setSelected([b.id, a.id])}
            />
          </View>
        </>
      )}
      <Button
        label="Kembali ke proyek dan riwayat"
        variant="quiet"
        onPress={() => router.push("/(tabs)/history")}
      />
    </Screen>
  );
}

function ComparisonRow({
  row,
  changed = false,
}: {
  row: ScenarioDifference;
  changed?: boolean;
}) {
  const format = (value: number | undefined) =>
    value === undefined ? "—" : fmt(value, 8);
  return (
    <View
      style={[
        styles.panel,
        { gap: 8, backgroundColor: changed ? colors.subtle : colors.surface },
      ]}
    >
      <Text style={styles.label}>
        {row.label}
        {row.unit ? ` · ${row.unit}` : ""}
      </Text>
      <View style={[styles.horizontal, { justifyContent: "space-between" }]}>
        <Text selectable style={styles.body}>
          A {format(row.a)}
        </Text>
        <Text selectable style={styles.body}>
          B {format(row.b)}
        </Text>
        <Text selectable style={[styles.body, { color: colors.primary }]}>
          Δ {row.delta !== undefined && row.delta > 0 ? "+" : ""}
          {format(row.delta)}
        </Text>
      </View>
    </View>
  );
}
