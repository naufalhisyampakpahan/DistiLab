import { calculateMcCabe } from "../src/calculations";
import {
  calculateWithProfile,
  validateResearchInput,
} from "../src/research/profile";
import {
  RESEARCH_CASES,
  compareResearchOutput,
  independentResearchReference,
} from "../src/research/protocol";
import {
  canExportResearchRun,
  researchSummary,
  runResearchBoundaries,
  runResearchCase,
  runResearchVerification,
} from "../src/research/runner";
import { researchCSV, researchRows, researchXLSX } from "../src/research/xlsx";
import type { ResearchRun } from "../src/research/runner";

let complete: ResearchRun;
beforeAll(async () => {
  complete = await runResearchVerification({
    yieldControl: () => Promise.resolve(),
  });
});

function readStoredZip(bytes: Uint8Array): Record<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files: Record<string, string> = {};
  let at = 0;
  while (view.getUint32(at, true) === 0x04034b50) {
    expect(view.getUint16(at + 8, true)).toBe(0);
    expect(view.getUint16(at + 6, true) & 0x800).toBeTruthy();
    const length = view.getUint32(at + 18, true),
      nameLength = view.getUint16(at + 26, true),
      extra = view.getUint16(at + 28, true);
    const name = Buffer.from(
      bytes.slice(at + 30, at + 30 + nameLength),
    ).toString("utf8");
    const start = at + 30 + nameLength + extra;
    files[name] = Buffer.from(bytes.slice(start, start + length)).toString(
      "utf8",
    );
    at = start + length;
  }
  expect(view.getUint32(at, true)).toBe(0x02014b50);
  expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
  expect(view.getUint16(bytes.length - 14, true)).toBe(
    Object.keys(files).length,
  );
  return files;
}

test("27 frozen cases use stable alpha/zF/factor ordering and independent input reflux", () => {
  expect(RESEARCH_CASES).toHaveLength(27);
  expect(new Set(RESEARCH_CASES.map((c) => c.caseId)).size).toBe(27);
  expect(RESEARCH_CASES[0]).toMatchObject({
    caseId: "C01",
    refluxFactor: 1.2,
    input: { alpha: 2, zF: 0.3 },
  });
  expect(RESEARCH_CASES[13]).toMatchObject({
    caseId: "C14",
    refluxFactor: 1.5,
    input: { alpha: 2.5, zF: 0.5, F: 100, q: 1 },
  });
  expect(RESEARCH_CASES[26]).toMatchObject({
    caseId: "C27",
    refluxFactor: 2,
    input: { alpha: 3, zF: 0.7 },
  });
  expect(RESEARCH_CASES[13]!.input.R).toBeCloseTo(1.65, 12);
  expect(Object.isFrozen(RESEARCH_CASES[13]!.input)).toBe(true);
});

test("the C14 anchor has 12 integer MT stages and the independently derived FUG reference", () => {
  const reference = independentResearchReference(RESEARCH_CASES[13]!);
  expect(reference.output).toMatchObject({ N_MT: 12 });
  expect(reference.output.D).toBeCloseTo(50, 12);
  expect(reference.output.B).toBeCloseTo(50, 12);
  expect(reference.output.Rmin).toBeCloseTo(1.1, 12);
  expect(reference.output.Nmin).toBeCloseTo(6.426866226495531, 12);
  expect(reference.output.N_FUG).toBeCloseTo(12.603406, 5);
  expect(reference.feedStage).toBe(6);
  expect(reference.firstSteps).toHaveLength(2);
});

test("all 162 engine outputs meet the independently implemented reference and 9 boundaries are diagnosed", () => {
  expect(complete.status).toBe("completed");
  expect(researchSummary(complete)).toMatchObject({
    computed: 27,
    failed: 0,
    compared: 162,
    passed: 162,
    boundaryPassed: 9,
  });
  expect(
    complete.records.every(
      (record) => record.status === "computed" && record.mt.Nceil <= 60,
    ),
  ).toBe(true);
  expect(complete.referenceProvenance).toContain("belum dicocokkan");
  expect(complete.executionEnvironment).toBe("desktop-test");
  expect(runResearchBoundaries().map((b) => b.caseId)).toEqual(
    Array.from({ length: 9 }, (_, i) => `T0${i + 1}`),
  );
  expect(complete.boundaries[8]?.message).toContain("60");
});

test("research limits do not change the general solver or silently fill F", () => {
  const input = RESEARCH_CASES[13]!.input;
  expect(() => validateResearchInput({ ...input, F: undefined })).toThrow(
    "memerlukan laju umpan",
  );
  expect(() => calculateWithProfile("mccabe", { ...input, q: 0.5 })).toThrow(
    "q = 1",
  );
  expect(
    calculateWithProfile(
      "mccabe",
      { ...input, R: 3, q: 0.5, F: undefined },
      "general",
    ).N,
  ).toBeGreaterThan(0);
  const demanding = { ...input, alpha: 1.05, R: 50 };
  expect(() => calculateWithProfile("mccabe", demanding)).toThrow("60");
  expect(calculateMcCabe(demanding).Nceil).toBeGreaterThan(60);
});

