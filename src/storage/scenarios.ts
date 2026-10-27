import type { Study } from "../types";

export function projectKey(study: Study): string {
  return study.projectId ?? study.id;
}

export function projectTitle(study: Study, studies: readonly Study[]): string {
  const key = projectKey(study);
  return (
    studies.find((candidate) => candidate.id === key)?.name ??
    studies.find(
      (candidate) => projectKey(candidate) === key && !candidate.parentStudyId,
    )?.name ??
    studies
      .filter((candidate) => projectKey(candidate) === key)
      .sort(
        (a, b) =>
          Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
          a.id.localeCompare(b.id),
      )[0]?.name ??
    study.name
  );
}

export interface ScenarioDifference {
  key: string;
  label: string;
  unit?: string;
  a?: number;
  b?: number;
  delta?: number;
}

function difference(
  key: string,
  label: string,
  a?: number,
  b?: number,
  unit?: string,
): ScenarioDifference {
  return {
    key,
    label,
    unit,
    a,
    b,
    delta: a === undefined || b === undefined ? undefined : b - a,
  };
}

export function scenarioDifferences(
  a: Study,
  b: Study,
): {
  inputs: ScenarioDifference[];
  outputs: ScenarioDifference[];
  warnings: string[];
} {
  const inputLabels = [
    ["F", "Laju umpan F", "kmol/jam"],
    ["zF", "Komposisi umpan zF", "fraksi mol"],
    ["xD", "Target distilat xD", "fraksi mol"],
    ["xB", "Target produk bawah xB", "fraksi mol"],
    ["q", "Kondisi umpan q", ""],
    ["alpha", "Volatilitas relatif α", ""],
    ["R", "Refluks R", ""],
  ] as const;
  const inputs = inputLabels.map(([key, label, unit]) =>
    difference(key, label, a.result.input[key], b.result.input[key], unit),
  );
  const outputs = [
    difference(
      "N",
      "Tahap N tanpa pembulatan",
      a.result.N,
      b.result.N,
      "tahap",
    ),
    difference("Nceil", "Tahap bulat", a.result.Nceil, b.result.Nceil, "tahap"),
    difference("Rmin", "Refluks minimum Rmin", a.result.Rmin, b.result.Rmin),
    difference(
      "Nmin",
      "Tahap minimum Fenske",
      a.result.method === "fug" ? a.result.Nmin : undefined,
      b.result.method === "fug" ? b.result.Nmin : undefined,
      "tahap",
    ),
    difference(
      "D",
      "Laju distilat D",
      a.result.balance?.D,
      b.result.balance?.D,
      "kmol/jam",
    ),
    difference(
      "B",
      "Laju produk bawah B",
      a.result.balance?.B,
      b.result.balance?.B,
      "kmol/jam",
    ),
    difference(
      "feed",
      "Indeks tahap umpan",
      a.result.method === "mccabe"
        ? (a.result.feedStage ?? undefined)
        : undefined,
      b.result.method === "mccabe"
        ? (b.result.feedStage ?? undefined)
        : undefined,
    ),
  ];
  const warnings: string[] = [];
  if (a.result.method !== b.result.method)
    warnings.push(
      "Metode berbeda: selisih mencakup pengaruh metode serta perubahan input.",
    );
  if (a.engineVersion !== b.engineVersion)
    warnings.push(
      "Versi mesin berbeda. Hitung ulang kedua skenario dengan versi yang sama untuk kajian perubahan input.",
    );
  if ((a.profile ?? "general") !== (b.profile ?? "general"))
    warnings.push(
      "Profil perhitungan berbeda. Periksa asumsi dan batas setiap skenario.",
    );
  if (a.result.input.q !== b.result.input.q)
    warnings.push(
      "Kondisi umpan q berbeda; perbandingan tidak mengisolasi pengaruh refluks.",
    );
  if (
    a.protocolVersion !== b.protocolVersion &&
    (a.protocolVersion || b.protocolVersion)
  )
    warnings.push(
      "Versi protokol penelitian berbeda atau belum tercatat pada salah satu skenario.",
    );
  return { inputs, outputs, warnings };
}
