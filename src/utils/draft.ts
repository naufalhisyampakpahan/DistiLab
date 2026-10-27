import type { BinaryInput, CalculationProfile } from "../types";
import { minimumReflux } from "../calculations";
import { parseNumeric } from "../validation";

export type Fields = Record<keyof Required<BinaryInput>, string>;
export const FIELD_LABELS: Record<keyof Fields, string> = {
  zF: "Komposisi umpan zF",
  xD: "Komposisi distilat xD",
  xB: "Komposisi bawah xB",
  q: "Kondisi termal q",
  alpha: "Volatilitas relatif α",
  R: "Rasio refluks R",
  F: "Laju umpan F",
};
export const BLANK_FIELDS: Fields = {
  zF: "",
  xD: "",
  xB: "",
  q: "",
  alpha: "",
  R: "",
  F: "",
};
export function inputFields(input: BinaryInput): Fields {
  return Object.fromEntries(
    Object.keys(BLANK_FIELDS).map((key) => [
      key,
      input[key as keyof BinaryInput] === undefined
        ? ""
        : String(input[key as keyof BinaryInput]),
    ]),
  ) as Fields;
}
export function parseFields(fields: Fields): BinaryInput {
  const input = {} as BinaryInput;
  for (const key of ["zF", "xD", "xB", "q", "alpha", "R"] as const)
    input[key] = parseNumeric(fields[key], FIELD_LABELS[key]);
  if (fields.F.trim()) input.F = parseNumeric(fields.F, FIELD_LABELS.F);
  return input;
}
export function inspectFields(
  fields: Fields,
  profile: CalculationProfile,
): Partial<Record<keyof Fields, string>> {
  const errors: Partial<Record<keyof Fields, string>> = {};
  const values: Partial<BinaryInput> = {};
  for (const key of Object.keys(BLANK_FIELDS) as (keyof Fields)[]) {
    if (key === "F" && !fields.F.trim() && profile === "general") continue;
    try {
      values[key] = parseNumeric(fields[key], FIELD_LABELS[key]);
    } catch (e) {
      errors[key] = e instanceof Error ? e.message : "Isi angka yang valid.";
    }
  }
  for (const key of ["zF", "xD", "xB"] as const)
    if (values[key] !== undefined && !(values[key]! > 0 && values[key]! < 1))
      errors[key] =
        "Fraksi mol harus lebih besar dari 0 dan lebih kecil dari 1.";
  if (values.alpha !== undefined && values.alpha <= 1)
    errors.alpha = "α harus lebih besar dari 1.";
  if (values.R !== undefined && values.R < 0)
    errors.R = "R tidak boleh negatif.";
  if (values.F !== undefined && values.F <= 0)
    errors.F = "F harus positif, dalam kmol/jam.";
  if (
    values.q !== undefined &&
    (profile === "research" ? values.q !== 1 : values.q < 0 || values.q > 1)
  )
    errors.q =
      profile === "research"
        ? "Profil penelitian menggunakan q = 1 (cair jenuh)."
        : "q harus berada di antara 0 dan 1.";
  if (
    ["xB", "zF", "xD"].every(
      (key) =>
        values[key as keyof BinaryInput] !== undefined &&
        !errors[key as keyof Fields],
    ) &&
    !(values.xB! < values.zF! && values.zF! < values.xD!)
  ) {
    errors.zF = "Komposisi harus memenuhi xB < zF < xD.";
  }
  if (Object.keys(errors).length === 0) {
    try {
      const minimum = minimumReflux(values as BinaryInput).Rmin;
      if (!(values.R! > minimum))
        errors.R = `Gunakan R > Rmin (${minimum.toPrecision(7)}).`;
    } catch (e) {
      errors.R = e instanceof Error ? e.message : "Periksa kelayakan operasi.";
    }
  }
  return errors;
}
