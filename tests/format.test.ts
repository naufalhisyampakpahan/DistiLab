import { exact, fmt } from "../src/utils/format";
test("scientific labels preserve extreme composition, volatility, and reflux values", () => {
  expect(fmt(1e-12)).toContain("e-12");
  expect(fmt(1 - 1e-10)).not.toBe(fmt(1));
  expect(fmt(1 + 1e-10)).not.toBe(fmt(1));
  expect(fmt(0)).not.toContain("e");
  expect(exact(0.950000000001)).toBe("0,950000000001");
});
