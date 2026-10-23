// Tests für components/tools/urlaubsanspruch-logik.ts. Aufruf: node scripts/test-urlaub.mjs
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith(".")) return n(s + ".ts", c); throw e; } }`), import.meta.url);
const assert = (await import("node:assert/strict")).default;
const { berechneUrlaub: u, volleMonate, rundeAuf } = await import("../components/tools/urlaubsanspruch-logik.ts");
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok", String(n).padStart(2), name); };
const base = { jahresurlaub: 30, bezug: 5, tage: 5, jahr: 2026 };
const teile = (r) => [r.gesetzlich.wert, r.mehr.wert, r.gesamt];
const alt = { eintritt: "2020-01-01" };

// Ganzes Jahr, Teilzeit, Bezugswoche
t("Vollzeit ganzes Jahr: 20 gesetzlich + 10 Mehrurlaub = 30", () => assert.deepEqual(teile(u(base)), [20, 10, 30]));
t("Teilzeit 3 Tage: 12 + 6 = 18", () => assert.deepEqual(teile(u({ ...base, tage: 3 })), [12, 6, 18]));
t("Ganzes Jahr Teilzeit 3 Tage bei 28 Tagen: 16,8 wird freiwillig 17 (12 + 5)", () => { const r = u({ ...base, jahresurlaub: 28, tage: 3 }); assert.deepEqual(teile(r), [12, 5, 17]); assert.ok(r.rechenweg.some((x) => x.includes("16,8") && x.includes("freiwillig aufgerundet auf 17"))); });
t("Halbe Tage: 5 kurze Arbeitstage zählen wie 5 volle, 30 Tage", () => assert.equal(u({ ...base, tage: 5 }).gesamt, 30));
t("Wechselnde Wochen 2 und 3 Tage = 2,5: 10 + 5 = 15", () => assert.deepEqual(teile(u({ ...base, tage: 2.5 })), [10, 5, 15]));
t("6-Tage-Bezug: 36 Werktage bei 5 Tagen = 20 + 10", () => assert.deepEqual(teile(u({ ...base, jahresurlaub: 36, bezug: 6 })), [20, 10, 30]));
t("6-Tage-Woche selbst: 24 gesetzlich", () => assert.equal(u({ ...base, jahresurlaub: 24, bezug: 6, tage: 6 }).gesetzlich.wert, 24));
t("Vertrag unter Mindesturlaub (18): es gelten 20, Mehrurlaub 0, Warnung", () => { const r = u({ ...base, jahresurlaub: 18 }); assert.deepEqual(teile(r), [20, 0, 20]); assert.ok(r.hinweise.some((h) => h.typ === "warnung")); });

// Eintritt
t("Eintritt 01.07.: Wartezeit endet 31.12., voller Urlaub 20 + 10", () => { const r = u({ ...base, eintritt: "2026-07-01" }); assert.deepEqual(teile(r), [20, 10, 30]); assert.equal(r.wartezeitEnde, "2026-12-31"); });
t("Eintritt 01.07. mit anteiligem Mehrurlaub: 20 + 5 = 25", () => assert.deepEqual(teile(u({ ...base, eintritt: "2026-07-01", mehrRegel: "anteilig" })), [20, 5, 25]));
t("Eintritt 02.07.: 5/12, gesetzlich 8,33 wird 9, gesamt 12,5 wird 13", () => { const r = u({ ...base, eintritt: "2026-07-02" }); assert.equal(r.gesetzlich.zwoelftel, 5); assert.equal(r.gesetzlich.exakt, 8.333333); assert.deepEqual(teile(r), [9, 4, 13]); assert.ok(r.rechenweg.some((x) => x.includes("8,33 Tage, freiwillig aufgerundet auf 9"))); assert.ok(r.rechenweg.some((x) => x.includes("12,5 Tage, aufgerundet auf 13"))); });
t("Eintritt 02.07. Mehrurlaub getrennt anteilig: 8,33 -> 9 + 4,17 -> 5 = 14", () => assert.deepEqual(teile(u({ ...base, eintritt: "2026-07-02", mehrRegel: "anteilig" })), [9, 5, 14]));
t("Eintritt 15.08.: 4 volle Monate, gesetzlich 6,67 wird 7, gesamt 10", () => { const r = u({ ...base, eintritt: "2026-08-15" }); assert.deepEqual(teile(r), [7, 3, 10]); });

// Austritt
t("Austritt 30.06. (erste Jahreshälfte): 6/12 = 10 + 5 = 15", () => assert.deepEqual(teile(u({ ...base, ...alt, austritt: "2026-06-30" })), [10, 5, 15]));
t("Austritt 01.07. (zweite Jahreshälfte): voll 20 + 10", () => assert.deepEqual(teile(u({ ...base, ...alt, austritt: "2026-07-01" })), [20, 10, 30]));
t("Austritt 01.07. mit anteiligem Mehrurlaub: 20 + 6/12 von 10 = 25", () => assert.deepEqual(teile(u({ ...base, ...alt, austritt: "2026-07-01", mehrRegel: "anteilig" })), [20, 5, 25]));
t("Austritt 31.03.: 3/12, gesamt 7,5 wird 8", () => { const r = u({ ...base, ...alt, austritt: "2026-03-31" }); assert.equal(r.gesetzlich.wert, 5); assert.equal(r.gesamt, 8); });
t("Austritt 30.09. mit anteiligem Mehrurlaub: 20 + 7,5 -> 8 = 28", () => assert.deepEqual(teile(u({ ...base, ...alt, austritt: "2026-09-30", mehrRegel: "anteilig" })), [20, 8, 28]));
t("Austritt 31.08. anteilig: 20 + 6,67 -> 7 = 27", () => assert.deepEqual(teile(u({ ...base, ...alt, austritt: "2026-08-31", mehrRegel: "anteilig" })), [20, 7, 27]));
t("Ein- und Austritt vor Wartezeit 01.03. bis 31.05.: 3/12 = 7,5 wird 8", () => assert.equal(u({ ...base, eintritt: "2026-03-01", austritt: "2026-05-31" }).gesamt, 8));

// Rundung: immer aufrunden
t("Aufrunden: 0,49 -> 1, 0,5 -> 1, 7,49 -> 8, 8,33 -> 9, 12,5 -> 13, 16,8 -> 17", () => { assert.equal(rundeAuf(0.49), 1); assert.equal(rundeAuf(0.5), 1); assert.equal(rundeAuf(7.49), 8); assert.equal(rundeAuf(8.333333), 9); assert.equal(rundeAuf(12.5), 13); assert.equal(rundeAuf(16.8), 17); });
t("Aufrunden: ganze Zahlen bleiben, Rechenrauschen zählt nicht (7, 12,0000000001)", () => { assert.equal(rundeAuf(7), 7); assert.equal(rundeAuf(12.0000000001), 12); assert.equal(rundeAuf((20 * 9) / 12), 15); });
t("1 Arbeitstag/Woche, Eintritt 01.12., 1 Monat: gesetzlich 0,33 wird 1, gesamt 0,5 wird 1", () => { const r = u({ ...base, tage: 1, eintritt: "2026-12-01" }); assert.equal(r.gesetzlich.wert, 1); assert.equal(r.gesamt, 1); });
t("Gesamt ist immer ganzzahlig, Hinweis zur freiwilligen Aufrundung erscheint", () => { const r = u({ ...base, eintritt: "2026-07-02", mehrRegel: "anteilig", schwerbehindert: true }); assert.equal(r.gesamt % 1, 0); assert.ok(r.hinweise.some((h) => h.text.includes("freiwillig"))); });
t("Ohne Bruchteil kein Rundungshinweis", () => assert.ok(!u(base).hinweise.some((h) => h.text.includes("aufrunde") || h.text.includes("rundet"))));
t("1,5 Tage/Woche, Austritt 31.01.: 30×1,5/5 = 9, 1/12 = 0,75 wird 1", () => assert.equal(u({ ...base, tage: 1.5, ...alt, austritt: "2026-01-31" }).gesamt, 1));

// Schwerbehinderung
t("Schwerbehinderung Vollzeit: +5", () => assert.equal(u({ ...base, schwerbehindert: true }).gesamt, 35));
t("Schwerbehinderung 3 Tage: +3", () => assert.equal(u({ ...base, tage: 3, schwerbehindert: true }).gesamt, 21));
t("Schwerbehinderung ab 01.07.: 6/12 von 5 = 2,5 wird 3", () => assert.equal(u({ ...base, schwerbehindert: true, schwerbehindertAb: "2026-07-01" }).zusatz.wert, 3));

// Wechsel
t("Wechsel 5 -> 3 Tage ab 01.07.: im Schnitt 4 Tage, 16 + 8 = 24", () => assert.deepEqual(teile(u({ ...base, wechsel: { ab: "2026-07-01", tage: 3 } })), [16, 8, 24]));

// Hilfsfunktionen und Fehler
t("volleMonate 01.01.-30.06. = 6, 02.07.-31.12. = 5", () => { assert.equal(volleMonate("2026-01-01", "2026-06-30"), 6); assert.equal(volleMonate("2026-07-02", "2026-12-31"), 5); });
t("Austritt vor Eintritt wirft", () => assert.throws(() => u({ ...base, eintritt: "2026-05-01", austritt: "2026-04-01" })));
t("6 Arbeitstage bei 5-Tage-Bezug: 30 × 6 ÷ 5 = 36, gesetzlich 24", () => assert.deepEqual(teile(u({ ...base, tage: 6 })), [24, 12, 36]));
t("0 oder 7 Arbeitstage werfen", () => { assert.throws(() => u({ ...base, tage: 0 })); assert.throws(() => u({ ...base, tage: 7 })); });
console.log(`\n${n} Tests bestanden.`);
