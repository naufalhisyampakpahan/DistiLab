# Target revisi DistiLab 1.1 — siap verifikasi dan penelitian

Tanggal penyusunan: 21 Oktober 2026. Implementasi 1.1 sudah dikerjakan; pemeriksaan kode, angka, workbook baru, dan UI browser telah dijalankan. APK 1.1 sudah dibangun dan tanda tangan serta isinya diverifikasi. Pengujian HP fisik masih menunggu perangkat.

Status implementasi: R01–R04, R06, R08–R10 tersedia. Alur R05 dan UI01–UI08 sudah diimplementasikan; pemeriksaan browser mencakup alur utama. R05/UI08 masih memerlukan pengujian keyboard dan pembesaran teks di Android. R07 belum dinyatakan lulus karena perangkat/AVD tidak tersedia. Bukti aktual dan panduan ada di [RELEASE_1_1.md](RELEASE_1_1.md).

Target diperluas sesuai permintaan pengguna agar rilis ini memiliki UI mobile yang jelas dan tampilan interaktif untuk menjelajahi proses, tahap, parameter, dan hasil.

Dasar: chat **Rancang Aplikasi Distilasi**, khususnya permintaan terakhir agar aplikasi memudahkan validasi dan penelitian. ID chat: `6ad867f1-b9e4-83ec-a315-e6818cc2e2df`. Arah terakhir di chat menjadi dasar prioritas; rancangan simulator lengkap ditempatkan sebagai pengembangan selanjutnya.

## Sasaran rilis

Pengguna dapat menjalankan 27 kasus penelitian dari APK, mengekspor satu tabel, menempelkannya ke Excel acuan, dan menelusuri setiap hasil tanpa mengetik angka satu per satu.

Pengguna juga dapat menyentuh bagian diagram kolom, memilih tahap pada grafik dan tabel, menjalankan penahapan secara bertahap, serta mengubah refluks untuk melihat hasil perhitungan berubah.

Rilis selesai jika paket penelitian mempunyai 27 kasus lengkap, 162 pembandingan keluaran lolos kriteria yang ditetapkan, sembilan uji batas ditangani sesuai protokol, delapan kriteria UI interaktif di bawah terpenuhi, serta bukti pengujian APK di perangkat Android tersedia. Status penghitungan, kesesuaian terhadap referensi, dan pengujian perangkat dicatat terpisah.

## Kondisi sebelum revisi

Saat target disusun, aplikasi dan mesin masih berlabel 1.0.0. Audit awal membandingkan 34 berkas dengan arsip sumber APK sebelumnya dan tidak menemukan perubahan. Revisi kini berlabel 1.1.0; persamaan inti dipertahankan, sedangkan profil penelitian, UI, penyimpanan metadata, dan ekspor ditambahkan.

Yang dipertahankan:

- Mesin McCabe–Thiele dan FUG–Molokanov, neraca massa, Rmin/Nmin, serta parameter perantara.
- Diagram, penahapan, tabel tahap, dan persamaan dengan substitusi angka.
- Nilai MT fraksional serta `Nceil` sebagai jumlah tahap bulat.
- Penyimpanan lokal, buka kembali, pencarian, dan gandakan parameter.
- Ekspor CSV yang sudah menyimpan presisi penuh.

Kekurangan untuk protokol baru: belum ada profil penelitian khusus, paket C01–C27 di APK, ekspor XLSX dengan format impor yang ditentukan, hubungan proyek–skenario, maupun bukti pengujian HP. Kemampuan mesin sekarang mencakup q=0…1 dan batas MT bawaan 2.000 langkah; F masih opsional.

## Target dan kriteria selesai

