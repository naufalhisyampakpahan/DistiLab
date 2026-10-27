import type {
  Balance,
  BinaryInput,
  CalculationResult,
  Convergence,
  FUGResult,
  McCabeResult,
  Method,
  Point,
  SensitivityParameter,
  SensitivityRun,
  Stage,
} from "../types";
import { CalculationError, validateInput } from "../validation";

const DEFAULT_TOLERANCE = 1e-12;
export const NUMERICAL_DEFAULTS = {
  tolerance: DEFAULT_TOLERANCE,
  maxStages: 2000,
  maxUnderwoodIterations: 256,
} as const;
export interface RootOptions {
  maxIterations?: number;
  tolerance?: number;
}
export interface McCabeOptions {
  maxStages?: number;
  tolerance?: number;
}

function checkOptions(limit: number, tolerance: number, label: string): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100_000) {
    throw new CalculationError(
      `${label} harus berupa bilangan bulat dari 1 sampai 100000.`,
    );
  }
  if (!Number.isFinite(tolerance) || tolerance <= 0 || tolerance >= 0.01) {
    throw new CalculationError(
      "Toleransi numerik harus lebih besar dari 0 dan lebih kecil dari 0,01.",
    );
  }
}

function checkEquilibriumArgument(composition: number, alpha: number): void {
  if (!Number.isFinite(composition) || composition < 0 || composition > 1) {
    throw new CalculationError(
      "Fraksi mol kesetimbangan harus berada pada rentang 0 sampai 1.",
    );
  }
  if (!Number.isFinite(alpha) || alpha <= 1)
    throw new CalculationError(
      "Volatilitas relatif alpha harus lebih besar dari 1.",
    );
}

/** Algebraically identical to alpha*x/(1+(alpha-1)*x), without overflow. */
export function equilibriumY(x: number, alpha: number): number {
  checkEquilibriumArgument(x, alpha);
  if (x === 0 || x === 1) return x;
  return x / (x + (1 - x) / alpha);
}

export function equilibriumX(y: number, alpha: number): number {
  checkEquilibriumArgument(y, alpha);
  if (y === 0 || y === 1) return y;
  return y / (y + alpha * (1 - y));
}

export function massBalance(input: BinaryInput): Balance | undefined {
  validateInput(input);
  if (input.F === undefined) return undefined;
  const D = input.F * ((input.zF - input.xB) / (input.xD - input.xB));
  const B = input.F - D;
  const totalResidual = input.F - (D + B);
  const componentResidual = input.F * input.zF - (D * input.xD + B * input.xB);
  if (
    ![D, B, totalResidual, componentResidual].every(Number.isFinite) ||
    D <= 0 ||
    B <= 0 ||
    Math.abs(totalResidual) > 1e-10 * input.F ||
    Math.abs(componentResidual) > 1e-10 * input.F
  ) {
    throw new CalculationError(
      "Neraca massa tidak dapat dipenuhi dengan ketelitian numerik yang tersedia. Periksa komposisi dan F.",
      "MASS_BALANCE",
    );
  }
  return { D, B, totalResidual, componentResidual };
}

/** Positive stripping vapour requires (R+1)D/F > 1-q. */
export function minimumFlowReflux(input: BinaryInput): number {
  validateInput(input);
  const distillateFraction = (input.zF - input.xB) / (input.xD - input.xB);
  return Math.max(0, (1 - input.q) / distillateFraction - 1);
}

