import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { CalculationResult } from "../types";
import { calculationSteps } from "../utils/calculationSteps";
import { colors } from "../theme";
import { Disclosure, styles } from "./ui";

export function CalculationWalkthrough({
  result,
}: {
  result: CalculationResult;
}) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.caption}>
        Cara membaca: rumus → substitusi → hasil. Angka tampilan dibulatkan
        sampai 4 desimal; perhitungan dan ekspor tetap memakai presisi penuh. ≈
        berarti mendekati.
      </Text>
      {calculationSteps(result).map((step, index) => (
        <Disclosure key={step.id} title={`${index + 1}. ${step.title}`}>
          <View style={s.equationBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View
                accessible
                accessibilityLabel={step.equation
                  .map((part) =>
                    typeof part === "string"
                      ? part
                      : `(${part.numerator}) dibagi (${part.denominator})`,
                  )
                  .join("")}
                style={s.equation}
              >
                {step.equation.map((part, i) =>
                  typeof part === "string" ? (
                    <Text selectable key={i} style={s.math}>
                      {part}
                    </Text>
                  ) : (
                    <View key={i} style={s.fraction}>
                      <Text selectable style={[s.math, s.numerator]}>
                        {part.numerator}
                      </Text>
                      <Text selectable style={s.math}>
                        {part.denominator}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            </ScrollView>
          </View>
          <Text style={styles.eyebrow}>SUBSTITUSI</Text>
          <Text selectable style={s.substitution}>
            {step.substitution}
          </Text>
          <View style={s.answer}>
            <Text selectable style={s.answerText}>
              {step.result}
            </Text>
          </View>
          <Text style={styles.body}>{step.explanation}</Text>
        </Disclosure>
      ))}
      <Disclosure title="Arti simbol">
        <Text style={styles.body}>
          zF: komposisi umpan · xD: komposisi distilat · xB: komposisi produk
          bawah. Semua komposisi adalah fraksi mol komponen ringan.
        </Text>
        <Text style={styles.body}>
          F, D, B: laju umpan, distilat, dan produk bawah (kmol/jam). R: rasio
          refluks. q: kondisi termal umpan (0 = uap jenuh; 1 = cair jenuh). α:
          volatilitas relatif.
        </Text>
        <Text style={styles.caption}>
          Rumus panjang dapat digeser mendatar; penjelasan dan hasil tetap
          mengikuti lebar layar.
        </Text>
      </Disclosure>
    </View>
  );
}

const s = StyleSheet.create({
  equationBox: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    padding: 8,
  },
  equation: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  math: {
    fontSize: 17,
    lineHeight: 28,
    color: colors.primary,
    fontWeight: "500",
  },
  fraction: { alignItems: "center", marginHorizontal: 4 },
  numerator: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingHorizontal: 6,
    textAlign: "center",
    alignSelf: "stretch",
  },
  substitution: {
    fontSize: 15,
    lineHeight: 26,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  answer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  answerText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.primary,
    fontVariant: ["tabular-nums"],
  },
});
