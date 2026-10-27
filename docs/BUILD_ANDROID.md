# APK Android DistiLab

Versi terbaru dengan UI redesign adalah **[DistiLab 1.2.0](https://github.com/naufalhisyampakpahan/DistiLab/releases/tag/apk-v1.2.0)**. Unduh DistiLab-1.2.0.apk pada Assets dan pasang sebagai pembaruan. VersionCode 3 dan sertifikat sama dengan 1.1.0. Lihat [laporan rilis 1.2](RELEASE_1_2.md). Belum diuji pada HP fisik.

## Arsip petunjuk build 1.1.0

APK final **DistiLab-1.1.0.apk** telah dibuat pada 21 Oktober 2026 dan tanda tangannya terverifikasi. [Unduh APK](https://expo.dev/artifacts/eas/Zv6vuZ9HMZDEetwI88nZWJwcP3Cd9S6_muEYGV2X_vA.apk) atau gunakan [salinan lokal](../artifacts/v1.1/DistiLab-1.1.0.apk). Package id.distilab.app dan kunci penandatanganan dipertahankan; versionCode 2 untuk pembaruan dari 1.0. Identitas build, checksum, dan hasil pemeriksaan ada di [panduan 1.1](RELEASE_1_1.md). Uji pada HP fisik belum dilakukan.

## Memasang di HP

1. Gunakan HP Android 7.0 atau lebih baru. Salin atau unduh **DistiLab-1.1.0.apk** melalui tautan di atas ke HP. Arsip ZIP sumber tersedia untuk pengembangan; berkas APK diunduh melalui tautan APK.
2. Buka aplikasi **Files / Berkas / Pengelola File** di HP, cari folder tempat APK tersimpan, lalu ketuk berkas APK tersebut.
3. Jika muncul permintaan izin pemasangan, buka **Setelan** dari dialog itu dan izinkan **Pasang aplikasi tidak dikenal / Izinkan dari sumber ini** hanya untuk aplikasi pengelola file yang sedang digunakan. Kembali ke APK dan lanjutkan pemasangan. Nama menu dapat berbeda menurut merek dan versi Android; lihat [petunjuk Google](https://support.google.com/pixelphone/answer/7391672?hl=en).
4. Tekan **Pasang**, lalu **Buka**, atau buka ikon **DistiLab** dari daftar aplikasi.
5. APK release ini membuka kode dan aset yang disertakan di dalam aplikasi. Expo Go, pemindaian QR, komputer yang menyala, dan server Metro tidak diperlukan untuk menjalankan perhitungan.

## Membuat ulang APK lewat EAS Build

Build memakai profil `apk` dalam [eas.json](../eas.json):

```json
{
  "build": {
    "apk": {
      "distribution": "internal",
      "developmentClient": false,
      "android": { "buildType": "apk" }
    }
  }
}
```

`buildType: "apk"` menghasilkan berkas yang dapat dipasang langsung, sedangkan `distribution: "internal"` menyediakan distribusi untuk pengujian. Profil ini membuat release mandiri. Rujukan: [APK dengan EAS Build](https://docs.expo.dev/build-reference/apk/) dan [distribusi internal Expo](https://docs.expo.dev/build/internal-distribution/).

Dari folder proyek, dengan Node.js yang kompatibel dan akun Expo yang memiliki akses ke proyek:

```powershell
npm.cmd ci
npm.cmd run typecheck
npx.cmd expo-doctor
npx.cmd eas-cli whoami
npx.cmd eas-cli build --platform android --profile apk
```

Jika belum masuk, gunakan `npx.cmd eas-cli login` dengan akun pemilik proyek atau anggota yang berwenang. Tunggu status build **FINISHED**, lalu unduh APK dari detail build. `npm run export:android` hanya menghasilkan bundle JavaScript dan aset; APK dibuat oleh proses build Android.

Pertahankan `package-lock.json`, `app.json`, `eas.json`, serta sumber native `android/` untuk membuat ulang aplikasi yang sama. Jika konfigurasi Expo berubah, sinkronkan proyek native sebelum build melalui `npx.cmd expo prebuild --platform android`, lalu periksa perubahan. Catat versi EAS CLI dan lingkungan build bersama identitas build untuk penelusuran; checksum build berikutnya tidak dijanjikan identik byte demi byte.

## Tanda tangan dan pembaruan

Jalur build ini memakai kredensial Android yang dikelola EAS. Kunci privat dan kata sandi penandatanganan tetap dikelola di EAS dan tidak perlu disertakan dalam APK, ZIP sumber, atau laporan pengujian. EAS memakai kembali kredensial pada build berikutnya, sesuai [dokumentasi kredensial terkelola](https://docs.expo.dev/app-signing/managed-credentials/).

Untuk memperbarui aplikasi yang sudah terpasang, pertahankan package `id.distilab.app` dan kunci penandatanganan yang sama, serta naikkan `android.versionCode`. Jangan membuat ulang atau menghapus keystore hanya untuk mengganti versi. Android menggunakan identitas tanda tangan untuk menerima pembaruan; lihat [penandatanganan aplikasi Android](https://developer.android.com/studio/publish/app-signing). Instalasi dengan identitas tanda tangan berbeda dapat gagal sebagai pembaruan; ekspor riwayat CSV sebelum tindakan yang menghapus data aplikasi.

## Pilihan build lokal

Pengembang yang menyiapkan Android Studio, JDK, Android SDK/NDK, dan kredensial penandatanganan dapat mengikuti [panduan release lokal Expo](https://docs.expo.dev/guides/local-app-production/). Jangan menganggap `assembleRelease` pada template native otomatis memakai kunci EAS: konfigurasi penandatanganan lokal perlu disiapkan dengan benar.

`eas build --local` memakai lingkungan lokal yang dikelola pengembang. Expo mendukung macOS/Linux untuk jalur itu; Windows langsung tidak didukung, dan WSL tidak diuji resmi. Lihat [batas build EAS lokal](https://docs.expo.dev/build-reference/local-builds/). Jalur utama proyek ini adalah EAS Build cloud.

## Uji singkat pada HP — masih menunggu

Uji pada HP fisik belum dilakukan. Setelah APK tersedia dan terpasang, catat merek/model HP, versi Android, versi aplikasi, dan hasil setiap langkah:

- Buka DistiLab, tutup sepenuhnya, matikan Wi-Fi/data, lalu buka kembali. Beranda dan ikon harus muncul tanpa server komputer.
- Pilih McCabe–Thiele, isi data demonstrasi, lalu hitung. Hasil yang diharapkan: N sekitar **9,3756**, Rmin **1,1000**, dan **10 tahap bulat**. Buka grafik dan periksa kontrolnya.
- Ulangi dengan FUG. Hasil demonstrasi yang diharapkan: N sekitar **9,7850** dan **10 tahap bulat**.
- Simpan studi bernama, tutup dan buka kembali aplikasi, lalu buka studi dari Riwayat. Periksa pula input koma, keyboard, dan tombol Kembali Android.
- Ekspor hasil dan sensitivitas ke CSV. Pilih aplikasi tujuan berbagi yang tersedia dan pastikan berkas dapat dibuka; tujuan daring dapat memerlukan koneksi.

Hasil langkah di atas baru boleh dicatat sebagai lulus setelah benar-benar dijalankan. Verifikasi tanda tangan APK dan kelengkapan bundle tidak menggantikan uji antarmuka serta ekspor pada perangkat.
