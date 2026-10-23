/** Vertragsbausteine E bis K: Pflichtsätze, Standardfälle und die Regeln P-089 bis P-095, P-103, K-31, K-36, K-37. */
import { describe, expect, it } from "vitest";
import { BAUSTEIN } from "@/lib/vertragsbausteine/katalog";
import { pruefeVertrag } from "@/lib/vertragsbausteine/pruefen";
import { BAUSTEINE_EFGH } from "@/lib/vertragsbausteine/gruppe-efgh";
import { BAUSTEINE_IJK, PAUSCHALE_GEHALT, PAUSCHALE_SICHER, PAUSCHALE_VOR_MELDUNG } from "@/lib/vertragsbausteine/gruppe-ijk";
import { WERTE } from "@/lib/regeln/werte";
import { eingabe, lage, schlaegt, text } from "./hilfe";

/** Standardwerte eines Bausteins plus Ergänzungen für Pflichtfelder ohne Standard. */
const voll = (id: string, extra: Record<string, string> = {}) => ({
  ...Object.fromEntries(BAUSTEIN[id].felder.filter((f) => f.standard !== undefined).map((f) => [f.id, f.standard!])),
  ...extra,
});
const EXTRA: Record<string, Record<string, string>> = {
  E1: { tageGesamt: "30" },
  E3: { hoechstMonate: "6" },
  E5: { zeitraum: "zwischen Weihnachten und Neujahr" },
  F2: { dauerWochen: "6" },
  F4: { zahlung: "Anwesenheitsprämie" },
  G1: { fristWochen: "2" },
  J4: { pauschale: "20" },
  J6: { speicherTage: "30" },
  K4: { bereich: "Ladenkasse", mankogeld: "50" },
};
const IDS = [...BAUSTEINE_EFGH, ...BAUSTEINE_IJK].map((b) => b.id);

describe("Bausteine E bis K: Bestand", () => {
  it("alle Kennungen aus dem Katalog sind da", () => {
    expect(IDS.sort()).toEqual(["E1", "E2", "E3", "E4", "E5", "F1", "F2", "F3", "F4", "G1", "H1", "H2", "H3", "H4", "H5", "I1", "I2", "I3", "I4", "I5", "I6", "I7", "J1", "J2", "J3", "J4", "J5", "J6", "K1", "K2", "K3", "K4"].sort());
  });
  it("Ausbildung nur bei K1 bis K3, ersetzt nur bei H1 und I4", () => {
    expect(IDS.filter((id) => BAUSTEIN[id].fuer.includes("ausbildung")).sort()).toEqual(["K1", "K2", "K3"]);
    expect(IDS.filter((id) => BAUSTEIN[id].ersetzt).map((id) => `${id}:${BAUSTEIN[id].ersetzt}`).sort()).toEqual(["H1:§ 10", "I4:§ 9"]);
  });
  it.each(IDS)("%s: vollständiger Standardfall ohne Eingabefehler und ohne Sperre", (id) => {
    const w = voll(id, EXTRA[id]);
    expect(eingabe({ [id]: w })).toEqual([]);
    expect(pruefeVertrag(lage({ [id]: w })).befunde.filter((b) => b.art === "sperre")).toEqual([]);
    expect(text(id, w).length).toBeGreaterThan(50);
    expect(text(id, w)).not.toMatch(/[–—!]/);
    expect(text(id, w)).toContain("Paul");
  });
});