| ID | Prioritas | Target revisi | Kriteria selesai |
|---|---|---|---|
| R01 | P0 | Profil penelitian yang konsisten | Biner hipotetik A/B, α konstan, CMO, satu umpan, dua produk, q=1. F wajib positif. Asumsi dan satuan terlihat. Riwayat q≠1 tetap dapat dibaca dengan label cakupan yang tepat. |
| R02 | P0 | Tombol Jalankan Paket Verifikasi | APK menghitung C01–C27 memakai mesin yang sama dengan perhitungan satu kasus; menampilkan progres dan status tiap kasus, serta menyimpan input dan hasil run. Nilai keluaran tidak diambil dari jawaban referensi. |
| R03 | P0 | Ekspor XLSX sekali jalan | Satu blok berisi 27 baris data × 7 kolom dengan ID tetap dan angka kontinu presisi penuh. Pengguna cukup menempel satu blok ke Hasil_App. CSV lama tetap tersedia. |
| R04 | P0 | Pemeriksaan angka dan kondisi batas | 162 keluaran dibandingkan dengan acuan independen menggunakan toleransi yang disepakati; sembilan kasus T01–T09 menghasilkan diagnosis yang benar. Paket lama tetap menjadi uji regresi tambahan. |
| R05 | P1 | UI mobile Proses → Data → Hasil | Navigasi mempertahankan kasus aktif; diagram dan kelompok data saling terhubung; satuan, asumsi, kelengkapan, dan kesalahan terlihat. Tampilan diuji pada layar kecil, keyboard terbuka, dan pembesaran teks. |
| R06 | P1 | Proyek, skenario, dan audit kasus | Kasus dapat dinamai, disalin sebagai skenario terkait, diedit, dan dibandingkan input/hasilnya; dua kurva dapat ditumpuk dengan legenda yang jelas. Mengedit salinan tidak mengubah kasus awal. C01/C14/C27 memiliki pintasan audit. |
| R07 | P0 sebelum rilis | Pengujian Android dan bukti penelitian | APK revisi diuji offline, setelah restart, saat simpan/buka/duplikasi, menjalankan paket, berbagi XLSX, dan memakai seluruh interaksi UI01–UI08. Versi APK, perangkat, waktu, hasil, dan kegagalan dicatat. |
| R08 | P1 | Diagram kolom yang dapat disentuh | Umpan, kolom, kondensor/refluks, reboiler, dan produk dapat dipilih. Pilihan membuka data atau hasil terkait; nilai dan penanda tahap berasal dari kasus aktif. |
| R09 | P1 | Grafik dan jejak tahap interaktif | Pilihan tahap tersinkron antara diagram, grafik, dan tabel. Penahapan memiliki Sebelumnya/Berikutnya/Putar/Jeda/Reset. Titik sensitivitas dapat dipilih untuk melihat hasil dan alasannya jika gagal. |
| R10 | P1 | Eksplorasi refluks secara langsung | Slider R atau R/Rmin dan isian angka tersinkron; perubahan menjalankan mesin dan memperbarui grafik, jumlah tahap, serta kelayakan. Hasil lama ditandai usang, dan kasus tersimpan tidak berubah tanpa tindakan pengguna. |

P0 menentukan kebenaran dan keterulangan penelitian. P1 dikerjakan setelah kontrak perhitungan dan ekspor dikunci; UI inti tetap menjadi bagian wajib rilis 1.1.

## UI dan tampilan interaktif

### Susunan layar

- **Proyek:** daftar kasus dan skenario, tombol Buat Kasus dan Jalankan Paket Verifikasi, serta status run terakhir yang dapat dibuka kembali.
- **Proses:** diagram kolom dengan umpan, kondensor, refluks, reboiler, distilat, dan produk bawah. Bagian yang dipilih disorot dan membuka data atau hasil terkait.
- **Data:** kelompok Campuran dan Model, Umpan, Kolom dan Target, serta Pemeriksaan. Simbol, arti, satuan, rentang, dan asumsi q=1 terlihat. Nilai hasil neraca ditampilkan sebagai hasil baca-saja.
- **Hasil:** tampilan Ringkasan, Grafik, dan Perhitungan yang sudah ada diperkuat dengan pilihan tahap, penahapan bertahap, dan perbandingan skenario.
- **Verifikasi:** progres run, kasus aktif, jumlah selesai dari 27, diagnosis kegagalan, akses audit per kasus, serta ekspor untuk run yang dipilih.

