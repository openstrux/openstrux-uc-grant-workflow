import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Stub Next.js server-only guard — not needed in test environment
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
      // Stub next/headers for tests that import session.ts indirectly
      "next/headers": path.resolve(__dirname, "tests/__mocks__/next-headers.ts"),
    },
  },
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
