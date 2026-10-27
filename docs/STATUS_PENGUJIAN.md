# Status pengujian DistiLab

## Revisi 1.1 — 21 Oktober 2026

TypeScript dan 190 tes pada 17 suite lulus. Paket 27 kasus, sembilan kondisi batas, workbook referensi baru, regresi 30 kasus lama, serta interaksi utama browser diperiksa. APK 1.1 berhasil dibangun dan diverifikasi: versionCode 2, kunci sama dengan 1.0, bundle/font tertanam, empat ABI, serta integritas ZIP lulus. Expo Doctor cloud 19/21 lulus; peringatan native dan versi patch dicatat. Pengujian perangkat Android masih menunggu HP/AVD. Rincian aktual, checksum, batas bukti, dan langkah uji HP ada di [RELEASE_1_1.md](RELEASE_1_1.md).

## Arsip versi 1.0

Pemeriksaan dilakukan pada 14 Oktober 2026. Ini laporan hasil yang benar-benar dijalankan, bukan klaim validasi eksperimen.

## Hasil akhir

| Pemeriksaan | Hasil aktual |
|---|---|
| `npm run typecheck` | Lulus; strict TypeScript + noUncheckedIndexedAccess; exit 0 |
| `npm run test:coverage` | 9 suite, 138 tes lulus, 0 gagal; exit 0 |
| `npx expo install --check` | Dependensi sesuai SDK; exit 0 |
| `npx expo-doctor` | Awal: 21/21 lulus. Setelah folder native dibuat: 20/21; peringatan konfigurasi yang perlu disinkronkan lewat prebuild |
| `npm run export:android` | Bundle Hermes Android berhasil; exit 0; bukan APK |
| `npm run export:web` | Bundle web berhasil; exit 0 |
| EAS `apk` / `assembleRelease` | FINISHED; APK release 1.0.0/versionCode 1 berhasil dibangun |
| `scripts/verify-apk.ps1` | Tanda tangan, package, bundle offline, font, library ARM64, dan izin terverifikasi; exit 0 |
| UI browser | Alur input–hasil–grafik–sensitivitas–simpan–riwayat–CSV diperiksa |
| Android fisik/emulator | Belum diuji; perangkat/AVD tidak tersedia, driver akselerasi emulator belum terpasang |
| Pembanding eksperimen / simulator rigorous | Belum dilakukan |

Coverage modul yang dikumpulkan: 93,73% statements; 93,36% branches; 100% functions; 93,62% lines. Mesin: 91,14% lines; validasi: 100%; penyimpanan: 94,25%; CSV: 100%. Coverage ini tidak mengukur seluruh UI atau membuktikan ketepatan model terhadap eksperimen.

## Cakupan tes otomatis

- `calculations.test.ts`: 81 kasus VLE/invers, neraca, Fenske, Underwood, Gilliland, stepping MT, endpoint q, komposisi ekstrem, dekat minimum, nonkonvergensi, validasi, dan sensitivitas.
- `independent-invariants.test.ts`: 10 pemeriksaan rumus akar independen, fixture lain, konservasi, grafik, batas aliran, dan domain FUG.
- `storage.test.ts`: riwayat/draft, antrean tulis, round-trip hasil mesin, korupsi tanpa penimpaan.
- `export.test.ts`, `export-sharing.test.ts`: escaping CSV, formula injection, status invalid, File/Paths dan sharing native yang dimock, unduhan web.
- `chart.test.ts`: jalur terputus pada data invalid, rentang ekstrem, koordinat press Android/browser, dan regresi readout tanpa NaN.
- `app-state.test.tsx`: 7 integrasi provider dengan mesin nyata; hidrasi, input koma, koreksi, simpan/hapus, restore/gandakan, invalidasi hasil setelah input berubah.
- `format.test.ts`: angka ekstrem tidak ditampilkan sebagai 0/1 akibat pembulatan.
- `reproducibility.test.ts`: CSV mempertahankan presisi hasil MT/FUG, setiap tahap/koordinat dan metadata; titik gagal tidak menjadi hasil finite.

Mock penyimpanan dan sharing native memeriksa kontrak kode. Berbagi CSV melalui aplikasi Android belum diuji pada perangkat.

## Pemeriksaan antarmuka

Pratinjau memakai ekspor kode React Native yang sama dengan server statis lokal. Viewport diperiksa pada 320×740, 360×800, dan 480×900 piksel. Ini pengujian browser, bukan emulator Android.

