import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Button,
  Heading,
  Note,
  Row,
  Screen,
  Section,
  styles,
} from "../src/components/ui";
import { colors } from "../src/theme";
import { useApp } from "../src/state/AppContext";
import { fmt } from "../src/utils/format";
import { shareCSV } from "../src/utils/export";
import {
  REFERENCE_PROVENANCE,
  RESEARCH_CASES,
  RESEARCH_DATASET_VERSION,
} from "../src/research/protocol";
import {
  canExportResearchRun,
  researchSummary,
  runResearchVerification,
} from "../src/research/runner";
import type { ResearchProgress, ResearchRun } from "../src/research/runner";
import { loadResearchRuns, saveResearchRun } from "../src/research/storage";
import { shareResearchXLSX } from "../src/research/export";
import { researchCSV } from "../src/research/xlsx";

export default function Verification() {
  const app = useApp();
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ResearchProgress>({
    completed: 0,
    total: 27,
    activeCaseId: "",
  });
  const [selected, setSelected] = useState("C14");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const cancelled = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    void loadResearchRuns()
      .then((items) => {
        if (mounted.current) {
          setRuns(items);
          setRun(items[0] ?? null);
        }
      })
      .catch((e: unknown) => {
        if (mounted.current)
          setError(
            e instanceof Error ? e.message : "Run tersimpan gagal dibaca.",
          );
      })
      .finally(() => {
        if (mounted.current) setHydrated(true);
      });
    return () => {
      mounted.current = false;
      cancelled.current = true;
    };
  }, []);

  const start = async () => {
    if (busy || !hydrated) return;
    cancelled.current = false;
    setBusy(true);
    setError("");
    setNotice("");
    setRun(null);
    setProgress({ completed: 0, total: 27, activeCaseId: "C01" });
    try {
      const next = await runResearchVerification({
        executionEnvironment:
          Platform.OS === "android"
            ? "android"
            : Platform.OS === "ios"
              ? "ios"
              : "web",
        systemVersion: String(Platform.Version ?? "tidak dicatat"),
        isCancelled: () => cancelled.current,
        onProgress: (value) => {
          if (mounted.current) setProgress(value);
        },
      });
      if (mounted.current) setRun(next);
      await saveResearchRun(next);
      const saved = await loadResearchRuns();
      if (mounted.current) {
        setRuns(saved);
        setNotice(
          next.status === "cancelled"
            ? "Run dibatalkan. Hasil parsial tersimpan; ekspor paket lengkap belum tersedia."
            : "Run selesai dan tersimpan. Tiga run terakhir tersedia pada perangkat ini.",
        );
      }
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : "Paket belum dapat diselesaikan atau disimpan.",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const summary = run ? researchSummary(run) : null;
  const record = run?.records.find((item) => item.caseId === selected);
  const exportRun = async (format: "xlsx" | "csv") => {
    if (!run || exporting || busy) return;
    setExporting(true);
    setError("");
    setNotice("");
    try {
      if (format === "xlsx") await shareResearchXLSX(run);
      else await shareCSV(researchCSV(run), `DistiLab-${run.id}`);
      if (mounted.current)
        setNotice(
          `${format.toUpperCase()} dibuat dari run ${run.id}. Salin 27 baris data ke workbook acuan yang memakai ID sama.`,
        );
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Ekspor gagal.");
    } finally {
      if (mounted.current) setExporting(false);
    }
  };
  const completed = busy ? progress.completed : (run?.records.length ?? 0);

  return (
    <Screen>
      <Heading
        eyebrow="PAKET PENELITIAN"
        title="Verifikasi 27 kasus"
        description="Satu run menghitung dua metode pada input yang sama, lalu membandingkan 162 keluaran dengan acuan kode independen."
      />
      <Note>
        Profil penelitian: biner hipotetik, α konstan, CMO, q = 1, F = 100
        kmol/jam; xD = 0,95 dan xB = 0,05. Kondensor total tidak dihitung,
        reboiler termasuk tahap.
      </Note>
      <View style={{ height: 18 }} />
      <Section title="Jalankan pada perangkat ini">
        <Button
          label={
            !hydrated
              ? "Membaca riwayat run…"
              : busy
                ? "Paket sedang dihitung"
                : "Jalankan Paket Verifikasi"
          }
          icon="play-outline"
          onPress={() => void start()}
          disabled={busy || !hydrated}
        />
        {busy && (
          <Button
            label="Batalkan setelah kasus aktif"
            variant="secondary"
            onPress={() => {
              cancelled.current = true;
            }}
          />
        )}
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Progres paket penelitian"
          accessibilityValue={{ min: 0, max: 27, now: completed }}
          style={{
            height: 10,
            borderRadius: 6,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${(completed / 27) * 100}%`,
              backgroundColor: colors.accent,
            }}
          />
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.body}>
          {completed}/27 kasus{" "}
          {busy
            ? `· aktif ${progress.activeCaseId}`
            : run?.status === "cancelled"
              ? "· run dibatalkan"
              : run
                ? "· selesai dihitung"
                : "· belum dijalankan"}
        </Text>
        {notice ? <Note>{notice}</Note> : null}
        {error ? <Note error>{error}</Note> : null}
      </Section>

      {runs.length > 0 && (
        <Section title="Run tersimpan">
          {runs.map((saved) => (
            <Pressable
              key={saved.id}
              accessibilityRole="button"
              accessibilityState={{
                selected: saved.id === run?.id,
                disabled: busy,
              }}
              disabled={busy}
              onPress={() => {
                setRun(saved);
                setNotice("");
                setError("");
              }}
              style={[
                styles.panel,
                {
                  minHeight: 48,
                  borderColor:
                    saved.id === run?.id ? colors.primary : colors.border,
                  opacity: busy ? 0.5 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                {new Date(saved.createdAt).toLocaleString("id-ID")} ·{" "}
                {saved.records.length}/27
              </Text>
              <Text style={styles.caption}>
                {saved.id} · mesin {saved.engineVersion} ·{" "}
                {saved.executionEnvironment}
              </Text>
            </Pressable>
          ))}
        </Section>
      )}

      {run && summary && (
        <>
          <Section title="Ringkasan run terpilih">
            <Text selectable style={styles.caption}>
              {run.id}
            </Text>
            <Text style={styles.caption}>
              Lingkungan run: {run.executionEnvironment} · sistem{" "}
              {run.systemVersion}
            </Text>
            <Row
              label="Kasus selesai dihitung"
              value={`${summary.computed}/27`}
            />
            <Row label="Kasus gagal dihitung" value={String(summary.failed)} />
            <Row
              label="Keluaran cocok dengan acuan kode"
              value={`${summary.passed}/${summary.compared}`}
            />
            <Row
              label="Diagnosis kondisi batas sesuai"
              value={`${summary.boundaryPassed}/${run.boundaries.length}`}
            />
            <Text style={styles.caption}>
              Kontinu: |galat| ≤ 10⁻⁸ + 10⁻⁶ × |acuan|. N MT bulat harus sama
              persis.
            </Text>
            <Note>{REFERENCE_PROVENANCE}</Note>
            <Button
              label="Ekspor XLSX · 27 × 7"
              icon="download-outline"
              onPress={() => void exportRun("xlsx")}
              disabled={!canExportResearchRun(run) || busy || exporting}
              busy={exporting}
            />
            <Button
              label="Ekspor blok CSV"
              variant="secondary"
              onPress={() => void exportRun("csv")}
              disabled={!canExportResearchRun(run) || busy || exporting}
            />
            <Text style={styles.caption}>
              XLSX memuat Hasil_App, Metadata, Input_Kasus, dan Uji_Batas. Angka
              disimpan tanpa pembulatan tampilan. CSV hanya berisi blok tujuh
              kolom; metadata tersedia pada run/XLSX.
            </Text>
          </Section>

          <Section title="Pilih kasus untuk audit">
            <View style={styles.horizontal}>
              {RESEARCH_CASES.map((entry) => {
                const item = run.records.find((r) => r.caseId === entry.caseId);
                const label = !item
                  ? "belum dihitung"
                  : item.status === "failed"
                    ? "gagal dihitung"
                    : item.comparisons.every((c) => c.passed)
                      ? "cocok acuan kode"
                      : "periksa selisih";
                return (
                  <Pressable
                    key={entry.caseId}
                    accessibilityRole="button"
                    accessibilityLabel={`${entry.caseId}, ${label}`}
                    accessibilityState={{ selected: selected === entry.caseId }}
                    onPress={() => setSelected(entry.caseId)}
                    style={{
                      minWidth: 72,
                      minHeight: 52,
                      padding: 10,
                      justifyContent: "center",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        selected === entry.caseId
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        selected === entry.caseId
                          ? colors.subtle
                          : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      {entry.caseId}
                    </Text>
                    <Text
                      style={[
                        styles.caption,
                        {
                          textAlign: "center",
                          color:
                            item?.status === "failed"
                              ? colors.error
                              : colors.muted,
                        },
                      ]}
                    >
                      {!item
                        ? "Belum"
                        : item.status === "failed"
                          ? "Gagal"
                          : item.comparisons.every((c) => c.passed)
                            ? "Cocok"
                            : "Selisih"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.caption}>
              Audit manual utama: C01, C14, dan C27. “Cocok” pada layar ini
              mengacu pada kode independen, bukan hasil pembandingan workbook
              Excel.
            </Text>
          </Section>

          {record ? (
            <Section title={`Audit ${record.caseId}`}>
              <Row
                label="α · zF · R/Rmin"
                value={`${fmt(record.input.alpha)} · ${fmt(record.input.zF)} · ${fmt(record.refluxFactor)}`}
              />
              <Row label="Refluks operasi R" value={fmt(record.input.R, 10)} />
              {record.status === "failed" ? (
                <Note error>
                  {record.errorCode}: {record.error}
                </Note>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    accessibilityLabel="Perbandingan keluaran kasus"
                  >
                    <View style={{ minWidth: 560 }}>
                      <View
                        style={[styles.horizontal, { paddingVertical: 10 }]}
                      >
                        {[
                          "Besaran",
                          "Aplikasi",
                          "Acuan kode",
                          "Galat absolut",
                        ].map((text) => (
                          <Text
                            key={text}
                            style={[styles.tableHeader, { width: 128 }]}
                          >
                            {text}
                          </Text>
                        ))}
                      </View>
                      {record.comparisons.map((comparison) => (
                        <View
                          key={comparison.metric}
                          style={[
                            styles.horizontal,
                            {
                              paddingVertical: 10,
                              borderTopWidth: 1,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.tableCell, { width: 128 }]}>
                            {comparison.metric} ·{" "}
                            {comparison.passed ? "Cocok" : "Selisih"}
                          </Text>
                          <Text
                            selectable
                            style={[styles.tableCell, { width: 128 }]}
                          >
                            {fmt(comparison.actual, 10)}
                          </Text>
                          <Text
                            selectable
                            style={[styles.tableCell, { width: 128 }]}
                          >
                            {fmt(comparison.reference, 10)}
                          </Text>
                          <Text
                            selectable
                            style={[styles.tableCell, { width: 128 }]}
                          >
                            {comparison.absoluteError.toExponential(3)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  <Row
                    label="N MT fraksional / bulat"
                    value={`${fmt(record.mt.N, 10)} / ${record.mt.Nceil}`}
                  />
                  <Row
                    label="Tahap umpan dari puncak"
                    value={
                      record.mt.feedStage === null
                        ? "Tidak teridentifikasi"
                        : String(record.mt.feedStage)
                    }
                  />
                  <Button
                    label={`Buka grafik dan jejak ${record.caseId}`}
                    variant="secondary"
                    onPress={() => {
                      app.adoptResult(record.mt, {
                        profile: "research",
                        caseId: record.caseId,
                        protocolVersion: run.datasetVersion,
                        sourceEngineVersion: run.engineVersion,
                        sourceComputedAt: run.createdAt,
                      });
                      router.push("/result");
                    }}
                  />
                </>
              )}
            </Section>
          ) : (
            <Note>{selected} belum dihitung pada run ini.</Note>
          )}

          {run.boundaries.length > 0 && (
            <Section title="Sembilan kondisi batas">
              {run.boundaries.map((boundary) => (
                <View key={boundary.caseId} style={styles.panel}>
                  <Text
                    style={{
                      color: boundary.passed ? colors.primary : colors.error,
                      fontWeight: "600",
                    }}
                  >
                    {boundary.caseId} ·{" "}
                    {boundary.passed ? "Diagnosis sesuai" : "Periksa diagnosis"}
                  </Text>
                  <Text style={styles.body}>{boundary.label}</Text>
                  <Text style={styles.caption}>{boundary.message}</Text>
                </View>
              ))}
              <Text style={styles.caption}>
                Identitas T01–T09 pada implementasi ini mengikuti daftar kondisi
                dalam chat. Cocokkan pemetaan dengan dokumen protokol asli
                sebelum dijadikan bukti final penelitian.
              </Text>
            </Section>
          )}
        </>
      )}
      <Section title="Versi protokol">
        <Text selectable style={styles.caption}>
          {RESEARCH_DATASET_VERSION}
        </Text>
        <Text style={styles.body}>
          Urutan: α → zF → R/Rmin, masing-masing naik. Paket 30 kasus sebelumnya
          tetap menjadi regresi tambahan. Penghitungan di browser/komputer belum
          menjadi bukti uji APK di HP.
        </Text>
      </Section>
    </Screen>
  );
}
