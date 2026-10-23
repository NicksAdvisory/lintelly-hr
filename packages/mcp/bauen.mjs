// Baut zwei Fassungen: für npm (das MCP-SDK als Abhängigkeit) und eine Datei mit allem für hr.lintelly.com und Docker.
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const hier = import.meta.dirname;
const gemeinsam = {
  entryPoints: [`${hier}/src/cli.ts`], bundle: true, platform: "node", format: "esm", target: "node22",
  alias: { "@": `${hier}/../kern/werkbank` }, banner: { js: "#!/usr/bin/env node" }, legalComments: "none", logLevel: "warning",
};
await build({ ...gemeinsam, outfile: `${hier}/dist/lintelly-hr-mcp.mjs`, external: ["@modelcontextprotocol/sdk"] });
await build({ ...gemeinsam, outfile: `${hier}/dist/lintelly-hr-mcp-server.mjs` });
console.log(`gebaut: ${JSON.parse(readFileSync(`${hier}/package.json`, "utf8")).version}`);
