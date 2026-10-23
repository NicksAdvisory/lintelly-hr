/** Vertragsbausteine L, M, N, O, P, Q, S: Regeln P-070 bis P-088, P-096 bis P-098, K-12 bis K-21, K-26 bis K-28, Texte und Standardfälle. */
import { describe, expect, it } from "vitest";
import { BAUSTEIN } from "@/lib/vertragsbausteine/katalog";
import { BAUSTEINE_LMN, hoechstBindung } from "@/lib/vertragsbausteine/gruppe-lmn";
import { BAUSTEINE_OPQS } from "@/lib/vertragsbausteine/gruppe-opqs";
import { pruefeVertrag } from "@/lib/vertragsbausteine/pruefen";
import { eingabe, lage, schlaegt, text } from "./hilfe";

const L2: Record<string, string> = {
  titel: "Zertifikat Projektmanagement", anbieter: "Akademie", art: "Fortbildung mit Wert auf dem Arbeitsmarkt", dauerMonate: "3", kosten: "4.000",
  kostenarten: "Lehrgangs- und Prüfungsgebühren|Reisekosten", freistellung: "ja", bindungMonate: "24", staffel: "monatlich anteilig",
  gruende: "Eigenkündigung der Person", faelligkeit: "in Monatsraten", raten: "6", vereinbartAm: "2026-10-01", beginn: "2026-11-15",
};
const L3 = { ...L2, titel: "MBA", dauerMonate: "24", bindungMonate: "36", studientage: "5", pruefungstage: "ja", erfolg: "nein" };
const M2: Record<string, string> = { dauerMonate: "12", gegenstand: "Vertrieb von Lohnsoftware", gebiet: "Deutschland", interesse: "Kundenstamm im Mittelstand", entschaedigung: "50", variabel: "500", sachbezuege: "300", auszahlung: "monatlich zum Monatsende", verzicht: "ja" };
const M3: Record<string, string> = { kunden: "Kundenliste als Anlage", dauerMonate: "12", entschaedigung: "50", variabel: "0", sachbezuege: "0", auszahlung: "monatlich zum Monatsende" };
const N1: Record<string, string> = { verstoesse: "Nichtantritt der Stelle|Beendigung ohne Einhaltung der Kündigungsfrist", fristTage: "28", betrag: "3.000", betragProbezeit: "2.000", obergrenze: "3.000" };
const N2: Record<string, string> = { verstoesse: "Verrat von Geschäftsgeheimnissen|Verstoß gegen das nachvertragliche Wettbewerbsverbot", leicht: "2.000", mittel: "5.000", schwer: "10.000", obergrenze: "20.000" };
const Q1 = { dauerMonate: "3", stufen: "zweistufig", zweiteMonate: "3" };
const P3 = { fristMonate: "3", fristPersonMonate: "3", termin: "zum Monatsende" };

/** Vollständig ausgefüllte Standardwerte je Baustein. */
const STANDARD: Record<string, Record<string, string>> = {
  L1: { budget: "1.500", tage: "3", genehmigung: "in Abstimmung mit der Führungskraft", nachweis: "ja" },
  L2, L3,
  L4: { kosten: "3.000", bindungMonate: "12" },
  L5: { betrag: "2.000", auszahlung: "mit dem ersten Gehalt", bindungMonate: "6" },
  M1: { umfang: "jede Tätigkeit für Wettbewerber", beteiligung: "ja", beteiligungGrenze: "5" },
  M2, M3,
  M4: { dauerMonate: "12", karenz: "nein" },
  N1, N2: { ...N2, verstoesse: "Verrat von Geschäftsgeheimnissen" },
  O1: { zustimmung: "ja" }, O2: { mitteilung: "ja" }, O3: { vorab: "ja" },
  P1: { grenze: "Regelaltersgrenze der gesetzlichen Rentenversicherung", weiter: "ja" },
  P2: { gruende: "nach Ausspruch einer Kündigung", art: "unwiderruflich", urlaub: "ja", ueberstunden: "ja", verdienst: "ja", rueckgabe: "ja" },
  P3, P4: { zwischenzeugnis: "ja" },
  Q1, Q2: { tarifvertrag: "Manteltarifvertrag Groß- und Außenhandel Hessen", fassung: "01.05.2024", art: "dynamisch", umfang: "vollständig" },
  Q3: { regelwerke: "Reisekostenrichtlinie", zugriff: "im Intranet" },
  Q4: { form: "Textform", salvatorisch: "ja" },
  Q5: { sprache: "Deutsch mit Übersetzung", uebersetzung: "Englisch" },
  Q6: { leistungen: "Sommerfest-Gutschein" },
  Q7: { unterlagen: "Ausfertigung dieses Vertrags|Datenschutzinformation" },
  Q8: { angaben: "Anschrift|Bankverbindung" },
  S1: { wertgrenze: "40", kodex: "ja" }, S2: { regel: "Verweis auf die Betriebsordnung" },
  S3: { pflichtvorsorge: "ja", ersthelfer: "nein" },
  S4: { art: "Werkmietwohnung (eigener Mietvertrag)", wohnung: "Hauptstraße 1, Frankfurt", sachbezug: "450" },
  S5: { modell: "Blockmodell", beginn: "2027-01-01", ende: "2030-12-31" },
  S6: { vorrang: "ja" },
};