/** q*x + (1-q)*y*(x)=zF; stable quadratic, including both q endpoints. */
export function minimumReflux(input: BinaryInput): {
  Rmin: number;
  pinch: Point;
  rawRmin: number;
  flowRmin: number;
} {
  validateInput(input);
  const { q, zF, alpha, xD } = input;
  let x: number;
  if (q === 1) x = zF;
  else if (q === 0) x = equilibriumX(zF, alpha);
  else {
    const a = q * (1 - 1 / alpha);
    const b = q / alpha + (1 - q) - zF * (1 - 1 / alpha);
    const c = zF / alpha;
    const discriminant = Math.sqrt(b * b + 4 * a * c);
    x = b >= 0 ? (2 * c) / (b + discriminant) : (discriminant - b) / (2 * a);
  }
  const y = equilibriumY(x, alpha);
  // Evaluating y-x by subtraction loses significant digits when alpha approaches 1.
  const gap = (x * (1 - x) * (1 - 1 / alpha)) / (x + (1 - x) / alpha);
  const rawRmin = (xD - y) / gap;
  const flowRmin = minimumFlowReflux(input);
  const Rmin = Math.max(0, rawRmin, flowRmin);
  if (![x, y, rawRmin, Rmin].every(Number.isFinite) || !(x > 0 && x < 1)) {
    throw new CalculationError(
      "Pinch tidak dapat dihitung dengan ketelitian numerik yang tersedia.",
      "NUMERICAL_DOMAIN",
    );
  }
  return { Rmin, pinch: { x, y }, rawRmin, flowRmin };
}

function ensureOperatingReflux(R: number, Rmin: number): void {
  const indistinguishable =
    Rmin > 0 && R - Rmin <= 4 * Number.EPSILON * Math.max(R, Rmin);
  if (!(R > Rmin) || indistinguishable)
    throw new CalculationError(
      `R = ${R} harus lebih besar dari Rmin = ${Rmin.toPrecision(7)}. Pada atau di bawah batas ini, operasi tahap hingga tidak layak.`,
      "REFLUX_LIMIT",
    );
}

export function fenske(input: BinaryInput): number {
  validateInput(input);
  // Sum of logarithms avoids overflow in products of extreme composition ratios.
  const Nmin =
    (Math.log(input.xD) -
      Math.log1p(-input.xD) +
      Math.log1p(-input.xB) -
      Math.log(input.xB)) /
    Math.log(input.alpha);
  if (!Number.isFinite(Nmin) || Nmin <= 0)
    throw new CalculationError(
      "Persamaan Fenske tidak menghasilkan jumlah tahap minimum yang layak.",
      "NUMERICAL_DOMAIN",
    );
  return Nmin;
}

export function underwood(
  input: BinaryInput,
  options: RootOptions = {},
): {
  theta: number;
  Rmin: number;
  rawRmin: number;
  flowRmin: number;
  convergence: Convergence;
} {
  validateInput(input);
  const maxIterations =
    options.maxIterations ?? NUMERICAL_DEFAULTS.maxUnderwoodIterations;
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  checkOptions(maxIterations, tolerance, "Batas iterasi Underwood");
  const { alpha, zF, xD, q } = input;
  // t=(theta-1)/(alpha-1). Multiplying the residual by its positive
  // denominators removes the poles, retaining the exact sign in (0,1).
  const scaledHeavy = (1 - zF) / alpha;
  const thermal = (1 - q) * (1 - 1 / alpha);
  const midpointResidual = zF * 0.5 - scaledHeavy * 0.5 - thermal * 0.25;
  // Solve in the distance to the nearer pole. In particular, do not recover
  // a tiny 1-t by subtracting two numbers close to 1 for extreme feeds.
  const reversed = midpointResidual < 0;
  const residual = (coordinate: number): number =>
    reversed
      ? -(
          zF * (1 - coordinate) -
          scaledHeavy * coordinate -
          thermal * coordinate * (1 - coordinate)
        )
      : zF * coordinate -
        scaledHeavy * (1 - coordinate) -
        thermal * coordinate * (1 - coordinate);
  let low = 0;
  let high = 0.5;
  let coordinate = 0.5;
  let iterations = 0;
  let converged = midpointResidual === 0;
  for (iterations = 1; iterations <= maxIterations; iterations += 1) {
    if (converged) break;
    coordinate = low + (high - low) / 2;
    const value = residual(coordinate);
    if (
      !Number.isFinite(value) ||
      coordinate === 0 ||
      coordinate === low ||
      coordinate === high
    )
      break;
    if (value === 0) {
      converged = true;
      break;
    }
    if (value < 0) low = coordinate;
    else high = coordinate;
    // Relative bracket width is scaled by distance to the nearest pole.
    if (high - low <= tolerance * coordinate) {
      coordinate = low + (high - low) / 2;
      converged = true;
      break;
    }
  }
  const t = reversed ? 1 - coordinate : coordinate;
  const u = reversed ? coordinate : 1 - coordinate;
  const theta = reversed ? alpha - (alpha - 1) * u : 1 + (alpha - 1) * t;
  if (!converged || !(theta > 1 && theta < alpha)) {
    throw new CalculationError(
      `Akar Underwood tidak konvergen di antara 1 dan alpha dalam ${maxIterations} iterasi, atau terlalu dekat dengan singularitas untuk ketelitian angka. Periksa alpha dan komposisi.`,
      "UNDERWOOD_NONCONVERGENCE",
    );
  }
  // These denominators are retained in the normalized coordinate to avoid
  // cancellation when theta lies close to either volatility pole.
  const delta = alpha - 1;
  const rawRmin = ((alpha / delta) * xD) / u - (1 - xD) / (delta * t) - 1;
  const flowRmin = minimumFlowReflux(input);
  const Rmin = rawRmin;
  if (!Number.isFinite(Rmin)) {
    throw new CalculationError(
      "Refluks minimum Underwood tidak hingga; periksa parameter dekat singularitas.",
      "NUMERICAL_DOMAIN",
    );
  }
  return {
    theta,
    Rmin,
    rawRmin,
    flowRmin,
    convergence: { converged: true, iterations, tolerance },
  };
}

