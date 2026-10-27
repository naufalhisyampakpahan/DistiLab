import { router } from "expo-router";
import { Button, Empty, Screen } from "../src/components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Empty
        title="Halaman tidak ditemukan"
        description="Kembali ke beranda untuk melanjutkan perhitungan."
      />
      <Button label="Kembali ke beranda" onPress={() => router.replace("/")} />
    </Screen>
  );
}