1. Beranda, pilihan metode, formulir, dan navigasi bekerja. Input awal kosong; menekan hitung memberi pesan zF belum diisi tanpa meninggalkan formulir.
2. Data demonstrasi diberi label. zF `0,50` diterima; F=100 kmol/jam menghasilkan D/B sekitar 50 kmol/jam, residual komponen sekitar −1,42×10⁻¹⁴.
3. MT demonstrasi: N=9,3756; 10 tahap bulat; feed stage 5; Rmin=1,100000. Perbandingan FUG dihitung dari input sama.
4. Grafik MT: skala setara, tangga/kurva nyata, zoom/fokus/geser/kurva, dan inspeksi koordinat diperiksa. Bug readout NaN browser diperbaiki, ditambah tes regresi, lalu diuji ulang pada bundle terbaru; koordinat finite tampil.
5. Sensitivitas R=0,5–3 dengan 6 titik menghasilkan 4 layak dan 2 tidak layak. Pesan dan tabel sesuai; CSV diunduh dan keenam baris diperiksa.
6. “QA Demonstrasi MT” disimpan, tersedia setelah reload, dan dibuka kembali. Tombol kembali mengembalikan pengguna ke Riwayat.
7. FUG untuk q=0, α=2,5, komposisi demonstrasi, R=2,5: θ=1,75; Rmin=2,1; N=15,1228; 16 tahap bulat. Grafik FUG menghitung ulang 31 titik.
8. Metodologi dan sumber persamaan tersedia. Tidak ditemukan menu kosong pada alur yang diperiksa.

## Masalah dan pekerjaan yang belum selesai

- Uji pemakaian APK pada Android masih diperlukan. SDK Android tersedia, tetapi tidak ada perangkat terhubung/AVD siap dan driver akselerasi emulator belum terpasang. Tidak dilakukan perubahan driver/virtualisasi komputer.
- APK mandiri sudah tersedia. Publikasi Play Store dan validasi terhadap eksperimen belum dilakukan.
- `npm audit` masih melaporkan 65 advisory dependensi (16 moderate, 49 high), sebagian besar merambat melalui toolchain Expo/Metro/Jest dan beberapa dependensi Router. `npm audit fix` yang menjaga kompatibilitas telah dijalankan dan tidak menyelesaikannya. Saran `--force` mengganti versi utama Expo/Router/Jest di luar SDK 57 sehingga tidak dijalankan. Pemeriksaan kompatibilitas lulus; audit keamanan belum bersih. Tinjau pembaruan upstream yang kompatibel sebelum distribusi produksi.
- Multikomponen belum aktif. FUG dibatasi pada feed pinch dalam interval produk; kondisi di luar domain dapat dicoba dengan MT, sesuai pesan batasan.

Uji berikutnya di HP: pasang APK, keyboard angka/koma, Android Back, layar kecil, grafik, riwayat setelah menutup aplikasi, pilihan aplikasi tujuan CSV, dan hitung setelah jaringan dimatikan. Catat perangkat, versi Android/aplikasi, input, waktu, dan hasil aktual; jangan menganggap laporan ini sebagai bukti pengujian HP.

## APK final — 14 Oktober 2026

- Berkas: `artifacts/DistiLab-1.0.0.apk`, 102.783.702 byte.
- Build EAS: `fd2ff447-b344-4303-b777-21a686635af2`; status FINISHED. [Detail build](https://expo.dev/accounts/naufalpakpahan/projects/distilab/builds/fd2ff447-b344-4303-b777-21a686635af2).
- Build selesai pada 14 Oktober 2026, 04:01 WIB (waktu server UTC: 2026-10-13T21:01:39Z).
- Lingkungan EAS: `ubuntu-26.04-jdk-17-ndk-r27b-sdk-57`; Gradle 9.3.1; NDK 27.1.12297006; Node 22.23.1.
- Package: `id.distilab.app`; versionName `1.0.0`; versionCode `1`; minSdk 24; target/compileSdk 36.
- ABI: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.
- `apksigner verify --verbose --print-certs`: valid, APK Signature Scheme v2; satu signer RSA 2048; bukan sertifikat debug. Kunci release dikelola EAS dan tidak disertakan dalam arsip sumber.
- SHA-256 sertifikat signer: `ae9b0c3e88f32700d5c0501276b8bb9e72f360f385a48dffe217e82d1dcf403d`.
- `assets/index.android.bundle` ada dan berukuran 2.495.992 byte. Ionicons diverifikasi melalui hash isi font asli yang cocok dengan `res/CU.ttf`; optimisasi Android mengubah nama aset.
- APK tidak debuggable. Izin storage, overlay, microphone, dan vibrate yang tidak digunakan tidak ada pada manifest final. Manifest hanya mencantumkan INTERNET dan izin internal dynamic receiver milik aplikasi.
- Ikon DistiLab, tema terang, dan bundle release disertakan. Pembaruan OTA dinonaktifkan; APK tidak membutuhkan Expo Go atau Metro untuk memuat kode.
- Setelah persiapan APK, `npm test` dijalankan ulang: 138/138 lulus; TypeScript juga lulus.

SHA-256 APK:

```text
85f919f943c63e8aacc43bd9cad3c956a935b7e34c5848217ba942c5e6b9dafd
```

Hasil pemeriksaan mesin tersedia di `artifacts/apk-verification.json`, `apk-signature.txt`, dan `apk-metadata.txt`. Verifikasi paket dan tanda tangan tidak menggantikan pengujian pemakaian aplikasi pada HP fisik.