/** User-specified Molokanov approximation to Gilliland's empirical curve. */
export function gilliland(
  Nmin: number,
  R: number,
  Rmin: number,
): { N: number; X: number; Y: number } {
  if (
    ![Nmin, R, Rmin].every(Number.isFinite) ||
    Nmin <= 0 ||
    Rmin < 0 ||
    R < 0
  ) {
    throw new CalculationError(
      "Domain Gilliland memerlukan Nmin > 0, Rmin ≥ 0, dan rasio refluks hingga.",
      "NUMERICAL_DOMAIN",
    );
  }
  ensureOperatingReflux(R, Rmin);
  const X = (R - Rmin) / (R + 1);
  if (!(X > 0 && X <= 1))
    throw new CalculationError(
      "X Gilliland harus berada pada rentang 0 < X ≤ 1.",
      "NUMERICAL_DOMAIN",
    );
  const exponent =
    ((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X));
  const oneMinusY = Math.exp(exponent);
  const Y = -Math.expm1(exponent);
  const N = (Nmin + Y) / oneMinusY;
  if (
    !Number.isFinite(N) ||
    oneMinusY === 0 ||
    N < Nmin ||
    N > Number.MAX_SAFE_INTEGER
  ) {
    throw new CalculationError(
      "R terlalu dekat dengan Rmin untuk menghasilkan jumlah tahap Gilliland yang hingga dan terwakili secara numerik. Naikkan R.",
      "GILLILAND_DIVERGENCE",
    );
  }
  return { N, X, Y };
}

export function calculateFUG(input: BinaryInput): FUGResult {
  validateInput(input);
  const Nmin = fenske(input);
  const { theta, rawRmin, convergence } = underwood(input);
  const geometric = minimumReflux(input);
  // Standard binary Underwood/Gilliland assumes a feed pinch in the product
  // separation interval. Extending the correlation with a flow-adjusted
  // minimum would obscure the actual Underwood identity; use McCabe instead.
  if (geometric.pinch.x < input.xB || geometric.rawRmin < 0) {
    throw new CalculationError(
      "Pinch umpan berada di luar rentang pemisahan produk, atau Underwood menghasilkan Rmin negatif. Kondisi ini di luar domain FUG biner yang didukung; gunakan McCabe–Thiele.",
      "FUG_DOMAIN",
    );
  }
  const Rmin =
    geometric.rawRmin === 0 && Math.abs(rawRmin) <= 100 * convergence.tolerance
      ? 0
      : rawRmin;
  if (Rmin < 0 || input.R <= geometric.flowRmin) {
    throw new CalculationError(
      "Kondisi FUG tidak memenuhi domain refluks minimum dan aliran uap stripping positif. Gunakan McCabe–Thiele atau perbaiki parameter.",
      "FUG_DOMAIN",
    );
  }
  const { N, X, Y } = gilliland(Nmin, input.R, Rmin);
  return {
    method: "fug",
    input: { ...input },
    Nmin,
    Rmin,
    underwoodRawRmin: rawRmin,
    N,
    Nceil: Math.ceil(N),
    theta,
    X,
    Y,
    balance: massBalance(input),
    convergence,
  };
}

