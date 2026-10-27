import {
  calculate,
  calculateFUG,
  calculateMcCabe,
  equilibriumX,
  equilibriumY,
  fenske,
  gilliland,
  massBalance,
  minimumFlowReflux,
  minimumReflux,
  runSensitivity,
  underwood,
} from "../src/calculations";
import { DEMO_INPUT } from "../src/types";
import {
  CalculationError,
  parseNumeric,
  validateInput,
} from "../src/validation";

describe("VLE and balances", () => {
  test.each([0, 1e-12, 0.01, 0.25, 0.5, 0.95, 1 - 1e-12, 1])(
    "analytical inverse at x=%s",
    (x) => {
      const y = equilibriumY(x, 2.5);
      expect(y).toBeCloseTo((2.5 * x) / (1 + 1.5 * x), 14);
      expect(equilibriumX(y, 2.5)).toBeCloseTo(x, 13);
      expect(y).toBeGreaterThanOrEqual(x);
    },
  );
  test("known independent equilibrium composition", () => {
    expect(equilibriumY(0.2, 4)).toBeCloseTo(0.5, 14);
    expect(equilibriumX(0.5, 4)).toBeCloseTo(0.2, 14);
  });
  test("huge volatility does not overflow VLE", () => {
    expect(equilibriumY(0.5, 1e300)).toBe(1);
    expect(equilibriumX(0.5, 1e300)).toBeCloseTo(1e-300, 310);
  });
  test("mass balance for a nonsymmetric separation", () => {
    const balance = massBalance({ ...DEMO_INPUT, zF: 0.4, F: 180 })!;
    expect(balance.D).toBeCloseTo(70, 12);
    expect(balance.B).toBeCloseTo(110, 12);
    expect(balance.totalResidual).toBeCloseTo(0, 12);
    expect(balance.componentResidual).toBeCloseTo(0, 12);
    expect(balance.D * 0.95 + balance.B * 0.05).toBeCloseTo(180 * 0.4, 12);
  });
  test("no invented flow without F", () =>
    expect(massBalance(DEMO_INPUT)).toBeUndefined());
});

