/**
 * Zahlen, Prozente, Euro, Tage und Stunden immer deutsch (1,6 %, 1.234,50 €, 1,32 Mio. €). Eine Stelle für Seiten, Mails und Dokumente.
 * Rein, läuft auf Server und im Browser. Nie `${x} %` oder toFixed direkt ausgeben, sondern prozent(x).
 * components/ui.tsx reicht zahl und euroKurz von hier weiter, damit alte Aufrufe gleich bleiben.
 * Dazu Uhrzeit, Telefon und IBAN nach DIN 5008 und Zeitpunkte nach ISO 8601 für Exporte. Belege: docs/normen/din5008-schreibregeln.md.
 * Das Datum TT.MM.JJJJ liefert formatDE aus lib/regeln/datum.ts.
 */
import { berlinTag, berlinUhr, mitZone, tagVon } from "@/lib/heute";
import { formatDE } from "@/lib/regeln/datum";


const LEER = "keine Angabe";
const ok = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/**
 * Zahl nach DIN 5008: bis vier Stellen ungegliedert (1500), ab fünf Stellen in Dreiergruppen mit geschütztem Leerzeichen (15 976),
 * Dezimalkomma, höchstens `stellen` Nachkommastellen (Standard 1), mindestens `min`. Den Tausenderpunkt bekommen nur Geldbeträge (euro).
 */
export function zahl(n: number, stellen = 1, min = 0): string {
  if (!ok(n)) return LEER;
  const s = n.toLocaleString("de-DE", { maximumFractionDigits: stellen, minimumFractionDigits: Math.min(min, stellen), useGrouping: false });
  if (s === "-0") return "0";
  const [ganz, dez] = s.split(",");
  const g = ganz.replace("-", "").length > 4 ? ganz.replace(/\B(?=(\d{3})+$)/g, "\u00a0") : ganz;
  return dez === undefined ? g : `${g},${dez}`;
}

/** Prozentwert, der schon in Prozent vorliegt: prozent(1.6) = "1,6 %". */
export function prozent(n: number, stellen = 1): string {
  return ok(n) ? `${zahl(n, stellen)} %` : LEER;
}

/** Anteil zwischen 0 und 1 als Prozent: anteil(0.25) = "25 %". */
export function anteil(x: number, stellen = 0): string {
  return ok(x) ? prozent(x * 100, stellen) : LEER;
}

/**
 * Geldbetrag ohne Währung nach DIN 5008: Tausenderpunkt ab vier Stellen, Dezimalkomma ("4.100", "500,50").
 * Ganze Beträge ohne Cent, krumme mit zwei Stellen. `cent: true` erzwingt immer zwei Stellen (Lohn, Verträge), `cent: false` rundet auf ganze Euro.
 */
export function betrag(n: number, o: { cent?: boolean } = {}): string {
  if (!ok(n)) return LEER;
  const krumm = Math.round(n * 100) % 100 !== 0;
  const zwei = o.cent === true || (o.cent === undefined && krumm);
  const wert = o.cent === false ? Math.round(n) : n;
  return wert.toLocaleString("de-DE", { minimumFractionDigits: zwei ? 2 : 0, maximumFractionDigits: zwei ? 2 : 0 });
}

/** Euro mit Leerzeichen vor dem Zeichen: "4.100 €", "500,50 €". */
export function euro(n: number, o: { cent?: boolean } = {}): string {
  return ok(n) ? `${betrag(n, o)} €` : LEER;
}

