import { RESEARCH_CASES, RESEARCH_HEADERS } from "./protocol";
import type { ResearchRun } from "./runner";
import { canExportResearchRun, researchSummary } from "./runner";
import { rowsToCSV } from "../utils/csv";

type Cell = string | number;
const escapeXML = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function researchRows(run: ResearchRun): Cell[][] {
  if (!canExportResearchRun(run))
    throw new Error(
      "Ekspor memerlukan 27 kasus yang selesai dihitung. Jalankan ulang paket atau periksa diagnosis kasus gagal.",
    );
  return [
    [...RESEARCH_HEADERS],
    ...run.records.map((record) => {
      if (record.status !== "computed")
        throw new Error("Hasil kasus belum tersedia.");
      const o = record.output;
      return [record.caseId, o.D, o.B, o.Rmin, o.Nmin, o.N_MT, o.N_FUG];
    }),
  ];
}

export function researchCSV(run: ResearchRun): string {
  return rowsToCSV(researchRows(run));
}

/** UTF-8 and ZIP store need no native module, TextEncoder, or network runtime. */
function utf8(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const point = char.codePointAt(0)!;
    if (point < 0x80) bytes.push(point);
    else if (point < 0x800)
      bytes.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
    else if (point < 0x10000)
      bytes.push(
        0xe0 | (point >> 12),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      );
    else
      bytes.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      );
  }
  return Uint8Array.from(bytes);
}
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const value of bytes) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function bytesHeader(size: number): { bytes: Uint8Array; view: DataView } {
  const bytes = new Uint8Array(size);
  return { bytes, view: new DataView(bytes.buffer) };
}
function join(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(
    chunks.reduce((size, chunk) => size + chunk.length, 0),
  );
  let at = 0;
  for (const chunk of chunks) {
    result.set(chunk, at);
    at += chunk.length;
  }
  return result;
}
function zipFiles(
  files: Array<[string, string]>,
  createdAt: string,
): Uint8Array {
  const date = new Date(createdAt);
  const year = Math.max(1980, Math.min(2107, date.getUTCFullYear()));
  const dosDate =
    ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  const dosTime =
    (date.getUTCHours() << 11) |
    (date.getUTCMinutes() << 5) |
    Math.floor(date.getUTCSeconds() / 2);
  const local: Uint8Array[] = [],
    central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of files) {
    const filename = utf8(name),
      data = utf8(text),
      crc = crc32(data);
    const h = bytesHeader(30);
    h.view.setUint32(0, 0x04034b50, true);
    h.view.setUint16(4, 20, true);
    h.view.setUint16(6, 0x800, true);
    h.view.setUint16(10, dosTime, true);
    h.view.setUint16(12, dosDate, true);
    h.view.setUint32(14, crc, true);
    h.view.setUint32(18, data.length, true);
    h.view.setUint32(22, data.length, true);
    h.view.setUint16(26, filename.length, true);
    local.push(h.bytes, filename, data);
    const c = bytesHeader(46);
    c.view.setUint32(0, 0x02014b50, true);
    c.view.setUint16(4, 20, true);
    c.view.setUint16(6, 20, true);
    c.view.setUint16(8, 0x800, true);
    c.view.setUint16(12, dosTime, true);
    c.view.setUint16(14, dosDate, true);
    c.view.setUint32(16, crc, true);
    c.view.setUint32(20, data.length, true);
    c.view.setUint32(24, data.length, true);
    c.view.setUint16(28, filename.length, true);
    c.view.setUint32(42, offset, true);
    central.push(c.bytes, filename);
    offset += h.bytes.length + filename.length + data.length;
  }
  const directory = join(central),
    end = bytesHeader(22);
  end.view.setUint32(0, 0x06054b50, true);
  end.view.setUint16(8, files.length, true);
  end.view.setUint16(10, files.length, true);
  end.view.setUint32(12, directory.length, true);
  end.view.setUint32(16, offset, true);
  return join([...local, directory, end.bytes]);
}
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function column(index: number): string {
  let n = index + 1,
    result = "";
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}
function sheet(rows: Cell[][], widths: number[]): string {
  return `${declaration}<worksheet xmlns="${ns}"><dimension ref="A1:${column(Math.max(...rows.map((r) => r.length)) - 1)}${rows.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols><sheetData>${rows
    .map(
      (row, index) =>
        `<row r="${index + 1}"${index === 0 ? ' ht="26" customHeight="1"' : ""}>${row
          .map((value, c) => {
            const attributes = `r="${column(c)}${index + 1}"${index === 0 ? ' s="1"' : ""}`;
            if (typeof value === "number") {
              if (!Number.isFinite(value))
                throw new Error("Angka tidak hingga tidak dapat diekspor.");
              return `<c ${attributes}><v>${String(value)}</v></c>`;
            }
            return `<c ${attributes} t="inlineStr"><is><t xml:space="preserve">${escapeXML(value)}</t></is></c>`;
          })
          .join("")}</row>`,
    )
    .join("")}</sheetData></worksheet>`;
}