describe("Fenske–Underwood–Gilliland", () => {
  test("demo matches independently evaluated equations", () => {
    const result = calculateFUG(DEMO_INPUT);
    expect(result.Nmin).toBeCloseTo(6.426866226495531, 10);
    expect(result.theta).toBeCloseTo(10 / 7, 11);
    expect(result.Rmin).toBeCloseTo(1.1, 10);
    expect(result.X).toBeCloseTo(0.4, 10);
    expect(result.Y).toBeCloseTo(0.31136798438215435, 10);
    expect(result.N).toBeCloseTo(9.784956345417797, 9);
    expect(result.Nceil).toBe(10);
  });
  test.each([0, 0.1, 0.5, 0.9, 1])(
    "Underwood identity, q-line and pinch agree for q=%s",
    (q) => {
      const input = { ...DEMO_INPUT, q };
      const result = underwood(input);
      const sumFeed =
        (input.alpha * input.zF) / (input.alpha - result.theta) +
        (1 - input.zF) / (1 - result.theta);
      const sumDistillate =
        (input.alpha * input.xD) / (input.alpha - result.theta) +
        (1 - input.xD) / (1 - result.theta);
      expect(result.theta).toBeGreaterThan(1);
      expect(result.theta).toBeLessThan(input.alpha);
      expect(sumFeed).toBeCloseTo(1 - q, 9);
      expect(sumDistillate).toBeCloseTo(result.Rmin + 1, 9);
      const minimum = minimumReflux(input);
      expect(q * minimum.pinch.x + (1 - q) * minimum.pinch.y).toBeCloseTo(
        input.zF,
        13,
      );
      expect(result.Rmin).toBeCloseTo(minimum.Rmin, 9);
    },
  );
  test("saturated vapour analytic root is 1.75; minimum reflux 2.1", () => {
    const input = { ...DEMO_INPUT, q: 0 };
    expect(underwood(input).theta).toBeCloseTo(1.75, 11);
    expect(underwood(input).Rmin).toBeCloseTo(2.1, 10);
    expect(minimumReflux(input).pinch.x).toBeCloseTo(2 / 7, 13);
    expect(minimumReflux(input).pinch.y).toBeCloseTo(0.5, 13);
  });
  test("Fenske independent alpha=2 example uses logarithm base consistently", () => {
    expect(fenske({ ...DEMO_INPUT, xD: 0.9, xB: 0.1, alpha: 2 })).toBeCloseTo(
      Math.log2(81),
      13,
    );
  });
  test("Molokanov correlation reproduces X=.5 independent calculation", () => {
    const result = gilliland(6, 3, 1);
    const independentY = 1 - Math.exp((28.2 / 69.6) * (-0.5 / Math.sqrt(0.5)));
    expect(result.X).toBe(0.5);
    expect(result.Y).toBeCloseTo(independentY, 14);
    expect((result.N - 6) / (result.N + 1)).toBeCloseTo(independentY, 14);
  });
  test("large reflux approaches total-reflux Fenske limit", () => {
    expect(gilliland(6, 1e16, 1).N).toBeCloseTo(6, 12);
  });
  test("near minimum divergence is reported instead of fabricated stage count", () => {
    expect(() => gilliland(6, 1.1, 1.1)).toThrow(CalculationError);
    expect(() => gilliland(6, 1.1 + 1e-14, 1.1)).toThrow(/terlalu dekat/);
  });
  test("Underwood iteration limit is honored", () => {
    expect(() => underwood(DEMO_INPUT, { maxIterations: 1 })).toThrow(
      /tidak konvergen/,
    );
  });
  test("FUG rejects an off-range feed pinch instead of altering Underwood", () => {
    const mild = { ...DEMO_INPUT, q: 0, xD: 0.6, xB: 0.4, R: 1.2 };
    expect(underwood(mild).Rmin).toBeCloseTo(7 / 15, 10);
    expect(() => calculateFUG(mild)).toThrow(/domain FUG.*McCabe/);
  });
  test("FUG rejects negative raw minimum; McCabe supports this weak separation", () => {
    const input = { ...DEMO_INPUT, xD: 0.65, xB: 0.35, R: 0.01 };
    expect(underwood(input).Rmin).toBeCloseTo(-0.3, 10);
    expect(() => calculateFUG(input)).toThrow(/Rmin negatif/);
    expect(calculateMcCabe(input).Rmin).toBe(0);
  });
  test("extreme product compositions remain finite with logarithmic Fenske", () => {
    const input = { ...DEMO_INPUT, xD: 1 - 1e-10, xB: 1e-10, R: 8 };
    const result = calculateFUG(input);
    expect(result.Nmin).toBeGreaterThan(50);
    expect(Number.isFinite(result.N)).toBe(true);
    expect(result.N).toBeGreaterThan(result.Nmin);
  });
  test("independent partial-vapour fixture", () => {
    const input = { zF: 0.4, xD: 0.9, xB: 0.1, alpha: 2, q: 0.5, R: 4 };
    const result = calculateFUG(input);
    expect(result.theta).toBeCloseTo(1.5177446878757828, 10);
    expect(result.Rmin).toBeCloseTo(2.5393173832039393, 9);
    expect(result.Nmin).toBeCloseTo(6.339850002884625, 11);
    expect(result.N).toBeCloseTo(10.969350271867134, 9);
  });
  test("independent saturated-vapour fixture", () => {
    const result = calculateFUG({ ...DEMO_INPUT, q: 0, R: 3 });
    expect(result.N).toBeCloseTo(12.24958701366977, 9);
  });
  test("extreme feed near the volatility pole retains accurate minimum reflux", () => {
    const input = { ...DEMO_INPUT, q: 0, zF: 1e-10, xB: 1e-12, R: 4e10 };
    const result = underwood(input);
    expect(result.theta).toBeCloseTo(
      input.alpha - (input.alpha - 1) * input.zF,
      14,
    );
    expect(result.Rmin / minimumReflux(input).rawRmin).toBeCloseTo(1, 11);
    expect(Number.isFinite(calculateFUG(input).N)).toBe(true);
  });
  test("unrepresentable Underwood root and integer stage count fail honestly", () => {
    expect(() =>
      underwood({ ...DEMO_INPUT, alpha: 1 + Number.EPSILON }),
    ).toThrow(/singularitas/);
    expect(() => gilliland(6, 1.1 + 1e-5, 1.1)).toThrow(/terlalu dekat/);
  });
});

