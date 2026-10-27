import { useState } from "react";
import { router } from "expo-router";
import { Linking, Pressable, Text } from "react-native";
import {
  Heading,
  Button,
  Note,
  Row,
  Screen,
  Section,
  styles,
} from "../../src/components/ui";
import { ASSUMPTIONS, ENGINE_VERSION } from "../../src/types";
const references = [
  {
    title: "Skogestad (1997) · Tutorial distilasi NTNU",
    url: "https://skoge.folk.ntnu.no/publications/1997/dist_plenary/submitted_version/dist_plenary.pdf",
    detail: "Hubungan VLE dan asumsi proses distilasi.",
  },
  {
    title: "University of Waterloo · Distillation Column",
    url: "https://chemengvirtual.uwaterloo.ca/distillation-lab/components/distillation-column.html",
    detail: "Garis operasi, q-line, dan hubungan aliran internal.",
  },
  {
    title: "University of Waterloo · Design and Optimization",
    url: "https://chemengvirtual.uwaterloo.ca/distillation-lab/design.html",
    detail:
      "Fenske; Underwood dengan αHK = 1 dan q sebagai fraksi cair. Korelasi Gilliland pada halaman ini berbeda dari Molokanov yang digunakan DistiLab.",
  },
  {
    title:
      "Soliman (2009) · A Shortcut Method for Binary Distillation Column Design",
    url: "https://direct.ksu.edu.sa/bitstreams/45d92811-c07a-4cc0-9222-67e722e94330/download",
    detail:
      "J. King Saud Univ., 21(1), 1–5. Persamaan (1): bentuk Molokanov dengan koefisien 54,4 dan 117,2.",
  },
  {
    title: "Expo · Dokumentasi SDK 57",
    url: "https://docs.expo.dev/versions/v57.0.0/",
    detail: "Kompatibilitas modul native, React Native, dan Expo Go.",
  },
];
export default function Methodology() {
  const [error, setError] = useState("");
  return (
    <Screen>
      <Heading
        eyebrow={`DISTILAB · MESIN ${ENGINE_VERSION}`}
        title="Metode & konvensi"
        description="Model ideal untuk perhitungan dan analisis sensitivitas distilasi biner."
      />
      <Section title="Pemeriksaan referensi">
        <Button
          label="Paket verifikasi · 27 kasus"
          variant="secondary"
          onPress={() => router.push("/verification")}
        />
      </Section>
      <Section title="Profil penelitian 1.1">
        <Note>
          Biner hipotetik A/B, α konstan, CMO, F wajib positif dan umpan cair
          jenuh q=1. Penahapan MT dibatasi 60 langkah. Mode umum tetap mendukung
          q=0…1 dan riwayat versi lama.
        </Note>
        <Text style={styles.body}>
          Paket C01–C27 memakai α=2/2,5/3, zF=0,3/0,5/0,7 dan R/Rmin=1,2/1,5/2;
          F=100 kmol/jam, xD=0,95 dan xB=0,05. Setiap hasil dihitung oleh mesin
          aplikasi.
        </Text>
        <Text style={styles.caption}>
          Pembanding internal merupakan implementasi referensi terpisah dari
          persamaan q=1, dengan versi yang tercatat. Pemetaan terhadap workbook
          27 kasus yang disebut di chat belum diverifikasi dari berkas aslinya.
          Ekspor membawa keterangan asal referensi tersebut.
        </Text>
        <Text selectable style={styles.body}>
          Kriteria kontinu: |App−Ref| ≤ 10⁻⁸ + 10⁻⁶|Ref|. N_MT bulat harus sama
          persis. 27 kasus × 6 keluaran = 162 pembandingan; sembilan kondisi
          batas diperiksa terpisah.
        </Text>
        <Text style={styles.caption}>
          Hasil MT fraksional tetap tersedia untuk menelusuri interpolasi. N_MT
          dalam paket verifikasi adalah ceil(N), termasuk reboiler.
        </Text>
      </Section>
      <Section title="Definisi variabel">
        {[
          ["zF", "Fraksi mol komponen ringan dalam umpan"],
          ["xD", "Fraksi mol komponen ringan dalam distilat"],
          ["xB", "Fraksi mol komponen ringan dalam produk bawah"],
          ["q", "Fraksi cair termal umpan; 0 ≤ q ≤ 1"],
          ["α", "Volatilitas relatif light key terhadap heavy key"],
          ["R", "L/D: rasio refluks terhadap distilat"],
          ["F, D, B", "Laju molar umpan, distilat, bawah (kmol/jam)"],
          ["N, Nmin", "Tahap operasi dan tahap minimum teoritis"],
          ["θ", "Akar Underwood dengan 1 < θ < α"],
        ].map(([k, v]) => (
          <Row key={k} label={k ?? ""} value={v ?? ""} />
        ))}
      </Section>
      <Section title="Model kesetimbangan">
        <Text selectable style={styles.body}>
          {"y = αx / [1 + (α−1)x]\nx = y / [α−(α−1)y]"}
        </Text>
        <Text style={styles.caption}>
          Komposisi komponen berat adalah 1−x atau 1−y. Model tidak mencakup
          azeotrop; α tidak berubah terhadap komposisi atau suhu.
        </Text>
      </Section>
      <Section title="McCabe–Thiele">
        <Text selectable style={styles.body}>
          {
            "Rectifying: y = [R/(R+1)]x + xD/(R+1)\nq-line: y = [q/(q−1)]x − zF/(q−1)\nq = 1: garis vertikal x = zF\nq = 0: garis horizontal y = zF"
          }
        </Text>
        <Text style={styles.body}>
          Feed pinch adalah perpotongan q-line dan kurva VLE. Garis rectifying
          minimum melalui (xD,xD) dan pinch. Garis stripping operasi melalui
          (xB,xB) dan perpotongan rectifying dengan q-line.
        </Text>
        <Text style={styles.caption}>
          Rmin = max(0, Rpinch, Rflow), dengan d = D/F = (zF−xB)/(xD−xB) dan
          Rflow = max(0, (1−q)/d − 1). R harus lebih besar dari Rmin; aliran uap
          stripping harus positif.
        </Text>
        <Text style={styles.caption}>
          Tahap dimulai dari (xD,xD). Langkah horizontal memakai invers VLE;
          garis operasi berganti ketika x kesetimbangan melewati perpotongan
          operasi. Tahap umpan adalah indeks perpindahan pertama, dihitung dari
          puncak. Pecahan tahap akhir menggunakan interpolasi linear horizontal
          menuju xB.
        </Text>
      </Section>
      <Section title="Fenske–Underwood–Gilliland">
        <Text selectable style={styles.body}>
          {
            "Nmin = ln[(xD/(1−xD))((1−xB)/xB)] / ln α\nΣ αᵢzᵢ/(αᵢ−θ) = 1−q\nRmin + 1 = Σ αᵢxD,ᵢ/(αᵢ−θ)\nαLK = α; αHK = 1\nX = (R−Rmin)/(R+1)\nY = 1−exp{[(1+54.4X)/(11+117.2X)]·[(X−1)/√X]}\nN = (Nmin+Y)/(1−Y)"
          }
        </Text>
        <Text style={styles.caption}>
          Akar Underwood dicari dengan bisection di antara singularitas 1 dan α.
          FUG dibatasi pada feed pinch di antara komposisi produk, 0 ≤ Rmin,
          serta aliran stripping positif. Kondisi di luar domain ini diarahkan
          ke McCabe–Thiele. Korelasi empiris tidak digunakan sebagai simulasi
          rigorous.
        </Text>
      </Section>
      <Section title="Konvensi & batas numerik">
        <Note>
          Total condenser tidak dihitung. Reboiler kesetimbangan termasuk dalam
          N. Jumlah bulat adalah ceil(N); kebutuhan tray teoritis bulat adalah
          ceil(N)−1.
        </Note>
        <Text style={styles.caption}>
          Batas default McCabe–Thiele: 2.000 tahap; toleransi 10⁻¹². Underwood:
          256 iterasi; toleransi 10⁻¹². Periksa metadata hasil untuk nilai
          aktual. Pada R mendekati Rmin, algoritma dapat mencapai batas iterasi
          atau ketelitian; hasil gagal tidak disamarkan menjadi angka.
        </Text>
      </Section>
      <Section title="Asumsi model">
        {ASSUMPTIONS.map((a) => (
          <Text key={a} style={styles.body}>
            • {a}
          </Text>
        ))}
        <Note>
          Pengujian otomatis memverifikasi implementasi numerik. Validasi
          terhadap data eksperimen atau perangkat lunak simulasi rigorous belum
          dilakukan. Tidak ada data campuran nyata yang disertakan.
        </Note>
        <Text style={styles.caption}>
          Mode multikomponen belum aktif. Pengembangan memerlukan komposisi
          seluruh komponen, volatilitas, light/heavy key, neraca komponen,
          distribusi non-key, pemilihan akar, dan pengujian terpisah.
        </Text>
      </Section>
      <Section title="Referensi">
        {references.map((ref) => (
          <Pressable
            key={ref.url}
            accessibilityRole="link"
            onPress={() =>
              void Linking.openURL(ref.url).catch(() =>
                setError(
                  "Referensi tidak dapat dibuka. Periksa koneksi internet.",
                ),
              )
            }
            style={{ gap: 6, marginBottom: 12, minHeight: 44 }}
          >
            <Text style={styles.link}>{ref.title}</Text>
            <Text style={styles.caption}>{ref.detail}</Text>
          </Pressable>
        ))}
        {error && <Note error>{error}</Note>}
        <Text style={styles.caption}>
          Penjelasan di halaman ini tersedia offline. Membuka sumber eksternal
          memerlukan koneksi internet.
        </Text>
      </Section>
    </Screen>
  );
}
