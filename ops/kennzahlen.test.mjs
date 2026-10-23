// Kennzahlen-Bericht (Plan Abschnitt 7): fasst die Tagesdateien eines Monats zusammen, ohne Rohwerte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bericht, vormonat } from "./kennzahlen.mjs";

const tage = [
  { ablauf: { aufrufe: 3, fehler: 0, baender: { ablauf: { krankheit: 2, erste_einstellung: 1 }, groesse: { "5-9": 3 } } }, rechtswert: { aufrufe: 5, fehler: 1, baender: {} } },
  { ablauf: { aufrufe: 2, fehler: 1, baender: { ablauf: { krankheit: 1, kuendigung_vorbereiten: 1 }, groesse: { "2-4": 1 }, land: { HE: 2 } } }, minijob: { aufrufe: 1, fehler: 0, baender: {} } },
];

test("Vormonat am 1. Januar ist der Dezember davor", () => {
  assert.equal(vormonat("2027-01-01"), "2026-12");
  assert.equal(vormonat("2026-11-01"), "2026-10");
});

test("Summen, Top-Werkzeuge, häufigste Abläufe und Bänder", () => {
  const t = bericht("2026-10", tage, { sterne: 12 });
  assert.match(t, /Aufrufe: 11 an 2 Tagen/);
  assert.match(t, /Fehler: 2/);
  assert.match(t, /1\. ablauf 5\n2\. rechtswert 5\n3\. minijob 1/);
  assert.match(t, /krankheit 3/);
  assert.match(t, /Firmengröße: 5-9 3, 2-4 1/);
  assert.match(t, /Bundesland: HE 2/);
  assert.match(t, /GitHub-Sterne: 12/);
});

test("ohne Daten sagt der Bericht das", () => {
  assert.match(bericht("2026-10", [], {}), /keine Aufrufe/);
});
