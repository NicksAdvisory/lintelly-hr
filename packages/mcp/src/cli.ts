/**
 * Start: ohne Schalter über stdio (npx @lintelly/hr-mcp, Claude Desktop, Claude Code), mit --http als Streamable HTTP
 * (hr.lintelly.com, Docker). Port aus --port oder PORT (Standard 8787), Adresse aus HOST (Standard 127.0.0.1).
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { httpServer } from "./http";
import { mcpServer, VERSION } from "./server";
import { sichern } from "./zaehler";

const args = process.argv.slice(2);
const wert = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

if (args.includes("--version")) {
  console.log(VERSION);
} else if (args.includes("--http")) {
  const port = Number(wert("--port") ?? process.env.PORT ?? 8787);
  const host = process.env.HOST ?? "127.0.0.1";
  httpServer().listen(port, host, () => console.error(`Lintelly HR ${VERSION} hört auf http://${host}:${port}/mcp`));
  setInterval(sichern, 60_000).unref();
  for (const s of ["SIGTERM", "SIGINT"] as const) process.on(s, () => { sichern(); process.exit(0); });
} else {
  await mcpServer().connect(new StdioServerTransport());
}
