module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
  collectCoverageFrom: [
    "src/calculations/**/*.ts",
    "src/validation/**/*.ts",
    "src/utils/csv.ts",
    "src/storage/**/*.ts",
  ],
  coverageDirectory: "coverage",
};
