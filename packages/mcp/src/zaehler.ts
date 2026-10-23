/**
 * Zählung ohne Personenbezug (Plan Abschnitt 2 Nr. 4, Nick 23.10.2026 „Zähler plus Bänder“): je Tag und Werkzeug die Aufrufe,
 * die Fehler und grobe Bänder (Firmengröße 1, 2 bis 4, 5 bis 9, 10+; Beschäftigungsart; Bundesland; Art des Ablaufs).
 * Nie Freitext, nie genaue Daten oder Beträge, nie Adressen. Im Speicher, mit ZAEHLER_ORDNER einmal je Minute als Tagesdatei.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { berlinTag } from "@/lib/heute";
import type { Baender } from "./werkzeug";

type Zeile = { aufrufe: number; fehler: number; baender: Record<string, Record<string, number>> };
type Tag = Record<string, Zeile>;

let tag = "";
let zahlen: Tag = {};

export const groessenband = (n: number) => (n >= 10 ? "10+" : n >= 5 ? "5-9" : n >= 2 ? "2-4" : "1");

function datei(ordner: string, t: string) { return path.join(ordner, `${t}.json`); }

/** Tageswechsel: alten Tag sichern, neuen Tag aus der Datei weiterzählen (nach einem Neustart). */
function aufTag(t: string) {
  if (t === tag) return;
  sichern();
  tag = t;
  const ordner = process.env.ZAEHLER_ORDNER;
  zahlen = {};
  // Eine kaputte Tagesdatei darf keinen Aufruf stören: dann zählt der Tag neu.
  if (ordner && existsSync(datei(ordner, t))) try { zahlen = JSON.parse(readFileSync(datei(ordner, t), "utf8")) as Tag; } catch { zahlen = {}; }
}

/** baender null: der Aufruf ist gescheitert (Eingabe ungültig oder Rechnung abgelehnt). */
export function zaehle(werkzeug: string, baender: Baender | null, jetzt = new Date()) {
  aufTag(berlinTag(jetzt));
  const z = (zahlen[werkzeug] ??= { aufrufe: 0, fehler: 0, baender: {} });
  if (!baender) { z.fehler++; return; }
  z.aufrufe++;
  const b: Record<string, string | undefined> = {
    groesse: typeof baender.groesse === "number" ? groessenband(baender.groesse) : undefined,
    art: baender.art, land: baender.land, ablauf: baender.ablauf,
  };
  for (const [k, v] of Object.entries(b)) if (v) { const f = (z.baender[k] ??= {}); f[v] = (f[v] ?? 0) + 1; }
}

export function stand(): { tag: string; zahlen: Tag } { return { tag, zahlen }; }

/** Schreibt den laufenden Tag atomar (erst Hilfsdatei, dann umbenennen). Ohne ZAEHLER_ORDNER nichts. */
export function sichern() {
  const ordner = process.env.ZAEHLER_ORDNER;
  if (!ordner || !tag) return;
  const ziel = datei(ordner, tag);
  try {
    mkdirSync(ordner, { recursive: true });
    writeFileSync(`${ziel}.neu`, JSON.stringify(zahlen));
    renameSync(`${ziel}.neu`, ziel);
  } catch {
    // Volle Platte oder fehlende Rechte: die Zählung fällt aus, der Dienst läuft weiter.
  }
}

/** Nur für Tests: Speicher leeren. */
export function zuruecksetzen() { tag = ""; zahlen = {}; }
