/**
 * Rechner für Provision und Zielbonus (Katalog Abschnitt 5): linear, Staffel rückwirkend, Staffel nur über der Schwelle (Beschleuniger),
 * Mindestschwelle, Kappung, Team- oder Einzelprovision, Umsatz- oder Margenbasis, Folgeprovision, Garantie und Vorschuss (Draw), Storno
 * mit Haftungszeit, anteilig bei Ein- und Austritt, Mindestlohnprüfung über das Register. Reine Funktionen: dieselbe Rechnung steht im
 * Rechenbeispiel der Vertragsanlage, im Dialog und in der Provisionsabrechnung für den Lohn-Input. Rechnen tut nie die KI.
 */
import { compare, diffDays, formatDE } from "@/lib/regeln/datum";
import { euro, mindestlohnAm, monatsstunden, prozent, type Stufe, zahlText } from "./hilfen";

export type Form = "linear" | "staffel-rueckwirkend" | "staffel-marginal" | "mindestschwelle";
export type Plan = {
  form: Form;
  /** Satz als Anteil (0,05 = 5 Prozent) bei linear und Mindestschwelle. */
  satz: number;
  /** Stufen mit Satz in Prozent (Eingabeform), bei Staffeln. */
  stufen: Stufe[];
  /** Unterhalb dieser Bemessungsgrundlage gibt es nichts (Mindestschwelle). */
  schwelle: number;
  /** Anteil der Bemessungsgrundlage am Umsatz, z. B. Marge 0,3 (1 bei Umsatzbasis). */
  basisAnteil: number;
  basisName: string;
  /** Anteil der Person an einer Teamprovision (1 bei Einzelprovision). */
  teamAnteil: number;
  /** Kappung je Abrechnungszeitraum in Euro (null: keine). */
  kappung: number | null;
  /** Monatliche Garantie (nicht rückforderbar) oder Vorschuss (verrechenbar). */
  absicherung: { art: "garantie" | "vorschuss"; betragMonat: number } | null;
  /** Abrechnungszeitraum in Monaten. */
  zeitraumMonate: number;
};

