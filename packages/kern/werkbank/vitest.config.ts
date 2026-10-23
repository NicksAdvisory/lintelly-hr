// Die Tests aus der Werkbank laufen hier unverändert, mit demselben Kürzel "@" für den Ordner (scripts/abgleich.mjs).
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: { include: ["tests/**/*.test.ts"] },
});
