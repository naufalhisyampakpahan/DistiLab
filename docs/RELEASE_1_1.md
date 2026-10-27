# DistiLab 1.1

Revisi 21 Oktober 2026 menambahkan alur Proses → Data → Hasil, diagram kolom yang dapat disentuh, pilihan tahap yang tersinkron, pemutaran penahapan, eksplorasi refluks, serta perbandingan skenario tersimpan.

## APK final

[Unduh APK 1.1](https://expo.dev/artifacts/eas/Zv6vuZ9HMZDEetwI88nZWJwcP3Cd9S6_muEYGV2X_vA.apk). Salinan lokal: `artifacts/v1.1/DistiLab-1.1.0.apk`.

| Metadata | Nilai terverifikasi |
|---|---|
| Versi / versionCode | 1.1.0 / 2 |
| Package | id.distilab.app |
| Ukuran | 102.884.850 byte |
| Android | minimum API 24 / Android 7.0; target API 36 |
| Prosesor | arm64-v8a, armeabi-v7a, x86, x86_64 |
| Build EAS | 4a523d0a-5dcd-4df3-88ea-d94688345bbb, FINISHED |
| Waktu selesai | 21 Oktober 2026 23.11 WIB |
| Bundle offline | 2.597.140 byte; font Ionicons asli terverifikasi |
| Integritas / debug | CRC ZIP lulus; APK tidak debuggable |
| Izin | INTERNET dan izin receiver internal aplikasi |
| OTA Expo | Nonaktif pada manifest APK |

SHA-256 APK: `2349d23b1d128757c74450e3475315aeb6aaa4c91937757eb845dec17a3e9135`.

SHA-256 sertifikat: `ae9b0c3e88f32700d5c0501276b8bb9e72f360f385a48dffe217e82d1dcf403d`, sama dengan APK 1.0. Verifikasi penandatanganan lulus. Kunci privat tetap dikelola di EAS. Instalasi pembaruan dan pemakaian offline pada HP masih perlu diuji.

Workbook referensi baru memiliki SHA-256 `63674b4d5855fafd8933b9eefc151193c1ba271d9ebf8096694462e603763261`. Area Hasil_App diserahkan kosong agar hasil dari APK dapat diimpor.

## Memakai fitur baru

1. Pilih **Kasus penelitian baru**. Sentuh bagian diagram untuk membuka kelompok data yang sesuai.
2. Lengkapi komposisi, F, α, dan R. Profil penelitian menggunakan cair jenuh q=1, F positif, dan batas 60 langkah MT. Profil umum mempertahankan rentang q=0…1 dari versi sebelumnya.
3. Tekan **Hitung kolom**. Pada **Grafik**, pilih tahap di grafik atau tabel, buka diagram tahap, lalu gunakan Sebelumnya, Berikutnya, Putar, Jeda, dan Reset.
4. Pada **Eksplorasi**, coba R melalui slider atau isian angka. Nilai dan grafik mengikuti pratinjau. Pilih **Jadikan skenario baru**, hitung, beri nama, lalu simpan.
5. Di **Riwayat**, pilih dua studi untuk membandingkan input, hasil, dan dua jejak MT. Δ menyatakan B − A. Kasus dasar tetap tersedia.

## Menggunakan Excel

1. Dari Beranda, buka **Jalankan paket verifikasi**, lalu jalankan paket hingga 27/27 kasus selesai.
2. Periksa jumlah keluaran yang cocok dengan acuan kode dan diagnosis batas. Setiap run menyimpan versi mesin, dataset, waktu, input, dan lingkungan pelaksanaan. Browser ditandai web; APK ditandai android.
3. Tekan **Ekspor XLSX · 27 × 7**. Berkas hasil memiliki Hasil_App, Metadata, Input_Kasus, dan Uji_Batas.
4. Pada berkas hasil, salin hanya **Hasil_App A2:G28** ke area yang sama di workbook referensi yang disertakan. Jangan menyalin header.
5. Buka tab **Verifikasi** pada workbook referensi. Impor lengkap yang sesuai menghasilkan 27 kasus lulus dan 162 keluaran lulus. Tab **Audit** menyediakan pilihan C01–C27 dan jejak tahap.

Workbook referensi diserahkan dengan area impor kosong. Angka nol tetap diperiksa sebagai angka; kosong, teks, ID ganda, dan ID asing terdeteksi. Urutan baris boleh berubah karena pencocokan memakai ID.

Paket memakai dataset `chat-protocol-20261021-v1`: α=2/2,5/3, zF=0,3/0,5/0,7, dan R/Rmin=1,2/1,5/2; F=100 kmol/jam, xD=0,95, xB=0,05, q=1. Urutan kombinasi α → zF → R/Rmin. N_MT merupakan jumlah tahap bulat. Angka kontinu diekspor tanpa pembulatan tampilan.

Toleransi kontinu: |app − referensi| ≤ 10⁻⁸ + 10⁻⁶ × |referensi|. N_MT bulat harus sama persis. Kondensor total dikecualikan; reboiler kesetimbangan termasuk satu tahap.

Workbook ini merupakan **acuan baru** versi `excel-reference-20261021-v1` yang mengikuti parameter chat “Rancang Aplikasi Distilasi”. Lampiran 27 kasus asli dari chat tersebut belum tersedia sebagai berkas lokal. Kecocokan dengan acuan kode dan workbook baru dicatat terpisah dari pencocokan dengan lampiran asli.

## Bukti pemeriksaan

- TypeScript dan 190 tes dalam 17 suite lulus.
- Pemeriksaan Expo pada build cloud: 19/21 lulus. Dua peringatan berkaitan dengan konfigurasi Expo yang juga disimpan dalam proyek native dan enam versi patch yang lebih baru. Prebuild sudah menyinkronkan proyek Android sebelum upload; build memakai package-lock yang diuji, tanpa mengganti versi dependensi saat build. Versi patch yang disarankan server: @expo/metro-runtime 57.0.17, expo 57.0.31, expo-constants 57.0.22, expo-linking 57.0.13, expo-router 57.0.29, dan expo-sharing 57.0.24. Peringatan ini dicatat; pemeriksaan Expo tidak diklaim bersih.
- Paket baru: 27 kasus, 162 pembandingan cocok dengan acuan kode independen, dan 9/9 diagnosis kondisi batas sesuai.
- Workbook: 162 keluaran dan 1.038 koordinat tahap dibandingkan dengan mesin, 18 pemeriksaan alur impor/rekalkulasi lulus, dan tidak ditemukan galat formula dalam pemindaian. N_MT bulat sama persis; selisih maksimum N_FUG 9,670486633694964×10⁻¹² tahap (sekitar 5,11×10⁻¹¹%). Rekalkulasi diperiksa dengan Artifact Tool; Microsoft Excel desktop belum dijalankan.
- Regresi workbook lama 30 kasus: 30/30 pemeriksaan MT dan 30/30 FUG lulus. Galat maksimum N terhadap acuan lama: MT 3,552713678800501×10⁻¹⁵ tahap; FUG 2,312816604899126×10⁻¹² tahap. Jumlah tahap bulat sama. Kasus 24 memiliki acuan indeks umpan kosong, sementara mesin memberi 1; perbedaan konvensi ini dipertahankan.
- UI browser: paket dan ekspor, audit C14, pemilihan tahap umpan, diagram, reset/berikutnya/putar/jeda, R tidak layak, perhitungan ulang R, penyimpanan dua skenario, pembukaan kembali setelah memuat ulang, dan perbandingan diperiksa. Sensitivitas R=0,5…3 dengan enam titik menghasilkan empat titik layak dan dua diagnosis tidak layak; memilih titik R=2 menampilkan N≈10,38800148 serta tindakan skenario baru. Sentuhan umpan membuka kelompok Data yang sesuai dan mempertahankan input aktif.

Mesin persamaan inti tidak diubah dari versi 1.0. SHA-256 sumber mesin: `3f307dd2100ddf04e9ca0d55e91a1eca3e1771a895ee2e32d82819eb8e48f3f1`.

## Pengujian Android yang masih diperlukan

Tidak ada HP atau AVD tersedia pada komputer ini. Pengujian browser dan tanda tangan APK tidak membuktikan perilaku pada HP. Sesudah pemasangan, lakukan alur berikut dan catat hasil aktual:

| Pemeriksaan | Hasil aktual |
|---|---|
| Buka tanpa jaringan setelah aplikasi ditutup penuh | Belum diuji |
| Input angka/koma, keyboard, tombol Kembali Android, layar kecil, teks diperbesar | Belum diuji |
| Sentuh diagram, pilih tahap, putar/jeda, zoom/cubit/geser | Belum diuji |
| Ubah R, pilih titik sensitivitas, buat dan bandingkan skenario | Belum diuji |
| Riwayat dan run tetap ada setelah restart | Belum diuji |
| Jalankan 27 kasus dan sembilan kondisi batas dari APK | Belum diuji |
| Bagikan XLSX/CSV dan cocokkan dengan workbook | Belum diuji |

Kasus audit C14: α=2,5, zF=0,5, xD=0,95, xB=0,05, F=100, q=1, R≈1,65. Hasil: MT≈11,6748000168 atau 12 tahap bulat, tahap umpan 6; FUG≈12,6034055786.

Isi merek/model HP, versi Android, versi aplikasi, waktu pengujian, hasil, serta kegagalan sebelum memakai laporan ini sebagai bukti penelitian penggunaan. Evaluasi mahasiswa dan validasi terhadap kolom nyata belum dilakukan.
