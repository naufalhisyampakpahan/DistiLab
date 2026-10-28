# DistiLab 1.10.0

Rilis ini dibuat atas pilihan pemilik untuk menggunakan tampilan aplikasi lokal 1.1.0. Versi paket dinaikkan menjadi 1.10.0 dan Android versionCode 4, dengan package `id.distilab.app` yang sama. Mesin perhitungan tetap versi 1.1.0; persamaan dan algoritmanya tidak diubah.

Navigasi aplikasi tetap Beranda / Riwayat / Metodologi, dengan alur Proses → Data → Hasil. Desain FigCraft tersimpan sebagai lampiran dan belum diterapkan ke UI APK ini.

Sumber awal telah lulus TypeScript dan 190 tes dalam 17 suite. TypeScript diperiksa ulang setelah pembaruan versi. Peringatan pengujian `act(...)` StageExplorer masih tercatat. Pengujian pada HP fisik belum dilakukan.

Profil build EAS: `apk`, Android, distribusi internal, development client nonaktif, menggunakan kredensial signing terkelola proyek yang sama. APK harus diperiksa versi, versionCode, package, sertifikat, bundle offline, font, dan library ARM64 sebelum dipublikasikan. Identitas build, checksum, dan hasil pemeriksaan tersedia pada berkas laporan verifikasi di GitHub Releases.