describe("Gruppen L bis S: Aufbau", () => {
  it("alle Bausteine sind da und im Katalog", () => {
    const ids = [...BAUSTEINE_LMN, ...BAUSTEINE_OPQS].map((b) => b.id);
    expect(ids).toEqual(["L1", "L2", "L3", "L4", "L5", "M1", "M2", "M3", "M4", "N1", "N2", "O1", "O2", "O3", "P1", "P2", "P3", "P4", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "S1", "S2", "S3", "S4", "S5", "S6"]);
    for (const id of ids) expect(BAUSTEIN[id]).toBeDefined();
  });
  it("Schriftform bei M2, M3, P1; ersetzt nur Q1 bis Q4 (Q2 und Q3 ersetzen § 14)", () => {
    expect([...BAUSTEINE_LMN, ...BAUSTEINE_OPQS].filter((b) => b.nass).map((b) => b.id)).toEqual(["M2", "M3", "P1"]);
    expect(BAUSTEIN.Q1.ersetzt).toBe("§ 15");
    expect(BAUSTEIN.Q4.ersetzt).toBe("§ 17");
    expect([...BAUSTEINE_LMN, ...BAUSTEINE_OPQS].filter((b) => b.ersetzt).map((b) => b.id)).toEqual(["Q1", "Q2", "Q3", "Q4"]);
  });
  it("Ausbildung nur bei L1 und Q ohne Q6", () => {
    const mit = [...BAUSTEINE_LMN, ...BAUSTEINE_OPQS].filter((b) => b.fuer.includes("ausbildung")).map((b) => b.id);
    expect(mit).toEqual(["L1", "Q1", "Q2", "Q3", "Q4", "Q5", "Q7", "Q8"]);
  });
  it("vollständige Standardfälle: keine Eingabefehler und keine Sperre", () => {
    for (const [id, w] of Object.entries(STANDARD)) {
      expect(eingabe({ [id]: w }), id).toEqual([]);
      const sperren = pruefeVertrag(lage({ [id]: w })).befunde.filter((b) => b.art === "sperre");
      expect(sperren.map((b) => `${b.regel}: ${b.text}`), id).toEqual([]);
    }
  });
});

