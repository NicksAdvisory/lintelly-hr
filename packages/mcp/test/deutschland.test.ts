// Nur deutsches Arbeits- und Sozialversicherungsrecht (Nick 23.10.2026, Plan Abschnitt 2 Nr. 7).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ANWEISUNGEN, mcpServer, NUR_DEUTSCHLAND } from "../src/server";

let client: Client;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await mcpServer(() => new Date("2026-10-23T10:00:00Z")).connect(b);
  client = new Client({ name: "test", version: "1" });
  await client.connect(a);
});
afterAll(() => client.close());
const text = (r: any) => JSON.parse(r.content[0].text);

describe("nur Deutschland", () => {
  it("Anweisungen und jede Werkzeugbeschreibung sagen Germany only", async () => {
    expect(ANWEISUNGEN).toMatch(/nur deutsches Arbeits- und Sozialversicherungsrecht/);
    for (const t of (await client.listTools()).tools) expect(t.description, t.name).toMatch(/^Germany only\./);
  });
  it("Frage nach Österreich: Hinweis statt Rechnung", async () => {
    const a = text(await client.callTool({ name: "rechtswerte_suchen", arguments: { suchtext: "Mindestlohn Österreich" } }));
    expect(a.ergebnis).toEqual({ hinweis: NUR_DEUTSCHLAND });
    expect(NUR_DEUTSCHLAND).toBe("Lintelly HR kennt nur deutsches Arbeits- und Sozialversicherungsrecht.");
  });
  it("Schweiz und Switzerland im Klauseltext ebenso", async () => {
    for (const k of ["Kündigungsfrist nach Schweizer OR", "notice period in Switzerland"]) {
      expect(text(await client.callTool({ name: "klausel_pruefen", arguments: { klausel: k } })).ergebnis).toEqual({ hinweis: NUR_DEUTSCHLAND });
    }
  });
  it("deutsche Fragen laufen normal", async () => {
    expect(text(await client.callTool({ name: "rechtswerte_suchen", arguments: { suchtext: "Mindestlohn" } })).ergebnis.treffer.length).toBeGreaterThan(0);
  });
});

describe("keine Fehlalarme", () => {
  it("Italienischkenntnisse, Schweizer Käse im Text eines Kunden oder 'join us' sind kein anderes Land, nur die Länder selbst", async () => {
    const a = text(await client.callTool({ name: "stellenanzeige_check", arguments: { anzeigentext: "Join us! Italienischkenntnisse von Vorteil, Arbeitsort Frankfurt." } }));
    expect(a.ergebnis.hinweis).not.toBe(NUR_DEUTSCHLAND);
  });
});