### Kriteria penerimaan interaksi

| ID | Interaksi | Kriteria selesai |
|---|---|---|
| UI01 | Sentuh diagram kolom | Sentuh umpan untuk F/zF dan kondisi umpan; sentuh kolom/refluks untuk spesifikasi; sentuh produk untuk target dan hasil. Bagian terpilih mempunyai label, dan nilai mengikuti kasus aktif. |
| UI02 | Pilih tahap | Sentuh tahap pada grafik atau baris tabel untuk memilih nomor tahap yang sama pada diagram, grafik, dan tabel. Detail menampilkan x/y, bagian rectifying/stripping, penanda umpan, serta fraksi tahap terminal. |
| UI03 | Putar penahapan | Sebelumnya, Berikutnya, Putar, Jeda, dan Reset memperlihatkan langkah horizontal lalu vertikal sesuai koordinat engine. Tersedia kendali manual dan pengurangan animasi. Pemutaran menjelaskan urutan perhitungan MT; tidak menggambarkan simulasi aliran dinamis. |
| UI04 | Geser refluks | Slider R atau R/Rmin disertai isian angka agar pengguna tetap bisa memasukkan nilai presisi. Perubahan menghitung ulang garis operasi, N, dan status. R≤Rmin menampilkan diagnosis; keluaran sebelumnya tidak ditampilkan seolah masih berlaku. |
| UI05 | Periksa titik sensitivitas | Sentuh titik untuk melihat parameter, keluaran, dan status sekaligus menyorot baris tabelnya. Titik gagal memiliki alasan dan memutus kurva. Titik layak dapat diterapkan sebagai skenario baru. |
| UI06 | Bandingkan dua skenario | Pilih dua skenario untuk melihat perubahan input dan hasil, serta grafik dengan legenda pembeda. Selisih antarskenario diberi label tersendiri dari selisih MT–FUG dan galat terhadap Excel. |
| UI07 | Pantau verifikasi | Pengguna melihat kasus aktif, jumlah selesai/27, dan kasus gagal dihitung. Baris dapat disentuh untuk audit. Status lulus hanya muncul bila pembandingan referensi telah dilakukan; ekspor tidak mencampur hasil run yang berbeda. |
| UI08 | Formulir dan navigasi mobile | Kasus aktif tetap sama ketika berpindah Proses/Data/Hasil. Kesalahan tampil dekat input beserta tindakan perbaikan. Keyboard tidak menutupi tindakan utama; pembesaran teks dan layar kecil tetap terbaca; kontrol penting memiliki area sentuh minimal 48 dp. Status memakai teks/ikon bersama warna. |

### Arah visual dan perilaku

- Pertahankan identitas DistiLab dengan warna utama yang konsisten, latar yang tenang, tipografi terbaca, dan hierarki judul–nilai–satuan yang jelas.
- Tempatkan tindakan utama sesuai pekerjaan layar: Hitung, Simpan Skenario, atau Ekspor. Diagram dan grafik memakai ruang utama, sementara rincian tahap muncul saat dipilih.
- Pada layar kecil, panel disusun ke bawah dan detail panjang dibuka sesuai kebutuhan. Nilai dan satuan tidak terpotong. Interaksi penting tersedia melalui sentuhan dan tombol, tanpa bergantung pada hover.
- Zoom, fokus, geser melalui tombol, pilihan kurva, pembacaan koordinat, dan tab hasil sudah tersedia. Pertahankan semuanya; tambahkan pinch-to-zoom dan drag untuk navigasi grafik, dengan tombol sebagai alternatif.
- Semua kontrol interaktif menggunakan hasil engine yang sama dengan formulir biasa. Diagram, grafik, tabel, dan ekspor harus mengikuti input serta versi hasil yang sama.
- Ketika input berubah, tandai hasil sebelumnya sebagai perlu dihitung ulang sampai hasil terbaru tersedia. Tangani input tidak layak dan proses yang belum selesai secara jelas.
- Perubahan untuk eksplorasi tidak mengubah kasus dasar atau input baku C01–C27. Pengguna memilih Simpan sebagai Skenario untuk menyimpan perubahan.
- Diagram tetap mengikuti kemampuan model yang tersedia. Temperatur, beban energi, dan aliran dinamis tidak ditampilkan sebagai hasil hitung sebelum model pendukungnya tersedia.