export type Rechnung = {
  bemessung: number;
  provisionVoll: number;
  kappungGegriffen: boolean;
  nachKappung: number;
  stornoAbzug: number;
  anteilig: number;
  /** Garantie stockt auf, Vorschuss wird verrechnet. */
  aufstockung: number;
  vorschussVerrechnet: number;
  auszahlung: number;
  schritte: string[];
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Provision aus der Bemessungsgrundlage nach der Berechnungsform (ohne Kappung). */
export function provisionAus(plan: Pick<Plan, "form" | "satz" | "stufen" | "schwelle">, bemessung: number): { betrag: number; weg: string } {
  if (bemessung <= 0) return { betrag: 0, weg: "keine Bemessungsgrundlage" };
  if (plan.form === "linear") return { betrag: bemessung * plan.satz, weg: `${euro(bemessung)} mal ${prozent(plan.satz)}` };
  if (plan.form === "mindestschwelle") {
    if (bemessung < plan.schwelle) return { betrag: 0, weg: `${euro(bemessung)} liegt unter der Schwelle von ${euro(plan.schwelle)}, keine Provision` };
    return { betrag: bemessung * plan.satz, weg: `Schwelle ${euro(plan.schwelle)} erreicht: ${euro(bemessung)} mal ${prozent(plan.satz)}` };
  }
  const stufen = [...plan.stufen].sort((a, b) => a.ab - b.ab);
  if (plan.form === "staffel-rueckwirkend") {
    const s = [...stufen].reverse().find((x) => bemessung >= x.ab);
    if (!s) return { betrag: 0, weg: `${euro(bemessung)} liegt unter der ersten Stufe` };
    return { betrag: (bemessung * s.satz) / 100, weg: `Stufe ab ${euro(s.ab)} erreicht, ${prozent(s.satz / 100)} gelten für den ganzen Betrag: ${euro(bemessung)} mal ${prozent(s.satz / 100)}` };
  }
  // Marginal: jeder Teil zum Satz seiner Stufe (Beschleuniger über der Quote).
  let summe = 0;
  const teile: string[] = [];
  for (const s of stufen) {
    const oben = s.bis === null ? bemessung : Math.min(bemessung, s.bis);
    const teil = oben - s.ab;
    if (teil <= 0) continue;
    summe += (teil * s.satz) / 100;
    teile.push(`${euro(teil)} mal ${prozent(s.satz / 100)}`);
  }
  return { betrag: summe, weg: teile.join(" plus ") || "keine Stufe erreicht" };
}

/** Lücken oder Überschneidungen einer Staffel (P-050). Leer heißt in Ordnung. */
export function staffelFehler(stufen: Stufe[]): string[] {
  const s = [...stufen].sort((a, b) => a.ab - b.ab);
  const out: string[] = [];
  if (!s.length) return ["Die Staffel hat keine Stufe."];
  s.forEach((x, i) => {
    if (x.bis !== null && x.bis <= x.ab) out.push(`Stufe ab ${zahlText(x.ab)} endet nicht über ihrem Anfang.`);
    const n = s[i + 1];
    if (!n) { if (x.bis !== null) out.push(`Über ${zahlText(x.bis)} ist kein Satz geregelt.`); return; }
    if (x.bis === null) out.push(`Stufe ab ${zahlText(x.ab)} hat kein Ende, danach folgt noch eine Stufe.`);
    else if (n.ab > x.bis) out.push(`Lücke zwischen ${zahlText(x.bis)} und ${zahlText(n.ab)}.`);
    else if (n.ab < x.bis) out.push(`Überschneidung zwischen ${zahlText(n.ab)} und ${zahlText(x.bis)}.`);
  });
  return out;
}

/** Sprung bei rückwirkender Staffel: Provision knapp unter und auf der Stufengrenze (zeigt die Anlage, Katalog P-050). */
export function sprungRueckwirkend(stufen: Stufe[]): { grenze: number; davor: number; danach: number }[] {
  const s = [...stufen].sort((a, b) => a.ab - b.ab);
  return s.slice(1).map((x, i) => ({ grenze: x.ab, davor: r2(((x.ab - 0.01) * s[i].satz) / 100), danach: r2((x.ab * x.satz) / 100) }));
}

/** Anteil eines Zeitraums, in dem die Person beschäftigt war (Pro rata nach Kalendertagen). */
export function anteilImZeitraum(periodeVon: string, periodeBis: string, eintritt: string, austritt?: string | null): number {
  const von = compare(eintritt, periodeVon) > 0 ? eintritt : periodeVon;
  const bis = austritt && compare(austritt, periodeBis) < 0 ? austritt : periodeBis;
  if (compare(von, bis) > 0) return 0;
  return (diffDays(von, bis) + 1) / (diffDays(periodeVon, periodeBis) + 1);
}

export type Abrechnung = {
  umsatz: number;
  /** Rückbelastung aus Storno im Zeitraum (Umsatz, der wegen Kundengründen entfällt). */
  stornoUmsatz?: number;
  /** Anteil der Beschäftigung im Zeitraum (Pro rata), Standard 1. */
  anteil?: number;
  /** Offener Vorschuss aus früheren Zeiträumen, der verrechnet werden darf. */
  offenerVorschuss?: number;
};

/** Provisionsabrechnung eines Zeitraums mit Rechenweg. */
export function rechne(plan: Plan, a: Abrechnung): Rechnung {
  const schritte: string[] = [];
  const umsatzNetto = Math.max(0, a.umsatz - (a.stornoUmsatz ?? 0));
  if (a.stornoUmsatz) schritte.push(`Umsatz ${euro(a.umsatz)} abzüglich Storno aus Kundengründen ${euro(a.stornoUmsatz)} = ${euro(umsatzNetto)}`);
  const bemessung = r2(umsatzNetto * plan.basisAnteil * plan.teamAnteil);
  if (plan.basisAnteil !== 1) schritte.push(`Bemessungsgrundlage ${plan.basisName}: ${euro(umsatzNetto)} mal ${prozent(plan.basisAnteil)}`);
  if (plan.teamAnteil !== 1) schritte.push(`Anteil am Team: ${prozent(plan.teamAnteil)}`);
  const p = provisionAus(plan, bemessung);
  const provisionVoll = r2(p.betrag);
  schritte.push(`Provision: ${p.weg} = ${euro(provisionVoll)}`);
  const kappungGegriffen = plan.kappung !== null && provisionVoll > plan.kappung;
  const nachKappung = kappungGegriffen ? plan.kappung! : provisionVoll;
  if (kappungGegriffen) schritte.push(`Kappung greift: höchstens ${euro(plan.kappung!)}`);
  const anteil = a.anteil ?? 1;
  const anteilig = r2(nachKappung * anteil);
  if (anteil < 1) schritte.push(`Anteilig für die Zeit der Beschäftigung: ${euro(nachKappung)} mal ${prozent(anteil)} = ${euro(anteilig)}`);
  let aufstockung = 0;
  let vorschussVerrechnet = 0;
  let auszahlung = anteilig;
  if (plan.absicherung) {
    const sockel = r2(plan.absicherung.betragMonat * plan.zeitraumMonate * anteil);
    if (plan.absicherung.art === "garantie") {
      if (anteilig < sockel) { aufstockung = r2(sockel - anteilig); auszahlung = sockel; schritte.push(`Garantie: aufgestockt auf ${euro(sockel)} (nicht rückforderbar)`); }
    } else {
      vorschussVerrechnet = r2(Math.min(a.offenerVorschuss ?? 0, anteilig));
      auszahlung = r2(anteilig - vorschussVerrechnet);
      if (vorschussVerrechnet) schritte.push(`Vorschuss verrechnet: ${euro(vorschussVerrechnet)} (nur im pfändbaren Teil)`);
    }
  }
  schritte.push(`Auszahlung: ${euro(auszahlung)}`);
  return { bemessung, provisionVoll, kappungGegriffen, nachKappung, stornoAbzug: r2(((a.stornoUmsatz ?? 0) * plan.basisAnteil * plan.teamAnteil)), anteilig, aufstockung, vorschussVerrechnet, auszahlung, schritte };
}

/** Mindestlohn: Fixum allein (oder Fixum plus Garantie) je Stunde gegen den Mindestlohn am Stichtag (Register, § 1 MiLoG). */
export function mindestlohnCheck(fixumMonat: number, wochenstunden: number, datum: string, garantieMonat = 0) {
  const h = monatsstunden(wochenstunden);
  const mindest = mindestlohnAm(datum);
  const stunde = h > 0 ? (fixumMonat + garantieMonat) / h : 0;
  return { stundenlohn: r2(stunde), mindestlohn: mindest, ok: stunde >= mindest, fehlbetrag: r2(Math.max(0, mindest * h - fixumMonat - garantieMonat)), text: `${euro(fixumMonat + garantieMonat)} geteilt durch ${zahlText(r2(h))} Stunden im Monat = ${euro(r2(stunde))} je Stunde, Mindestlohn am ${formatDE(datum)}: ${euro(mindest)}` };
}

/** Zielbonus: Ziele mit Gewicht (Anteil) und Erreichung (Anteil), Schwelle und Obergrenze der Erreichung, Kurve linear oder in vollen Zehnteln. */
export type Zielbonus = { betrag: number; ziele: { name: string; gewicht: number; erreichung: number }[]; schwelle: number; obergrenze: number; kurve: "linear" | "stufen"; anteil?: number };
export function rechneZielbonus(z: Zielbonus): { erreichung: number; faktor: number; betrag: number; schritte: string[] } {
  const schritte: string[] = [];
  const erreichung = z.ziele.reduce((s, x) => s + x.gewicht * x.erreichung, 0);
  z.ziele.forEach((x) => schritte.push(`${x.name}: ${prozent(x.erreichung)} erreicht, Gewicht ${prozent(x.gewicht)}`));
  schritte.push(`Gesamt: ${prozent(r2(erreichung))}`);
  let faktor = erreichung < z.schwelle ? 0 : Math.min(erreichung, z.obergrenze);
  if (erreichung < z.schwelle) schritte.push(`Unter der Schwelle von ${prozent(z.schwelle)}: kein Bonus`);
  if (faktor > 0 && z.kurve === "stufen") { faktor = Math.floor(faktor * 10) / 10; schritte.push(`Stufen: abgerundet auf ${prozent(faktor)}`); }
  if (erreichung > z.obergrenze) schritte.push(`Obergrenze: höchstens ${prozent(z.obergrenze)}`);
  const anteil = z.anteil ?? 1;
  const betrag = r2(z.betrag * faktor * anteil);
  schritte.push(`Bonus: ${euro(z.betrag)} mal ${prozent(faktor)}${anteil < 1 ? ` mal ${prozent(r2(anteil))} (anteilig)` : ""} = ${euro(betrag)}`);
  return { erreichung: r2(erreichung), faktor, betrag, schritte };
}
