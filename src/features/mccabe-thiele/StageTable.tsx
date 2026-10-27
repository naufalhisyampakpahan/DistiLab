import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, styles } from "../../components/ui";
import { colors } from "../../theme";
import type { McCabeResult } from "../../types";
import { fmt } from "../../utils/format";
export function StageTable({
  result,
  selectedStage,
  onStageSelect,
}: {
  result: McCabeResult;
  selectedStage?: number | null;
  onStageSelect?: (stage: number) => void;
}) {
  const [limit, setLimit] = useState(30);
  const vertical = useRef<ScrollView>(null);
  useEffect(() => {
    if (!selectedStage) return;
    setLimit((current) =>
      Math.max(current, Math.ceil(selectedStage / 30) * 30),
    );
    const frame = requestAnimationFrame(() =>
      vertical.current?.scrollTo({
        y: Math.max(0, (selectedStage - 2) * 49),
        animated: false,
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selectedStage]);
  useEffect(() => {
    setLimit(Math.max(30, Math.ceil((selectedStage ?? 1) / 30) * 30));
  }, [result]);
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.caption}>
        Tahap dari puncak kolom. Baris terakhir mempertahankan langkah
        kesetimbangan penuh; fraksi tahap dihitung dengan interpolasi horizontal
        menuju xB. Geser tabel ke samping untuk melihat semua kolom. x/y adalah
        fraksi mol; fraksi tahap bukan efisiensi tray.
      </Text>
      <ScrollView horizontal>
        <ScrollView
          ref={vertical}
          nestedScrollEnabled
          style={{ maxHeight: 380 }}
        >
          <View>
            <View
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              {[
                "Tahap",
                "Bagian",
                "x awal",
                "y awal",
                "x VLE",
                "y akhir",
                "Fraksi",
              ].map((s, i) => (
                <Text
                  key={s}
                  style={[
                    styles.tableHeader,
                    { width: i === 1 ? 100 : 88, paddingHorizontal: 8 },
                  ]}
                >
                  {s}
                </Text>
              ))}
            </View>
            {result.stages.slice(0, limit).map((stage) => (
              <Pressable
                key={stage.number}
                accessibilityRole="button"
                accessibilityLabel={`Pilih tahap ${stage.number}, ${stage.section}`}
                accessibilityState={{
                  selected: stage.number === selectedStage,
                }}
                onPress={() => onStageSelect?.(stage.number)}
                style={{
                  flexDirection: "row",
                  minHeight: 48,
                  backgroundColor:
                    stage.number === selectedStage
                      ? colors.accentLight
                      : colors.surface,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                {[
                  String(stage.number),
                  stage.section === "rectifying" ? "Atas" : "Bawah",
                  fmt(stage.start.x),
                  fmt(stage.start.y),
                  fmt(stage.equilibrium.x),
                  fmt(stage.end.y),
                  fmt(stage.fraction),
                ].map((v, i) => (
                  <Text
                    selectable
                    key={i}
                    style={[
                      styles.tableCell,
                      { width: i === 1 ? 100 : 88, paddingHorizontal: 8 },
                    ]}
                  >
                    {v}
                  </Text>
                ))}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
      {limit < result.stages.length && (
        <Button
          variant="secondary"
          label={`Tampilkan tahap berikutnya (${result.stages.length - limit} tersisa)`}
          onPress={() => setLimit((n) => n + 30)}
        />
      )}
    </View>
  );
}
