/**
 * Geldwerter Vorteil des Dienstwagens je Monat (Strang 29, Bauschritt F7 aus Destillat 20, Nick 11.10.2026: "Lintelly rechnet selbst mit
 * sichtbarem Rechenweg, das Lohnbüro bestätigt den Wert einmal je Fahrzeug"). Rein, ohne Datenbank. Alle Zahlen kommen aus lib/regeln/werte.ts.
 * Was Lintelly nicht sicher rechnen kann (Fahrtenbuch, Batterieabzug, Hybrid ohne Angaben), kommt als "nicht berechnet" mit Grund zurück,
 * nie als geschätzte Zahl.
 */
import { DIENSTWAGEN_BATTERIEABZUG_BIS, DIENSTWAGEN_BRUCHTEIL, type DienstwagenBruchteil } from "./werte";
import { formatDE, type ISODate } from "./datum";

export type Antrieb = "verbrenner" | "elektro" | "hybrid";
export type Methode = "pauschal" | "einzel" | "fahrtenbuch";
export const METHODE_TEXT: Record<Methode, string> = { pauschal: "Pauschal je Monat", einzel: "Einzelbewertung je Fahrt", fahrtenbuch: "Fahrtenbuch" };
/** Wer den Dienstwagen fahren darf (Überlassungsvertrag und Baustein D24). */
export const FAHRERKREIS = ["nur die Person selbst", "die Person und im Haushalt lebende Angehörige mit gültiger Fahrerlaubnis"];

export type Fahrzeugdaten = { antrieb: Antrieb; anschaffungAm: ISODate; listenpreis: number; co2?: number | null; reichweiteKm?: number | null };
export type VorteilEingabe = Fahrzeugdaten & {
  /** Private Nutzung erlaubt. Ohne sie gibt es keinen Nutzungswert nach der Prozentregel. */
  privat: boolean;
  methode: Methode;
  /** Einfache Entfernung Wohnung und erste Tätigkeitsstätte, wird auf volle km abgerundet. */
  entfernungKm: number;
  /** Einzelbewertung: Fahrten im Monat laut Erklärung der Person, null wenn die Erklärung fehlt. */
  fahrten?: number | null;
  /** Einzelbewertung: schon angerechnete Fahrten früherer Monate desselben Jahres. */
  fahrtenVorher?: number;
  nutzungsentgeltMonat?: number;
  /** Zuzahlung zu den Anschaffungskosten: ohne `monate` bis aufgebraucht, mit `monate` gleichmäßig verteilt. */
  zuzahlung?: { betrag: number; am: ISODate; monate?: number | null };
  /** Belegte Gesamtkosten des Fahrzeugs im Jahr. Nur dann deckelt Lintelly. */
  gesamtkostenJahr?: number | null;
  /** Abrechnungsmonat JJJJ-MM. */
  monat: string;
};
export type Vorteil =
  | { berechnet: true; wert: number; basis: number; bruchteil: number; vorlaeufig: boolean; schritte: string[]; hinweise: string[] }
  | { berechnet: false; grund: string; schritte: string[]; hinweise: string[] };

const zwischen = (d: ISODate, z: Pick<DienstwagenBruchteil, "anschaffungAb" | "anschaffungBis">) => z.anschaffungAb <= d && d <= z.anschaffungBis;

/**
 * Bruchteil des Listenpreises nach Antrieb und Anschaffung. `vorlaeufig`: Eine Zeile mit `bestaetigt: false` lag im Zeitraum und hat mitentschieden.
 * `nichtBerechnet`: Grund, warum Lintelly keinen Bruchteil nennt (dann ist `bruchteil` bedeutungslos).
 */
export function bruchteilFuer(f: Fahrzeugdaten): { bruchteil: number; vorlaeufig: boolean; zeile?: DienstwagenBruchteil; hinweis?: string; nichtBerechnet?: string } {
  if (f.antrieb === "verbrenner") return { bruchteil: 1, vorlaeufig: false };
  const letzte = DIENSTWAGEN_BRUCHTEIL.reduce((m, z) => (z.anschaffungBis > m ? z.anschaffungBis : m), "");
  if (f.anschaffungAm > letzte) return { bruchteil: 1, vorlaeufig: false, hinweis: `Angeschafft nach dem ${formatDE(letzte)}: Das Gesetz kennt dafür heute keinen kleineren Anteil, gerechnet wird mit dem ganzen Listenpreis.` };
  const imZeitraum = DIENSTWAGEN_BRUCHTEIL.filter((z) => z.antrieb === f.antrieb && zwischen(f.anschaffungAm, z));
  const batterie = `Angeschafft bis ${formatDE(DIENSTWAGEN_BATTERIEABZUG_BIS.datum)}: Der Listenpreis mindert sich um die Kosten des Batteriesystems (${DIENSTWAGEN_BATTERIEABZUG_BIS.quelle.split(" (")[0]}). Das rechnet Lintelly nicht, den Wert nennt das Lohnbüro.`;
  if (f.antrieb === "elektro") {
    const z = imZeitraum.find((x) => x.maxListenpreis !== undefined && f.listenpreis <= x.maxListenpreis) ?? imZeitraum.find((x) => x.maxListenpreis === undefined);
    if (!z) return { bruchteil: 1, vorlaeufig: false, nichtBerechnet: batterie };
    return { bruchteil: z.bruchteil, zeile: z, vorlaeufig: imZeitraum.some((x) => x.bestaetigt === false) };
  }
  const co2 = f.co2 ?? null, km = f.reichweiteKm ?? null;
  if (co2 === null && km === null) return { bruchteil: 1, vorlaeufig: false, nichtBerechnet: "Für den Plug-in-Hybrid fehlen CO2-Ausstoß und elektrische Reichweite (aus der Übereinstimmungsbescheinigung). Ohne sie rechnet Lintelly nicht." };
  for (const z of imZeitraum) {
    if ((co2 !== null && co2 <= z.maxCo2!) || (km !== null && km >= z.minReichweiteKm!)) return { bruchteil: z.bruchteil, zeile: z, vorlaeufig: z.bestaetigt === false };
    if (co2 === null || km === null) return { bruchteil: 1, vorlaeufig: false, nichtBerechnet: "Für den Plug-in-Hybrid fehlt der CO2-Ausstoß oder die elektrische Reichweite. Mit dem fehlenden Wert könnte die Hälfte gelten, darum rechnet Lintelly nicht." };
  }
  if (f.anschaffungAm <= DIENSTWAGEN_BATTERIEABZUG_BIS.datum) return { bruchteil: 1, vorlaeufig: false, nichtBerechnet: batterie };
  return { bruchteil: 1, vorlaeufig: false };
}

/**
 * Was das Lohnbüro einmal bestätigt: alles, was den Wert bestimmt, ohne die Fahrten des Monats. Ändert sich etwas davon, gilt die Bestätigung nicht mehr.
 */
export function grundlage(e: VorteilEingabe): string {
  return JSON.stringify([e.listenpreis, e.antrieb, e.anschaffungAm, e.co2 ?? null, e.reichweiteKm ?? null, e.privat, e.methode, Math.floor(e.entfernungKm), e.nutzungsentgeltMonat ?? 0, e.zuzahlung ?? null, e.gesamtkostenJahr ?? null]);
}