describe("L: Fortbildung und Rückzahlung", () => {
  it("Faustformel aus dem Register", () => {
    expect(hoechstBindung(0.75)).toBe(6);
    expect(hoechstBindung(2)).toBe(12);
    expect(hoechstBindung(3)).toBe(24);
    expect(hoechstBindung(12)).toBe(36);
    expect(hoechstBindung(30)).toBe(60);
  });
  it("P-070 Bindung über der Faustformel", () => {
    expect(schlaegt({ L2: { ...L2, dauerMonate: "0,75", bindungMonate: "36" } }, "P-070")).toBe(true);
    expect(schlaegt({ L3: { ...L3, bindungMonate: "60" } }, "P-070")).toBe(true);
    expect(schlaegt({ L2 }, "P-070")).toBe(false);
  });
  it("P-071 ohne Staffel", () => {
    expect(schlaegt({ L2: { ...L2, staffel: "keine Staffel" } }, "P-071")).toBe(true);
    expect(schlaegt({ L2 }, "P-071")).toBe(false);
  });
  it("P-072 Ausnahmenkatalog immer im Text", () => {
    expect(schlaegt({ L2 }, "P-072")).toBe(true);
    expect(schlaegt({ L1: STANDARD.L1 }, "P-072")).toBe(false);
    const t = text("L2", L2);
    expect(t).toMatch(/dauerhafter, unverschuldeter Arbeitsunfähigkeit/);
    expect(t).toMatch(/betriebs- oder personenbedingten Gründen/);
    expect(t).toMatch(/Sphäre des Arbeitgebers/);
    expect(t).toMatch(/um 1\/24/);
    expect(t).not.toMatch(/Vergütung während der Freistellung,/);
  });
  it("P-073 Kosten nicht beziffert", () => {
    expect(schlaegt({ L2: { ...L2, kosten: "" } }, "P-073")).toBe(true);
    expect(schlaegt({ L2 }, "P-073")).toBe(false);
  });
  it("P-074 Pflichtfortbildung, Einarbeitung, Azubi", () => {
    expect(schlaegt({ L2: { ...L2, art: "betriebsinterne Einarbeitung" } }, "P-074")).toBe(true);
    expect(schlaegt({ L2 }, "P-074", { person: { beschaeftigung: "azubi" } })).toBe(true);
    expect(schlaegt({ L2 }, "P-074")).toBe(false);
  });
  it("P-075 Gehalt in der Rückzahlung", () => {
    expect(schlaegt({ L2: { ...L2, kostenarten: "Reisekosten|Vergütung während der Freistellung" } }, "P-075")).toBe(true);
    expect(schlaegt({ L2 }, "P-075")).toBe(false);
  });
  it("P-076 Vereinbarung nach Beginn", () => {
    expect(schlaegt({ L2: { ...L2, vereinbartAm: "2026-11-20" } }, "P-076")).toBe(true);
    expect(schlaegt({ L2 }, "P-076")).toBe(false);
  });
  it("K-19 L2 ohne Staffel oder über Faustformel", () => {
    expect(schlaegt({ L2: { ...L2, staffel: "keine Staffel" } }, "K-19")).toBe(true);
    expect(schlaegt({ L2 }, "K-19")).toBe(false);
  });
  it("K-20 L2 für Pflichtfortbildung", () => {
    expect(schlaegt({ L2: { ...L2, art: "Pflichtfortbildung (Gesetz, Tarifvertrag, Betriebsvereinbarung)" } }, "K-20")).toBe(true);
    expect(schlaegt({ L2 }, "K-20")).toBe(false);
  });
  it("K-21 L2 und N1 für denselben Sachverhalt", () => {
    expect(schlaegt({ L2, N1: { ...N1, verstoesse: "Nichtantritt der Stelle|Ausscheiden während einer Fortbildungsbindung" } }, "K-21")).toBe(true);
    expect(schlaegt({ L2, N1 }, "K-21")).toBe(false);
  });
  it("P-077 Umzug und Einstiegsprämie über der Höchstbindung", () => {
    expect(schlaegt({ L4: { kosten: "3.000", bindungMonate: "36" } }, "P-077")).toBe(true);
    expect(schlaegt({ L5: { betrag: "2.000", auszahlung: "mit dem ersten Gehalt", bindungMonate: "36" } }, "P-077")).toBe(true);
    expect(schlaegt({ L4: STANDARD.L4 }, "P-077")).toBe(false);
  });
  it("L1 Pflichtfortbildung kostenfrei im Text", () => {
    expect(text("L1", STANDARD.L1)).toMatch(/kostenfrei und finden in der Arbeitszeit statt/);
  });
});

