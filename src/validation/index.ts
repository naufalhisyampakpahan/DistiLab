import type { BinaryInput } from "../types";

export class CalculationError extends Error {
  readonly code: string;
  constructor(message: string, code = "INVALID_INPUT") {
    super(message);
    this.name = "CalculationError";
    this.code = code;
  }
}

export function parseNumeric(text: string, label: string): number {
  const trimmed = text.trim();
  if (!trimmed)
    throw new CalculationError(`${label} belum diisi. Masukkan nilai numerik.`);
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    throw new CalculationError(
      `${label} harus berupa angka. Gunakan satu tanda koma atau titik desimal, tanpa pemisah ribuan.`,
    );
  }
  const number = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(number))
    throw new CalculationError(
      `${label} harus berupa angka hingga; NaN dan Infinity tidak didukung.`,
    );
  return number;
}

export function validateInput(input: BinaryInput): void {
  for (const name of ["zF", "xD", "xB", "q", "alpha", "R"] as const) {
    if (!Number.isFinite(input[name]))
      throw new CalculationError(`${name} harus berupa angka hingga.`);
  }
  for (const name of ["zF", "xD", "xB"] as const) {
    if (input[name] <= 0 || input[name] >= 1) {
      throw new CalculationError(
        `${name} harus lebih besar dari 0 dan lebih kecil dari 1. Komposisi murni memerlukan tahap tak hingga pada model ini.`,
      );
    }
  }
  if (!(input.xD > input.zF && input.zF > input.xB)) {
    throw new CalculationError(
      "Komposisi harus memenuhi xD > zF > xB untuk pemisahan komponen ringan.",
    );
  }
  if (input.q < 0 || input.q > 1)
    throw new CalculationError(
      "q harus berada pada rentang 0 sampai 1 (umpan uap jenuh hingga cair jenuh).",
    );
  if (input.alpha <= 1)
    throw new CalculationError(
      "Volatilitas relatif alpha harus lebih besar dari 1.",
    );
  if (input.R < 0)
    throw new CalculationError(
      "Rasio refluks R tidak boleh negatif. Untuk operasi tahap hingga, gunakan R > Rmin.",
    );
  if (input.F !== undefined && (!Number.isFinite(input.F) || input.F <= 0)) {
    throw new CalculationError(
      "Laju alir umpan F harus berupa angka hingga yang lebih besar dari 0.",
    );
  }
}
