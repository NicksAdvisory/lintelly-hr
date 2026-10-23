// Eine Version überall: npm-Paket, server.json, Claude-Plugin, Marktplatz, Changelog (scripts/version.mjs setzt sie gemeinsam).
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { VERSION } from "../src/server";

const W = path.resolve(import.meta.dirname, "../../..");
const json = (f: string) => JSON.parse(readFileSync(path.join(W, f), "utf8"));

it("Version gleich in Paket, server.json, Plugin, Marktplatz und Changelog", () => {
  const s = json("server.json");
  expect(s.version).toBe(VERSION);
  // npm steht erst drin, wenn das Paket veröffentlicht ist (das Registry prüft es).
  for (const p of s.packages.filter((p: { registryType: string }) => p.registryType === "npm")) expect(p.version).toBe(VERSION);
  expect(s.packages.find((p: { registryType: string }) => p.registryType === "oci").identifier).toBe(`ghcr.io/nicksadvisory/lintelly-hr:${VERSION}`);
  expect(json("plugins/claude/.claude-plugin/plugin.json").version).toBe(VERSION);
  expect(json(".claude-plugin/marketplace.json").plugins[0].version).toBe(VERSION);
  expect(readFileSync(path.join(W, "CHANGELOG.md"), "utf8")).toContain(`## ${VERSION}`);
  expect(s.description.length).toBeLessThanOrEqual(100);
});