describe("M: Wettbewerbsverbote", () => {
  it("P-078 Entschädigung unter der Hälfte mit Rechnung", () => {
    const b = pruefeVertrag(lage({ M2: { ...M2, entschaedigung: "40" } })).befunde.find((x) => x.regel === "P-078");
    expect(b?.text).toMatch(/5\.300,00 €/);
    expect(b?.text).toMatch(/2\.650,00 €/);
    expect(schlaegt({ M2 }, "P-078")).toBe(false);
  });
  it("P-079 Dauer über der Grenze", () => {
    expect(schlaegt({ M2: { ...M2, dauerMonate: "30" } }, "P-079")).toBe(true);
    expect(schlaegt({ M2 }, "P-079")).toBe(false);
  });
  it("P-080 minderjährig", () => {
    expect(schlaegt({ M2 }, "P-080", { person: { geburtstag: "2009-03-01" } })).toBe(true);
    expect(schlaegt({ M2 }, "P-080")).toBe(false);
  });
  it("P-081 Gegenstand fehlt oder pauschal", () => {
    expect(schlaegt({ M2: { ...M2, gegenstand: "" } }, "P-081")).toBe(true);
    expect(schlaegt({ M2: { ...M2, gegenstand: "jede Tätigkeit" } }, "P-081")).toBe(true);
    expect(schlaegt({ M2 }, "P-081")).toBe(false);
  });
  it("P-082 Ersatzklausel, Wahlrecht, Ehrenwort", () => {
    expect(schlaegt({ M2: { ...M2, ergaenzung: "Fehlt die Entschädigung, gilt eine salvatorische Ersatzentschädigung." } }, "P-082")).toBe(true);
    expect(schlaegt({ M2: { ...M2, ergaenzung: "Der Arbeitgeber hat ein Wahlrecht bis zum letzten Tag." } }, "P-082")).toBe(true);
    expect(schlaegt({ M2 }, "P-082")).toBe(false);
  });
  it("P-083 Auszahlung nicht monatlich", () => {
    expect(schlaegt({ M2: { ...M2, auszahlung: "vierteljährlich" } }, "P-083")).toBe(true);
    expect(schlaegt({ M2 }, "P-083")).toBe(false);
  });
  it("P-084 Verzicht mit Jahresfrist im Text", () => {
    expect(schlaegt({ M2 }, "P-084")).toBe(true);
    expect(schlaegt({ M2: { ...M2, verzicht: "nein" } }, "P-084")).toBe(false);
    expect(text("M2", M2)).toMatch(/mit Ablauf von 12 Monaten seit der Erklärung/);
  });
  it("M2 Text: feste Zusage, Euro-Beispiel, Anrechnung, Urkunde", () => {
    const t = text("M2", M2);
    expect(t).toMatch(/fest zugesagt/);
    expect(t).toMatch(/2\.650,00 €/);
    expect(t).toMatch(/§ 74c HGB/);
    expect(t).toMatch(/unterschriebene Urkunde/);
  });
  it("K-12 ohne Karenz oder zu niedrig, auch Kundenschutz", () => {
    expect(schlaegt({ M2: { ...M2, entschaedigung: "" } }, "K-12")).toBe(true);
    expect(schlaegt({ M3: { ...M3, entschaedigung: "30" } }, "K-12")).toBe(true);
    expect(schlaegt({ M2, M3 }, "K-12")).toBe(false);
  });
  it("K-13 Dauer über der Grenze", () => {
    expect(schlaegt({ M3: { ...M3, dauerMonate: "30" } }, "K-13")).toBe(true);
    expect(schlaegt({ M3 }, "K-13")).toBe(false);
  });
  it("K-14 Minderjährige oder Azubis", () => {
    expect(schlaegt({ M3 }, "K-14", { person: { beschaeftigung: "azubi" } })).toBe(true);
    expect(schlaegt({ M3 }, "K-14")).toBe(false);
  });
  it("K-15 Strafe zum Wettbewerbsverbot über der Staffel", () => {
    expect(schlaegt({ M2, N2: { ...N2, obergrenze: "200.000" } }, "K-15")).toBe(true);
    expect(schlaegt({ M2, N2: { ...N2, schwer: "30.000" } }, "K-15")).toBe(true);
    expect(schlaegt({ M2, N2 }, "K-15")).toBe(false);
  });
  it("K-16 Signatur Original", () => {
    expect(schlaegt({ M2 }, "K-16")).toBe(true);
    expect(schlaegt({ M3 }, "K-16")).toBe(false);
    expect(pruefeVertrag(lage({ M2 })).nass).toBe(true);
  });
  it("M4 nur aktives Abwerben", () => {
    expect(text("M4", STANDARD.M4)).toMatch(/von sich aus anfragen/);
  });
});

describe("N: Vertragsstrafe", () => {
  it("P-085 über dem Entgelt der Frist, auch in der Probezeit", () => {
    expect(schlaegt({ N1: { ...N1, betrag: "5.000", obergrenze: "5.000" } }, "P-085")).toBe(true);
    expect(schlaegt({ N1: { ...N1, fristTage: "14", betrag: "4.000", betragProbezeit: "", obergrenze: "4.000" } }, "P-085")).toBe(true);
    expect(schlaegt({ N1: { ...N1, betragProbezeit: "2.500" } }, "P-085")).toBe(true);
    expect(schlaegt({ N1 }, "P-085")).toBe(false);
  });
  it("K-17 Höchstbetrag nach Kündigungsfrist", () => {
    const t = pruefeVertrag(lage({ N1: { ...N1, betrag: "5.000", obergrenze: "5.000" } })).befunde.find((b) => b.regel === "K-17")?.text;
    expect(t).toMatch(/4\.200,00 €/);
    expect(schlaegt({ N1 }, "K-17")).toBe(false);
  });
  it("P-086 ohne Liste oder ohne Obergrenze", () => {
    expect(schlaegt({ N1: { ...N1, obergrenze: "" } }, "P-086")).toBe(true);
    expect(schlaegt({ N2: { ...N2, verstoesse: "" } }, "P-086")).toBe(true);
    expect(schlaegt({ N1: { ...N1, ergaenzung: "Die Strafe gilt für jede Pflichtverletzung." } }, "P-086")).toBe(true);
    expect(schlaegt({ N1 }, "P-086")).toBe(false);
  });
  it("P-087 Strafe nach Ermessen", () => {
    expect(schlaegt({ N2: { ...N2, ergaenzung: "Im Übrigen gilt eine angemessene Strafe." } }, "P-087")).toBe(true);
    expect(schlaegt({ N2 }, "P-087")).toBe(false);
  });
  it("P-088 und K-18 Berufsausbildung", () => {
    expect(schlaegt({ N1 }, "P-088", { person: { beschaeftigung: "azubi" } })).toBe(true);
    expect(schlaegt({ N2 }, "K-18", { art: "ausbildung" })).toBe(true);
    expect(schlaegt({ N1 }, "P-088")).toBe(false);
    expect(schlaegt({ N2 }, "K-18")).toBe(false);
  });
  it("N1 Text mit Anrechnung", () => {
    expect(text("N1", N1)).toMatch(/angerechnet/);
  });
});

