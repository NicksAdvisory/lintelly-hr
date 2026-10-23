#!/usr/bin/env node
// Neue Version an allen Stellen setzen: npm-Paket, server.json, Claude-Plugin, Agent-Plugin (Kiro), Cursor-Plugin, Gemini-Erweiterung, Marktplätze, Changelog-Überschrift.
// Aufruf: node scripts/version.mjs 0.2.0   Danach Changelog-Text ergänzen, committen, auf main pushen: die Pipeline macht das Release.
import { readFileSync, writeFileSync } from "node:fs";

const v = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(v ?? "")) { console.error("Version wie 0.2.0 angeben"); process.exit(1); }
const json = (f, setze) => { const d = JSON.parse(readFileSync(f, "utf8")); setze(d); writeFileSync(f, `${JSON.stringify(d, null, 2)}\n`); };
json("packages/mcp/package.json", (d) => { d.version = v; });
json("server.json", (d) => { d.version = v; for (const p of d.packages) { if (p.registryType === "npm") p.version = v; else p.identifier = p.identifier.replace(/:[^:]+$/, `:${v}`); } });
json("plugins/claude/.claude-plugin/plugin.json", (d) => { d.version = v; });
json("plugins/agent/plugin.json", (d) => { d.version = v; });
json("plugins/cursor/.cursor-plugin/plugin.json", (d) => { d.version = v; });
json(".cursor-plugin/marketplace.json", (d) => { d.metadata.version = v; });
json("gemini-extension.json", (d) => { d.version = v; });
json(".claude-plugin/marketplace.json", (d) => { d.plugins[0].version = v; });
const log = readFileSync("CHANGELOG.md", "utf8");
if (!log.includes(`## ${v}`)) writeFileSync("CHANGELOG.md", log.replace(/\n## /, `\n## ${v}\n\n- \n\n## `));
console.log(`Version ${v} gesetzt.`);
