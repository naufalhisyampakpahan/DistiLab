import { useEffect, useState } from "react";
import { AccessibilityInfo, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { ColumnDiagram } from "./ColumnDiagram";
import { McCabeChart } from "./McCabeChart";
import { Button, Note, Row, styles } from "./ui";
import { StageTable } from "../features/mccabe-thiele/StageTable";
import type { McCabeResult } from "../types";
import { fmt } from "../utils/format";

export interface StageExplorerProps {
  result: McCabeResult;
  selectedStage: number;
  onStageSelect: (stage: number) => void;
}

export function StageExplorer({
  result,
  selectedStage,
  onStageSelect,
}: StageExplorerProps) {
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const total = Math.max(0, result.staircase.length - 1);
  const active =
    result.stages[Math.max(0, selectedStage - 1)] ?? result.stages[0];
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) {
          setReduceMotion(value);
          if (value) setPlaying(false);
        }
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        setReduceMotion(value);
        if (value) setPlaying(false);
      },
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    setPlaying(false);
    setStep(null);
  }, [result]);
  useEffect(() => {
    if (!playing || reduceMotion) return;
    const timer = setTimeout(() => {
      const next = Math.min(total, (step ?? 0) + 1);
      setStep(next);
      onStageSelect(Math.max(1, Math.ceil(next / 2)));
      if (next === total) setPlaying(false);
    }, 750);
    return () => clearTimeout(timer);
  }, [playing, step, reduceMotion, total, onStageSelect]);
  const select = (number: number) => {
    setPlaying(false);
    setStep(null);
    onStageSelect(number);
  };
  const move = (direction: number) => {
    setPlaying(false);
    const next = Math.max(
      0,
      Math.min(total, (step ?? (selectedStage - 1) * 2) + direction),
    );
    setStep(next);
    onStageSelect(Math.max(1, Math.ceil(next / 2)));
  };
  return (
    <View style={{ gap: 14 }}>
      <McCabeChart
        result={result}
        selectedStage={selectedStage}
        onStageSelect={select}
        playbackStep={step}
      />
      <View style={styles.horizontal}>
        <Button
          label="Sebelumnya"
          variant="secondary"
          disabled={step === 0}
          onPress={() => move(-1)}
        />
        <Button
          label="Berikutnya"
          variant="secondary"
          disabled={step === total}
          onPress={() => move(1)}
        />
        <Button
          label={playing ? "Jeda" : "Putar"}
          disabled={reduceMotion}
          onPress={() => {
            if (!playing && (step === null || step >= total)) {
              setStep(0);
              onStageSelect(1);
            }
            setPlaying((value) => !value);
          }}
        />
        <Button
          label="Reset penahapan"
          variant="quiet"
          onPress={() => {
            setPlaying(false);
            setStep(0);
            onStageSelect(1);
          }}
        />
        <Button
          label="Tampilkan semua tahap"
          variant="quiet"
          onPress={() => {
            setPlaying(false);
            setStep(null);
          }}
        />
      </View>
      <View
        style={[
          styles.horizontal,
          { justifyContent: "space-between", minHeight: 48 },
        ]}
      >
        <Text style={styles.body}>Kurangi animasi</Text>
        <Switch
          accessibilityLabel="Kurangi animasi penahapan"
          value={reduceMotion}
          onValueChange={(value) => {
            setReduceMotion(value);
            if (value) setPlaying(false);
          }}
        />
      </View>
      <Text
        accessibilityLiveRegion={playing ? "none" : "polite"}
        style={styles.caption}
      >
        {step === null
          ? "Seluruh jejak ditampilkan."
          : step === 0
            ? "Mulai dari komposisi distilat."
            : `Langkah ${step}/${total}: tahap ${Math.ceil(step / 2)}, ${step % 2 ? "horizontal menuju kesetimbangan" : "vertikal menuju garis operasi"}.`}
      </Text>
      {reduceMotion && (
        <Note>
          Animasi otomatis dimatikan. Gunakan Sebelumnya dan Berikutnya untuk
          menelusuri hitungan.
        </Note>
      )}
      {active && (
        <View style={styles.panel}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Tahap terpilih {active.number}
            {active.number === result.feedStage ? " · umpan" : ""}
          </Text>
          <Row label="Bagian kolom" value={active.section} />
          <Row
            label="x cair kesetimbangan"
            value={fmt(active.equilibrium.x, 6)}
          />
          <Row label="y uap masuk" value={fmt(active.start.y, 6)} />
          <Row
            label={
              active.number === result.stages.length
                ? "y pada titik terminal"
                : "y setelah garis operasi"
            }
            value={fmt(active.end.y, 6)}
          />
          <Row label="Fraksi tahap" value={fmt(active.fraction, 6)} />
          <Text style={styles.caption}>
            Ketuk baris tabel untuk memilih tahap yang sama pada grafik. Tahap
            terakhir memakai interpolasi horizontal; penahapan ini menjelaskan
            hitungan kesetimbangan.
          </Text>
        </View>
      )}
      <Button
        label={showDiagram ? "Tutup diagram tahap" : "Buka diagram tahap"}
        variant="secondary"
        onPress={() => setShowDiagram((value) => !value)}
      />
      {showDiagram && (
        <ColumnDiagram
          input={result.input}
          result={result}
          selectedStage={selectedStage}
          onSelect={(part) =>
            router.push({ pathname: "/input", params: { section: part } })
          }
        />
      )}
      <StageTable
        result={result}
        selectedStage={selectedStage}
        onStageSelect={select}
      />
    </View>
  );
}
