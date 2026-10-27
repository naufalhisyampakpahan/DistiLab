import {
  calculationCSV,
  csvCell,
  rowsToCSV,
  sensitivityCSV,
} from "../src/utils/csv";
import type { FUGResult, SensitivityRun } from "../src/types";

test.each(["=SUM(A1)", "+cmd", "-cmd", "@SUM(A1)", " \t=SUM(A1)"])(
  "CSV forces formula-like text into a literal: %s",
  (value) => {
    expect(csvCell(value).startsWith("'")).toBe(true);
  },
);

test("CSV quotes commas, double quotes, and line breaks with CRLF row endings", () => {
  expect(
    rowsToCSV([
      ["a,b", 'He said "hello"', "line\nnext"],
      [1, -2, true],
    ]),
  ).toBe('"a,b","He said ""hello""","line\nnext"\r\n1,-2,true\r\n');
});

test("missing and nonfinite values are empty rather than fake numerical outputs", () => {
  expect(rowsToCSV([[null, undefined, NaN, Infinity, 0]])).toBe(",,,,0\r\n");
});

const result: FUGResult = {
  method: "fug",
  input: { zF: 0.5, xD: 0.95, xB: 0.05, q: 1, alpha: 2.5, R: 2.5 },
  Nmin: 6.43,
  Rmin: 1.1,
  N: 10.2,
  Nceil: 11,
  theta: 1.5,
  X: 0.4,
  Y: 0.33,
  convergence: { converged: true, iterations: 40, tolerance: 1e-10 },
};

test("calculation export includes reproducible inputs, outputs, assumptions, version, and calculation timestamp", () => {
  const csv = calculationCSV(result, {
    name: "=test",
    createdAt: "2026-10-14T10:00:00Z",
    engineVersion: "1.0.0",
  });
  expect(csv).toContain("nama_studi,'=test\r\n");
  expect(csv).toContain("waktu_perhitungan_ISO,2026-10-14T10:00:00Z\r\n");
  expect(csv).toContain("alpha,2.5\r\n");
  expect(csv).toContain("Nmin,6.43\r\n");
  expect(csv).toContain("theta_Underwood,1.5\r\n");
  expect(csv).toContain("versi_mesin,1.0.0\r\n");
  expect(csv).toContain("Reboiler termasuk; total condenser tidak dihitung");
  expect(csv).toContain("asumsi,Volatilitas relatif konstan");
});

test("sensitivity export retains failed rows with empty results and explicit reasons", () => {
  const run: SensitivityRun = {
    method: "fug",
    input: result.input,
    parameter: "R",
    min: 1,
    max: 3,
    count: 3,
    points: [
      { value: 1, valid: false, error: "=untrusted" },
      { value: 2, valid: true, N: 12, Nmin: 6.43, Rmin: 1.1 },
      { value: 3, valid: false, error: "Tidak konvergen, koreksi input" },
    ],
    createdAt: "2026-10-14T10:00:00Z",
  };
  const csv = sensitivityCSV(run);
  expect(csv).toContain("1,false,,,,'=untrusted\r\n");
  expect(csv).toContain("2,true,12,6.43,1.1,\r\n");
  expect(csv).toContain('3,false,,,,"Tidak konvergen, koreksi input"\r\n');
  expect(csv).toContain("waktu_perhitungan_ISO,2026-10-14T10:00:00Z");
});