describe("Pflichtsätze im Text", () => {
  it("H1 ersetzt § 10 und hängt den Hinweisgeberschutz an, H2 ebenso, mit Erfahrungswissen", () => {
    expect(text("H1", voll("H1"))).toMatch(/Hinweisgeberschutzgesetz bleiben unberührt/);
    expect(text("H1", voll("H1"))).not.toMatch(/alle Angelegenheiten|alles, was/i);
    const h2 = text("H2", voll("H2"));
    expect(h2).toMatch(/Hinweisgeberschutzgesetz bleiben unberührt/);
    expect(h2).toMatch(/allgemeine Erfahrungswissen/);
    expect(h2).toMatch(/für (ein Jahr|\S+ Jahre) geheim/);
  });
  it("I1 enthält Meldung in Textform, Inanspruchnahme, Vergütung nach § 9, § 22, § 24, § 26 und alle Fristen aus dem Register", () => {
    const t = text("I1", voll("I1"));
    for (const s of ["unverzüglich gesondert in Textform", "Eingang unverzüglich in Textform", "Erklärung in Textform", "gilt die Inanspruchnahme als erklärt", "§ 9 ArbnErfG", "Vergütungsrichtlinien", "erst nach der Meldung", "§ 22 ArbnErfG", "§ 13 ArbnErfG", "§ 14 ArbnErfG", "§ 16 ArbnErfG", "§ 23 ArbnErfG", "§ 24 ArbnErfG", "§ 26 ArbnErfG", "nicht mit dem Gehalt abgegolten"]) expect(t).toContain(s);
    expect(t).toContain("binnen vier Monaten");
    expect(t).toContain("binnen zwei Monaten nach Eingang");
    expect(t).toContain("spätestens sechs Monate nach Ende");
    expect(t).not.toContain("Prämie");
  });
  it("I1 mit Prämie nach Meldung: zusätzlich, ohne Anrechnung", () => {
    const t = text("I1", voll("I1", { pauschale: "ja", pauschaleZeitpunkt: PAUSCHALE_SICHER, pauschaleBetrag: "500" }));
    expect(t).toMatch(/Zusätzlich zahlt der Arbeitgeber nach Eingang jeder ordnungsgemäßen Meldung[\s\S]*500,00 €[\s\S]*nicht angerechnet/);
    expect(t).toMatch(/\(10\) Die Rechte und Pflichten/);
  });
  it("I2 mit Fristen aus § 18 und § 19, I3 trennt qualifiziert und einfach", () => {
    expect(text("I2", voll("I2"))).toMatch(/binnen drei Monaten nach Eingang der Mitteilung[\s\S]*binnen drei Monaten an/);
    expect(text("I3", voll("I3"))).toMatch(/Qualifizierte Verbesserungsvorschläge[\s\S]*einfache Verbesserungsvorschläge/);
  });
  it("I4 ersetzt § 9: Nutzungsrechte, § 43, § 31a, § 32a, nur Werke aus der Arbeitspflicht", () => {
    const t = text("I4", voll("I4"));
    for (const s of ["Nutzungsrechte", "§ 43 UrhG", "§ 31a UrhG", "soweit nicht § 32a UrhG zwingend etwas anderes vorsieht", "in Erfüllung der Pflichten", "außerhalb der Arbeitspflicht"]) expect(t).toContain(s);
  });
  it("I5 nennt § 69b und Open Source, verbietet private Projekte nicht", () => {
    const t = text("I5", voll("I5"));
    expect(t).toMatch(/§ 69b UrhG[\s\S]*Open-Source[\s\S]*stehen Paul zu/);
  });
  it("I6 Bildnis nur mit gesonderter, widerruflicher Einwilligung", () => {
    expect(text("I6", voll("I6"))).toMatch(/gesonderter Einwilligung[\s\S]*nicht Teil dieses Vertrags[\s\S]*widerruflich/);
  });
  it("E1 trennt gesetzlich und vertraglich, F4 schließt Mutterschutz aus, F1 ohne Diagnose", () => {
    expect(text("E1", voll("E1", EXTRA.E1))).toMatch(/30 Arbeitstage[\s\S]*20 Arbeitstage gesetzlicher Mindesturlaub und 10 Arbeitstage vertraglicher Mehrurlaub/);
    expect(text("F4", voll("F4", { ...EXTRA.F4, zaehlt: "Arbeitsunfähigkeit wegen Krankheit|Mutterschutz und Beschäftigungsverbote" }))).toMatch(/Nicht gekürzt wird für Zeiten des Mutterschutzes/);
    expect(text("F1", voll("F1"))).toMatch(/Diagnose muss Paul nicht mitteilen/);
  });
  it("J2 nennt Vertretung, Löschung, Kontrolle; K2 stellt Schutzausrüstung kostenlos; K4 begrenzt auf das Mankogeld", () => {
    expect(text("J2", voll("J2"))).toMatch(/kontrolliert die private Nutzung nicht[\s\S]*Abwesenheitsnotiz[\s\S]*löscht/);
    expect(text("K2", voll("K2"))).toMatch(/kostenlos[\s\S]*§ 3 Abs\. 3 ArbSchG/);
    expect(text("K4", voll("K4", EXTRA.K4))).toMatch(/50,00 €[\s\S]*nur bis zur Höhe des Mankogelds/);
  });
});

