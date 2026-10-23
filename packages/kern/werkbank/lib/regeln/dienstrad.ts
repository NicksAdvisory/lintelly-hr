/**
 * Dienstrad (Strang 30, Bauschritt F16 aus Destillat 20). Rein, ohne Datenbank. Ein Rechner für alle Stellen: Entgeltumwandlung
 * (lib/module/umwandlung.ts), Vertragsbaustein D25 und Zusatzleistungen (lib/module/zusatzleistungen.ts).
 * Gehaltsumwandlung: monatlich 1 Prozent eines auf volle 100 Euro abgerundeten Viertels der UVP (2019 der Hälfte), Ländererlasse vom 09.01.2020.
 * Zuschuss zusätzlich zum Lohn: steuerfrei nach § 3 Nr. 37 EStG bis Lohnzahlungszeiträume vor 2031.
 * E-Bikes, die verkehrsrechtlich Kraftfahrzeuge sind, laufen nach der Dienstwagenregel (Fahrzeugakte, lib/regeln/dienstwagen.ts).
 */
import type { ISODate } from "@/lib/regeln/datum";
import { WERTE } from "@/lib/regeln/werte";
import { anteil, euro } from "@/lib/format";
import { formatDE } from "@/lib/regeln/datum";

export type DienstradEingabe = { uvp: number | null; ersteUeberlassung: ISODate; monat: string; kfz: boolean };
export type DienstradVorteil = { berechnet: true; wert: number; schritte: string[] } | { berechnet: false; grund: string };

const R = WERTE.fahrradUmwandlung;
const norm = (q: string) => q.split(" (")[0];
const cent = (n: number) => Math.round(n * 100) / 100;
const EUR = (n: number) => euro(n, { cent: true });

export const KFZ_GRUND = `E-Bike über 25 km/h mit Kennzeichen ist ein Kraftfahrzeug: Es gilt die Dienstwagenregel (${norm(WERTE.fahrradKfz.quelle)}).`;

/** Geldwerter Vorteil eines Monats (JJJJ-MM) bei Gehaltsumwandlung. Nicht berechnet mit Grund statt einer geschätzten Zahl. */
export function dienstradVorteil(e: DienstradEingabe): DienstradVorteil {
  if (e.kfz) return { berechnet: false, grund: KFZ_GRUND };
  if (e.uvp === null || !Number.isFinite(e.uvp) || e.uvp <= 0) return { berechnet: false, grund: "Unverbindliche Preisempfehlung fehlt: ohne sie rechnet Lintelly den Vorteil nicht, das Lohnbüro braucht sie." };
  if (e.ersteUeberlassung < R.ersteUeberlassungAb || e.ersteUeberlassung > R.ersteUeberlassungBis)
    return { berechnet: false, grund: `Erste Überlassung außerhalb des Zeitraums der Ländererlasse (${formatDE(R.ersteUeberlassungAb)} bis ${formatDE(R.ersteUeberlassungBis)}): den Vorteil rechnet das Lohnbüro.` };
  const halb = e.monat.slice(0, 4) === R.ersteUeberlassungAb.slice(0, 4);
  const bruchteil = halb ? R.bruchteil2019 : R.bruchteil;
  const teil = cent(e.uvp * bruchteil);
  const basis = Math.floor(teil / R.rundung) * R.rundung;
  const wert = cent(basis * R.prozent);
  return {
    berechnet: true, wert,
    schritte: [`Unverbindliche Preisempfehlung ${EUR(e.uvp)}`, `${halb ? "die Hälfte" : "ein Viertel"} ${EUR(teil)}`, `auf volle ${EUR(R.rundung)} abgerundet ${EUR(basis)}`, `davon ${anteil(R.prozent)} = ${EUR(wert)} im Monat`],
  };
}

