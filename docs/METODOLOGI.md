# Metodologi DistiLab

DistiLab versi pertama menghitung distilasi biner kontinu secara lokal. Semua komposisi adalah fraksi mol komponen ringan (light key, LK); komposisi komponen berat (heavy key, HK) selalu `1 − x`. Volatilitas HK dijadikan acuan `αHK = 1` dan `αLK = α > 1`. Kasus demonstrasi adalah model matematis, bukan pengukuran campuran nyata.

## Asumsi, variabel, dan domain

| Simbol | Makna | Domain/satuan |
| --- | --- | --- |
| `zF` | Fraksi mol LK dalam umpan | `0 < xB < zF < xD < 1` |
| `xD`, `xB` | Fraksi mol LK dalam distilat dan produk bawah | Fraksi mol |
| `α` | Volatilitas relatif LK terhadap HK | `α > 1`, tak berdimensi |
| `q` | Kondisi termal umpan | `0 ≤ q ≤ 1` |
| `R` | Refluks eksternal, `L/D` | Positif dan melampaui batas operasi minimum |
| `F` | Laju molar umpan, opsional | Positif, kmol/jam |
| `N` | Jumlah tahap kesetimbangan | Termasuk reboiler kesetimbangan |

Model memakai volatilitas relatif konstan, constant molar overflow, satu umpan, dua produk, total condenser, dan reboiler kesetimbangan. Model tidak menghitung temperatur, tekanan, kebutuhan panas, efisiensi tray, hidraulika, diameter, atau tinggi fisik kolom. Campuran azeotrop/nonideal membutuhkan data atau model termodinamika lain. Dasar hubungan volatilitas relatif dan asumsi aliran molar dibahas pada [Skogestad, Dynamics and Control of Distillation Columns (1997), persamaan (2)–(4)](https://skoge.folk.ntnu.no/publications/1997/dist_plenary/submitted_version/dist_plenary.pdf).

`q = 1` berarti cair jenuh; `q = 0` berarti uap jenuh; `0 < q < 1` berarti umpan dua fase dalam pendekatan model. `q` secara umum berasal dari entalpi, `(HV − HF)/(HV − HL)`, sehingga dapat berada di luar 0–1. Versi ini sengaja menolak cair subdingin (`q > 1`) dan uap lewat panas (`q < 0`). Definisi entalpi dan hubungan aliran bagian kolom tercantum pada [University of Waterloo, Distillation Column, persamaan feed quality dan feed line](https://chemengvirtual.uwaterloo.ca/distillation-lab/components/distillation-column.html).

## Kesetimbangan dan neraca massa

Kurva kesetimbangan LK untuk model α konstan adalah:

```text
y*(x) = α x / [1 + (α − 1)x]
x*(y) = y / [α − (α − 1)y]
```

Persamaan pertama sesuai [Skogestad (1997), persamaan (3)](https://skoge.folk.ntnu.no/publications/1997/dist_plenary/submitted_version/dist_plenary.pdf). Invers diperoleh dengan menyelesaikan persamaan itu terhadap `x`; langkah horizontal menggunakan invers analitis, bukan interpolasi sampel grafik.

Konservasi jumlah mol dan mol LK memberi:

```text
F = D + B
F zF = D xD + B xB
D/F = d = (zF − xB)/(xD − xB)
B/F = 1 − d
```

Bila `F` tidak diisi, hasil tahap tetap dapat dihitung; aliran produk tidak diberi angka buatan. Bila diisi, aliran serta residu neraca disertakan. `D`, `B`, dan `F` memakai satuan molar yang sama.

## McCabe–Thiele

Garis rectifying dan q-line adalah:

```text
yR(x) = [R/(R + 1)]x + xD/(R + 1)
q x + (1 − q)y = zF
```

Untuk `q = 1`, q-line vertikal `x = zF`; untuk `q = 0`, horizontal `y = zF`. Bentuk implisit q-line menghindari pembagian oleh `q − 1` di dekat satu. Garis stripping menghubungkan `(xB, xB)` ke perpotongan q-line dan rectifying. Sumber garis operasi dan konstruksi bertahap: [University of Waterloo, Distillation Column](https://chemengvirtual.uwaterloo.ca/distillation-lab/components/distillation-column.html).

Pinch kandidat adalah perpotongan q-line dan VLE, yang unik di 0–1 karena `q x + (1 − q)y*(x)` meningkat monoton. Bila pinch berada dalam daerah pemisahan, garis rectifying minimum melewati pinch dan `(xD,xD)`:

```text
mmin = (xD − ypinch)/(xD − xpinch)
Rpinch = mmin/(1 − mmin)
```

Konstruksi pinch dibahas pada [Skogestad, kuliah distilasi NTNU, slide 14–15](https://skoge.folk.ntnu.no/septek/lectures/septek-sis2-distillation.pdf). Untuk kasus pemisahan ringan, pinch dapat berada di luar segmen operasi; kandidat ini sendiri belum menjamin aliran internal fisik.

### Batas aliran dan minimum fisik

Dari neraca umpan dan total condenser, `V/F = (R+1)d`, sedangkan uap bagian bawah `Vbar/F = (R+1)d − (1−q)`. Reboiler perlu aliran uap positif. Karena itu:

```text
Rflow = max(0, (1 − q)/d − 1)
Rmin,fisik = max(0, Rpinch, Rflow)
```

Batas ini diturunkan dari neraca di atas, bukan korelasi tambahan. Kandidat aliran yang negatif dicatat sebagai nol karena refluks negatif tidak diizinkan. `R > Rmin,fisik` menghasilkan perpotongan garis operasi di atas `xB` dan aliran bagian bawah positif. Mesin tetap memeriksa geometrinya, kemajuan tahap, dan domain numerik. Contoh: `q=0, zF=0.5, xD=0.6, xB=0.4, α=2.5` memiliki kandidat pinch sekitar `0.466667`, tetapi `Rflow=1`; `R=0.8` tidak layak meskipun melampaui kandidat pinch.

### Stepping, tahap umpan, dan fraksi terakhir

Stepping dimulai pada `(xD,xD)`. Untuk setiap tahap, mesin bergerak horizontal ke `x*(y)`, lalu vertikal ke garis operasi. Perpindahan ke stripping terjadi ketika komposisi cair tahap telah melewati absis perpotongan garis operasi. Tahap pertama yang memakai stripping adalah perkiraan tahap umpan, dihitung dari atas. Seluruh koordinat grafik berasal dari rekaman mesin yang sama.

Total condenser tidak dihitung; reboiler kesetimbangan dihitung satu tahap. Konvensi ini sesuai [Skogestad, kuliah NTNU, slide 14](https://skoge.folk.ntnu.no/septek/lectures/septek-sis2-distillation.pdf). `Nceil = ceil(N)` merupakan jumlah tahap kesetimbangan bulat; bila hendak menaksir tray ideal di badan kolom, kurangi satu untuk reboiler. Tray aktual memerlukan efisiensi tersendiri.

Jika langkah ke-`k` melampaui `xB`, nilai desimal memakai interpolasi horizontal linear:

```text
f = (xprevious − xB)/(xprevious − xequilibrium)
N = (k − 1) + f
```

`f` adalah konvensi estimasi fraksi tahap, bukan pembagian fisik reboiler. Titik VLE terakhir tetap dicatat agar grafik dan audit dapat memeriksa satu langkah penuh. Pembulatan kebutuhan tahap selalu ke atas. Pada total reflux, jumlah langkah bulat konsisten dengan Fenske; fraksi linear komposisi tidak harus persis sama dengan interpolasi logaritmik Fenske. Jangan memakai selisih kecil kedua fraksi sebagai bukti kesalahan mesin.

## Fenske–Underwood–Gilliland (FUG)

Fenske pada total reflux:

```text
Nmin = ln[(xD/(1−xD))((1−xB)/xB)] / ln(α)
```

Underwood memakai kedua komponen secara eksplisit:

```text
α zF/(α−θ) + (1−zF)/(1−θ) = 1−q
RUnderwood,raw + 1 = α xD/(α−θ) + (1−xD)/(1−θ)
1 < θ < α
```

Formulasi dan konvensi `q` ini sesuai [University of Waterloo, Design and Optimization, Tabel 1](https://chemengvirtual.uwaterloo.ca/distillation-lab/design.html). Akar dipilih di antara volatilitas HK dan LK, dijauhkan dari kutub, dan dicari dengan bisection. Turunan fungsi akar positif di interval itu; tidak ada pergantian akar secara arbitrer.

**Batas domain FUG versi ini:** rangkaian FUG hanya menerima kasus dengan pinch umpan di dalam interval produk dan `Rmin` Underwood yang fisik. Kasus ketika pinch berada di luar interval produk atau batas aliran internal mengontrol ditolak dengan pesan untuk memakai McCabe–Thiele. Kasus tersebut dapat tetap layak secara fisik; yang dibatasi adalah domain shortcut yang telah diverifikasi. Helper Underwood mengembalikan hasil mentah persamaan kedua secara konsisten, tanpa diam-diam mengoreksinya. McCabe–Thiele menangani batas fisik gabungan `max(0, Rpinch, Rflow)`.

Gilliland diimplementasikan dengan pendekatan Molokanov:

```text
X = (R−Rmin)/(R+1)
Y = 1 − exp{[(1+54.4X)/(11+117.2X)] [(X−1)/sqrt(X)]}
N = (Nmin + Y)/(1 − Y)
```

Persamaan Molokanov dan definisi `X` diverifikasi pada [M. A. Soliman (2009), A Shortcut Method for Binary Distillation Column Design, J. King Saud Univ. 21(1), 1–5, persamaan (1), halaman 1](https://direct.ksu.edu.sa/bitstreams/45d92811-c07a-4cc0-9222-67e722e94330/download). Artikel tersebut mengutip Molokanov dkk. (1972); implementasi menggunakan bentuk yang dicetak dalam artikel Soliman, tanpa mengklaim telah membaca naskah asli 1972. Halaman Waterloo memakai pendekatan Gilliland berbeda (`0.75[1−X^0.5668]`); pendekatan tersebut tidak dipakai DistiLab.

Untuk operasi hingga, `0 < X < 1`. Saat `R → Rmin+`, `X → 0+`, `Y → 1−`, dan `N → ∞`; saat `R → ∞`, `X → 1−`, `Y → 0+`, dan `N → Nmin`. Mesin menolak `R ≤ Rmin` dan angka tak hingga, serta melaporkan kegagalan bila hasil melampaui kemampuan numerik. FUG adalah estimasi awal; hasilnya tidak wajib identik dengan stepping McCabe–Thiele.

## Sensitivitas dan reproduksibilitas

Setiap titik sensitivitas mengganti satu parameter, memvalidasi ulang input, menghitung ulang `Rmin`, lalu menjalankan mesin. Titik tidak layak disimpan dengan pesan kegagalan; grafik tidak boleh menyambung melewati titik itu. Input, metode, versi mesin, asumsi, waktu, dan hasil diperlukan untuk mengulang suatu studi. Lihat [VALIDASI.md](./VALIDASI.md) untuk nilai independen dan batas klaim pengujian.

## Rancangan multikomponen

Mode multikomponen belum aktif. Pengembangan memerlukan daftar komponen beserta `zFi`, `xDi`, `xBi`, `αi`, pemilihan LK/HK, normalisasi komposisi, neraca komponen, akar Underwood yang sesuai, serta asumsi distribusi komponen non-key. Setiap akar yang relevan dan pemisahan non-distributing key harus ditangani menurut referensi sebelum fitur diaktifkan. Uji biner yang lulus tidak memvalidasi algoritma multikomponen.

## Sumber yang benar-benar diperiksa

- [Skogestad (1997), naskah tutorial asli yang dihos oleh NTNU](https://skoge.folk.ntnu.no/publications/1997/dist_plenary/submitted_version/dist_plenary.pdf): hubungan VLE dan asumsi aliran.
- [University of Waterloo, Distillation Column](https://chemengvirtual.uwaterloo.ca/distillation-lab/components/distillation-column.html): garis operasi, q-line, dan hubungan aliran internal.
- [University of Waterloo, Design and Optimization](https://chemengvirtual.uwaterloo.ca/distillation-lab/design.html): Fenske dan Underwood; bentuk Gilliland di halaman ini berbeda.
- [Soliman (2009), artikel jurnal dari repositori King Saud University](https://direct.ksu.edu.sa/bitstreams/45d92811-c07a-4cc0-9222-67e722e94330/download): Molokanov, persamaan (1).
- [Skogestad, bahan kuliah distilasi NTNU](https://skoge.folk.ntnu.no/septek/lectures/septek-sis2-distillation.pdf): konvensi tahap, kondensor/reboiler, dan pinch.

Sumber diperiksa pada 14 Oktober 2026. Tidak ada data eksperimen literatur yang dipakai sebagai angka pembanding versi ini.
