import {
  calculateFUG,
  calculateMcCabe,
  minimumReflux,
  underwood,
} from "../src/calculations";
import type { BinaryInput, McCabeResult } from "../src/types";

// These references are independent closed forms or conservation identities;
// they do not run a second copy of the production stepping/root algorithms.
const saturatedInput: BinaryInput = {
  zF: 0.37,
  xD: 0.92,
  xB: 0.04,
  q: 1,
  alpha: 3.4,
  R: 7,
};
const vle = (x: number, alpha: number): number =>
  (alpha * x) / (1 + (alpha - 1) * x);

describe("Audit independen: identitas kimia dan geometri", () => {
  test.each([0, 1])(
    "akar Underwood mempunyai solusi aljabar independen untuk q=%s",
    (q) => {
      const input = { ...saturatedInput, q };
      const expectedTheta =
        q === 0
          ? input.alpha - (input.alpha - 1) * input.zF
          : input.alpha / (1 + (input.alpha - 1) * input.zF);
      const result = underwood(input);
      expect(result.theta).toBeCloseTo(expectedTheta, 10);
      const feedResidual =
        (input.alpha * input.zF) / (input.alpha - result.theta) +
        (1 - input.zF) / (1 - result.theta) -
        (1 - q);
      expect(Math.abs(feedResidual)).toBeLessThan(1e-9);
      const independentRmin =
        (input.alpha * input.xD) / (input.alpha - expectedTheta) +
        (1 - input.xD) / (1 - expectedTheta) -
        1;
      expect(result.Rmin).toBeCloseTo(independentRmin, 9);
    },
  );

  test("q=1/2 dan umpan ekuimolar memberi theta=sqrt(alpha)", () => {
    const input = { ...saturatedInput, zF: 0.5, q: 0.5 };
    expect(underwood(input).theta).toBeCloseTo(Math.sqrt(input.alpha), 10);
  });

  test.each([
    { zF: 0.3, xD: 0.9, xB: 0.1, q: 0.15, alpha: 1.8, R: 8 },
    { zF: 0.7, xD: 0.98, xB: 0.02, q: 0.8, alpha: 4, R: 2 },
    { zF: 0.5, xD: 0.95, xB: 0.05, q: 0.5, alpha: 2.5, R: 3 },
  ])(
    "rekaman tahap dan segmen operasi memenuhi konservasi, input %j",
    (input: BinaryInput) => {
      const result = calculateMcCabe({ ...input, F: 137 });
      auditGeometry(result);
      const balance = result.balance!;
      expect(balance.D + balance.B).toBeCloseTo(137, 10);
      expect(balance.D * input.xD + balance.B * input.xB).toBeCloseTo(
        137 * input.zF,
        10,
      );
      const topL = input.R * balance.D;
      const topV = topL + balance.D;
      const bottomL = topL + input.q * 137;
      const bottomV = topV - (1 - input.q) * 137;
      expect(bottomV).toBeGreaterThan(0);
      expect(result.rectifying.slope).toBeCloseTo(topL / topV, 10);
      expect(result.stripping.slope).toBeCloseTo(bottomL / bottomV, 10);
      expect(result.stripping.intercept).toBeCloseTo(
        (-balance.B * input.xB) / bottomV,
        10,
      );
    },
  );

  test("jumlah tahap dan komposisi independen terhadap skala F", () => {
    const small = calculateMcCabe({ ...saturatedInput, F: 1 });
    const large = calculateMcCabe({ ...saturatedInput, F: 100_000 });
    expect(large.N).toBe(small.N);
    expect(large.staircase).toEqual(small.staircase);
    expect(large.balance!.D).toBeCloseTo(small.balance!.D * 100_000, 8);
  });

  test.each([
    { zF: 0.5, xD: 0.7, xB: 0.45, q: 0, alpha: 2.5, R: 4.2 },
    { zF: 0.5, xD: 0.7, xB: 0.45, q: 0.25, alpha: 5, R: 3 },
    { zF: 0.5, xD: 0.7, xB: 0.45, q: 0.5, alpha: 10, R: 1.7 },
  ])(
    "neraca aliran mengontrol minimum di luar interval pinch, input %j",
    (mild: BinaryInput) => {
      const d = (mild.zF - mild.xB) / (mild.xD - mild.xB);
      const flowMinimum = (1 - mild.q) / d - 1;
      expect(minimumReflux(mild).Rmin).toBeCloseTo(flowMinimum, 10);
      // The raw Underwood equation stays intact even when it is not the
      // operational limit. This tests the documented distinction directly.
      const raw = underwood(mild);
      const identity =
        (mild.alpha * mild.xD) / (mild.alpha - raw.theta) +
        (1 - mild.xD) / (1 - raw.theta) -
        1;
      expect(raw.Rmin).toBeCloseTo(identity, 9);
      expect(raw.Rmin).toBeLessThan(flowMinimum);
      const result = calculateMcCabe(mild);
      expect(result.N).toBeGreaterThan(0);
      auditGeometry(result);
      expect(() => calculateMcCabe({ ...mild, R: flowMinimum - 0.1 })).toThrow(
        /Rmin|uap|layak/i,
      );
      expect(() => calculateFUG(mild)).toThrow(/domain|McCabe|pinch/i);
    },
  );
});

function auditGeometry(result: McCabeResult): void {
  const { input, intersection, rectifying, stripping, stages } = result;
  expect(input.q * intersection.x + (1 - input.q) * intersection.y).toBeCloseTo(
    input.zF,
    10,
  );
  expect(rectifying.slope * intersection.x + rectifying.intercept).toBeCloseTo(
    intersection.y,
    10,
  );
  expect(stripping.slope * intersection.x + stripping.intercept).toBeCloseTo(
    intersection.y,
    10,
  );
  expect(result.staircase[0]).toEqual({ x: input.xD, y: input.xD });
  for (const stage of stages) {
    expect(stage.equilibrium.y).toBeCloseTo(
      vle(stage.equilibrium.x, input.alpha),
      11,
    );
    expect(stage.start.y).toBe(stage.equilibrium.y);
    expect(stage.start.x).toBeGreaterThan(stage.equilibrium.x);
    expect(stage.fraction).toBeGreaterThan(0);
    expect(stage.fraction).toBeLessThanOrEqual(1);
    if (stage.number < stages.length) {
      const operating = stage.section === "rectifying" ? rectifying : stripping;
      expect(stage.end.x).toBe(stage.equilibrium.x);
      expect(stage.end.y).toBeCloseTo(
        operating.slope * stage.end.x + operating.intercept,
        11,
      );
      const next = stages[stage.number];
      if (!next) throw new Error("Rekaman tahap berikutnya hilang.");
      expect(next.start).toEqual(stage.end);
    }
  }
  const last = stages[stages.length - 1];
  if (!last)
    throw new Error("Hasil konvergen harus mempunyai sedikitnya satu tahap.");
  expect(last.equilibrium.x).toBeLessThanOrEqual(input.xB);
  expect(last.start.x).toBeGreaterThanOrEqual(input.xB);
  const fraction =
    (last.start.x - input.xB) / (last.start.x - last.equilibrium.x);
  expect(result.N).toBeCloseTo(stages.length - 1 + fraction, 11);
  expect(result.Nceil).toBe(Math.ceil(result.N));
  for (const [line, from, to] of [
    [rectifying, intersection.x, input.xD],
    [stripping, input.xB, intersection.x],
  ] as const) {
    for (let i = 0; i <= 10; i += 1) {
      const x = from + ((to - from) * i) / 10;
      expect(line.slope * x + line.intercept).toBeLessThan(vle(x, input.alpha));
    }
  }
}
