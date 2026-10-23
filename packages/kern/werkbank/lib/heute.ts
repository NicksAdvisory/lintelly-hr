/**
 * Gemeinsame API (Foundation 09.10.2026): Datum und Uhrzeit in Europe/Berlin, rein und testbar.
 * `berlinTag(jetzt)` liefert JJJJ-MM-TT, `berlinUhr(jetzt)` HH:MM:SS. Den Tag der App liefert `heuteTag()` in lib/db.ts
 * (Echtbetrieb: echter Berliner Tag, Demo: die Demo-Uhr aus der Regie).
 */
import { formatDE } from "@/lib/regeln/datum";

const TEILE = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

function teile(jetzt: Date) {
  const t = Object.fromEntries(TEILE.formatToParts(jetzt).map((p) => [p.type, p.value]));
  return t as Record<"year" | "month" | "day" | "hour" | "minute" | "second", string>;
}
export const berlinTag = (jetzt: Date = new Date()) => { const t = teile(jetzt); return `${t.year}-${t.month}-${t.day}`; };
/** Zeitpunkt mit Zone (Z oder +02:00) ist ein echter Moment; ohne Zone ist es schon Berliner Wandzeit "JJJJ-MM-TTThh:mm[:ss]". */
export const mitZone = (ts: string) => /(Z|[+-]\d{2}:?\d{2})$/.test(ts);
/** Berliner Tag JJJJ-MM-TT eines gespeicherten Zeitpunkts. Statt `ts.slice(0, 10)`, das bei Zeitpunkten in UTC nach 22 Uhr den Vortag liefert (Running List A7). */
export const tagVon = (ts: string) => (mitZone(ts) ? berlinTag(new Date(ts)) : ts.slice(0, 10));
export const berlinUhr = (jetzt: Date = new Date()) => { const t = teile(jetzt); return `${t.hour}:${t.minute}:${t.second}`; };
/** Gespeicherter Zeitpunkt (ISO mit Z) als Berliner Anzeige "TT.MM.JJJJ, hh:mm" statt UTC. */
export const berlinZeitpunkt = (iso: string) => { const d = new Date(iso); return `${formatDE(berlinTag(d))}, ${berlinUhr(d).slice(0, 5)}`; };