test("continuous tolerance is combined absolute/relative while integer MT must match exactly", () => {
  const reference = independentResearchReference(RESEARCH_CASES[13]!).output;
  const tolerance = 1e-8 + 1e-6 * Math.abs(reference.D);
  expect(
    compareResearchOutput(
      { ...reference, D: reference.D + tolerance * 0.5 },
      reference,
    ).find((c) => c.metric === "D")?.passed,
  ).toBe(true);
  expect(
    compareResearchOutput(
      { ...reference, D: reference.D + tolerance * 2 },
      reference,
    ).find((c) => c.metric === "D")?.passed,
  ).toBe(false);
  expect(
    compareResearchOutput(
      { ...reference, N_MT: reference.N_MT + 1e-9 },
      reference,
    ).find((c) => c.metric === "N_MT")?.passed,
  ).toBe(false);
});

test("cancellation leaves a distinct partial run that cannot be exported as a complete package", async () => {
  let stop = false;
  const partial = await runResearchVerification({
    yieldControl: () => Promise.resolve(),
    isCancelled: () => stop,
    onProgress: (progress) => {
      if (progress.completed === 1) stop = true;
    },
  });
  expect(partial.status).toBe("cancelled");
  expect(partial.records).toHaveLength(1);
  expect(partial.boundaries).toHaveLength(0);
  expect(partial.id).not.toBe(complete.id);
  expect(canExportResearchRun(partial)).toBe(false);
  expect(() => researchXLSX(partial)).toThrow("27 kasus");
});

test("failed calculations remain failures without fabricated zero outputs", () => {
  const entry = RESEARCH_CASES[0]!;
  const failed = runResearchCase({
    ...entry,
    input: { ...entry.input, q: 0.5 },
  });
  expect(failed).toMatchObject({ status: "failed", errorCode: "RESEARCH_Q" });
  expect("output" in failed).toBe(false);
});

test("XLSX is a real stored ZIP/OOXML package with exact 27x7 import block and full precision", () => {
  const files = readStoredZip(researchXLSX(complete));
  expect(Object.keys(files)).toHaveLength(9);
  expect(files["[Content_Types].xml"]).toContain(
    "spreadsheetml.sheet.main+xml",
  );
  expect(files["xl/workbook.xml"]).toContain('name="Hasil_App"');
  expect(files["xl/workbook.xml"]).toContain('name="Metadata"');
  const data = files["xl/worksheets/sheet1.xml"]!;
  expect(data).toContain('dimension ref="A1:G28"');
  expect((data.match(/<row /g) ?? []).length).toBe(28);
  expect((data.match(/<c /g) ?? []).length).toBe(28 * 7);
  expect(data).not.toContain("<f>");
  const c14 = complete.records[13]!;
  if (c14.status !== "computed") throw new Error("C14 missing");
  expect(data).toContain(`<c r="G15"><v>${String(c14.output.N_FUG)}</v></c>`);
  expect(data).toContain('<c r="F15"><v>12</v></c>');
  expect(files["xl/worksheets/sheet2.xml"]).toContain(complete.id);
  expect(files["xl/worksheets/sheet2.xml"]).toContain(complete.datasetVersion);
  expect(files["xl/worksheets/sheet2.xml"]).toContain("belum dicocokkan");
  expect(files["xl/worksheets/sheet3.xml"]).toContain("N_MT_fraksional");
  expect(files["xl/worksheets/sheet4.xml"]).toContain("T09");
});

test("CSV and XLSX rows share the same exact import schema and preserve zero-free real output", () => {
  const rows = researchRows(complete);
  expect(rows[0]).toEqual([
    "case_id",
    "D",
    "B",
    "Rmin",
    "Nmin",
    "N_MT",
    "N_FUG",
  ]);
  expect(rows).toHaveLength(28);
  expect(rows.every((row) => row.length === 7)).toBe(true);
  expect(researchCSV(complete).split("\r\n")[0]).toBe(
    "case_id,D,B,Rmin,Nmin,N_MT,N_FUG",
  );
  const reordered = { ...complete, records: [...complete.records].reverse() };
  expect(() => researchRows(reordered)).toThrow("27 kasus");
  const invalid = JSON.parse(JSON.stringify(complete)) as ResearchRun;
  const first = invalid.records[0]!;
  if (first.status === "computed") first.output.N_FUG = NaN;
  expect(() => researchCSV(invalid)).toThrow("27 kasus");
});
