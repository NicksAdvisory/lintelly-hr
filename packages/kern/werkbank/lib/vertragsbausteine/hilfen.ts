/**
 * Kleine Helfer für Bausteine und Regeln: Zahlen lesen, Werte abfragen, Beträge schreiben, Mindestlohn zum Stichtag.
 * Rein, ohne Datenbank.
 */
import { MINDESTLOHN, WERTE, wertZu } from "@/lib/regeln/werte";
import { addMonths, compare } from "@/lib/regeln/datum";
import type { Auswahl, Lage, Regel, Werte } from "./typen";
import { euro as euroFormat, zahl as dezimal } from "@/lib/format";

/** "4.500,50" → 4500.5, "2,5" → 2.5, "" → null. Punkt als Tausendertrenner nur vor genau drei Ziffern. */
export function zahl(s: string | undefined | null): number | null {
  if (s === undefined || s === null) return null;
  const t = String(s).trim().replace(/\s|€|%/g, "");
  if (!t) return null;
  const n = Number(t.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Prozent-Eingabe "2,5" als Anteil 0.025. */
export const anteil = (s: string | undefined | null) => { const n = zahl(s); return n === null ? null : n / 100; };

export const euro = (n: number) => euroFormat(n, { cent: true });
export const prozent = (a: number) => `${dezimal((a * 100), 2)} Prozent`;
/** Zahl deutsch ohne Einheit. */
export const zahlText = (n: number) => dezimal(n, 2);

export const hat = (l: Lage, id: string) => id in l.auswahl;
export const wert = (l: Lage, id: string, feld: string): string => (l.auswahl[id]?.[feld] ?? "").trim();
export const num = (l: Lage, id: string, feld: string) => zahl(l.auswahl[id]?.[feld]);
export const ja = (w: Werte | undefined, feld: string) => (w?.[feld] ?? "").trim().toLowerCase() === "ja";
/** Mehrfachauswahl als Liste. */
export const liste = (s: string | undefined) => (s ?? "").split("|").map((x) => x.trim()).filter(Boolean);
export const leer = (s: string | undefined) => !(s ?? "").trim();

/** Mindestlohn je Stunde am Stichtag (Register). */
export const mindestlohnAm = (datum: string) => wertZu(MINDESTLOHN, datum).wert;
/** Vertragliche Monatsstunden aus Wochenstunden (Rechenwert Wochen je Monat aus dem Register). */
export const monatsstunden = (wochenstunden: number) => wochenstunden * WERTE.wochenJeMonat.wert;
/** Fixum geteilt durch die Monatsstunden. */
export const stundenlohn = (gehalt: number, wochenstunden: number, zusatzStundenMonat = 0) => {
  const h = monatsstunden(wochenstunden) + zusatzStundenMonat;
  return h > 0 ? gehalt / h : 0;
};

/** Alter in vollen Jahren an einem Tag. */
export function alterAm(geburtstag: string, tag: string): number {
  const [gy, gm, gd] = geburtstag.split("-").map(Number);
  const [y, m, d] = tag.split("-").map(Number);
  return y - gy - (m < gm || (m === gm && d < gd) ? 1 : 0);
}
export const minderjaehrig = (l: Lage) => !!l.person.geburtstag && alterAm(l.person.geburtstag, l.heute) < WERTE.jugendlicheBisJahre.wert;

/** Liegt `datum` innerhalb von `monate` Monaten vor `stichtag`? */
export const innerhalbMonate = (datum: string, stichtag: string, monate: number) => compare(addMonths(stichtag, -monate), datum) <= 0;

/** Kurzform für eine Regel, die an Bausteinen hängt. */
export const regel = (id: string, art: Regel["art"], titel: string, norm: string, bausteine: string[], pruefe: Regel["pruefe"]): Regel => ({ id, art, titel, norm, bausteine, pruefe });

/** Text einer Regel, wenn eine Bedingung erfüllt ist. */
export const wenn = (bed: boolean, text: string): string | null => (bed ? text : null);

/** Auswahl aus JSON (Angabe "bausteine" im Dokument-Dialog). Kaputtes oder fremdes JSON ergibt eine leere Auswahl. */
export function leseAuswahl(roh: string | undefined | null): Auswahl {
  if (!roh) return {};
  try {
    const x = JSON.parse(roh) as unknown;
    if (!x || typeof x !== "object" || Array.isArray(x)) return {};
    const out: Auswahl = {};
    for (const [id, w] of Object.entries(x as Record<string, unknown>)) {
      if (!/^[A-S]\d{1,2}$/.test(id) || !w || typeof w !== "object" || Array.isArray(w)) continue;
      out[id] = Object.fromEntries(Object.entries(w as Record<string, unknown>).filter(([k, v]) => /^[\w-]{1,40}$/.test(k) && typeof v === "string").map(([k, v]) => [k, (v as string).slice(0, 2000)]));
    }
    return out;
  } catch {
    return {};
  }
}

/** Staffel aus der Eingabe: [{ ab, bis, satz }] mit satz in Prozent. */
export type Stufe = { ab: number; bis: number | null; satz: number };
export function leseStaffel(s: string | undefined): Stufe[] {
  if (!s?.trim()) return [];
  try {
    const x = JSON.parse(s) as unknown;
    if (!Array.isArray(x)) return [];
    return x
      .map((z) => (z && typeof z === "object" ? (z as Record<string, unknown>) : {}))
      .map((z) => ({ ab: Number(z.ab), bis: z.bis === null || z.bis === undefined || z.bis === "" ? null : Number(z.bis), satz: Number(z.satz) }))
      .filter((z) => Number.isFinite(z.ab) && Number.isFinite(z.satz) && (z.bis === null || Number.isFinite(z.bis)));
  } catch {
    return [];
  }
}
