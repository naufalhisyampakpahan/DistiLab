# DistiLab

## DistiLab 1.10.0 — tampilan aplikasi lokal

Rilis ini memakai tampilan aplikasi lokal 1.1.0 sesuai pilihan pemilik: Beranda / Riwayat / Metodologi, dengan alur Proses → Data → Hasil. Versi paket Android dinaikkan menjadi **1.10.0 (versionCode 4)**. Mesin numerik tetap versi 1.1.0 karena persamaan dan algoritmanya tidak berubah.

[Unduh APK 1.10.0 dan berkas rilis](https://github.com/naufalhisyampakpahan/DistiLab/releases/tag/apk-v1.10.0). Desain FigCraft di [design/figcraft](design/figcraft) tersedia sebagai lampiran terpisah dan belum diterapkan ke UI APK ini.

Aplikasi Android React Native + Expo untuk perhitungan dan analisis sensitivitas distilasi biner. Semua persamaan dijalankan secara lokal dalam TypeScript. Tidak memerlukan akun, backend, API berbayar, atau mesin Python.

## Revisi 1.1

Alur Proses → Data → Hasil, diagram kolom yang dapat disentuh, penahapan interaktif, eksplorasi refluks, proyek dan perbandingan skenario, serta paket penelitian 27 kasus dengan ekspor XLSX tersedia. Profil penelitian memakai q=1 dan F positif. Profil umum serta data versi sebelumnya tetap didukung. Lihat [panduan revisi dan bukti pengujian](docs/RELEASE_1_1.md).

## APK mandiri

**APK rilis ini memakai versi 1.10.0 dan versionCode 4.** [Unduh melalui GitHub Releases](https://github.com/naufalhisyampakpahan/DistiLab/releases/tag/apk-v1.10.0). Package tetap id.distilab.app; Android 7.0/API 24 atau lebih baru. Identitas build, checksum, dan laporan verifikasi tersedia sebagai berkas pada halaman rilis.

Untuk penggunaan di HP, ikuti [panduan pemasangan APK](docs/BUILD_ANDROID.md). APK sudah menyertakan kode, font, dan aset; Expo Go atau server komputer tidak diperlukan. Pengujian pemakaian pada HP fisik masih belum dilakukan. SHA-256 dan pemeriksaan APK 1.10.0 tersedia pada halaman rilis; [laporan pengujian lama](docs/STATUS_PENGUJIAN.md) menyimpan bukti pengembangan 1.1.0.

## Menjalankan source

1. Buka PowerShell atau Terminal.
2. Masuk ke folder aplikasi:

   ```powershell
   cd "DistiLab"
   ```

3. Pasang Node.js LTS minimal 22.13, lalu instal dependensi sesuai lockfile:

   ```powershell
   npm ci
   ```

4. Pasang Expo Go yang mendukung SDK 57 pada Android. Hubungkan HP dan komputer ke Wi-Fi yang sama. Jalankan:

   ```powershell
   npm start
   ```

5. Buka Expo Go, pilih pemindai QR, lalu pindai kode yang muncul di terminal. Tunggu sampai aplikasi terbuka. Jika jaringan lokal memblokir koneksi, lihat [panduan koneksi Expo](https://docs.expo.dev/get-started/start-developing/).
6. Tekan **Kasus penelitian baru**, buka **Data**, pilih metode, lalu isi parameter. Tombol **Isi data demonstrasi** mengisi kasus ideal yang diberi label; angka hasil tetap dihitung oleh mesin.
7. Di hasil, buka **Grafik** atau **Perhitungan**, jalankan sensitivitas, lalu simpan studi atau ekspor CSV. Riwayat berada di tab bawah.

Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd start`, `npm.cmd ci`, dan seterusnya; tidak perlu mengubah kebijakan komputer. Untuk menghentikan server, tekan Ctrl+C di terminal.

Pratinjau pengembangan browser dapat dibuka dengan `npm run web`. Pemuatan bundle pertama dapat memerlukan beberapa menit. Untuk pratinjau dari bundle yang sudah dibuat, jalankan `npm run export:web`, lalu `npm run preview`, dan buka `http://127.0.0.1:8082`. Browser menggunakan kode React Native yang sama, tetapi pemeriksaan browser tidak menggantikan pengujian Android.

## Fitur perhitungan

- Formulir berlabel permanen, parameter dikelompokkan, input koma/titik, pesan validasi Bahasa Indonesia, dan parameter terakhir tersimpan.
- McCabe–Thiele: model VLE analitis dan invers, pinch, Rmin fisik, garis q untuk q=0/1 maupun di antaranya, garis operasi, tahap umpan, koordinat tangga asli, fraksi tahap terakhir, serta aliran produk opsional.
- FUG biner: Fenske, bisection Underwood, Gilliland–Molokanov, nilai sebelum pembulatan, jumlah tahap bulat, akar θ, X/Y, dan status numerik.
- Grafik SVG dengan skala x/y setara, grid, legenda, kontrol kurva, pembesaran, geser/fokus, dan inspeksi koordinat. Grafik FUG dihitung ulang terhadap R.
- Sensitivitas R, zF, xD, α, q: 2–201 titik, perhitungan ulang, tabel, dan grafik yang terputus pada titik tidak layak.
- Riwayat lokal: beri nama, buka kembali, cari, gandakan parameter, hapus, ekspor. Data korup dilaporkan dan tidak ditimpa diam-diam.
- CSV hasil dan sensitivitas mencakup input/output, asumsi, waktu, versi mesin, status, dan langkah/titik numerik. Android membuka lembar berbagi; browser mengunduh berkas.
- Perbandingan McCabe–Thiele/FUG pada kondisi sama, persamaan dan substitusi, serta metodologi offline.

Mode multikomponen belum diaktifkan. Tidak ada klaim validasi eksperimen atau data eksperimen palsu.

## Arsitektur dan direktori aktual

```text
distilab/
├── assets/                        # Ikon launcher PNG + sumber SVG
├── android/                       # Proyek native hasil Expo Prebuild
├── app/
│   ├── _layout.tsx                 # Stack Router + provider
│   ├── (tabs)/                    # Beranda, riwayat, metodologi
│   ├── methods.tsx
│   ├── input.tsx
│   ├── result.tsx
│   ├── sensitivity.tsx
│   └── +not-found.tsx
├── src/
│   ├── calculations/index.ts      # Mesin murni: VLE, MT, FUG, sensitivitas
│   ├── validation/index.ts        # Parser dan validasi domain
│   ├── components/                # Input/tombol, grafik SVG reusable
│   ├── features/fug/              # Kurva FUG
│   ├── features/mccabe-thiele/     # Tabel langkah per tahap
│   ├── state/AppContext.tsx       # Hooks, draft, hasil, riwayat
│   ├── storage/index.ts           # AsyncStorage, skema dan antrean tulis
│   ├── theme/index.ts             # Warna, spacing, tipografi
│   ├── types/index.ts             # Kontrak data dan asumsi
│   └── utils/                     # CSV, berbagi berkas, format angka
├── tests/                         # Numerik, invariant, storage, CSV, chart, state
├── docs/
│   ├── METODOLOGI.md
│   ├── VALIDASI.md
│   ├── BUILD_ANDROID.md
│   └── STATUS_PENGUJIAN.md
├── app.json
├── eas.json                       # Profil APK release internal
├── package.json
├── package-lock.json              # Versi reproducible
├── tsconfig.json                  # strict + noUncheckedIndexedAccess
└── jest.config.js                 # jest-expo
```

Mesin tidak mengimpor UI, penyimpanan, ataupun jaringan. UI mengonsumsi hasil bertipe; grafik memakai koordinat mesin. State menggunakan React Hooks dan Context. AsyncStorage menyimpan skema versi 1; antrean serial melindungi operasi baca–ubah–tulis. CSV menyimpan angka asli, tanpa bergantung pada pembulatan tampilan.

## Metode dan hasil demonstrasi

Input: zF=0,50; xD=0,95; xB=0,05; q=1,00; α=2,50; R=2,50. Ini model ideal α konstan, bukan campuran eksperimen nyata.

| Hasil | Nilai mesin |
|---|---:|
| Fenske Nmin | 6,4268662265 |
| Underwood θ | 1,4285714286 |
| Underwood Rmin | 1,1000000000 |
| Gilliland N | 9,7849563454 |
| McCabe–Thiele N | 9,3755717850 |
| Perkiraan tahap umpan MT | 5 dari puncak |
| Tahap bulat MT / FUG | 10 / 10 |

Total condenser tidak dihitung; reboiler kesetimbangan termasuk tahap. Nilai N desimal MT menggunakan interpolasi horizontal linear pada langkah terakhir. Fenske memakai logaritma; kedua nilai pecahan tidak wajib identik pada batas total reflux, sementara jumlah tahap bulat konsisten. Lihat [metodologi lengkap](docs/METODOLOGI.md) dan [pembanding independen](docs/VALIDASI.md).

## Pemeriksaan dan pengujian

Revisi 1.1: **190 tes dalam 17 suite lulus** dan TypeScript lulus. Paket baru menghasilkan 162/162 pembandingan sesuai serta 9/9 diagnosis batas sesuai; regresi Excel lama 30 kasus juga lulus. Ekspor web, sinkronisasi proyek native, dan build APK 1.1 berhasil. Tanda tangan, versi, bundle offline, font, dan integritas ZIP APK terverifikasi. Expo Doctor pada build cloud melaporkan 19/21 lulus dengan peringatan konfigurasi native dan enam versi patch yang lebih baru; detail ada dalam panduan revisi. Uji perangkat Android dan validasi eksperimen belum dilakukan. Audit keamanan dependensi versi sebelumnya belum bersih; detail ada di laporan status.

Jalankan dari folder aplikasi:

```powershell
npm run typecheck
npm test
npm run test:coverage
npx expo install --check
npx expo-doctor
npm run export:android
```

`typecheck` memeriksa strict typing. `test` memeriksa persamaan/domain, q endpoints, beberapa kasus independen, neraca, konvergensi, nilai ekstrem, sensitivitas invalid, grafik, penyimpanan dan ekspor. `export:android` memeriksa bundling Android; keluarannya **bukan APK** dan tidak membuktikan aplikasi sudah diuji pada HP.

Status perintah, jumlah tes aktual, pemeriksaan UI, dan keterbatasan lingkungan dicatat dalam [STATUS_PENGUJIAN.md](docs/STATUS_PENGUJIAN.md). Untuk memeriksa Android, pasang APK lalu coba input, grafik, navigasi kembali, riwayat setelah restart, berbagi CSV, dan hitung setelah jaringan dimatikan. Pengujian perangkat tetap perlu dilakukan sebelum penelitian pemakaian aplikasi.

## Batas matematis dan operasional

- Biner kontinu, light key lebih volatil; 0 < xB < zF < xD < 1; α > 1; 0 ≤ q ≤ 1; F > 0 jika diisi. Fraksi murni 0/1 dan α=1 ditolak pada perhitungan pemisahan.
- Constant molar overflow dan α konstan; tanpa azeotrop, efisiensi tray, diameter, pressure drop, atau neraca energi rigorous.
- Operasi tahap hingga memerlukan R > Rmin dan aliran uap stripping positif. MT memakai batas gabungan pinch/aliran; FUG mempertahankan persamaan Underwood, dengan feed pinch dalam interval produk. Kasus di luar domain FUG diarahkan ke MT.
- Toleransi bawaan 10⁻¹²; maksimum 2.000 langkah MT dan 256 iterasi Underwood. Kasus yang melebihi batas, mendekati singularitas, atau melampaui ketelitian floating point dilaporkan sebagai kegagalan, bukan hasil sukses.
- Gilliland adalah korelasi empiris. Kedua metode bukan ground truth eksperimen. Validasi model terhadap VLE nyata dan pembanding independen masih diperlukan.
- APK menyertakan bundle sehingga mesin, grafik, riwayat, dan pembuatan CSV dapat berjalan offline tanpa server pengembangan. Unduhan APK, instalasi dependensi pengembangan, dan membuka referensi eksternal memerlukan koneksi. Jika menggunakan Expo Go untuk pengembangan, bundle pertama perlu dimuat dari komputer.
- Riwayat berada di penyimpanan aplikasi/browser ini. Menghapus data aplikasi atau berganti perangkat tidak memindahkannya; ekspor CSV terlebih dahulu.

## Referensi yang digunakan

- [Waterloo: Design and Optimization](https://chemengvirtual.uwaterloo.ca/distillation-lab/design.html): Fenske dan dua persamaan Underwood dengan pembilang berbobot α.
- [Waterloo: Distillation Column](https://chemengvirtual.uwaterloo.ca/distillation-lab/components/distillation-column.html): garis operasi/q dan aliran internal.
- [Skogestad (1997), tutorial distilasi NTNU](https://skoge.folk.ntnu.no/publications/1997/dist_plenary/submitted_version/dist_plenary.pdf): VLE dan asumsi proses.
- [Soliman (2009), repositori King Saud University](https://direct.ksu.edu.sa/bitstreams/45d92811-c07a-4cc0-9222-67e722e94330/download): persamaan (1), pendekatan Molokanov 54,4/117,2 yang dipakai. Korelasi Gilliland pada halaman Waterloo berbeda dan tidak dipakai.
- [Skogestad, kuliah distilasi](https://skoge.folk.ntnu.no/septek/lectures/septek-sis2-distillation.pdf): konvensi tahap dan pinch.
- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) dan [instalasi Expo Router](https://docs.expo.dev/router/installation/): kompatibilitas SDK dan navigasi.

Penjelasan pemilihan persamaan, ketelitian, dan rancangan pengembangan multikomponen terdapat dalam dokumentasi metodologi.

## Isi cabang rilis dan build lokal

Sumber, tes, lockfile, dokumentasi, aset, proyek Android, dan desain tersedia di Git. Cache, node_modules, hasil build, log, kredensial, serta kunci penandatanganan tidak disertakan. Tautan artefak lokal dalam dokumentasi lama adalah catatan bukti pengembangan; unduhan yang tersedia di GitHub berada di halaman rilis.

Keystore tidak disimpan di Git. Build Android lokal memerlukan debug keystore pengembangan sendiri di `android/app/debug.keystore`; build rilis memakai kredensial EAS yang dikelola pemilik. Folder `design/` dikecualikan dari upload EAS agar dokumen desain tidak masuk paket build aplikasi.
