# Build Android

Versi **1.10.0**, build **5**, package `id.distilab.app`.

## Pasang

1. [Unduh APK](https://github.com/naufalhisyampakpahan/DistiLab/releases/download/apk-v1.10.0/DistiLab-1.10.0.apk).
2. Buka berkas di Android 7.0 atau lebih baru dan izinkan pemasangan bila diminta.
3. Jalankan DistiLab. APK bekerja offline tanpa Expo Go atau komputer.

## Buat APK

Dengan akun Expo yang memiliki akses ke proyek:

```sh
npm ci
npm run check
npx eas-cli build --platform android --profile apk
```

Profil `apk` pada `eas.json` menghasilkan APK mandiri. Proyek native `android/` disertakan; perubahan versi harus disamakan di `app.json` dan `android/app/build.gradle`.

Gunakan kembali kredensial EAS yang sama agar APK dapat memperbarui pemasangan lama. Jangan simpan keystore atau token di Git.

`npm run export:android` hanya membuat bundle, bukan APK. Sebelum rilis, periksa versi, tanda tangan, dan uji alur utama pada perangkat.
