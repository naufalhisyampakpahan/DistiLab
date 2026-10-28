function buildSecondary(k) {
  const { C, screen, header, nav, box, card, rect, text, path, icon, pill, button, hotspot, links } = k;
  const idNumber = (n, digits = 2) => n.toFixed(digits).replace('.', ',');
  // The series uses the same binary, constant-alpha example as case C14.
  const stagesAt = (R) => {
    const alpha = 2.5, zF = 0.5, xD = 0.95, xB = 0.05;
    const mr = R / (R + 1), br = xD / (R + 1);
    const ms = (mr * zF + br - xB) / (zF - xB), bs = xB * (1 - ms);
    let y = xD, prev = xD;
    for (let n = 1; n <= 100; n++) {
      const x = y / (alpha - (alpha - 1) * y);
      if (x <= xB) return n - 1 + (prev - xB) / (prev - x);
      y = x >= zF ? mr * x + br : ms * x + bs;
      prev = x;
    }
    return 100;
  };
  const smallPill = (p, x, y, w, label, fill = C.mint, color = C.teal) => {
    const g = box(p, x, y, w, 26, fill, 13, null, label);
    text(g, 0, 4, w, label, 12, color, 'Semibold', 18, 'center');
    return g;
  };
  const stat = (p, x, y, w, value, label, fill = C.white, color = C.ink) => {
    const g = box(p, x, y, w, 76, fill, 16, fill === C.white ? C.border : null, 'Stat / ' + label);
    text(g, 14, 10, w - 28, value, 25, color, 'Bold', 36);
    text(g, 14, 47, w - 28, label, 12, fill === C.navy ? '#BBD2DA' : C.muted, 'Regular', 20);
    return g;
  };

  const sensitivity = screen('05 Sensitivitas', 0, 1);
  header(sensitivity, 'Eksplorasi model', 'Analisis sensitivitas', '04 Hasil');
  smallPill(sensitivity, 24, 116, 112, 'Contoh · C14');
  text(sensitivity, 148, 120, 218, 'McCabe–Thiele · q = 1', 12, C.muted, 'Regular', 20);
  const settings = card(sensitivity, 24, 156, 342, 154, 'Parameter sensitivitas');
  text(settings, 16, 13, 300, 'Variasi rasio refluks', 16, C.ink, 'Semibold', 25);
  [['R', 16, 65, true], ['zF', 87, 65, false], ['xD', 158, 65, false], ['α', 229, 65, false]].forEach(([label, x, w, selected]) => {
    const item = box(settings, x, 47, w, 32, selected ? C.teal : C.bg, 10, null, 'Parameter / ' + label);
    text(item, 0, 6, w, label, 13, selected ? C.white : C.muted, 'Semibold', 21, 'center');
  });
  const compactField = (parent, x, label, value) => {
    text(parent, x, 91, 94, label, 12, C.muted, 'Regular', 18);
    const field = box(parent, x, 113, 94, 30, C.bg, 8, C.border, 'Input / ' + label);
    text(field, 10, 3, 74, value, 15, C.ink, 'Semibold', 24);
  };
  compactField(settings, 16, 'Minimum R', '1,20');
  compactField(settings, 124, 'Maksimum R', '3,00');
  compactField(settings, 232, 'Titik sampel', '13');

  const chart = card(sensitivity, 24, 324, 342, 250, 'Grafik / N terhadap R');
  text(chart, 16, 13, 264, 'Tahap teoritis terhadap refluks', 15, C.ink, 'Semibold', 25);
  path(chart, 17, 48, 'M 0 0 L 18 0', C.teal, 3);
  text(chart, 42, 38, 270, 'N · parameter lain tetap', 12, C.muted, 'Regular', 20);
  const L = 45, T = 70, W = 271, H = 122, lo = 8, hi = 22;
  const px = (r) => L + (r - 1.2) / 1.8 * W;
  const py = (n) => T + (hi - n) / (hi - lo) * H;
  [8, 12, 16, 20].forEach((n) => {
    const yy = py(n);
    path(chart, L, yy, 'M 0 0 L ' + W + ' 0', C.border, 1);
    text(chart, 8, yy - 8, 28, String(n), 11, C.muted, 'Regular', 18, 'right');
  });
  path(chart, L, T - 1, 'M 0 0 L 0 ' + (H + 2) + ' L ' + W + ' ' + (H + 2), C.border, 1.3);
  const points = Array.from({ length: 13 }, (_, i) => ({ R: 1.2 + i * 0.15, N: stagesAt(1.2 + i * 0.15) }));
  const plot = points.map((p, i) => (i ? 'L ' : 'M ') + px(p.R).toFixed(2) + ' ' + py(p.N).toFixed(2)).join(' ');
  path(chart, 0, 0, plot, C.teal, 2.8, 'McCabe / Seri dihitung');
  points.forEach((p) => rect(chart, px(p.R) - 2, py(p.N) - 2, 4, 4, C.teal, 2));
  const activeX = px(1.65), activeY = py(stagesAt(1.65));
  path(chart, activeX, activeY, 'M 0 0 L 0 ' + (T + H - activeY), '#9CCEC4', 1.5);
  rect(chart, activeX - 5, activeY - 5, 10, 10, C.white, 5, C.teal, 'Titik terpilih');
  smallPill(chart, 165, 82, 145, 'R = 1,65 · contoh');
  [[1.2, '1,2'], [1.65, '1,65'], [2.1, '2,1'], [3, '3,0']].forEach(([r, label]) => text(chart, px(r) - 18, 199, 36, label, 11, C.muted, 'Regular', 18, 'center'));
  text(chart, 99, 223, 190, 'Rasio refluks operasi · R', 12, C.muted, 'Regular', 20, 'center');
  stat(sensitivity, 24, 590, 165, '1,65', 'R terpilih · contoh', C.navy, C.white);
  stat(sensitivity, 201, 590, 165, '11,6748', 'N teoritis · contoh');
  button(sensitivity, 24, 676, 342, 'Gunakan sebagai skenario baru', '03 Data kasus', 'primary', 'plus', 48);
  text(sensitivity, 24, 728, 342, 'Model biner · α = 2,5 · zF = 0,5', 11, C.muted, 'Regular', 16, 'center');
  nav(sensitivity, 'Beranda');

  const verification = screen('06 Verifikasi', 1, 1);
  header(verification, 'Paket penelitian', 'Verifikasi 27 kasus');
  smallPill(verification, 24, 116, 194, 'Contoh hasil tersimpan');
  text(verification, 230, 120, 136, 'Profil q = 1', 12, C.muted, 'Regular', 20, 'right');
  const run = box(verification, 24, 156, 342, 144, C.navy, 20, null, 'Ringkasan contoh run tersimpan');
  icon(run, 284, 18, 'shield', '#9FD8C7', 24);
  text(run, 18, 15, 255, 'Paket selesai dihitung', 15, C.white, 'Semibold', 25);
  text(run, 18, 44, 185, '27 / 27', 35, C.white, 'Bold', 48);
  text(run, 18, 92, 190, 'kasus selesai', 12, '#C0D5DD', 'Regular', 20);
  rect(run, 18, 122, 306, 6, '#315363', 3);
  rect(run, 18, 122, 306, 6, '#91D8C0', 3);
  stat(verification, 24, 314, 165, '162 / 162', 'Keluaran cocok');
  stat(verification, 201, 314, 165, '9 / 9', 'Diagnosis batas sesuai');
  text(verification, 24, 404, 250, 'Cocok acuan kode', 16, C.ink, 'Semibold', 25);
  text(verification, 24, 431, 342, 'Pilih C14 untuk meninjau contoh hasil.', 12, C.muted, 'Regular', 21);
  for (let i = 0; i < 27; i++) {
    const column = i % 9, row = Math.floor(i / 9), selected = i === 13;
    const caseLabel = 'C' + String(i + 1).padStart(2, '0');
    const item = box(verification, 24 + column * 38.6, 462 + row * 36, 33, 30, selected ? C.teal : C.mint, 8, null, 'Kasus / ' + caseLabel);
    text(item, 0, 5, 33, caseLabel, 12, selected ? C.white : C.teal, 'Semibold', 19, 'center');
    if (selected) links.push([item, '04 Hasil']);
  }
  const audit = card(verification, 24, 584, 342, 76, 'Audit / C14');
  text(audit, 16, 11, 170, 'C14 · contoh audit', 14, C.ink, 'Semibold', 22);
  smallPill(audit, 217, 10, 109, 'Cocok acuan');
  text(audit, 16, 42, 300, 'MT: 12 tahap  ·  FUG: 12,6034 tahap', 13, C.muted, 'Regular', 22);
  button(verification, 24, 678, 165, 'Lihat hasil C14', '04 Hasil', 'primary', 'arrow', 48);
  button(verification, 201, 678, 165, 'Ekspor XLSX', null, 'secondary', 'download', 48);
  text(verification, 24, 728, 342, 'Acuan kode independen · contoh, bukan run baru', 11, C.muted, 'Regular', 16, 'center');
  nav(verification, 'Beranda');

  const history = screen('07 Riwayat', 2, 1);
  header(history, 'Riwayat studi', 'Proyek dan skenario');
  const search = box(history, 24, 116, 342, 52, C.white, 14, C.border, 'Search / Studi');
  icon(search, 14, 14, 'search', C.muted, 24);
  text(search, 49, 15, 275, 'Cari studi atau metode', 14, C.muted, 'Regular', 23);
  smallPill(history, 24, 185, 126, '2 studi contoh');
  text(history, 236, 189, 130, '2 / 2 dipilih', 12, C.teal, 'Semibold', 20, 'right');
  const study = (y, letter, title, R, N, secondary = false) => {
    const g = card(history, 24, y, 342, 170, 'Studi / ' + title);
    const check = box(g, 16, 15, 30, 30, C.teal, 9, null, 'Pilihan / ' + letter);
    text(check, 0, 5, 30, letter, 14, C.white, 'Bold', 22, 'center');
    text(g, 58, 14, 250, title, 15, C.ink, 'Semibold', 24);
    text(g, 58, 39, 250, 'McCabe–Thiele · contoh C14', 12, C.muted, 'Regular', 20);
    text(g, 16, 75, 166, idNumber(N, 4), 27, C.ink, 'Bold', 39);
    text(g, 16, 113, 166, 'tahap teoritis', 12, C.muted, 'Regular', 20);
    smallPill(g, 215, 80, 111, 'R = ' + idNumber(R));
    button(g, 180, 126, 146, secondary ? 'Bandingkan' : 'Buka studi', secondary ? '09 Perbandingan' : '04 Hasil', 'secondary', 'arrow', 32);
    text(g, 16, 140, 150, secondary ? 'Skenario refluks' : 'Kasus dasar', 12, C.teal, 'Semibold', 20);
    hotspot(g, 0, 0, 342, 117, secondary ? '09 Perbandingan' : '04 Hasil', 'Open / ' + title);
    return g;
  };
  study(226, 'A', 'Pemisahan biner · dasar', 1.65, stagesAt(1.65));
  study(412, 'B', 'Refluks lebih tinggi', 2.5, stagesAt(2.5), true);
  const compare = box(history, 24, 600, 342, 62, C.mint, 16, null, 'Perbandingan / Dua skenario');
  icon(compare, 16, 19, 'compare', C.teal, 24);
  text(compare, 54, 10, 272, 'Dua skenario siap dibandingkan', 14, C.tealDark, 'Semibold', 22);
  text(compare, 54, 34, 270, 'Selisih Δ dihitung sebagai B − A.', 12, C.teal, 'Regular', 20);
  button(history, 24, 676, 342, 'Bandingkan skenario', '09 Perbandingan', 'primary', 'compare', 48);
  text(history, 24, 728, 342, 'Studi tersimpan di perangkat', 11, C.muted, 'Regular', 16, 'center');
  nav(history, 'Riwayat');

  const comparison = screen('09 Perbandingan', 4, 1);
  header(comparison, 'Dua skenario', 'Perbandingan skenario', '07 Riwayat');
  smallPill(comparison, 24, 116, 215, 'Contoh · C14 dan skenario');
  [['A', 'Kasus dasar', '1,65', 24], ['B', 'Refluks lebih tinggi', '2,50', 201]].forEach(([letter, label, value, x]) => {
    const g = card(comparison, x, 156, 165, 88, 'Skenario / ' + letter);
    smallPill(g, 12, 10, 28, letter, letter === 'A' ? C.blueBg : C.mint, letter === 'A' ? C.blue : C.teal);
    text(g, 48, 13, 107, label, 11, C.muted, 'Semibold', 18);
    text(g, 14, 42, 108, value, 27, C.ink, 'Bold', 38);
    text(g, 118, 54, 32, 'R', 13, C.muted, 'Semibold', 20, 'right');
  });
  const bars = card(comparison, 24, 260, 342, 180, 'Grafik / Perbandingan N');
  text(bars, 16, 12, 310, 'Tahap teoritis · N', 16, C.ink, 'Semibold', 25);
  text(bars, 16, 46, 180, 'A · Kasus dasar', 12, C.muted, 'Regular', 20);
  text(bars, 218, 44, 108, '11,6748', 17, C.blue, 'Bold', 25, 'right');
  rect(bars, 16, 77, 310, 18, C.blueBg, 9);
  rect(bars, 16, 77, 310 * 11.6748 / 12, 18, C.blue, 9);
  text(bars, 16, 109, 180, 'B · Refluks lebih tinggi', 12, C.muted, 'Regular', 20);
  text(bars, 218, 107, 108, '9,3756', 17, C.teal, 'Bold', 25, 'right');
  rect(bars, 16, 140, 310, 18, C.mint, 9);
  rect(bars, 16, 140, 310 * 9.3756 / 12, 18, C.teal, 9);
  const delta = box(comparison, 24, 454, 342, 74, C.navy, 17, null, 'Selisih / B dikurangi A');
  text(delta, 16, 10, 155, 'ΔN · B − A', 12, '#BBD2DA', 'Semibold', 20);
  text(delta, 183, 11, 143, '−2,2992', 28, C.white, 'Bold', 41, 'right');
  text(delta, 16, 44, 310, 'Tahap teoritis lebih sedikit pada B.', 12, '#C7E1DD', 'Regular', 21);
  const table = card(comparison, 24, 544, 342, 120, 'Tabel / Perbandingan hasil');
  text(table, 16, 10, 166, 'Besaran', 12, C.muted, 'Semibold', 20);
  text(table, 187, 10, 60, 'A', 12, C.blue, 'Bold', 20, 'right');
  text(table, 266, 10, 60, 'B', 12, C.teal, 'Bold', 20, 'right');
  [['Tahap bulat', '12', '10'], ['Tahap umpan', '6', '5'], ['D / B · kmol/jam', '50 / 50', '50 / 50']].forEach(([label, a, b], i) => {
    const yy = 37 + i * 26;
    path(table, 16, yy - 3, 'M 0 0 L 310 0', C.border, 1);
    text(table, 16, yy, 166, label, 12, C.ink, 'Regular', 20);
    text(table, 187, yy, 60, a, 13, C.ink, 'Semibold', 20, 'right');
    text(table, 266, yy, 60, b, 13, C.ink, 'Semibold', 20, 'right');
  });
  button(comparison, 24, 676, 342, 'Kembali ke riwayat', '07 Riwayat', 'primary', 'history', 48);
  text(comparison, 24, 728, 342, 'Input lain sama · McCabe–Thiele · q = 1', 11, C.muted, 'Regular', 16, 'center');
  nav(comparison, 'Riwayat');
}

module.exports = buildSecondary;
