import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  Button,
  Heading,
  Note,
  Screen,
  Section,
  styles,
} from "../src/components/ui";
import { WorkflowNav } from "../src/components/WorkflowNav";
import { ColumnDiagram, COLUMN_LABELS } from "../src/components/ColumnDiagram";
import type { ColumnPart } from "../src/components/ColumnDiagram";
import { useApp } from "../src/state/AppContext";
import { inspectFields } from "../src/utils/draft";
import { parseNumeric } from "../src/validation";
import { colors } from "../src/theme";
import type { BinaryInput } from "../src/types";
import { methodName } from "../src/utils/format";

export default function Process() {
  const app = useApp();
  const [selected, setSelected] = useState<ColumnPart>();
  const partial = useMemo(() => {
    const values: Partial<BinaryInput> = {};
    for (const key of Object.keys(app.fields) as (keyof BinaryInput)[]) {
      try {
        values[key] = parseNumeric(app.fields[key], key);
      } catch {
        /* Incomplete inputs stay visibly unavailable. */
      }
    }
    return values;
  }, [app.fields]);
  const errors = inspectFields(app.fields, app.profile);
  return (
    <Screen>
      <Heading
        eyebrow="KASUS AKTIF"
        title="Jelajahi kolom"
        description="Sentuh bagian proses untuk membuka data yang terkait."
      />
      <WorkflowNav active="process" />
      <View
        style={[
          styles.panel,
          { marginBottom: 20, backgroundColor: colors.subtle, gap: 6 },
        ]}
      >
        <Text style={styles.sectionTitle}>
          {app.profile === "research"
            ? "Profil penelitian · q = 1"
            : "Mode umum · 0 ≤ q ≤ 1"}
        </Text>
        <Text style={styles.body}>
          {methodName(app.method)} · {app.caseId ?? "Kasus mandiri"}
        </Text>
      </View>
      <ColumnDiagram
        input={partial}
        result={app.result}
        selectedPart={selected}
        onSelect={(part) => {
          setSelected(part);
          router.push({ pathname: "/input", params: { section: part } });
        }}
      />
      {selected && (
        <Text style={[styles.caption, { marginBottom: 16 }]}>
          Bagian dipilih: {COLUMN_LABELS[selected]}
        </Text>
      )}
      <Section title="Lanjutkan analisis">
        <Note>
          {app.result
            ? "Hasil mengikuti input aktif. Buka Hasil untuk memilih tahap, menjelajahi refluks, dan menelusuri hitungan."
            : Object.keys(errors).length
              ? "Lengkapi atau periksa data. Bagian yang belum diisi ditampilkan dengan tanda —."
              : "Data siap dihitung. Hasil belum tersedia sampai perhitungan dijalankan."}
        </Note>
        <Button
          label="Buka data kasus"
          icon="options-outline"
          onPress={() => router.replace("/input")}
        />
        {app.result && (
          <Button
            label="Lihat hasil dan grafik"
            variant="secondary"
            icon="analytics-outline"
            onPress={() => router.replace("/result")}
          />
        )}
        <Button
          label="Jalankan paket 27 kasus"
          variant="secondary"
          icon="checkmark-done-outline"
          onPress={() => router.push("/verification")}
        />
      </Section>
      <Text style={styles.caption}>
        Diagram skematik model α konstan/CMO. Kondensor total tidak dihitung;
        reboiler termasuk tahap. Nilai D/B pada diagram berasal dari neraca
        massa.
      </Text>
    </Screen>
  );
}