describe("P und Q", () => {
  it("P-098 Frist der Person länger", () => {
    expect(schlaegt({ P3: { ...P3, fristPersonMonate: "6" } }, "P-098")).toBe(true);
    expect(schlaegt({ P3 }, "P-098")).toBe(false);
  });
  it("K-28 Frist nur für die Person", () => {
    expect(schlaegt({ P3: { ...P3, fristMonate: "" } }, "K-28")).toBe(true);
    expect(schlaegt({ P3 }, "K-28")).toBe(false);
  });
  it("Q1 Text ersetzt § 15 mit Prüfwörtern", () => {
    expect(text("Q1", Q1)).toMatch(/verfallen[\s\S]*Textform[\s\S]*Mindestlohn[\s\S]*Vorsatz[\s\S]*Leben, Körper oder Gesundheit/);
    expect(text("Q1", { ...Q1, stufen: "einstufig" })).toMatch(/verfallen[\s\S]*Textform[\s\S]*Mindestlohn[\s\S]*Vorsatz[\s\S]*Leben, Körper oder Gesundheit/);
  });
  it("P-096 zu kurz oder Schriftform", () => {
    expect(schlaegt({ Q1: { ...Q1, dauerMonate: "2" } }, "P-096")).toBe(true);
    expect(schlaegt({ Q1: { ...Q1, ergaenzung: "Ansprüche sind schriftlich geltend zu machen." } }, "P-096")).toBe(true);
    expect(schlaegt({ Q1 }, "P-096")).toBe(false);
  });
  it("K-26 gesperrte Ausschlussfrist in der Ergänzung", () => {
    expect(schlaegt({ Q1: { ...Q1, ergaenzung: "Die Ausschlussfrist gilt ohne Ausnahme für Mindestlohn." } }, "K-26")).toBe(true);
    expect(schlaegt({ Q1 }, "K-26")).toBe(false);
  });
  it("P-097 und K-27 doppelte Schriftform", () => {
    expect(schlaegt({ Q4: { form: "doppelte Schriftform (auch für die Aufhebung dieser Klausel)" } }, "P-097")).toBe(true);
    expect(schlaegt({ Q4: { form: "Textform" } }, "P-097")).toBe(false);
    expect(schlaegt({ Q4: { form: "Textform", ergaenzung: "Das gilt auch für die Aufhebung dieser Schriftformklausel." } }, "K-27")).toBe(true);
    expect(schlaegt({ Q4: { form: "Textform" } }, "K-27")).toBe(false);
  });
  it("Q4 Text: Textform und Vorrang der Individualabrede", () => {
    const t = text("Q4", STANDARD.Q4);
    expect(t).toMatch(/Textform/);
    expect(t).toMatch(/§ 305b BGB/);
  });
  it("Pflichtsätze: P1 Regelaltersgrenze, P4 Meldung, Q7 eigene Seite, Q8 Textform, S5 Insolvenzsicherung, Q5 ohne Schiedsabrede", () => {
    expect(text("P1", STANDARD.P1)).toMatch(/Regelaltersgrenze/);
    expect(text("P4", STANDARD.P4)).toMatch(/3 Monate vor dem Ende/);
    expect(text("Q7", STANDARD.Q7)).toMatch(/eigenen Seite/);
    expect(text("Q8", STANDARD.Q8)).toMatch(/Textform/);
    expect(text("S5", STANDARD.S5)).toMatch(/Insolvenz/);
    expect(text("Q5", STANDARD.Q5)).not.toMatch(/Schied/);
  });
});
