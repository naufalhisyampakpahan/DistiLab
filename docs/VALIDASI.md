# Verifikasi numerik dan rencana validasi penelitian

Dokumen ini memisahkan **verifikasi implementasi persamaan** dari **validasi terhadap eksperimen**. Kasus berikut dihitung dari model α konstan secara independen, kemudian dipakai sebagai pembanding pengujian otomatis. Nilai ini bukan pengukuran, hasil simulator rigorous, atau bukti bahwa model mewakili campuran tertentu.

## Angka pembanding independen

Kasus A adalah demonstrasi pengguna: `zF=0.50, xD=0.95, xB=0.05, q=1, α=2.50, R=2.50`.

Perhitungan aljabar Fenske: separation factor `S = 19 × 19 = 361`; `Nmin = ln(361)/ln(2.5)`. Pada `q=1`, akar Underwood dapat dihitung tanpa bisection: `θ = α/[1+(α−1)zF] = 10/7`. Substitusi distilat memberi `Rmin = 1.1`. Dalam Molokanov, `X = 0.4` dan eksponen `−0.37304823537715437`.

Kasus B: `zF=0.40, xD=0.90, xB=0.10, q=0.50, α=2.00, R=4.00`. Kasus C adalah umpan uap jenuh: parameter komposisi/α kasus A, `q=0, R=3.00`.

| Hasil | A | B | C |
| --- | ---: | ---: | ---: |
| Fenske `Nmin` | 6.426866226496 | 6.339850002885 | 6.426866226496 |
| Underwood `θ` | 1.428571428571 | 1.517744687876 | 1.750000000000 |
| `Rmin` | 1.100000000000 | 2.539317383204 | 2.100000000000 |
| Molokanov `X` | 0.400000000000 | 0.292136523359 | 0.225000000000 |
| Molokanov `Y` | 0.311367984382 | 0.386779579829 | 0.439464323014 |
| FUG `N` | 9.784956345418 | 10.969350271867 | 12.249587013670 |
| FUG tahap bulat | 10 | 11 | 13 |
| McCabe `N`, fraksi horizontal | 9.375571784999 | 10.182298081637 | 10.340992169872 |
| McCabe tahap bulat | 10 | 11 | 11 |
| Perkiraan tahap umpan dari atas | 5 | 6 | 6 |

Nilai tabel dibulatkan untuk keterbacaan; pembanding otomatis memakai presisi lebih lengkap. Tidak ada klaim bahwa selisih FUG terhadap McCabe merupakan galat eksperimen.

### Audit tangan stepping kasus A

Garis rectifying `y=(5/7)x+19/70`; titik umpan `(0.5, 22/35)`; stripping `y=(9/7)x−1/70`. Mulai `y1=0.95`, hitung `xk=yk/[2.5−1.5yk]`, lalu pilih garis operasi berikutnya.

| Tahap | `yk`, uap keluar tahap | `xk`, cair kesetimbangan | Garis untuk langkah berikut |
| --- | ---: | ---: | --- |
| 1 | 0.950000000000 | 0.883720930233 | Rectifying |
| 2 | 0.902657807309 | 0.787650384114 | Rectifying |
| 3 | 0.834035988653 | 0.667791863929 | Rectifying |
| 4 | 0.748422759949 | 0.543372521160 | Rectifying |
| 5 | 0.659551800828 | 0.436594886509 | Stripping |
| 6 | 0.547050568369 | 0.325736990980 | Stripping |
| 7 | 0.404518988403 | 0.213667013969 | Stripping |
| 8 | 0.260429017960 | 0.123463729951 | Stripping |
| 9 | 0.144453367079 | 0.063264619187 | Stripping |
| 10 | 0.067054510383 | 0.027946153539 | Batas bawah tercapai |

Fraksi tahap terakhir `(0.06326461918686471−0.05)/(0.06326461918686471−0.027946153538827102) = 0.3755717849991518`. Jadi `N=9+f`; kondensor total tidak menambah tahap.

## Pembanding aljabar selain demonstrasi

- Untuk umpan cair jenuh, `θ=α/[1+(α−1)zF]`.
- Untuk umpan uap jenuh, akar antara HK dan LK adalah `θ=α−(α−1)zF`.
- Untuk `q=1/2, zF=1/2`, akar adalah `θ=sqrt(α)`.

Ketiganya diperoleh dengan mengalikan persamaan Underwood dengan penyebutnya dan menyelesaikan persamaan aljabar. Pengujian independen memakai komposisi dan α selain demonstrasi. Residual diuji pada persamaan Underwood asli, bukan fungsi residual yang sama dengan produksi.

Pengujian geometri memeriksa bahwa setiap langkah horizontal berada pada VLE, setiap langkah vertikal mengikuti garis operasi, dua garis bertemu pada q-line, seluruh segmen operasi berada di bawah VLE, fraksi terakhir mengikuti konvensi yang didokumentasikan, serta kemiringan stripping cocok dengan `Lbar/Vbar` dari neraca molar. Mengalikan `F` tidak boleh mengubah tahap atau tangga komposisi.