/** Clip q*x+(1-q)*y=zF to the unit square without near-q=1 slopes. */
function qLinePoints(input: BinaryInput): Point[] {
  if (input.q === 1)
    return [
      { x: input.zF, y: 0 },
      { x: input.zF, y: 1 },
    ];
  if (input.q === 0)
    return [
      { x: 0, y: input.zF },
      { x: 1, y: input.zF },
    ];
  const { q, zF } = input;
  const points: Point[] = [];
  const candidates: Point[] = [
    { x: 0, y: zF / (1 - q) },
    { x: 1, y: (zF - q) / (1 - q) },
    { x: zF / q, y: 0 },
    { x: (zF - (1 - q)) / q, y: 1 },
  ];
  for (const point of candidates) {
    if (
      point.x >= 0 &&
      point.x <= 1 &&
      point.y >= 0 &&
      point.y <= 1 &&
      !points.some(
        (other) =>
          Math.abs(other.x - point.x) < 1e-15 &&
          Math.abs(other.y - point.y) < 1e-15,
      )
    )
      points.push(point);
  }
  return points.sort((a, b) => a.x - b.x).slice(0, 2);
}

export function calculateMcCabe(
  input: BinaryInput,
  options: McCabeOptions = {},
): McCabeResult {
  validateInput(input);
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const maxStages = options.maxStages ?? NUMERICAL_DEFAULTS.maxStages;
  checkOptions(maxStages, tolerance, "Batas tahap McCabe–Thiele");
  const { Rmin, pinch, rawRmin, flowRmin } = minimumReflux(input);
  ensureOperatingReflux(input.R, Rmin);
  const rectifying = {
    slope: input.R / (input.R + 1),
    intercept: input.xD / (input.R + 1),
  };
  const denominator = input.q + (1 - input.q) * rectifying.slope;
  const intersection = {
    x: (input.zF - (1 - input.q) * rectifying.intercept) / denominator,
    y: 0,
  };
  intersection.y = rectifying.slope * intersection.x + rectifying.intercept;
  if (
    ![intersection.x, intersection.y].every(Number.isFinite) ||
    !(intersection.x > input.xB && intersection.x < input.xD) ||
    !(intersection.y > intersection.x && intersection.y <= input.xD) ||
    !(intersection.y < equilibriumY(intersection.x, input.alpha))
  ) {
    throw new CalculationError(
      "Garis operasi tidak membentuk daerah pemisahan yang layak. Naikkan R atau periksa komposisi dan q; titik umpan harus berada di antara produk dan di bawah kurva kesetimbangan.",
      "INFEASIBLE_GEOMETRY",
    );
  }
  const strippingSlope =
    (intersection.y - input.xB) / (intersection.x - input.xB);
  const stripping = {
    slope: strippingSlope,
    intercept: input.xB * (1 - strippingSlope),
  };
  if (!Number.isFinite(strippingSlope) || strippingSlope <= 1) {
    throw new CalculationError(
      "Garis stripping tidak layak: aliran uap bagian bawah harus positif.",
      "INFEASIBLE_GEOMETRY",
    );
  }
  const stages: Stage[] = [];
  const staircase: Point[] = [{ x: input.xD, y: input.xD }];
  let start: Point = staircase[0]!;
  let feedStage: number | null = null;
  for (let number = 1; number <= maxStages; number += 1) {
    const equilibrium = { x: equilibriumX(start.y, input.alpha), y: start.y };
    const section =
      equilibrium.x >= intersection.x ? "rectifying" : "stripping";
    if (section === "stripping" && feedStage === null) feedStage = number;
    const horizontalProgress = start.x - equilibrium.x;
    if (horizontalProgress <= tolerance * Math.max(start.x, Number.MIN_VALUE)) {
      throw new CalculationError(
        "Langkah McCabe–Thiele berhenti di dekat pinch atau batas ketelitian angka. Naikkan R atau periksa parameter.",
        "MCCABE_NONCONVERGENCE",
      );
    }
    staircase.push(equilibrium);
    if (equilibrium.x <= input.xB) {
      // Count the last theoretical stage by linear interpolation of its
      // horizontal segment. The full equilibrium step is retained for plotting.
      const fraction = Math.min(
        1,
        Math.max(0, (start.x - input.xB) / horizontalProgress),
      );
      stages.push({
        number,
        start,
        equilibrium,
        end: equilibrium,
        section,
        fraction,
      });
      const N = number - 1 + fraction;
      return {
        method: "mccabe",
        input: { ...input },
        N,
        Nceil: Math.ceil(N),
        Rmin,
        RminPinch: rawRmin,
        Rflow: flowRmin,
        pinch,
        intersection,
        rectifying,
        stripping,
        qLine: qLinePoints(input),
        equilibriumCurve: Array.from({ length: 201 }, (_, i) => ({
          x: i / 200,
          y: equilibriumY(i / 200, input.alpha),
        })),
        staircase,
        stages,
        feedStage,
        balance: massBalance(input),
        convergence: { converged: true, iterations: number, tolerance },
      };
    }
    const operating = section === "rectifying" ? rectifying : stripping;
    const end = {
      x: equilibrium.x,
      y: operating.slope * equilibrium.x + operating.intercept,
    };
    if (
      !Number.isFinite(end.y) ||
      end.y < 0 ||
      end.y > 1 ||
      start.y - end.y <= tolerance * Math.max(start.y, Number.MIN_VALUE)
    ) {
      throw new CalculationError(
        "Langkah McCabe–Thiele tidak turun secara fisik atau mencapai pinch. Naikkan R atau periksa garis operasi.",
        "MCCABE_NONCONVERGENCE",
      );
    }
    stages.push({ number, start, equilibrium, end, section, fraction: 1 });
    staircase.push(end);
    start = end;
  }
  throw new CalculationError(
    `McCabe–Thiele belum mencapai xB setelah ${maxStages} tahap. Naikkan R; hasil tidak disimpan sebagai perhitungan yang konvergen.`,
    "MCCABE_NONCONVERGENCE",
  );
}