### Pemeriksaan UI sebelum rilis

Uji satu alur lengkap di HP: buka kasus → sentuh umpan pada diagram → perbaiki input → hitung → pilih tahap → putar/jeda penahapan → ubah refluks → simpan skenario → bandingkan → jalankan paket → ekspor. Cocokkan hasil melalui tombol, slider, grafik, dan tabel dengan perhitungan input yang sama. Ulangi pemeriksaan saat keyboard terbuka, teks diperbesar, orientasi/ukuran layar yang didukung berubah, serta setelah aplikasi ditutup dan dibuka kembali.

## Kontrak paket penelitian

| Parameter | Nilai |
|---|---|
| α | 2,0; 2,5; 3,0 |
| zF | 0,30; 0,50; 0,70 |
| R/Rmin | 1,20; 1,50; 2,00 |
| F | 100 kmol/jam |
| xD | 0,95 |
| xB | 0,05 |
| q | 1 |

Jumlah kombinasi: 3 × 3 × 3 = 27. ID C01–C27, urutan kombinasi, input numerik R, dan versi dataset harus dikunci sesuai workbook acuan sebelum implementasi. Identitas kasus tidak bergantung pada urutan baris ekspor. Pada q=1 dalam paket ini, Rmin MT dan Underwood merupakan besaran yang setara dalam toleransi; definisi dan sumber Rmin untuk pembentukan input R tetap dinyatakan secara eksplisit.

Blok hasil, dengan satu baris header di atas 27 baris data:

```text
case_id, D, B, Rmin, Nmin, N_MT, N_FUG
```

- `N_MT` memakai jumlah tahap bulat yang sudah tersedia melalui `Nceil`.
- N MT fraksional tetap disimpan dalam jejak tambahan, dengan aturan interpolasinya.
- D, B, Rmin, Nmin, dan N_FUG diekspor sebagai angka, tanpa pembulatan tampilan.
- Versi aplikasi, mesin, dataset/protokol, waktu run, input, dan asumsi disimpan di luar blok tujuh kolom agar format impor tidak bergeser.
- Kegagalan tidak diubah menjadi nol atau hasil sukses; run yang tidak lengkap ditandai dan diperbaiki sebelum dipakai sebagai bukti kesesuaian.
- Pencocokan Excel menggunakan ID; ID ganda, asing, kosong, atau keluaran hilang harus terdeteksi.

Status **selesai dihitung** muncul setelah engine menyelesaikan kasus. Status **lulus verifikasi** memerlukan pembandingan terhadap referensi independen dengan versi yang tercatat.

## Kriteria penerimaan numerik

Untuk D, B, Rmin, Nmin, dan N_FUG:

```text
abs(hasil_aplikasi - referensi) <= 1e-8 + 1e-6 * abs(referensi)
```

Untuk N_MT, jumlah tahap bulat harus sama persis. Enam keluaran × 27 kasus menghasilkan 162 pembandingan. Neraca total dan komponen serta konsistensi jejak tahap tetap diperiksa.

Konvensi: kondensor total tidak dihitung; reboiler kesetimbangan termasuk satu tahap; tahap diberi nomor dari atas. Jumlah tahap kesetimbangan dan tray di dalam kolom diberi label berbeda.

Pemeriksaan manual difokuskan pada C01, C14, dan C27: neraca massa, Rmin, dua langkah awal, posisi umpan, dan aturan berhenti. Menurut acuan yang tertulis di chat, C14 mempunyai α=2,5; zF=0,5; R/Rmin=1,5; R=1,65; D=B=50; Rmin=1,1; Nmin≈6,426866; N_MT=12; N_FUG≈12,603406; tahap umpan 6. Nilai bulat dalam uraian ini bukan pengganti nilai penuh workbook.

