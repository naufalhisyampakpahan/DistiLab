import type { CalculationResult } from "../types";
import { fmt } from "./format";

export type EquationPart = string | { numerator: string; denominator: string };
export interface CalculationStep {
  id: string;
  title: string;
  equation: EquationPart[];
  substitution: string;
  result: string;
  explanation: string;
}

/** Presentation only: outputs always come from the selected calculation snapshot. */
export function calculationSteps(r: CalculationResult): CalculationStep[] {
  const p = r.input;
  const n = (value: number) => fmt(value, 4);
  const fraction = (numerator: string, denominator: string) => ({
    numerator,
    denominator,
  });
  const steps: CalculationStep[] = [
    {
      id: "vle",
      title: "Kesetimbangan cair–uap",
      equation: ["y = ", fraction("α · x", "1 + (α − 1) · x")],
      substitution: `α = ${n(p.alpha)}. x adalah fraksi mol komponen ringan dalam cairan; y dalam uap.`,
      result: `Volatilitas relatif α = ${n(p.alpha)}`,
      explanation:
        "Kurva kesetimbangan memakai α konstan. Untuk melangkah dari uap ke cairan, inversnya x = y / [α − (α − 1) · y].",
    },
  ];

  if (r.balance && p.F !== undefined) {
    steps.push({
      id: "balance",
      title: "Neraca massa produk",
      equation: ["D = F × ", fraction("zꜰ − xʙ", "xᴅ − xʙ"), " ; B = F − D"],
      substitution: `D = ${n(p.F)} × (${n(p.zF)} − ${n(p.xB)}) / (${n(p.xD)} − ${n(p.xB)})`,
      result: `D = ${n(r.balance.D)} kmol/jam · B = ${n(r.balance.B)} kmol/jam`,
      explanation:
        "F = D + B dan F · zꜰ = D · xᴅ + B · xʙ. Laju produk tidak dihitung jika F tidak diisi.",
    });
  }

  if (r.method === "mccabe") {
    steps.push(
      {
        id: "minimum",
        title: "Refluks minimum",
        equation: ["Rpinch = ", fraction("xᴅ − yₚ", "yₚ − xₚ")],
        substitution: `Pinch (xₚ; yₚ) = (${n(r.pinch.x)}; ${n(r.pinch.y)}). Rpinch = (${n(p.xD)} − ${n(r.pinch.y)}) / (${n(r.pinch.y)} − ${n(r.pinch.x)}).`,
        result: `Rmin = ${n(r.Rmin)} · R operasi = ${n(p.R)}`,
        explanation:
          "Pinch memenuhi q · xₚ + (1 − q) · yₚ = zꜰ pada kurva kesetimbangan. Rmin fisik = max(0, Rpinch, Rflow), dengan Rflow = max[0, (1 − q)/(D/F) − 1]. Operasi memerlukan R > Rmin.",
      },
      {
        id: "rectifying",
        title: "Garis operasi bagian atas",
        equation: [
          "y = ",
          fraction("R", "R + 1"),
          " · x + ",
          fraction("xᴅ", "R + 1"),
        ],
        substitution: `R = ${n(p.R)}; xᴅ = ${n(p.xD)}. Kemiringan = R / (R + 1); intersep = xᴅ / (R + 1).`,
        result: `y = ${n(r.rectifying.slope)} · x + ${n(r.rectifying.intercept)}`,
        explanation:
          "Garis rectifying dipakai untuk tahap di atas perpotongan umpan.",
      },
      {
        id: "feed",
        title: "Garis umpan dan perpotongan",
        equation: ["q · x + (1 − q) · y = zꜰ"],
        substitution: `${n(p.q)} · x + (${n(1 - p.q)}) · y = ${n(p.zF)}`,
        result:
          p.q === 1
            ? `Garis vertikal: x = ${n(p.zF)}`
            : p.q === 0
              ? `Garis horizontal: y = ${n(p.zF)}`
              : `q = ${n(p.q)}`,
        explanation: `Perpotongan dengan garis atas (xᵢ; yᵢ) = (${n(r.intersection.x)}; ${n(r.intersection.y)}). Tanda titik koma memisahkan koordinat agar tidak tertukar dengan koma desimal.`,
      },
      {
        id: "stripping",
        title: "Garis operasi bagian bawah",
        equation: [
          "mₛ = ",
          fraction("yᵢ − xʙ", "xᵢ − xʙ"),
          " ; y = mₛ · x + xʙ · (1 − mₛ)",
        ],
        substitution: `mₛ = (${n(r.intersection.y)} − ${n(p.xB)}) / (${n(r.intersection.x)} − ${n(p.xB)})`,
        result: `y = ${n(r.stripping.slope)} · x ${r.stripping.intercept < 0 ? "−" : "+"} ${n(Math.abs(r.stripping.intercept))}`,
        explanation:
          "Garis stripping menghubungkan perpotongan umpan dengan titik (xʙ; xʙ).",
      },
    );
    const last = r.stages[r.stages.length - 1];
    if (last)
      steps.push({
        id: "stages",
        title: "Jumlah tahap dan pembulatan",
        equation: [
          "f = ",
          fraction("x awal − xʙ", "x awal − x VLE"),
          " ; N = (n − 1) + f",
        ],
        substitution: `Langkah terakhir n = ${last.number}. f = (${n(last.start.x)} − ${n(p.xB)}) / (${n(last.start.x)} − ${n(last.equilibrium.x)}) = ${n(last.fraction)}.`,
        result: `N = ${last.number - 1} + ${n(last.fraction)} ≈ ${n(r.N)} → ${r.Nceil} tahap bulat`,
        explanation:
          "Fraksi tahap terakhir memakai interpolasi horizontal pada diagram, bukan efisiensi tray. Tahap bulat dibulatkan ke atas dari nilai mesin, bukan dari angka tampilan.",
      });
  } else {
    steps.push(
      {
        id: "fenske",
        title: "Fenske · tahap minimum",
        equation: [
          "Nmin = ",
          fraction("ln[(xᴅ / (1 − xᴅ)) · ((1 − xʙ) / xʙ)]", "ln α"),
        ],
        substitution: `Nmin = ln[(${n(p.xD)} / ${n(1 - p.xD)}) × (${n(1 - p.xB)} / ${n(p.xB)})] / ln(${n(p.alpha)})`,
        result: `Nmin = ${n(r.Nmin)} tahap`,
        explanation:
          "Batas tahap teoritis pada refluks total; bukan jumlah tahap pada refluks operasi yang dipilih.",
      },
      {
        id: "underwood-root",
        title: "Underwood · cari akar θ",
        equation: [
          fraction("α · zꜰ", "α − θ"),
          " + ",
          fraction("1 − zꜰ", "1 − θ"),
          " = 1 − q",
        ],
        substitution: `(${n(p.alpha)} × ${n(p.zF)}) / (${n(p.alpha)} − θ) + ${n(1 - p.zF)} / (1 − θ) = ${n(1 - p.q)}`,
        result: `θ = ${n(r.theta)}`,
        explanation: `Akar dicari dengan bisection pada 1 < θ < α. Mesin menyatakan konvergen setelah ${r.convergence.iterations} iterasi.`,
      },
      {
        id: "underwood-minimum",
        title: "Underwood · refluks minimum",
        equation: [
          "Rmin = ",
          fraction("α · xᴅ", "α − θ"),
          " + ",
          fraction("1 − xᴅ", "1 − θ"),
          " − 1",
        ],
        substitution: `Rmin = (${n(p.alpha)} × ${n(p.xD)}) / (${n(p.alpha)} − ${n(r.theta)}) + ${n(1 - p.xD)} / (1 − ${n(r.theta)}) − 1`,
        result: `Rmin = ${n(r.Rmin)}`,
        explanation:
          "Rmin adalah batas refluks minimum, bukan nilai refluks operasi. FUG dibatasi pada domain feed pinch yang didukung mesin.",
      },
      {
        id: "gilliland-x",
        title: "Gilliland · refluks ternormalisasi",
        equation: ["X = ", fraction("R − Rmin", "R + 1")],
        substitution: `X = (${n(p.R)} − ${n(r.Rmin)}) / (${n(p.R)} + 1)`,
        result: `X = ${n(r.X)}`,
        explanation:
          "X tidak bersatuan. Semakin dekat R ke Rmin, semakin besar kebutuhan tahap.",
      },
      {
        id: "gilliland-y",
        title: "Molokanov · korelasi Gilliland",
        equation: ["Y = 1 − exp[A · B]"],
        substitution: `A = (1 + 54,4 · X) / (11 + 117,2 · X)\nB = (X − 1) / √X\nGunakan X = ${n(r.X)}. exp(t) berarti e pangkat t.`,
        result: `Y = ${n(r.Y)}`,
        explanation:
          "Korelasi empiris menghubungkan refluks dengan jumlah tahap. X dan Y adalah variabel bantu, bukan komposisi cair/uap x dan y.",
      },
      {
        id: "stages",
        title: "Jumlah tahap operasi",
        equation: ["N = ", fraction("Nmin + Y", "1 − Y")],
        substitution: `N = (${n(r.Nmin)} + ${n(r.Y)}) / (1 − ${n(r.Y)})`,
        result: `N ≈ ${n(r.N)} → ${r.Nceil} tahap bulat`,
        explanation:
          "Jumlah tahap berasal dari korelasi FUG, bukan penahapan grafis McCabe–Thiele. Pembulatan ke atas memakai nilai mesin dengan presisi penuh.",
      },
    );
  }
  return steps;
}