export function researchXLSX(run: ResearchRun): Uint8Array {
  const rows = researchRows(run);
  const summary = researchSummary(run);
  const metadata: Cell[][] = [
    ["Keterangan", "Nilai"],
    ["run_id", run.id],
    ["waktu_mulai_UTC", run.createdAt],
    ["waktu_selesai_UTC", run.finishedAt],
    ["versi_aplikasi", run.appVersion],
    ["versi_engine", run.engineVersion],
    ["versi_dataset", run.datasetVersion],
    ["versi_acuan_kode", run.referenceVersion],
    ["sumber_acuan", run.referenceProvenance],
    [
      "eksekusi",
      "Dihitung oleh mesin aplikasi pada perangkat yang menjalankan run",
    ],
    ["lingkungan_eksekusi", run.executionEnvironment],
    ["versi_sistem", run.systemVersion],
    ["profil", "Biner hipotetik, alpha konstan, CMO, q=1; F dalam kmol/jam"],
    [
      "konvensi_tahap",
      "Kondensor total tidak dihitung; reboiler dihitung. N_MT merupakan Nceil; N_FUG kontinu.",
    ],
    ["toleransi_kontinu", "abs(error) <= 1e-8 + 1e-6 * abs(reference)"],
    ["toleransi_N_MT", "Bilangan bulat harus sama persis"],
    ["perbandingan_acuan_kode", `${summary.passed}/${summary.compared}`],
    ["uji_batas_lulus", `${summary.boundaryPassed}/${run.boundaries.length}`],
    [
      "cakupan_bukti",
      "Kesesuaian terhadap acuan kode independen; bukan klaim pengujian Microsoft Excel atau eksperimen fisik",
    ],
    [
      "pemetaan_ID",
      "alpha terluar, zF di tengah, R/Rmin terdalam, masing-masing urut naik. Cocokkan ID dengan workbook asli sebelum impor.",
    ],
    [
      "petunjuk",
      "Salin Hasil_App A2:G28 (27 baris x 7 kolom) ke workbook acuan. Semua angka menyimpan presisi penuh.",
    ],
  ];
  const inputs: Cell[][] = [
    [
      "case_id",
      "F",
      "zF",
      "xD",
      "xB",
      "q",
      "alpha",
      "R",
      "R/Rmin",
      "N_MT_fraksional",
      "Feed_stage",
    ],
    ...run.records.map((record) => {
      const p = record.input;
      return [
        record.caseId,
        p.F,
        p.zF,
        p.xD,
        p.xB,
        p.q,
        p.alpha,
        p.R,
        record.refluxFactor,
        record.status === "computed" ? record.mt.N : "",
        record.status === "computed" ? (record.mt.feedStage ?? "") : "",
      ];
    }),
  ];
  const boundaryRows: Cell[][] = [
    [
      "case_id",
      "Kondisi",
      "Kode diharapkan",
      "Kode aktual",
      "Status",
      "Diagnosis",
    ],
    ...run.boundaries.map((b) => [
      b.caseId,
      b.label,
      b.expectedCode,
      b.actualCode,
      b.passed ? "SESUAI" : "PERIKSA",
      b.message,
    ]),
  ];
  const names = ["Hasil_App", "Metadata", "Input_Kasus", "Uji_Batas"];
  const files: Array<[string, string]> = [
    [
      "[Content_Types].xml",
      `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    ],
    [
      "_rels/.rels",
      `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `${declaration}<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${names.map((name, index) => `<sheet name="${name}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    [
      "xl/styles.xml",
      `${declaration}<styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF254E70"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    ],
    ["xl/worksheets/sheet1.xml", sheet(rows, [14, 22, 22, 22, 22, 16, 22])],
    ["xl/worksheets/sheet2.xml", sheet(metadata, [32, 110])],
    [
      "xl/worksheets/sheet3.xml",
      sheet(inputs, [14, 18, 18, 18, 18, 12, 18, 22, 18, 22, 18]),
    ],
    [
      "xl/worksheets/sheet4.xml",
      sheet(boundaryRows, [14, 40, 30, 30, 18, 100]),
    ],
  ];
  // Ensure snapshots are mapped to the frozen protocol, never row-position alone.
  if (
    !run.records.every(
      (record, index) => record.caseId === RESEARCH_CASES[index]?.caseId,
    )
  )
    throw new Error("Urutan ID paket tidak sesuai protokol.");
  return zipFiles(files, run.createdAt);
}
