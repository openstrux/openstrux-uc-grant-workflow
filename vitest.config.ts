import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration-mock",
          include: ["tests/integration-mock/**/*.test.ts"],
          setupFiles: ["./tests/integration-mock/setup.ts"],
        },
      },
    ],
  },
});
