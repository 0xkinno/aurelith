import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    pool: "threads",
    maxWorkers: 1,
    minWorkers: 1,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["contracts/**", "node_modules/**"],
  },
});
