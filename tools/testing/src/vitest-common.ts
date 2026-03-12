import { coverageConfigDefaults } from "vitest/config";

export const defaultConfig = {
  test: {
    environment: "node",
    globals: true,
    include: ["src/__test__/**/*.test.{ts,tsx}"],
    exclude: ["lib", "dist", "node_modules"],
    fileParallelism: false,
    coverage: {
      enabled: true,
      provider: "v8",
      reportOnFailure: true,
      reporter: ["json-summary", "text"],
      exclude: ["**/cdk.out/**", ...coverageConfigDefaults.exclude],
    },
  },
};