### Kasus batas fisik

`zF=0.5, xD=0.6, xB=0.4, q=0, α=2.5` mempunyai pinch di `x=2/7`, di luar interval produk. Kandidat Underwood/pinch `Rmin≈0.466667`, tetapi `D/F=0.5` dan `Vbar/F=0.5(R+1)−1`. Maka operasi membutuhkan `R>1`. McCabe harus menerima `R=1.2` dan menolak `R=0.8`. FUG versi ini menolak rezim tersebut secara eksplisit, karena batas aliran mengontrol di luar domain shortcut yang telah diverifikasi. Penolakan FUG bukan pernyataan bahwa seluruh pemisahan itu mustahil.

Pemisahan ringan cair jenuh `zF=0.5, xD=0.65, xB=0.35, q=1, α=2.5` memberi kandidat refluks negatif. McCabe menggunakan minimum fisik nol dan dapat menghitung `R=0.1`; FUG menolak domain ini dengan arahan untuk memakai McCabe.

## Ketelitian, batas algoritma, dan interpretasi

Parameter bawaan mesin: toleransi `1e−12`, maksimum 256 iterasi Underwood, dan maksimum 2000 langkah McCabe. Bisection memakai koordinat ternormalisasi di antara kutub; kriteria penghentian mempertimbangkan jarak ke kutub. Batas dapat diturunkan melalui opsi fungsi pada pengujian untuk memaksa kegagalan konvergensi yang terkontrol. Nilai nonkonvergen tidak dikembalikan sebagai hasil yang berhasil.

Pengujian menggunakan toleransi absolut/relatif yang sesuai identitas yang diperiksa; angka tahap pembanding tidak dibandingkan berdasarkan digit tampilan yang dibulatkan. Input ekstrem dapat kehilangan ketelitian floating point; keberhasilan tidak dijanjikan untuk seluruh bilangan real dalam domain fisik.

`R=Rmin` dan `R<Rmin` ditolak untuk hasil tahap hingga. Batas `R→Rmin+` pada Gilliland divergen. `Infinity` bukan cara memasukkan total reflux. Pada refluks sangat tinggi, Gilliland mendekati Fenske. Fraksi terakhir McCabe memakai interpolasi linear pada komposisi, sehingga untuk kasus A batas fraksinya sekitar `6.528496318421`, sedangkan Fenske `6.426866226496`; keduanya memerlukan 7 tahap bulat pada total reflux. Perbedaan ini berasal dari konvensi fraksi tahap, bukan dari pembagian atau penambahan kondensor.

## Menjalankan verifikasi

Dari terminal pada folder proyek:

```powershell
npm test -- --runInBand
npm run typecheck
```

Untuk menjalankan audit independen saja:

```powershell
npm test -- --runInBand tests/independent-invariants.test.ts
```

Audit independen dijalankan pada 14 Oktober 2026 menggunakan perintah terakhir di atas: **1 suite lulus, 10 pengujian lulus, 0 gagal**. Cakupannya adalah identitas akar aljabar, geometri tahap, neraca dan skala aliran, serta tiga kasus batas aliran. Jumlah seluruh suite dan hasil pemeriksaan TypeScript dicatat dalam README setelah pemeriksaan proyek selesai. Dokumen ini tidak mengklaim telah menjalankan pengujian Android, penyimpanan native, atau berbagi berkas hanya berdasarkan unit test numerik.

## Rencana validasi akademik yang masih diperlukan

1. Pilih sistem nyata dan tekanan operasi; peroleh VLE terukur atau parameter termodinamika yang dapat ditelusuri. Periksa apakah model α konstan dan CMO memadai.
2. Samakan seluruh konvensi kondensor, reboiler, efisiensi, nomor tahap, komposisi, `q`, dan `R` antara aplikasi dan pembanding.
3. Susun dataset pembanding independen dari hitungan tangan, literatur, simulator rigorous, dan/atau pilot plant. Pisahkan setiap jenis pembanding.
4. Catat nilai referensi, ketidakpastian, resolusi, versi mesin, input, sumber, dan hasil aplikasi untuk setiap kasus. Hitung galat hanya setelah pembanding nyata tersedia.
5. Periksa hasil pada Android fisik: input koma/titik, keyboard, navigasi kembali, grafik, riwayat setelah aplikasi ditutup, berbagi CSV, dan operasi saat jaringan dimatikan.

Tidak ada validasi eksperimen, galat terhadap literatur terukur, atau uji pada perangkat Android yang dinyatakan selesai di sini. Dasar persamaan yang diperiksa, termasuk perbedaan korelasi Gilliland Waterloo dan Molokanov, tercantum dalam [METODOLOGI.md](./METODOLOGI.md).