describe("McCabe–Thiele", () => {
  test("demo exact stepping and documented last horizontal fraction", () => {
    const result = calculateMcCabe(DEMO_INPUT);
    expect(result.N).toBeCloseTo(9.375571784999153, 10);
    expect(result.Nceil).toBe(10);
    expect(result.feedStage).toBe(5);
    expect(result.stages).toHaveLength(10);
    expect(result.stages[8]!.equilibrium.x).toBeCloseTo(
      0.06326461918686471,
      12,
    );
    expect(result.stages[9]!.equilibrium.x).toBeCloseTo(
      0.027946153538827102,
      12,
    );
    const last = result.stages[9]!;
    const fraction =
      (last.start.x - DEMO_INPUT.xB) / (last.start.x - last.equilibrium.x);
    expect(last.fraction).toBeCloseTo(0.3755717849991518, 10);
    expect(result.N).toBeCloseTo(9 + fraction, 12);
  });
  test.each([0, 0.01, 0.5, 0.99, 1])(
    "q=%s has valid clipped line and operating intersection",
    (q) => {
      const input = { ...DEMO_INPUT, q, R: 4 };
      const result = calculateMcCabe(input);
      expect(result.qLine).toHaveLength(2);
      for (const point of result.qLine) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1);
        expect(q * point.x + (1 - q) * point.y).toBeCloseTo(input.zF, 13);
      }
      expect(
        q * result.intersection.x + (1 - q) * result.intersection.y,
      ).toBeCloseTo(input.zF, 13);
      expect(
        result.rectifying.slope * result.intersection.x +
          result.rectifying.intercept,
      ).toBeCloseTo(result.intersection.y, 13);
      expect(
        result.stripping.slope * result.intersection.x +
          result.stripping.intercept,
      ).toBeCloseTo(result.intersection.y, 13);
      expect(
        result.stripping.slope * input.xB + result.stripping.intercept,
      ).toBeCloseTo(input.xB, 13);
      expect(result.N).toBeGreaterThan(0);
    },
  );
  test("all graph segments follow exact equations and stage transitions", () => {
    const result = calculateMcCabe(DEMO_INPUT);
    expect(result.staircase).toHaveLength(2 * result.stages.length);
    expect(result.staircase[0]).toEqual({ x: DEMO_INPUT.xD, y: DEMO_INPUT.xD });
    result.stages.forEach((stage, i) => {
      expect(stage.equilibrium.y).toBe(stage.start.y);
      expect(equilibriumY(stage.equilibrium.x, DEMO_INPUT.alpha)).toBeCloseTo(
        stage.equilibrium.y,
        13,
      );
      expect(result.staircase[2 * i + 1]).toEqual(stage.equilibrium);
      expect(stage.equilibrium.x).toBeLessThan(stage.start.x);
      if (i < result.stages.length - 1) {
        const line =
          stage.section === "rectifying" ? result.rectifying : result.stripping;
        expect(stage.end.x).toBe(stage.equilibrium.x);
        expect(stage.end.y).toBeCloseTo(
          line.slope * stage.end.x + line.intercept,
          13,
        );
        expect(result.staircase[2 * i + 2]).toEqual(stage.end);
        expect(stage.end.y).toBeLessThan(stage.start.y);
        expect(stage.fraction).toBe(1);
      }
    });
    expect(result.equilibriumCurve).toHaveLength(201);
    for (const point of result.equilibriumCurve)
      expect(point.y).toBe(equilibriumY(point.x, DEMO_INPUT.alpha));
    expect(
      result.stages.find((stage) => stage.section === "stripping")?.number,
    ).toBe(result.feedStage);
  });
  test("iteration and pinch failures never return partial results", () => {
    expect(() => calculateMcCabe(DEMO_INPUT, { maxStages: 3 })).toThrow(
      /setelah 3 tahap/,
    );
    expect(() => calculateMcCabe({ ...DEMO_INPUT, R: 1.1 })).toThrow(/Rmin/);
    expect(() =>
      calculateMcCabe({ ...DEMO_INPUT, R: 1.1 + 1e-10 }, { maxStages: 30 }),
    ).toThrow(/setelah 30 tahap/);
    const near = calculateMcCabe({ ...DEMO_INPUT, R: 1.1 + 1e-10 });
    expect(near.N).toBeGreaterThan(90);
    expect(near.convergence.converged).toBe(true);
  });
  test("mild vapour-feed separation checks positive stripping vapour", () => {
    const mild = { ...DEMO_INPUT, q: 0, xD: 0.6, xB: 0.4, R: 1.2 };
    const result = calculateMcCabe(mild);
    expect(result.RminPinch).toBeCloseTo(7 / 15, 12);
    expect(result.Rflow).toBeCloseTo(1, 12);
    expect(result.Rmin).toBeCloseTo(1, 12);
    expect(Number.isFinite(result.N)).toBe(true);
    expect(() => calculateMcCabe({ ...mild, R: 0.8 })).toThrow(/Rmin/);
    expect(() => calculateMcCabe({ ...mild, R: 1 })).toThrow(/Rmin/);
  });
  test("zero-minimum regime permits very small positive reflux", () => {
    const input = { ...DEMO_INPUT, xD: 0.65, xB: 0.35, R: 1e-9 };
    const result = calculateMcCabe(input);
    expect(result.Rmin).toBe(0);
    expect(Number.isFinite(result.N)).toBe(true);
    expect(() => calculateMcCabe({ ...input, R: 0 })).toThrow(/Rmin/);
  });
  test("extreme bottoms fractions converge without absolute-tolerance truncation", () => {
    const result = calculateMcCabe({
      ...DEMO_INPUT,
      xB: 1e-12,
      xD: 1 - 1e-10,
      R: 10,
    });
    expect(result.N).toBeGreaterThan(50);
    expect(result.stages.at(-1)!.equilibrium.x).toBeLessThanOrEqual(1e-12);
    expect(Number.isFinite(result.N)).toBe(true);
  });
  test("raising reflux reduces stage requirement for a standard case", () => {
    expect(calculateMcCabe({ ...DEMO_INPUT, R: 4 }).N).toBeLessThan(
      calculateMcCabe(DEMO_INPUT).N,
    );
  });
  test("independent partial-vapour stage fixture", () => {
    const result = calculateMcCabe({
      zF: 0.4,
      xD: 0.9,
      xB: 0.1,
      alpha: 2,
      q: 0.5,
      R: 4,
    });
    expect(result.N).toBeCloseTo(10.182298081637272, 10);
    expect(result.Nceil).toBe(11);
    expect(result.feedStage).toBe(6);
    expect(result.stages[9]!.equilibrium.x).toBeCloseTo(0.108942637386641, 12);
    expect(result.stages[10]!.equilibrium.x).toBeCloseTo(
      0.05988761000333273,
      12,
    );
  });
  test("independent saturated-vapour stage fixture", () => {
    const result = calculateMcCabe({ ...DEMO_INPUT, q: 0, R: 3 });
    expect(result.N).toBeCloseTo(10.34099216987187, 10);
    expect(result.feedStage).toBe(6);
  });
});

