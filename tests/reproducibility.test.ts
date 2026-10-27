import {
  calculateFUG,
  calculateMcCabe,
  runSensitivity,
} from "../src/calculations";
import { DEMO_INPUT } from "../src/types";
import { calculationCSV, sensitivityCSV } from "../src/utils/csv";

test("actual McCabe export retains every full equilibrium stage and graph coordinate", () => {
  const result = calculateMcCabe({ ...DEMO_INPUT, F: 100 });
  const csv = calculationCSV(result, {
    name: "Demonstrasi ideal",
    createdAt: "2026-10-14T00:00:00.000Z",
  });
  const rows = csv.split("\r\n");
  expect(rows).toContain(`N_tanpa_pembulatan,${result.N}`);
  expect(result.balance?.D).toBeCloseTo(50, 12);
  expect(rows).toContain(`D,${result.balance?.D}`);
  expect(rows).toContain("unit_F_D_B,kmol/jam");
  expect(rows.filter((row) => row.startsWith("staircase,")).length).toBe(
    result.staircase.length,
  );
  result.stages.forEach((s) =>
    expect(rows).toContain(
      [
        s.number,
        s.section,
        s.start.x,
        s.start.y,
        s.equilibrium.x,
        s.equilibrium.y,
        s.end.x,
        s.end.y,
        s.fraction,
      ].join(","),
    ),
  );
  expect(calculateMcCabe(result.input)).toEqual(result);
});
test("FUG export keeps Underwood and Gilliland diagnostics at original precision", () => {
  const result = calculateFUG({ ...DEMO_INPUT, q: 0.5, F: 120 });
  const rows = calculationCSV(result, {
    createdAt: "2026-10-14T00:00:00.000Z",
  }).split("\r\n");
  expect(rows).toContain(`theta_Underwood,${result.theta}`);
  expect(rows).toContain(`X_Gilliland,${result.X}`);
  expect(rows).toContain(`Y_Gilliland,${result.Y}`);
  expect(calculateFUG(result.input)).toEqual(result);
});
test("export never labels invalid sensitivity points as finite stage results", () => {
  const run = runSensitivity("mccabe", DEMO_INPUT, "R", 0.5, 3, 6);
  const rows = sensitivityCSV(run).split("\r\n");
  run.points.forEach((p) => {
    if (p.valid)
      expect(rows).toContain([p.value, true, p.N, "", p.Rmin, ""].join(","));
    else
      expect(rows.some((row) => row.startsWith(`${p.value},false,,,,`))).toBe(
        true,
      );
  });
});