Sembilan kasus T01–T09 mengikuti identitas dan nilai input dalam protokol asli. Cakupannya mencakup angka tidak terbaca/tidak hingga, F=0, α=1, urutan komposisi keliru, R sama dengan/di bawah Rmin, q di luar profil penelitian, serta target belum tercapai dalam 60 langkah.

## Keputusan untuk menjaga hasil lama

1. Profil penelitian membatasi q=1; kemampuan mesin lama q=0…1 tetap dipertahankan untuk kompatibilitas dan regresi. Data lama tidak diam-diam diubah menjadi q=1.
2. Batas 60 langkah berlaku pada profil penelitian. Gunakan opsi mesin yang sudah ada. Jika batas tercapai, pesannya adalah **target belum tercapai dalam 60 langkah**, bukan pemisahan mustahil secara fisik.
3. N_MT bulat menggunakan Nceil; tidak mengubah interpolasi atau memanipulasi hasil agar sesuai referensi.
4. Paket 30 kasus sebelumnya tetap menjadi regresi tambahan. Hasil verifikasi desktop paket lama tidak otomatis menjadi bukti untuk paket 27 kasus atau APK revisi.
5. Penyimpanan lokal yang ada dipertahankan. Struktur proyek/skenario dan metadata versi ditambahkan dengan migrasi yang dapat membuka data lama; pergantian basis data bukan syarat revisi ini.
6. Perbedaan MT–FUG dibahas sebagai perbedaan pendekatan. Galat implementasi dihitung MT terhadap MT Excel dan FUG terhadap FUG Excel.

## Urutan pelaksanaan

1. **Kunci acuan:** cocokkan workbook 27 kasus dan protokol asli, identitas kasus, definisi Rmin, aturan N_MT, batas 60 langkah, dan toleransi. Simpan versi serta checksum acuan.
2. **Selesaikan jalur verifikasi:** profil penelitian → paket C01–C27 → keluaran presisi penuh → XLSX → pembandingan Excel → T01–T09. Jadikan ini jalur pertama yang dapat diuji sampai selesai.
3. **Bangun UI interaktif:** Proses/Data/Hasil, diagram yang dapat disentuh, pilihan tahap tersinkron, pemutaran penahapan, eksplorasi refluks, titik sensitivitas, hubungan proyek–skenario, dan audit tiga kasus. Periksa UI01–UI08.
4. **Rilis untuk penelitian:** ulangi regresi lama dan paket baru, bangun APK revisi, lalu uji hitungan dan interaksi UI di Android serta catat bukti.

Rencana evaluasi penggunaan dalam chat adalah 10 mahasiswa yang telah mempelajari distilasi, dengan empat tugas: mengisi kasus, mengubah refluks, menelusuri tahap, serta menyimpan dan memperbaiki input. Siapkan lembar keberhasilan, durasi, bantuan, kesalahan, dan komentar. Jumlah peserta merupakan rencana awal untuk diselaraskan dengan pembimbing; hasil peserta tidak diisi sebelum pengamatan dilakukan.

## Batas revisi ini dan status bukti

NRTL, Antoine–Raoult, basis data campuran nyata, multikomponen, MESH, neraca energi, dan desain mekanik berada pada pengembangan berikutnya. Acuan ChemSep/DWSIM dalam revisi ini digunakan untuk alur dan penyajian informasi sesuai pembahasan chat.

Penyusunan target menggunakan isi chat dan audit kode lokal. Lampiran PDF/DOCX/workbook 27 kasus asli belum tersedia sebagai berkas lokal. Implementasi mengunci dataset chat-protocol-20261021-v1 dengan urutan kombinasi yang dinyatakan di atas, lalu menyediakan workbook baru excel-reference-20261021-v1. Keduanya diberi provenance eksplisit. Seluruh 190 tes kini sudah dijalankan dan lulus; regresi 30 kasus lama juga diulang. Pemeriksaan browser dan workbook baru sudah dilakukan, sedangkan pengujian APK pada HP belum dilakukan.
