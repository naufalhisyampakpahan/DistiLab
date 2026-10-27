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
import { useApp } from "../src/state/AppContext";
export default function Methods() {
  const app = useApp();
  return (
    <Screen>
      <Heading
        title="Pilih pendekatan"
        description="Gunakan kondisi biner yang sama untuk membandingkan kedua metode."
      />
      <Section title="McCabe–Thiele">
        <Text style={styles.body}>
          Menentukan tahap teoritis melalui langkah horizontal menuju kurva VLE
          dan langkah vertikal menuju garis operasi.
        </Text>
        <Text style={styles.caption}>
          Tujuan: analisis tahap dan perkiraan lokasi umpan. Asumsi: constant
          molar overflow, α konstan, total condenser. Batasan: tanpa azeotrop,
          efisiensi tray, atau hidraulika.
        </Text>
        <Button
          label="Gunakan McCabe–Thiele"
          onPress={() => {
            app.setMethod("mccabe");
            router.push("/input");
          }}
        />
      </Section>
      <View
        style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 24 }}
      />
      <Section title="Fenske–Underwood–Gilliland">
        <Text style={styles.body}>
          Menghitung Nmin pada total reflux, Rmin melalui akar Underwood, dan
          tahap operasi melalui korelasi Molokanov.
        </Text>
        <Text style={styles.caption}>
          Tujuan: estimasi awal rancangan kolom. Asumsi: α konstan, biner, 0 ≤ q
          ≤ 1. Batasan: korelasi empiris; tidak menentukan lokasi umpan.
        </Text>
        <Button
          label="Gunakan FUG"
          onPress={() => {
            app.setMethod("fug");
            router.push("/input");
          }}
        />
      </Section>
      <Note>
        Reboiler kesetimbangan termasuk tahap; total condenser tidak dihitung.
        Mode multikomponen belum diaktifkan karena belum diverifikasi.
      </Note>
    </Screen>
  );
}