/** Kurz für Kacheln: unter 10.000 genau, darüber "63 Tsd. €", ab einer Million "1,32 Mio. €". */
export function euroKurz(n: number): string {
  if (!ok(n)) return LEER;
  const v = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${v}${zahl(a / 1_000_000, 2)} Mio. €`;
  if (a >= 10_000) return `${v}${betrag(Math.round(a / 1000))} Tsd. €`;
  return `${v}${euro(a, { cent: false })}`;
}

/** "1 Tag", "2,5 Tage". */
export function tage(n: number): string {
  return ok(n) ? `${zahl(n, 1)} ${n === 1 ? "Tag" : "Tage"}` : LEER;
}

/** "7,5 Std." */
export function stunden(n: number): string {
  return ok(n) ? `${zahl(n, 1)} Std.` : LEER;
}


/** "14:30" in Berliner Zeit. */
export const uhrzeit = (ts: string) => (mitZone(ts) ? berlinUhr(new Date(ts)).slice(0, 5) : ts.slice(11, 16));

/** Tag eines Zeitpunkts als "16.10.2026" in Berliner Zeit. */
export const datum = (ts: string) => formatDE(tagVon(ts));

/** "16.10.2026, 14:30 Uhr". */
export const zeitpunkt = (ts: string) => `${datum(ts)}, ${uhrzeit(ts)} Uhr`;

/** Stunden als Zahl als Uhrzeit: volle Stunde "9 Uhr", sonst zweistellig "07:30 Uhr", nie "7,5 Uhr". */
export function uhr(stunden: number): string {
  const min = Math.round(stunden * 60);
  const h = Math.floor(min / 60);
  return min % 60 === 0 ? `${h} Uhr` : `${String(h).padStart(2, "0")}:${String(min % 60).padStart(2, "0")} Uhr`;
}

/**
 * Telefon und Fax nach DIN 5008: Vorwahl und Rufnummer mit einem Leerzeichen getrennt, Durchwahl mit Bindestrich,
 * ohne Klammern und Schrägstrich ("069 123456-20"); international "+49 69 123456-20" ohne die Null der Ortsvorwahl.
 * Gliedert nur um, was eingegeben ist: wo die Vorwahl endet, weiß nur, wer die Nummer eingibt. Bindestrich mit Leerzeichen gilt als Trenner.
 */
export function telefon(roh: string): string {
  const t = roh.trim().replace(/\(0\)/g, " ").replace(/[()/]|\s+-\s*|-\s+/g, " ").replace(/^00(?=[1-9])/, "+").replace(/\s+/g, " ").trim();
  return t.replace(/^(\+\d{1,3}) 0(?=\d)/, "$1 ");
}

/** Link für tel: ohne Gliederung bis auf die Durchwahl, deutsche Nummern mit +49. */
export function telLink(roh: string): string {
  const t = telefon(roh).replace(/\s/g, "");
  return `tel:${t.startsWith("+") ? t : `+49${t.replace(/^0/, "")}`}`;
}

/** IBAN in Vierergruppen von links: "DE89 3704 0044 0532 0130 00". */
export const iban = (roh: string) => roh.replace(/\s/g, "").toUpperCase().replace(/(.{4})(?=.)/g, "$1 ");

const VERSATZ = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", timeZoneName: "longOffset" });
const versatz = (d: Date) => VERSATZ.formatToParts(d).find((p) => p.type === "timeZoneName")!.value.replace("GMT", "") || "+00:00";

/**
 * Zeitpunkt für Exporte nach ISO 8601 (Profil RFC 3339): "2026-10-16T14:30:00+02:00", Berliner Zeit mit Versatz, ohne Millisekunden.
 * Nimmt einen Zeitpunkt mit Zone oder eine Berliner Wandzeit ohne Zone.
 */
export function isoZeitpunkt(ts: string): string {
  if (mitZone(ts)) { const d = new Date(ts); return `${berlinTag(d)}T${berlinUhr(d)}${versatz(d)}`; }
  const lokal = ts.length === 16 ? `${ts}:00` : ts.slice(0, 19);
  const v = ["+01:00", "+02:00"].find((x) => versatz(new Date(`${lokal}${x}`)) === x) ?? "+01:00";
  return `${lokal}${v}`;
}
/** "1 Tag", "1,5 Tage", "3 Personen": Zahl mit Komma und Einzahl nur bei genau 1 (Prüffund UX-29). */
export const anzahl = (n: number, eins: string, viele: string) => `${String(n).replace(".", ",")} ${n === 1 ? eins : viele}`;