describe("Regeln", () => {
  it("P-089: Pauschale vor Meldung oder Abgeltung im Gehalt sperrt, Prämie nach Meldung nicht", () => {
    expect(schlaegt({ I1: voll("I1", { pauschale: "ja", pauschaleZeitpunkt: PAUSCHALE_GEHALT, pauschaleBetrag: "100" }) }, "P-089")).toBe(true);
    expect(schlaegt({ I1: voll("I1", { pauschale: "ja", pauschaleZeitpunkt: PAUSCHALE_VOR_MELDUNG, pauschaleBetrag: "100" }) }, "P-089")).toBe(true);
    expect(schlaegt({ I1: voll("I1", { pauschale: "ja", pauschaleZeitpunkt: PAUSCHALE_SICHER, pauschaleBetrag: "100" }) }, "P-089")).toBe(false);
    expect(schlaegt({ I1: voll("I1") }, "P-089")).toBe(false);
  });
  it("K-31: I1 mit Abgeltungs- oder Verzichtsklausel im Freitext sperrt", () => {
    expect(schlaegt({ I1: voll("I1"), I4: voll("I4", { ergaenzung: "Die Erfindervergütung ist mit dem Gehalt abgegolten." }) }, "K-31")).toBe(true);
    expect(schlaegt({ I1: voll("I1", { ergaenzung: "Für Erfindungen gilt ein Verzicht auf jede Vergütung." }) }, "K-31")).toBe(true);
    expect(schlaegt({ I1: voll("I1") }, "K-31")).toBe(false);
    expect(schlaegt({ I4: voll("I4", { ergaenzung: "Die Erfindervergütung ist mit dem Gehalt abgegolten." }) }, "K-31")).toBe(false);
  });
  it("P-090: Pflichtelemente gemeldet, wenn I1 gewählt", () => {
    expect(schlaegt({ I1: voll("I1") }, "P-090")).toBe(true);
    expect(schlaegt({ I2: voll("I2") }, "P-090")).toBe(false);
  });
  it("P-091: Satz zu § 32a UrhG gemeldet, wenn I4 gewählt", () => {
    expect(schlaegt({ I4: voll("I4") }, "P-091")).toBe(true);
    expect(schlaegt({ I5: voll("I5") }, "P-091")).toBe(false);
  });
  it("P-092: Software-Baustein bei Rolle ohne Entwicklungsbezug gibt einen Hinweis", () => {
    expect(schlaegt({ I5: voll("I5") }, "P-092", { person: { rolle: "Buchhalterin" } })).toBe(true);
    expect(schlaegt({ I5: voll("I5") }, "P-092", { person: { rolle: "Softwareentwicklerin" } })).toBe(false);
    expect(schlaegt({ I5: voll("I5") }, "P-092", { person: { rolle: "Data Scientist" } })).toBe(false);
    expect(schlaegt({ I5: voll("I5") }, "P-092", { person: { rolle: "IT-Administrator" } })).toBe(false);
  });
  it("P-093: Kontrolle ohne Einwilligung oder laufend warnt", () => {
    expect(schlaegt({ J2: voll("J2", { kontrolle: "Verbindungsdaten nur bei konkretem Verdacht, mit Beteiligung der Person", einwilligung: "nein" }) }, "P-093")).toBe(true);
    expect(schlaegt({ J2: voll("J2", { kontrolle: "laufende Auswertung von Verbindungsdaten", einwilligung: "ja" }) }, "P-093")).toBe(true);
    expect(schlaegt({ J2: voll("J2", { kontrolle: "Verbindungsdaten nur bei konkretem Verdacht, mit Beteiligung der Person", einwilligung: "ja" }) }, "P-093")).toBe(false);
    expect(schlaegt({ J2: voll("J2") }, "P-093")).toBe(false);
  });
  it("K-36: Privatnutzung erlaubt mit Totalüberwachung warnt", () => {
    expect(schlaegt({ J2: voll("J2", { kontrolle: "Einsicht in Inhalte und Verlauf jederzeit", einwilligung: "ja" }) }, "K-36")).toBe(true);
    expect(schlaegt({ J2: voll("J2", { kontrolle: "laufende Auswertung von Verbindungsdaten", einwilligung: "ja" }) }, "K-36")).toBe(false);
  });
  it("P-094 und K-37: H1 oder H2 ohne H3 ergänzt den Hinweisgeberschutz", () => {
    expect(schlaegt({ H1: voll("H1") }, "P-094")).toBe(true);
    expect(schlaegt({ H2: voll("H2") }, "P-094")).toBe(true);
    expect(schlaegt({ H1: voll("H1"), H3: voll("H3") }, "P-094")).toBe(false);
    expect(schlaegt({ H2: voll("H2") }, "K-37")).toBe(true);
    expect(schlaegt({ H1: voll("H1"), H2: voll("H2"), H3: voll("H3") }, "K-37")).toBe(false);
  });
  it("K-37 nennt die Schwelle der Meldestelle aus dem Register", () => {
    const b = pruefeVertrag(lage({ H1: voll("H1") }, { firma: { betriebsrat: false, mitarbeiter: WERTE.radarHinweisgeber.wert + 10 } })).befunde.find((x) => x.regel === "K-37");
    expect(b?.text).toContain(String(WERTE.radarHinweisgeber.wert));
  });
  it("P-095: nachvertragliche Verschwiegenheit über dem Warnwert warnt", () => {
    expect(schlaegt({ H2: voll("H2", { dauerJahre: String(WERTE.vertragStandards.verschwiegenheitWarnJahre + 3) }) }, "P-095")).toBe(true);
    expect(schlaegt({ H2: voll("H2", { dauerJahre: String(WERTE.vertragStandards.verschwiegenheitWarnJahre) }) }, "P-095")).toBe(false);
  });
  it("P-103: Kürzung über einem Viertel je Fehltag oder wegen Mutterschutz sperrt", () => {
    expect(schlaegt({ F4: voll("F4", { ...EXTRA.F4, kuerzungProzent: "100" }) }, "P-103")).toBe(true);
    expect(schlaegt({ F4: voll("F4", { ...EXTRA.F4, zaehlt: "Arbeitsunfähigkeit wegen Krankheit|Mutterschutz und Beschäftigungsverbote" }) }, "P-103")).toBe(true);
    expect(schlaegt({ F4: voll("F4", EXTRA.F4) }, "P-103")).toBe(false);
  });
  it("Ausbildungsvertrag: Erfindungsbaustein gesperrt, Rückgabe erlaubt", () => {
    expect(schlaegt({ I1: voll("I1") }, "ART", { art: "ausbildung" })).toBe(true);
    expect(schlaegt({ K1: voll("K1") }, "ART", { art: "ausbildung" })).toBe(false);
  });
});
