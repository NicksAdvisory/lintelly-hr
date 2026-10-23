/** Gemeinsame Testhilfe für die Vertragsbausteine: eine Lage mit erwachsener Vollzeitperson und ein Blick auf einzelne Regeln. */
import type { Auswahl, Lage } from "@/lib/vertragsbausteine/typen";
import { pruefeVertrag } from "@/lib/vertragsbausteine/pruefen";
import { BAUSTEIN } from "@/lib/vertragsbausteine/katalog";

export type LageTeil = Omit<Partial<Lage>, "person"> & { person?: Partial<Lage["person"]> };

export function lage(auswahl: Auswahl, o: LageTeil = {}): Lage {
  return {
    art: o.art ?? "arbeitsvertrag",
    auswahl,
    heute: o.heute ?? "2026-10-10",
    firma: { betriebsrat: false, mitarbeiter: 23, ...o.firma },
    freigaben: o.freigaben,
    person: {
      vorname: "Paul", rolle: "Business Development Manager", beschaeftigung: "vollzeit", geburtstag: "1990-05-05", eintritt: "2026-11-01", gehalt: 4500, wochenstunden: 40,
      befristet: false, sachgrundlos: false, verlaengerungen: 0, befristungBis: null, vorbeschaeftigungEnde: null, vorbeschaeftigungUnbekannt: false, probezeitMonate: 6,
      ...o.person,
    },
  };
}

/** Befunde einer Regel (z. B. "P-044") für diese Auswahl. */
export const befund = (auswahl: Auswahl, regelId: string, o: LageTeil = {}) => pruefeVertrag(lage(auswahl, o)).befunde.filter((b) => b.regel === regelId);
/** Schlägt die Regel an? */
export const schlaegt = (auswahl: Auswahl, regelId: string, o: LageTeil = {}) => befund(auswahl, regelId, o).length > 0;
/** Eingabefehler eines Bausteins (regel "EINGABE"). */
export const eingabe = (auswahl: Auswahl, o: LageTeil = {}) => befund(auswahl, "EINGABE", o).map((b) => b.text);
/** Text eines Bausteins mit Standardkontext. */
export const text = (id: string, w: Record<string, string>, auswahl: Auswahl = { [id]: w }) =>
  BAUSTEIN[id].text(w, { vorname: "Paul", gehalt: 4500, wochenstunden: 40, eintritt: "2026-11-01", heute: "2026-10-10", auswahl });
