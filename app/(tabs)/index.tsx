import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Button,
  Empty,
  Heading,
  Note,
  Screen,
  Section,
  styles,
} from "../../src/components/ui";
import { useApp } from "../../src/state/AppContext";
import { colors } from "../../src/theme";
import { dateTime, fmt, methodName } from "../../src/utils/format";
export default function Home() {
  const app = useApp();
  const last = app.studies[0];
  return (
    <Screen>
      <Heading
        eyebrow="DISTILAB 1.1 · LABORATORIUM DISTILASI"
        title="Dari proses ke pemahaman."
        description="Jelajahi kolom, telusuri setiap tahap, dan verifikasi hasil untuk penelitianmu."
      />
      <Button
        label="Kasus penelitian baru"
        icon="add-outline"
        disabled={!app.ready}
        onPress={() => {
          app.newCase("research");
          router.push("/process");
        }}
      />
      <View style={{ height: 12 }} />
      <Button
        label="Lanjutkan kasus aktif"
        icon="git-branch-outline"
        variant="secondary"
        disabled={!app.ready}
        onPress={() => router.push("/process")}
      />
      <View style={{ height: 28 }} />
      <Section title="Verifikasi untuk penelitian">
        <View
          style={[styles.panel, { backgroundColor: colors.subtle, gap: 12 }]}
        >
          <Text style={styles.sectionTitle}>27 kasus. Satu paket hasil.</Text>
          <Text style={styles.body}>
            Jalankan C01–C27, periksa 162 keluaran terhadap referensi
            independen, dan ekspor XLSX untuk Excel.
          </Text>
          <Button
            label="Jalankan paket verifikasi"
            icon="checkmark-done-outline"
            onPress={() => router.push("/verification")}
          />
          <Text style={styles.caption}>
            α konstan · q=1 · 9 kondisi batas · data dan versi run tercatat
          </Text>
        </View>
      </Section>
      <Section title="Metode perhitungan">
        {(["mccabe", "fug"] as const).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            disabled={!app.ready}
            accessibilityLabel={methodName(m)}
            onPress={() => {
              app.setMethod(m);
              router.push("/process");
            }}
            style={({ pressed }) => [
              styles.panel,
              { gap: 8, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text style={[styles.sectionTitle, { flex: 1 }]}>
                {methodName(m)}
              </Text>
              <Ionicons
                name="arrow-forward-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.body}>
              {m === "mccabe"
                ? "Tahap demi tahap dari diagram kesetimbangan x–y."
                : "Estimasi tahap minimum, refluks minimum, dan tahap operasi."}
            </Text>
            <Text style={styles.caption}>
              {m === "mccabe"
                ? "Metode grafis · volatilitas relatif konstan"
                : "Metode shortcut · Fenske + Underwood + Gilliland"}
            </Text>
          </Pressable>
        ))}
      </Section>
      <Section title="Studi terakhir">
        {app.storageError ? (
          <Note error>{app.storageError}</Note>
        ) : last ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              app.restore(last);
              router.push("/result");
            }}
            style={[styles.panel, { gap: 8 }]}
          >
            <Text style={styles.sectionTitle}>{last.name}</Text>
            <Text style={styles.caption}>
              {methodName(last.result.method)} · {dateTime(last.createdAt)}
            </Text>
            <Text
              style={{ color: colors.primary, fontSize: 24, fontWeight: "600" }}
            >
              {fmt(last.result.N, 2)} tahap teoritis
            </Text>
            <Text style={styles.caption}>Buka hasil tersimpan</Text>
          </Pressable>
        ) : (
          <Empty
            title="Belum ada studi tersimpan"
            description="Setelah menghitung, simpan hasil dengan nama studi untuk dibuka kembali."
          />
        )}
        <Button
          variant="quiet"
          label="Lihat riwayat"
          icon="time-outline"
          onPress={() => router.push("/history")}
        />
      </Section>
      <Note>
        Seluruh perhitungan berjalan di perangkat. Profil penelitian memakai
        q=1; mode umum dan riwayat lama tetap mendukung 0 ≤ q ≤ 1.
      </Note>
    </Screen>
  );
}
