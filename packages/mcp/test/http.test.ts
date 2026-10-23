import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bremse } from "../src/bremse";
import { httpServer, MAX_BYTES } from "../src/http";

const KOPF = { "content-type": "application/json", accept: "application/json, text/event-stream" };
const INIT = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } };
let basis = "";
const server = httpServer({ bremse: bremse({ jeAdresse: 3, gesamt: 100, fensterMs: 60_000 }) });
beforeAll(() => new Promise<void>((ok) => server.listen(0, "127.0.0.1", () => { basis = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; ok(); })));
afterAll(() => new Promise<void>((ok) => server.close(() => ok())));

describe("HTTP", () => {
  it("/health antwortet mit Version und Zahl der Werkzeuge", async () => {
    const r = await fetch(`${basis}/health`);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, name: "lintelly-hr" });
  });
  it("POST /mcp initialize liefert JSON mit Servernamen und Anweisungen", async () => {
    const r = await fetch(`${basis}/mcp`, { method: "POST", headers: { ...KOPF, "x-forwarded-for": "10.0.0.1" }, body: JSON.stringify(INIT) });
    expect(r.status).toBe(200);
    const j = (await r.json()) as any;
    expect(j.result.serverInfo.name).toBe("lintelly-hr");
    expect(j.result.instructions).toMatch(/Lintelly/);
  });
  it("tools/call ohne Sitzung", async () => {
    const r = await fetch(`${basis}/mcp`, { method: "POST", headers: { ...KOPF, "x-forwarded-for": "10.0.0.2" }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "rechtswert", arguments: { kennung: "mindestlohn", stichtag: "2027-01-01" } } }) });
    const j = (await r.json()) as any;
    expect(JSON.parse(j.result.content[0].text).ergebnis.wert).toBe("14,60 €");
  });
  it("GET /mcp ist 405, unbekannter Pfad 404", async () => {
    expect((await fetch(`${basis}/mcp`)).status).toBe(405);
    expect((await fetch(`${basis}/admin`)).status).toBe(404);
  });
  it("Anfragen über 32 KB werden abgelehnt", async () => {
    const r = await fetch(`${basis}/mcp`, { method: "POST", headers: { ...KOPF, "x-forwarded-for": "10.0.0.3" }, body: "x".repeat(MAX_BYTES + 1) });
    expect(r.status).toBe(413);
  });
  it("Bremse je Adresse: der vierte Aufruf in der Minute bekommt 429, eine andere Adresse nicht", async () => {
    const rufe = (ip: string) => fetch(`${basis}/mcp`, { method: "POST", headers: { ...KOPF, "x-forwarded-for": ip }, body: JSON.stringify(INIT) }).then((r) => r.status);
    expect([await rufe("10.0.0.9"), await rufe("10.0.0.9"), await rufe("10.0.0.9"), await rufe("10.0.0.9")]).toEqual([200, 200, 200, 429]);
    expect(await rufe("10.0.0.10")).toBe(200);
  });
  it("Bremse: Fenster leert sich nach einer Minute", () => {
    const b = bremse({ jeAdresse: 1, gesamt: 10, fensterMs: 60_000 });
    expect([b("a", 0), b("a", 1000), b("a", 61_000)]).toEqual([true, false, true]);
  });
});
