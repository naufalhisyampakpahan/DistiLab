import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Field,
  Heading,
  Note,
  Screen,
  Section,
  styles,
} from "../components/ui";
import { WorkflowNav } from "../components/WorkflowNav";
import { useApp } from "../state/AppContext";
import { inspectFields, parseFields } from "../utils/draft";
import type { Fields } from "../utils/draft";
import { minimumReflux } from "../calculations";
import { colors } from "../theme";
import { fmt, methodName } from "../utils/format";

export default function CaseInputScreen() {
  const app = useApp();
  const params = useLocalSearchParams<{ section?: string }>();
  const [error, setError] = useState(""),
    [demoUsed, setDemoUsed] = useState(false);
  const [submitted, setSubmitted] = useState(false),
    [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>(
      {},
    );
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const focus =
    params.section === "feed"
      ? "feed"
      : ["distillate", "bottom"].includes(params.section ?? "")
        ? "composition"
        : params.section
          ? "operation"
          : "";
  useEffect(() => {
    if (!focus) return;
    const timer = setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: Math.max(0, (positions.current[focus] ?? 0) - 20),
          animated: true,
        }),
      250,
    );
    return () => clearTimeout(timer);
  }, [focus]);
  const errors = inspectFields(app.fields, app.profile);
  const rmin = useMemo(() => {
    try {
      return minimumReflux(
        parseFields({ ...app.fields, R: app.fields.R || "0" }),
      ).Rmin;
    } catch {
      return null;
    }
  }, [app.fields]);
  const change = (key: keyof Fields, value: string) => {
    setTouched((previous) => ({ ...previous, [key]: true }));
    setError("");
    app.setField(key, value);
  };
  const fieldError = (key: keyof Fields) =>
    submitted || touched[key] ? errors[key] : undefined;
  const status = (keys: (keyof Fields)[]) =>
    keys.every((key) => !errors[key])
      ? "Lengkap"
      : keys.some((key) => app.fields[key].trim() !== "")
        ? "Periksa / lengkapi"
        : "Belum diisi";
  const groupStyle = (name: string) =>
    focus === name
      ? { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12 }
      : undefined;
  const run = () => {
    Keyboard.dismiss();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      setError("Periksa pesan di bawah data yang perlu diperbaiki.");
      const group =
        errors.zF || errors.xD || errors.xB
          ? "composition"
          : errors.F || errors.q
            ? "feed"
            : "operation";
      scrollRef.current?.scrollTo({
        y: Math.max(0, (positions.current[group] ?? 0) - 20),
        animated: true,
      });
      return;
    }
    try {
      app.compute();
      setError("");
      router.replace("/result");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Perhitungan gagal. Periksa parameter.",
      );
    }
  };
  return (
    <Screen scrollRef={scrollRef}>
      <Heading
        eyebrow="DATA KASUS"
        title="Siapkan pemisahan"
        description="Fraksi mol komponen ringan. Isian menerima titik atau koma desimal."
      />
      <WorkflowNav active="data" />
      {app.storageError && <Note error>{app.storageError}</Note>}
      <Section title="Profil dan model">
        <View style={styles.horizontal}>
          <Button
            label="Penelitian · q = 1"
            variant={app.profile === "research" ? "primary" : "secondary"}
            onPress={() => {
              app.setProfile("research");
              setError("");
            }}
          />
          <Button
            label="Umum · q = 0…1"
            variant={app.profile === "general" ? "primary" : "secondary"}
            onPress={() => {
              app.setProfile("general");
              setError("");
            }}
          />
        </View>
        <Note>
          {app.profile === "research"
            ? "Biner hipotetik A/B · α konstan · CMO · cair jenuh (q=1). F wajib positif. Maksimum 60 langkah MT."
            : "Model umum α konstan/CMO dengan q=0…1. Data dan riwayat dari versi sebelumnya tetap dapat digunakan."}
        </Note>
        <View style={styles.horizontal}>
          {(["mccabe", "fug"] as const).map((method) => (
            <Button
              key={method}
              label={method === "mccabe" ? "McCabe–Thiele" : "FUG"}
              variant={app.method === method ? "primary" : "secondary"}
              onPress={() => {
                app.setMethod(method);
                setError("");
              }}
            />
          ))}
        </View>
        <Text style={styles.caption}>
          {methodName(app.method)} · {app.caseId ?? "Kasus mandiri"}
        </Text>
        <Button
          variant="quiet"
          label="Isi data demonstrasi"
          icon="flask-outline"
          disabled={!app.ready}
          onPress={() => {
            app.demo();
            setDemoUsed(true);
            setSubmitted(false);
            setTouched({});
            setError("");
          }}
        />
        {demoUsed && (
          <Text style={styles.caption}>
            Contoh α konstan untuk belajar; semua hasil dihitung saat tombol
            Hitung ditekan.
          </Text>
        )}
      </Section>
      <View
        style={groupStyle("composition")}
        onLayout={(event) => {
          positions.current.composition = event.nativeEvent.layout.y;
        }}
      >
        <Section
          title={`01 · Campuran dan target — ${status(["zF", "xD", "xB"])}`}
        >
          <Field
            label="Umpan"
            symbol="zF · mol/mol"
            value={app.fields.zF}
            onChange={(v) => change("zF", v)}
            error={fieldError("zF")}
            help="0 < xB < zF < xD < 1"
          />
          <Field
            label="Distilat"
            symbol="xD · mol/mol"
            value={app.fields.xD}
            onChange={(v) => change("xD", v)}
            error={fieldError("xD")}
          />
          <Field
            label="Produk bawah"
            symbol="xB · mol/mol"
            value={app.fields.xB}
            onChange={(v) => change("xB", v)}
            error={fieldError("xB")}
          />
        </Section>
      </View>
      <View
        style={groupStyle("feed")}
        onLayout={(event) => {
          positions.current.feed = event.nativeEvent.layout.y;
        }}
      >
        <Section
          title={`02 · Umpan — ${status(["q", ...(app.profile === "research" || app.fields.F.trim() ? ["F" as const] : [])])}`}
        >
          <Field
            label="Fraksi cair umpan"
            symbol="q · tanpa satuan"
            value={app.fields.q}
            onChange={(v) => change("q", v)}
            editable={app.profile !== "research"}
            error={fieldError("q")}
            help={
              app.profile === "research"
                ? "Tetap q = 1: cair jenuh pada profil penelitian."
                : "q = 1: cair jenuh · q = 0: uap jenuh"
            }
          />
          <Field
            label="Laju alir umpan"
            symbol="F · kmol/jam"
            value={app.fields.F}
            onChange={(v) => change("F", v)}
            optional={app.profile !== "research"}
            error={fieldError("F")}
            help={
              app.profile === "research"
                ? "Nilai awal 100 kmol/jam; sesuaikan dengan kasus. Harus positif."
                : "Kosongkan jika aliran D dan B tidak diperlukan."
            }
          />
        </Section>
      </View>
      <View
        style={groupStyle("operation")}
        onLayout={(event) => {
          positions.current.operation = event.nativeEvent.layout.y;
        }}
      >
        <Section
          title={`03 · Kesetimbangan dan operasi — ${status(["alpha", "R"])}`}
        >
          <Field
            label="Volatilitas relatif"
            symbol="α · tanpa satuan"
            value={app.fields.alpha}
            onChange={(v) => change("alpha", v)}
            error={fieldError("alpha")}
            help="α > 1, dengan komponen B sebagai acuan (αB = 1)."
          />
          <Field
            label="Rasio refluks operasi"
            symbol="R · mol/mol"
            value={app.fields.R}
            onChange={(v) => change("R", v)}
            error={fieldError("R")}
            help="R harus lebih besar dari Rmin agar tahap hingga dapat dihitung."
          />
          {rmin !== null && (
            <Text style={styles.caption}>
              Rmin dari model: {fmt(rmin, 8)}. Nilai ini dihitung dari input
              aktif.
            </Text>
          )}
        </Section>
      </View>
      <View style={{ gap: 12 }}>
        {error && <Note error>{error}</Note>}
        {app.result && (
          <Note>
            Hasil tersedia untuk input ini. Mengubah angka akan menandai hasil
            sebagai perlu dihitung ulang.
          </Note>
        )}
        <Button
          label="Hitung kolom"
          icon="calculator-outline"
          disabled={!app.ready}
          onPress={run}
        />
        <Button
          label="Lihat diagram proses"
          variant="secondary"
          icon="git-branch-outline"
          onPress={() => router.replace("/process")}
        />
        <Text style={styles.caption}>
          Reboiler termasuk tahap; kondensor total tidak. Input terakhir
          disimpan lokal.
        </Text>
      </View>
    </Screen>
  );
}
