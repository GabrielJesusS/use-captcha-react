import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    watch: false,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        // Scripts we append in tests (useLoadScript) are never meant to actually
        // execute; jsdom's default "dangerously" mode races with manually firing
        // onload/onerror and throws spurious NotFoundErrors on cleanup.
        runScripts: "outside-only",
      },
    },
    setupFiles: "./vitest.setup.ts",
    coverage: {
      include: ["source/**/*.{ts,tsx}"],
      exclude: ["source/**/@types/*.{ts,tsx}"],
      thresholds: {
        statements: 99.66,
        branches: 96.53,
        functions: 100,
        lines: 100,
        // Ratchets thresholds up when coverage improves; never accepts a drop.
        autoUpdate: true,
      },
    },
  },
});
