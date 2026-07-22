import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    watch: false,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    coverage: {
      include: ["source/**/*.{ts,tsx}"],
      exclude: ["source/**/@types/*.{ts,tsx}"],
    },
  },
});