export function calculate(
  method: Method,
  input: BinaryInput,
): CalculationResult {
  if (method === "mccabe") return calculateMcCabe(input);
  if (method === "fug") return calculateFUG(input);
  throw new CalculationError("Metode perhitungan tidak dikenali.");
}

export function runSensitivity(
  method: Method,
  input: BinaryInput,
  parameter: SensitivityParameter,
  min: number,
  max: number,
  count: number,
): SensitivityRun {
  validateInput(input);
  if (!["R", "zF", "xD", "alpha", "q"].includes(parameter))
    throw new CalculationError("Parameter sensitivitas tidak didukung.");
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    !Number.isFinite(max - min) ||
    max <= min
  )
    throw new CalculationError(
      "Rentang sensitivitas harus hingga dan nilai maksimum lebih besar dari minimum.",
    );
  if (!Number.isInteger(count) || count < 2 || count > 201)
    throw new CalculationError(
      "Jumlah titik sensitivitas harus berupa bilangan bulat dari 2 sampai 201.",
    );
  const points: SensitivityRun["points"] = Array.from(
    { length: count },
    (_, i) => {
      const value =
        i === count - 1 ? max : min + (max - min) * (i / (count - 1));
      try {
        const result = calculate(method, { ...input, [parameter]: value });
        return {
          value,
          valid: true,
          N: result.N,
          Rmin: result.Rmin,
          ...("Nmin" in result ? { Nmin: result.Nmin } : {}),
        };
      } catch (error) {
        if (!(error instanceof CalculationError)) throw error;
        return { value, valid: false, error: error.message };
      }
    },
  );
  return {
    method,
    input: { ...input },
    parameter,
    min,
    max,
    count,
    points,
    createdAt: new Date().toISOString(),
  };
}
