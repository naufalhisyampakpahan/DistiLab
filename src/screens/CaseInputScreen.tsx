import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  ChoiceGroup,
  Disclosure,
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
  const hadResult = useRef(Boolean(app.result));
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  useEffect(() => {
    if (app.result) setNeedsRecalculation(false);
    else if (hadResult.current) setNeedsRecalculation(true);
    hadResult.current = Boolean(app.result);
  }, [app.result]);
  const confirmReplace = (message: string, apply: () => void) => {
    if (Platform.OS === "web") {
      if (globalThis.confirm(message)) apply();
    } else {
      Alert.alert("Ganti data aktif?", message, [
        { text: "Batal", style: "cancel" },
        { text: "Ganti data", onPress: apply },
      ]);
    }
  };
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
      router.replace("/(tabs)/result");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Perhitungan gagal. Periksa parameter.",
      );
    }
  };
  return (
    <Screen
      scrollRef={scrollRef}
      footer={
        <Button label="Hitung kolom" disabled={!app.ready} onPress={run} />
      }
    >
      <Heading title={app.caseId ?? "Data kasus"} />
      <WorkflowNav active="data" />
      {app.storageError && <Note error>{app.storageError}</Note>}
      <ChoiceGroup
        label="Metode"
        value={app.method}
        options={[
          { value: "mccabe", label: "McCabe–Thiele" },
          { value: "fug", label: "FUG" },
        ]}
        onChange={(method) => {
          app.setMethod(method);
          setError("");
        }}
      />
      <Text style={[styles.caption, { marginVertical: 12 }]}>
        {app.profile === "research"
          ? "Penelitian · q = 1 · F wajib · maksimal 60 tahap"
          : "Umum · 0 ≤ q ≤ 1"}{" "}
        · α konstan / CMO
      </Text>
      <Disclosure title="Pengaturan model & data contoh">
        <ChoiceGroup
          label="Profil perhitungan"
          value={app.profile}
          options={[
            { value: "research", label: "Penelitian · q = 1" },
            { value: "general", label: "Umum · q = 0…1" },
          ]}
          onChange={(profile) => {
            app.setProfile(profile);
            setError("");
          }}
        />
        <Note>
          {app.profile === "research"
            ? "Biner hipotetik A/B · α konstan · CMO · cair jenuh (q=1). F wajib positif. Maksimum 60 langkah MT."
            : "Model umum α konstan/CMO dengan q=0…1. Data dan riwayat dari versi sebelumnya tetap dapat digunakan."}
        </Note>
        <Text style={styles.caption}>
          {methodName(app.method)} · {app.caseId ?? "Kasus mandiri"}
        </Text>
        <Button
          variant="quiet"
          label="Isi data demonstrasi"
          icon="flask-outline"
          disabled={!app.ready}
          onPress={() => {
            const apply = () => {
              app.demo();
              setDemoUsed(true);
              setSubmitted(false);
              setTouched({});
              setError("");
            };
            if (
              ["zF", "xD", "xB", "alpha", "R"].some((key) =>
                app.fields[key as keyof Fields].trim(),
              )
            ) {
              confirmReplace(
                "Data contoh akan mengganti parameter kasus ini. Lanjutkan?",
                apply,
              );
            } else apply();
          }}
        />
        <Button
          label="Kosongkan kasus"
          variant="quiet"
          onPress={() =>
            confirmReplace(
              "Kosongkan parameter kasus aktif? Studi yang sudah disimpan tidak dihapus.",
              () => {
                app.newCase(app.profile);
                setDemoUsed(false);
                setSubmitted(false);
                setTouched({});
                setError("");
                setNeedsRecalculation(false);
              },
            )
          }
        />
        {demoUsed && (
          <Text style={styles.caption}>
            Contoh α konstan untuk belajar; semua hasil dihitung saat tombol
            Hitung ditekan.
          </Text>
        )}
      </Disclosure>
      <View
        style={[{ marginTop: 12 }, groupStyle("composition")]}
        onLayout={(event) => {
          positions.current.composition = event.nativeEvent.layout.y;
        }}
      >
        <Section title="Komposisi komponen ringan">
          <Field
            label="Umpan"
            symbol="zF · mol/mol"
            value={app.fields.zF}
            onChange={(v) => change("zF", v)}
            error={fieldError("zF")}
            help="Fraksi mol, bukan persen: 0,5 berarti 50%. Urutan: 0 < xB < zF < xD < 1."
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
        <Section title="Umpan">
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
        <Section title="Kesetimbangan & operasi">
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
              Rmin dari model ≈ {fmt(rmin, 4)}. Nilai ini dihitung dari input
              aktif.
            </Text>
          )}
        </Section>
      </View>
      <View style={{ gap: 12 }}>
        {error && <Note error>{error}</Note>}
        {needsRecalculation && (
          <Note>
            Data berubah · perlu dihitung ulang. Hasil sebelumnya tidak
            ditampilkan untuk parameter baru.
          </Note>
        )}
        {app.result && (
          <Note>
            Hasil tersedia untuk input ini. Mengubah angka akan menandai hasil
            sebagai perlu dihitung ulang.
          </Note>
        )}
        <Button
          label="Lihat diagram proses"
          variant="quiet"
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
