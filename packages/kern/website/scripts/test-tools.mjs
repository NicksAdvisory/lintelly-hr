// Tests für Probezeit, Mutterschutz und Aufbewahrungsfristen. Aufruf: node scripts/test-tools.mjs (Node 22.18+ mit Type-Stripping)
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith(".")) return n(s + ".ts", c); throw e; } }`), import.meta.url);
const assert = (await import("node:assert/strict")).default;
const { berechneProbezeit } = await import("../components/tools/probezeit-logik.ts");
const { berechneFehlgeburt } = await import("../components/tools/mutterschutz-logik.ts");
const { DOKUMENTE, berechneFrist } = await import("../components/tools/aufbewahrungsfristen-logik.ts");

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok", String(n).padStart(2), name); };
const D = (s) => new Date(s + "T00:00:00Z");
const iso = (d) => d && d.toISOString().slice(0, 10);

/* ---------- Probezeit (§ 622 Abs. 3 BGB, §§ 20, 22 BBiG) ---------- */
const pz = (o) => berechneProbezeit({ beginn: "2026-10-01", einheit: "monate", dauer: 6, befristet: false, befristetBis: "", groesse: "gross", azubi: false, ...o });
t("Probezeit 6 Monate: Ende 31.03., Kündigung mit 2 Wochen bis 14.04.", () => {
  const r = pz({}).ergebnis;
  assert.equal(iso(r.ende), "2027-03-31"); assert.equal(iso(r.kuendEnde), "2027-04-14");
});
t("Azubi 4 Monate: Ende 30.11., Kündigung ohne Frist, keine Lücke zum KSchG", () => {
  const r = pz({ beginn: "2026-08-01", dauer: 4, azubi: true }).ergebnis;
  assert.equal(iso(r.ende), "2026-11-30"); assert.equal(iso(r.kuendEnde), "2026-11-30"); assert.equal(r.luecke, false);
});
t("Azubi: mehr als 4 Monate ist ein Fehler (§ 20 BBiG)", () => assert.match(pz({ dauer: 5, azubi: true }).fehler.dauer, /4 Monate/));
t("Azubi: weniger als 1 Monat ist ein Fehler (§ 20 BBiG)", () => assert.match(pz({ einheit: "wochen", dauer: 3, azubi: true }).fehler.dauer, /1 Monat/));
t("Azubi: Befristung wird nicht wie nach TzBfG geprüft", () => assert.equal(pz({ dauer: 3, azubi: true, befristet: true, befristetBis: "2029-07-31" }).ergebnis.anteil, null));

/* ---------- Mutterschutz nach Fehlgeburt oder Totgeburt (§ 3 MuSchG) ---------- */
t("Vor der 24. Woche, aber ab 500 Gramm: Totgeburt, also Entbindung", () => assert.equal(berechneFehlgeburt({ datum: "2026-05-10", ssw: "22", ab500: true }).totgeburt, true));
t("Vor der 24. Woche unter 500 Gramm: Fehlgeburt mit Staffel 8 Wochen", () => {
  const r = berechneFehlgeburt({ datum: "2026-05-10", ssw: "22", ab500: false });
  assert.equal(r.totgeburt, false); assert.equal(r.stufe.label, "8 Wochen");
});
t("Ab der 24. Woche immer Totgeburt", () => assert.equal(berechneFehlgeburt({ datum: "2026-05-10", ssw: "24", ab500: false }).totgeburt, true));

/* ---------- Aufbewahrungsfristen ---------- */
const typ = (id) => DOKUMENTE.find((d) => d.id === id);
t("Lohnabrechnung 31.03.2026: 8 Jahre ab Jahresende, bis 31.12.2034", () => assert.equal(iso(berechneFrist(typ("lohn"), D("2026-03-31")).bis), "2034-12-31"));
t("SV-Unterlage aus dem geprüften Zeitraum: bis Ende des Jahres nach der Prüfung", () => {
  const f = berechneFrist(typ("sv"), D("2023-01-31"), { bis: D("2023-12-31"), am: D("2024-05-10") });
  assert.equal(iso(f.bis), "2025-12-31"); assert.equal(iso(f.ab), "2026-01-01");
});
t("SV-Unterlage nach der letzten Prüfung: nicht löschbar", () => assert.equal(berechneFrist(typ("sv"), D("2026-03-31"), { bis: D("2023-12-31"), am: D("2024-05-10") }), null));
t("SV-Unterlage ohne Prüfung: nicht löschbar", () => assert.equal(berechneFrist(typ("sv"), D("2023-01-31"), null), null));

console.log(`\n${n} Tests bestanden.`);
