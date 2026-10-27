import { ASSUMPTIONS, ENGINE_VERSION } from "../types";
import type { BinaryInput, CalculationResult, SensitivityRun } from "../types";

export type CSVValue = string | number | boolean | null | undefined;
export interface ExportMetadata {
  name?: string;
  createdAt?: string;
  engineVersion?: string;
}

export function csvCell(value: CSVValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  let cell = String(value);
  // Spreadsheet programs may interpret untrusted text as a formula, even after leading whitespace.
  // Numeric values are left numeric; text with formula prefixes is forced into a text cell.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(cell)) cell = `'${cell}`;
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function rowsToCSV(rows: readonly (readonly CSVValue[])[]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function header(
  method: string,
  input: BinaryInput,
  metadata: ExportMetadata,
): CSVValue[][] {
  const rows: CSVValue[][] = [
    ["DistiLab", "Ekspor perhitungan biner"],
    ["nama_studi", metadata.name ?? ""],
    [
      "metode",
      method === "mccabe" ? "McCabe–Thiele" : "Fenske–Underwood–Gilliland",
    ],
    ["waktu_perhitungan_ISO", metadata.createdAt ?? new Date().toISOString()],
    ["versi_mesin", metadata.engineVersion ?? ENGINE_VERSION],
    ["konvensi_tahap", "Reboiler termasuk; total condenser tidak dihitung"],
    ["unit_komposisi", "fraksi mol light key"],
    ["unit_F_D_B", "kmol/jam"],
    [],
    ["INPUT"],
    ["parameter", "nilai"],
  ];
  for (const key of ["zF", "xD", "xB", "q", "alpha", "R", "F"] as const)
    rows.push([key, input[key]]);
  rows.push([], ["ASUMSI"]);
  for (const assumption of ASSUMPTIONS) rows.push(["asumsi", assumption]);
  return rows;
}

export function calculationCSV(
  result: CalculationResult,
  metadata: ExportMetadata = {},
): string {
  const rows = header(result.method, result.input, metadata);
  rows.push(
    [],
    ["OUTPUT"],
    ["parameter", "nilai"],
    ["N_tanpa_pembulatan", result.N],
    ["N_bulat", result.Nceil],
    ["Rmin", result.Rmin],
    ["konvergen", result.convergence.converged],
    ["iterasi", result.convergence.iterations],
    ["toleransi", result.convergence.tolerance],
  );
  if (result.balance)
    rows.push(
      ["D", result.balance.D],
      ["B", result.balance.B],
      ["residual_neraca_total", result.balance.totalResidual],
      ["residual_neraca_komponen", result.balance.componentResidual],
    );
  if (result.method === "fug") {
    rows.push(
      ["Nmin", result.Nmin],
      ["theta_Underwood", result.theta],
      ["X_Gilliland", result.X],
      ["Y_Gilliland", result.Y],
    );
    if (result.underwoodRawRmin !== undefined)
      rows.push(["Rmin_Underwood_mentah", result.underwoodRawRmin]);
  } else {
    if (result.RminPinch !== undefined)
      rows.push(["Rmin_pinch", result.RminPinch]);
    if (result.Rflow !== undefined)
      rows.push(["Rmin_batas_aliran", result.Rflow]);
    rows.push(
      ["perkiraan_tahap_umpan", result.feedStage],
      ["pinch_x", result.pinch.x],
      ["pinch_y", result.pinch.y],
      ["perpotongan_x", result.intersection.x],
      ["perpotongan_y", result.intersection.y],
      ["rectifying_slope", result.rectifying.slope],
      ["rectifying_intercept", result.rectifying.intercept],
      ["stripping_slope", result.stripping.slope],
      ["stripping_intercept", result.stripping.intercept],
      [],
      ["TAHAP_NUMERIK"],
      [
        "tahap",
        "bagian",
        "x_awal",
        "y_awal",
        "x_kesetimbangan",
        "y_kesetimbangan",
        "x_akhir",
        "y_akhir",
        "fraksi_tahap",
      ],
    );
    for (const stage of result.stages)
      rows.push([
        stage.number,
        stage.section,
        stage.start.x,
        stage.start.y,
        stage.equilibrium.x,
        stage.equilibrium.y,
        stage.end.x,
        stage.end.y,
        stage.fraction,
      ]);
    rows.push([], ["KOORDINAT_GRAFIK"], ["kurva", "indeks", "x", "y"]);
    for (const [curve, points] of [
      ["equilibrium", result.equilibriumCurve],
      ["q_line", result.qLine],
      ["staircase", result.staircase],
    ] as const) {
      points.forEach((point, index) =>
        rows.push([curve, index, point.x, point.y]),
      );
    }
  }
  return rowsToCSV(rows);
}

export function sensitivityCSV(
  run: SensitivityRun,
  metadata: ExportMetadata = {},
): string {
  const rows = header(run.method, run.input, {
    ...metadata,
    createdAt: metadata.createdAt ?? run.createdAt,
  });
  rows.push(
    [],
    ["SENSITIVITAS"],
    ["parameter_bebas", run.parameter],
    ["minimum", run.min],
    ["maksimum", run.max],
    ["jumlah_titik", run.count],
    [
      "keterangan",
      "Titik tidak layak tidak dihubungkan pada grafik; N, Nmin, dan Rmin kosong apabila perhitungan gagal.",
    ],
    [],
    [run.parameter, "valid", "N", "Nmin", "Rmin", "pesan"],
  );
  for (const point of run.points) {
    rows.push(
      point.valid
        ? [point.value, true, point.N, point.Nmin, point.Rmin, ""]
        : [point.value, false, null, null, null, point.error],
    );
  }
  return rowsToCSV(rows);
}