describe("Input and sensitivity validation", () => {
  test.each([
    ["0,50", 0.5],
    ["0.50", 0.5],
    [" .5 ", 0.5],
    ["1e-3", 0.001],
  ])("numeric parser accepts %s consistently", (text, expected) => {
    expect(parseNumeric(text, "zF")).toBe(expected);
  });
  test.each([
    "",
    " ",
    "abc",
    "NaN",
    "Infinity",
    "1,2.3",
    "1 000",
    "0x10",
    "1e999",
  ])("numeric parser rejects %s", (text) => {
    expect(() => parseNumeric(text, "zF")).toThrow(CalculationError);
  });
  test.each([
    { zF: NaN },
    { xD: Infinity },
    { xB: 0 },
    { xD: 1 },
    { zF: 0.99 },
    { xB: 0.6 },
    { q: -0.1 },
    { q: 1.1 },
    { alpha: 1 },
    { R: -1 },
    { F: 0 },
  ])("invalid input %j throws descriptive error", (patch) => {
    expect(() => validateInput({ ...DEMO_INPUT, ...patch })).toThrow(
      CalculationError,
    );
  });
  test("sensitivity recalculates endpoints and retains invalid gaps", () => {
    const run = runSensitivity("mccabe", DEMO_INPUT, "R", 0.5, 3, 6);
    expect(run.points.map((point) => point.value)).toEqual([
      0.5, 1, 1.5, 2, 2.5, 3,
    ]);
    expect(run.points.slice(0, 2).every((point) => !point.valid)).toBe(true);
    expect(run.points.slice(2).every((point) => point.valid)).toBe(true);
    for (const point of run.points) {
      if (point.valid)
        expect(point.N).toBe(
          calculateMcCabe({ ...DEMO_INPUT, R: point.value }).N,
        );
      else expect(point.error).toContain("Rmin");
    }
    expect(run.input).toEqual(DEMO_INPUT);
    expect(DEMO_INPUT.R).toBe(2.5);
  });
  test("changing feed rechecks composition and minimum reflux point by point", () => {
    const run = runSensitivity("fug", DEMO_INPUT, "zF", 0.01, 0.99, 7);
    expect(run.points[0]!.valid).toBe(false);
    expect(run.points.at(-1)!.valid).toBe(false);
    const middle = run.points[3]!;
    expect(middle.valid).toBe(true);
    if (middle.valid) expect(middle.Rmin).toBeCloseTo(1.1, 10);
  });
  test.each([
    [1, 1, 5],
    [2, 1, 5],
    [0, Infinity, 5],
    [0, 1, 1],
    [0, 1, 202],
    [0, 1, 2.5],
  ])("sensitivity rejects invalid range %s,%s,%s", (min, max, count) => {
    expect(() =>
      runSensitivity("mccabe", DEMO_INPUT, "R", min, max, count),
    ).toThrow(CalculationError);
  });
  test("unsupported method fails instead of defaulting silently", () => {
    expect(() => calculate("unknown" as never, DEMO_INPUT)).toThrow(
      CalculationError,
    );
  });
  test("all option domains are checked", () => {
    expect(() => calculateMcCabe(DEMO_INPUT, { maxStages: 0 })).toThrow(
      CalculationError,
    );
    expect(() => calculateMcCabe(DEMO_INPUT, { tolerance: 0 })).toThrow(
      CalculationError,
    );
    expect(() => underwood(DEMO_INPUT, { maxIterations: 1.5 })).toThrow(
      CalculationError,
    );
    expect(() => underwood(DEMO_INPUT, { tolerance: NaN })).toThrow(
      CalculationError,
    );
  });
  test("standalone physical flow helper also validates its domain", () => {
    expect(() => minimumFlowReflux({ ...DEMO_INPUT, xD: 0.05 })).toThrow(
      CalculationError,
    );
  });
  test("sensitivity rejects overflowing span and interpolates large finite spans safely", () => {
    expect(() =>
      runSensitivity("fug", DEMO_INPUT, "R", -1e308, 1e308, 3),
    ).toThrow(CalculationError);
    const run = runSensitivity("fug", DEMO_INPUT, "R", 1e300, 1e301, 201);
    expect(run.points.every((point) => Number.isFinite(point.value))).toBe(
      true,
    );
    expect(run.points[0]!.value).toBe(1e300);
    expect(run.points.at(-1)!.value).toBe(1e301);
  });
});
