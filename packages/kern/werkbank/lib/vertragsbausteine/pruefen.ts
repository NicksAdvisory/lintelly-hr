/**
 * Prüfung eines Vertrags mit Bausteinen: Eingaben je Baustein (Pflicht, Auswahl, Grenzen), Vertragsart, alle Regeln P-001 bis P-104
 * und Sperrkombinationen K-01 bis K-40. Läuft in der Vorprüfung des Dialogs, beim Anlegen auf dem Server und vor der Freigabe.
 * Sperre: Das Dokument entsteht nicht und lässt sich nicht freigeben. Warnung und Hinweis: in der Prüfliste. Rein, ohne Datenbank.
 */
import { isISODate } from "@/lib/regeln/datum";
import type { Beschaeftigung, Person } from "@/lib/types";
import type { Auswahl, Befund, Feld, Lage, Vertragsart, Werte } from "./typen";
import { BAUSTEIN, REGELN } from "./katalog";
import { leseStaffel, zahl } from "./hilfen";

export const feldSichtbar = (f: Feld, w: Werte) => !f.bei || Object.entries(f.bei).every(([k, werte]) => werte.includes(w[k] ?? ""));

/** Fehler in den Eingaben eines Bausteins (leer = in Ordnung). */
export function eingabeFehler(id: string, w: Werte): string[] {
  const b = BAUSTEIN[id];
  if (!b) return [`Unbekannter Baustein ${id}`];
  const out: string[] = [];
  for (const f of b.felder) {
    if (!feldSichtbar(f, w)) continue;
    const v = (w[f.id] ?? "").trim();
    if (!v) { if (f.pflicht) out.push(`${id}: „${f.label}“ fehlt`); continue; }
    if (f.typ === "auswahl" && f.optionen && !f.optionen.includes(v)) out.push(`${id}: ungültige Auswahl bei „${f.label}“`);
    if (f.typ === "mehrfach" && f.optionen && v.split("|").some((x) => !f.optionen!.includes(x.trim()))) out.push(`${id}: ungültige Auswahl bei „${f.label}“`);
    if (f.typ === "janein" && !["ja", "nein"].includes(v)) out.push(`${id}: „${f.label}“ bitte ja oder nein`);
    if (f.typ === "datum" && !isISODate(v)) out.push(`${id}: „${f.label}“ ist kein gültiges Datum`);
    if (f.typ === "staffel" && !leseStaffel(v).length) out.push(`${id}: „${f.label}“ braucht mindestens eine Stufe`);
    if (f.typ === "zahl" || f.typ === "betrag" || f.typ === "prozent") {
      const n = zahl(v);
      if (n === null) out.push(`${id}: „${f.label}“ ist keine Zahl`);
      else if (f.min !== undefined && n < f.min) out.push(`${id}: „${f.label}“ mindestens ${String(f.min).replace(".", ",")}`);
      else if (f.max !== undefined && n > f.max) out.push(`${id}: „${f.label}“ höchstens ${String(f.max).replace(".", ",")}`);
    }
  }
  return out;
}

export type Pruefergebnis = { befunde: Befund[]; gesperrt: boolean; nass: boolean };

export function pruefeVertrag(l: Lage): Pruefergebnis {
  const befunde: Befund[] = [];
  for (const [id, w] of Object.entries(l.auswahl)) {
    const b = BAUSTEIN[id];
    if (!b) { befunde.push({ regel: "EINGABE", art: "sperre", text: `Unbekannter Baustein ${id}`, norm: "Hausregel", bausteine: [id] }); continue; }
    if (!b.fuer.includes(l.art)) befunde.push({ regel: "ART", art: "sperre", text: `${id} ${b.label} gibt es für diese Vertragsart nicht${l.art === "ausbildung" ? " (§ 12 BBiG: im Ausbildungsvertrag nur, was das BBiG erlaubt)" : ""}.`, norm: l.art === "ausbildung" ? "§ 12 BBiG" : "Katalog Abschnitt 9 Nr. 3", bausteine: [id] });
    for (const t of eingabeFehler(id, w)) befunde.push({ regel: "EINGABE", art: "sperre", text: t, norm: "Pflichtangabe des Bausteins", bausteine: [id] });
  }
  for (const r of REGELN) {
    if (r.bausteine.length && !r.bausteine.some((id) => id in l.auswahl)) continue;
    let text: string | null = null;
    try { text = r.pruefe(l); } catch { text = null; }
    if (text) befunde.push({ regel: r.id, art: r.art, text, norm: r.norm, bausteine: r.bausteine.filter((id) => id in l.auswahl) });
  }
  return { befunde, gesperrt: befunde.some((b) => b.art === "sperre"), nass: Object.keys(l.auswahl).some((id) => BAUSTEIN[id]?.nass) };
}

/** Vertragsart aus Dokumenttyp und Person. */
export function vertragsartVon(typ: string, beschaeftigung: Beschaeftigung, befristet: boolean): Vertragsart {
  if (typ === "aenderungsvertrag") return "aenderung";
  if (typ === "ausbildungsvertrag" || beschaeftigung === "azubi") return "ausbildung";
  if (typ === "werkstudentenvertrag" || beschaeftigung === "werkstudent") return "werkstudent";
  if (beschaeftigung === "minijob") return "minijob";
  if (befristet) return "befristet";
  if (beschaeftigung === "teilzeit") return "teilzeit";
  return "arbeitsvertrag";
}

/** Lage aus einer Person der Firma. */
export function lageAus(typ: string, p: Person, auswahl: Auswahl, firma: Lage["firma"], heute: string, kanzlei?: Record<string, { datum: string; kanzlei: string }>): Lage {
  const vb = p.vorbeschaeftigung;
  return {
    art: vertragsartVon(typ, p.art, !!p.befristung), auswahl, firma, heute,
    freigaben: kanzlei && Object.fromEntries(Object.entries(kanzlei).map(([k, v]) => [k, v.datum])), freigabeKanzlei: kanzlei && Object.fromEntries(Object.entries(kanzlei).map(([k, v]) => [k, v.kanzlei])),
    person: {
      vorname: p.vorname, rolle: p.rolle, beschaeftigung: p.art, geburtstag: p.geburtstag ?? null, eintritt: p.eintritt, gehalt: p.gehalt, wochenstunden: p.wochenstunden,
      befristet: !!p.befristung, sachgrundlos: !!p.befristung && !p.befristung.sachgrund, verlaengerungen: p.befristung?.verlaengerungen ?? 0, befristungBis: p.befristung?.bis ?? null,
      vorbeschaeftigungEnde: vb && typeof vb === "object" ? vb.ende : null, vorbeschaeftigungUnbekannt: vb === null || vb === undefined || vb === true, probezeitMonate: p.probezeitMonate,
    },
  };
}
