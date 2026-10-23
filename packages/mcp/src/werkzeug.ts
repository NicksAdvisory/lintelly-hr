/**
 * Ein Werkzeug von Lintelly HR: Name, Titel (sichtbar, deutsch), Beschreibung für das Modell (englisch mit deutschen
 * Stichwörtern, damit Prüfer und Modell sie lesen), Eingabe-Schema und die Rechnung. `baender` nennt die groben Angaben
 * für die Zählung (Plan Abschnitt 2 Nr. 4): Firmengröße, Beschäftigungsart, Bundesland, Art des Ablaufs. Nie Freitext, nie Rohwerte.
 */
import type { Antwort } from "./antwort";
import type { Eingabe, Schema } from "./eingabe";
import { FEIERTAGE } from "@/lib/regeln/werte";

/** Nur Werte aus festen Listen (enum) oder die Zahl der Beschäftigten, die zaehler.ts in Bänder fasst. */
export type Baender = { groesse?: number; art?: string; land?: string; ablauf?: string };

export type Werkzeug = {
  name: string;
  titel: string;
  beschreibung: string;
  eingabe: Schema;
  ausfuehren: (e: Eingabe, heute: string) => Antwort;
  baender?: (e: Eingabe) => Baender;
};

/** Bundesländer als Kürzel, wie im Rechtswerte-Register (Feiertage) und in der Zählung. */
export const LAENDER = Object.keys(FEIERTAGE.laender);
