import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "packages/kern/werkbank") } },
  test: { include: ["packages/mcp/test/**/*.test.ts"] },
});
