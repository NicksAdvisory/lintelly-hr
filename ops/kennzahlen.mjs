#!/usr/bin/env node
// Kennzahlen von Lintelly HR für den Vormonat, am 1. per Telegram (Plan Abschnitt 7, Nick 23.10.2026 „Telegram monatlich“).
// Liest nur die Tagesdateien der Zählung (zaehler/JJJJ-MM-TT.json), keine Personendaten. Aufruf auf ops-01:
//   node kennzahlen.mjs ~/lintelly-hr/zaehler            sendet an Telegram (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
//   node kennzahlen.mjs ~/lintelly-hr/zaehler --probe    druckt nur
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const vormonat = (heute) => {
  const [j, m] = heute.split("-").map(Number);
  return m === 1 ? `${j - 1}-12` : `${j}-${String(m - 1).padStart(2, "0")}`;
};

const plus = (ziel, quelle) => { for (const [k, n] of Object.entries(quelle ?? {})) ziel[k] = (ziel[k] ?? 0) + n; };
const absteigend = (o) => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const liste = (o) => absteigend(o).map(([k, n]) => `${k} ${n}`).join(", ") || "keine Angabe";

export function bericht(monat, tage, extra) {
  const werkzeuge = {}, ablauf = {}, groesse = {}, land = {}, art = {};
  let fehler = 0;
  for (const tag of tage) for (const [name, z] of Object.entries(tag)) {
    plus(werkzeuge, { [name]: z.aufrufe });
    fehler += z.fehler;
    plus(ablauf, z.baender.ablauf); plus(groesse, z.baender.groesse); plus(land, z.baender.land); plus(art, z.baender.art);
  }
  const gesamt = Object.values(werkzeuge).reduce((a, b) => a + b, 0);
  const kopf = `Nick, Lintelly HR im ${monat}`;
  if (!gesamt) return `${kopf}: keine Aufrufe.${extra.sterne !== undefined ? ` GitHub-Sterne: ${extra.sterne}.` : ""}`;
  return [
    `${kopf}`,
    `Aufrufe: ${gesamt} an ${tage.length} Tagen. Fehler: ${fehler}.`,
    "",
    "Top 5 Werkzeuge:",
    ...absteigend(werkzeuge).slice(0, 5).map(([k, n], i) => `${i + 1}. ${k} ${n}`),
    "",
    `Abläufe: ${liste(ablauf)}`,
    `Firmengröße: ${liste(groesse)}`,
    `Beschäftigungsart: ${liste(art)}`,
    `Bundesland: ${liste(land)}`,
    "",
    ...(extra.sterne !== undefined ? [`GitHub-Sterne: ${extra.sterne}`] : []),
    "Nicht in diesem Bericht: Frist-merken-Anmeldungen, Klicks auf lintelly.com/hr und gebuchte Erstgespräche (andere Quellen).",
  ].join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ordner = process.argv[2];
  const monat = vormonat(new Date().toISOString().slice(0, 10));
  const tage = readdirSync(ordner).filter((f) => f.startsWith(monat) && f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(ordner, f), "utf8")));
  const sterne = await fetch("https://api.github.com/repos/NicksAdvisory/lintelly-hr").then((r) => r.json()).then((j) => j.stargazers_count).catch(() => undefined);
  const text = bericht(monat, tage, { sterne });
  if (process.argv.includes("--probe")) console.log(text);
  else {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    });
    if (!r.ok) { console.error(`Telegram ${r.status}`); process.exit(1); }
  }
}
