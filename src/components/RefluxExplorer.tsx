import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { calculateWithProfile } from "../research/profile";
import type { BinaryInput, CalculationResult } from "../types";
import { parseNumeric } from "../validation";
import { fmt } from "../utils/format";
import { McCabeChart } from "./McCabeChart";
import { FUGGraph } from "../features/fug/FUGGraph";
import { Button, Field, Metric, Note, styles } from "./ui";
import { colors } from "../theme";

const bounded = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function RefluxSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [width, setWidth] = useState(280);
  const latest = useRef({ min, max, onChange, width });
  latest.current = { min, max, onChange, width };
  const fromTouch = (x: number) => {
    const p = latest.current;
    if (!Number.isFinite(x)) return;
    const fraction = bounded((x - 14) / Math.max(1, p.width - 28), 0, 1);
    p.onChange(p.min + fraction * (p.max - p.min));
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => fromTouch(event.nativeEvent.locationX),
        onPanResponderMove: (event) => fromTouch(event.nativeEvent.locationX),
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );
  const fraction = bounded((value - min) / (max - min), 0, 1);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Slider rasio refluks"
      accessibilityValue={{
        min,
        max,
        now: bounded(value, min, max),
        text: `R ${fmt(value, 4)}`,
      }}
      accessibilityActions={[
        { name: "increment", label: "Tambah refluks" },
        { name: "decrement", label: "Kurangi refluks" },
      ]}
      onAccessibilityAction={(event) =>
        onChange(
          bounded(
            value +
              ((event.nativeEvent.actionName === "increment" ? 1 : -1) *
                (max - min)) /
                100,
            min,
            max,
          ),
        )
      }
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      {...responder.panHandlers}
      style={local.slider}
    >
      <View pointerEvents="none" style={local.track} />
      <View
        pointerEvents="none"
        style={[local.fill, { width: Math.max(0, fraction * (width - 28)) }]}
      />
      <View
        pointerEvents="none"
        style={[local.thumb, { left: fraction * (width - 28) }]}
      />
    </View>
  );
}

export function RefluxExplorer({
  result,
  profile,
  onApply,
}: {
  result: CalculationResult;
  profile: "research" | "general";
  onApply: (input: BinaryInput) => void;
}) {
  const [raw, setRaw] = useState(String(result.input.R));
  const [evaluated, setEvaluated] = useState(raw);
  useEffect(() => {
    setRaw(String(result.input.R));
    setEvaluated(String(result.input.R));
  }, [result]);
  useEffect(() => {
    const timer = setTimeout(() => setEvaluated(raw), 180);
    return () => clearTimeout(timer);
  }, [raw]);
  const outcome = useMemo(() => {
    try {
      const R = parseNumeric(evaluated, "Refluks R");
      return {
        value: calculateWithProfile(
          result.method,
          { ...result.input, R },
          profile,
        ),
        error: "",
      };
    } catch (error) {
      return {
        value: null,
        error:
          error instanceof Error
            ? error.message
            : "Pratinjau belum dapat dihitung.",
      };
    }
  }, [evaluated, result, profile]);
  const dirty = raw !== evaluated;
  const preview = dirty ? null : outcome.value;
  const min = Math.max(0, result.Rmin * 0.8),
    max = Math.min(
      Number.MAX_VALUE,
      Math.max(result.input.R * 2, result.Rmin * 3, 1),
    );
  const numeric = Number(raw.replace(",", "."));
  const sliderValue = Number.isFinite(numeric) ? numeric : result.input.R;
  return (
    <View style={{ gap: 16 }}>
      <Note>
        Eksplorasi sementara · R dasar {fmt(result.input.R, 6)}. Diagram dan
        hitungan di bawah mengikuti R yang sedang dicoba. Kasus dasar tetap
        tersimpan sampai Anda memilih skenario baru.
      </Note>
      <Field
        label="Refluks yang dicoba · R"
        symbol="tanpa satuan"
        value={raw}
        onChange={setRaw}
        help={`Rmin dasar ${fmt(result.Rmin, 8)}. Isian angka menerima presisi penuh; slider membantu eksplorasi.`}
        error={!dirty ? outcome.error : undefined}
      />
      <RefluxSlider
        value={sliderValue}
        min={min}
        max={max}
        onChange={(value) => setRaw(String(Number(value.toPrecision(12))))}
      />
      <View style={styles.horizontal}>
        <Button
          label="Kurangi R"
          variant="secondary"
          onPress={() => setRaw(String(Math.max(0, sliderValue - 0.05)))}
        />
        <Button
          label="Tambah R"
          variant="secondary"
          onPress={() => setRaw(String(sliderValue + 0.05))}
        />
        <Button
          label="Kembali ke R dasar"
          variant="quiet"
          onPress={() => setRaw(String(result.input.R))}
        />
      </View>
      {dirty && (
        <Text accessibilityLiveRegion="polite" style={styles.caption}>
          Input berubah · menghitung ulang pratinjau…
        </Text>
      )}
      {!dirty && outcome.error && (
        <Note error>
          {outcome.error} Grafik dan keluaran untuk input ini belum tersedia.
        </Note>
      )}
      {preview && (
        <>
          <View style={[styles.panel, styles.horizontal]}>
            <Metric
              label="N pratinjau"
              value={fmt(preview.N, 6)}
              unit="tahap"
            />
            <Metric
              label="Tahap bulat"
              value={String(preview.Nceil)}
              unit="tahap"
            />
            <Metric
              label="Perubahan N dari dasar"
              value={`${preview.N - result.N >= 0 ? "+" : ""}${fmt(preview.N - result.N, 6)}`}
            />
          </View>
          {preview.method === "mccabe" ? (
            <McCabeChart result={preview} />
          ) : (
            <FUGGraph result={preview} />
          )}
          <Button
            label="Jadikan skenario baru"
            icon="copy-outline"
            onPress={() => onApply({ ...preview.input })}
          />
          <Text style={styles.caption}>
            Skenario baru membuka Data dengan parameter ini. Beri nama dan
            simpan setelah diperiksa; input paket verifikasi baku tidak berubah.
          </Text>
        </>
      )}
    </View>
  );
}

const local = StyleSheet.create({
  slider: { minHeight: 48, justifyContent: "center", width: "100%" },
  track: {
    position: "absolute",
    height: 6,
    left: 14,
    right: 14,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  fill: {
    position: "absolute",
    height: 6,
    left: 14,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
