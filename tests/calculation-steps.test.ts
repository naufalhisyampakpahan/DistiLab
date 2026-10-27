import { calculateFUG, calculateMcCabe } from "../src/calculations";
import { calculationSteps } from "../src/utils/calculationSteps";
import { fmt } from "../src/utils/format";
import { DEMO_INPUT } from "../src/types";

describe("readable calculation walkthrough", () => {
  test.each([calculateMcCabe, calculateFUG])(
    "uses the original result without mutating it",
    (calculate) => {
      const result = calculate({ ...DEMO_INPUT, F: 100 });
      const before = JSON.stringify(result);
      const steps = calculationSteps(result);
      expect(steps.find((step) => step.id === "stages")?.result).toContain(
        fmt(result.N),
      );
      expect(steps.find((step) => step.id === "stages")?.result).toContain(
        `${result.Nceil} tahap bulat`,
      );
      expect(steps.find((step) => step.id === "balance")?.result).toContain(
        "kmol/jam",
      );
      expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
      expect(JSON.stringify(result)).toBe(before);
    },
  );

  test("does not invent product flows when feed flow is missing", () => {
    const steps = calculationSteps(calculateMcCabe(DEMO_INPUT));
    expect(steps.find((step) => step.id === "balance")).toBeUndefined();
  });

  test.each([0, 0.4, 1])(
    "q=%s gives the correct feed-line explanation",
    (q) => {
      const result = calculateMcCabe({ ...DEMO_INPUT, q, R: 5 });
      const step = calculationSteps(result).find((item) => item.id === "feed")!;
      expect(step.equation).toEqual(["q · x + (1 − q) · y = zꜰ"]);
      expect(step.result).toContain(
        q === 1 ? "Garis vertikal" : q === 0 ? "Garis horizontal" : "q =",
      );
      expect(
        result.input.q * result.intersection.x +
          (1 - q) * result.intersection.y,
      ).toBeCloseTo(result.input.zF, 12);
    },
  );

  test("McCabe interpolation and line substitutions agree with engine values", () => {
    const r = calculateMcCabe({ ...DEMO_INPUT, F: 100 });
    const last = r.stages.at(-1)!;
    const f = (last.start.x - r.input.xB) / (last.start.x - last.equilibrium.x);
    expect(f).toBeCloseTo(last.fraction, 12);
    expect(last.number - 1 + f).toBeCloseTo(r.N, 12);
    expect(
      (r.intersection.y - r.input.xB) / (r.intersection.x - r.input.xB),
    ).toBeCloseTo(r.stripping.slope, 12);
    expect(
      calculationSteps(r).find((step) => step.id === "stripping")?.result,
    ).not.toContain("+ -");
  });

  test.each([0, 0.5, 1])("FUG equations remain consistent for q=%s", (q) => {
    const r = calculateFUG({ ...DEMO_INPUT, q, R: 5, F: 100 });
    const p = r.input;
    const rootEquation =
      (p.alpha * p.zF) / (p.alpha - r.theta) + (1 - p.zF) / (1 - r.theta);
    expect(rootEquation).toBeCloseTo(1 - q, 9);
    expect(
      (p.alpha * p.xD) / (p.alpha - r.theta) + (1 - p.xD) / (1 - r.theta) - 1,
    ).toBeCloseTo(r.Rmin, 9);
    const X = (p.R - r.Rmin) / (p.R + 1);
    const Y =
      1 -
      Math.exp((((1 + 54.4 * X) / (11 + 117.2 * X)) * (X - 1)) / Math.sqrt(X));
    expect((r.Nmin + Y) / (1 - Y)).toBeCloseTo(r.N, 10);
    expect(r.Nceil).toBe(Math.ceil(r.N));
  });
});
