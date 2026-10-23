/**
 * Stundenlohn gegen den Mindestlohn (§ 1 MiLoG), eine Rechnung für Befund, Vertragsprüfung und Gehaltsänderung (Nachtprüfung 19.10. Nr. 8).
 * Monatsstunden = Wochenstunden × 13/3 (Rechenwert aus dem Register). Ausnahmen nach § 22 MiLoG kennt Lintelly nicht: Hinweis, keine Sperre.
 */
import type { Person } from "@/lib/types";
import { MINDESTLOHN, MINIJOB_GRENZE, WERTE, wertZu, type WertZuDatum } from "./werte";
import { euro } from "@/lib/format";

const cent = (x: number) => Math.round(x * 100) / 100;

/** Mindestlohn am Tag, Soll im Monat und Fehlbetrag (0 = reicht). */
export function mindestlohnLuecke(gehalt: number, wochenstunden: number, datum: string): { satz: WertZuDatum; stundenlohn: number; soll: number; fehlt: number } {
  const satz = wertZu(MINDESTLOHN, datum);
  const stunden = wochenstunden * WERTE.wochenJeMonat.wert;
  const soll = cent(stunden * satz.wert);
  return { satz, stundenlohn: stunden > 0 ? cent(gehalt / stunden) : 0, soll, fehlt: Math.max(0, cent(soll - gehalt)) };
}

/** Wen die allgemeine Prüfung betrifft: nicht Auszubildende und Praktika (eigene Regeln), nicht der Minijob (regelMinijob), nicht die Geschäftsführung als Organ. */
export const mindestlohnGilt = (p: Pick<Person, "art" | "organ">) => !p.organ && p.art !== "azubi" && p.art !== "praktikum" && p.art !== "minijob";

/**
 * Satz mit Zahlen für Laien (Prüffund UX-9): Stundenlohn, Mindestlohn, Soll im Monat, beim Minijob die Grenze. null, wenn es reicht oder die Regel
 * nicht gilt (Ausbildung, Praktikum, Organ). Für den Hinweis beim Speichern und die Lohnseite.
 */
export function mindestlohnHinweis(p: Pick<Person, "gehalt" | "wochenstunden" | "art"> & Partial<Pick<Person, "organ">>, datum: string): string | null {
  if (!(p.gehalt > 0) || !(p.wochenstunden > 0) || (p.art !== "minijob" && !mindestlohnGilt({ art: p.art, organ: p.organ }))) return null;
  const m = mindestlohnLuecke(p.gehalt, p.wochenstunden, datum);
  if (!m.fehlt) return null;
  const soll = Math.ceil(m.soll);
  const grenze = wertZu(MINIJOB_GRENZE, datum).wert;
  const std = String(p.wochenstunden).replace(".", ",");
  return `${euro(p.gehalt)} für ${std} Stunden pro Woche sind ${euro(m.stundenlohn, { cent: true })} pro Stunde, der Mindestlohn ist ${euro(m.satz.wert, { cent: true })}. Für ${std} Stunden braucht es mindestens ${euro(soll)}${p.art === "minijob" && soll > grenze ? `, das liegt über der Minijob-Grenze von ${euro(grenze)}` : ""}.`;
}
