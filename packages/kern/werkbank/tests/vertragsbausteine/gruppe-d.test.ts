/** Gruppe D (Vergütung, Provision, Bonus): jede Regel mit rotem und grünem Fall, Pflichtsätze im Text. */
import { describe, expect, it } from "vitest";
import { befund, eingabe, schlaegt, text } from "./hilfe";
import { FAELLIG, FORMEN, planAus } from "@/lib/vertragsbausteine/gruppe-d-variabel";
import { rechne } from "@/lib/vertragsbausteine/provision";

const D5 = { basis: "Nettoumsatz", basisDefinition: "Rechnungsbeträge ohne Umsatzsteuer laut Buchhaltung", geschaefte: "Neukunden", team: "Einzelprovision", form: FORMEN[0], satz: "5", wiederkehrend: "einmalige Abschlussprovision", entstehung: "bei Ausführung des Geschäfts durch den Arbeitgeber", abrechnungMonate: "1", faelligkeit: FAELLIG[0], fixumArt: "Fixum plus Provision", prorata: "anteilig nach Kalendertagen", teilzeit: "anteilig", definitionAenderbar: "nein" };
const D2 = { periode: "Kalenderjahr", betrag: "10000", gewichtUnternehmen: "30", gewichtTeam: "0", gewichtPerson: "70", schwelle: "50", obergrenze: "150", kurve: "linear", zielBisMonate: "1", fallback: "volle Zielerreichung", feststellung: "Führungskraft", auszahlung: "mit dem Gehalt des Monats nach der Feststellung", prorata: "anteilig nach Kalendertagen", teilzeit: "anteilig" };
const D3 = { periode: "Kalenderjahr", betrag: "5000", vorgabeBisMonate: "1", massstab: "Unternehmensziele", prorata: "anteilig nach Kalendertagen" };
const D22 = { leistungen: "Zulage (D20)", betragMonat: "500", aufwendung: "nein", gruende: "Wegfall der Funktion", ankuendigung: "einen Monat zum Monatsende" };
const D24 = { fahrzeug: "Mittelklasse", privat: "ja", wertMonat: "400", kosten: "trägt der Arbeitgeber", rueckgabe: "Ende des Arbeitsverhältnisses" };

describe("Standardfälle ohne Sperre", () => {
  it("D5 Provision vollständig", () => expect(eingabe({ D5 })).toEqual([]));
  it("D2 Zielbonus vollständig", () => expect(eingabe({ D2 })).toEqual([]));
  it("D5 Text: Buchauszug, Fälligkeit, Pro rata, kein Stichtag", () => {
    const t = text("D5", D5);
    expect(t).toMatch(/Buchauszug/); expect(t).toMatch(/§ 87a Abs. 4 HGB/); expect(t).toMatch(/anteilig/); expect(t).toMatch(/nicht davon ab, dass das Arbeitsverhältnis an einem Stichtag/);
  });
  it("D2 Text: Fallback und anteilig", () => { const t = text("D2", D2); expect(t).toMatch(/als voll erreicht/); expect(t).toMatch(/ungekündigt/); });
});

describe("Mindestlohn (P-040 bis P-043, K-08, K-39)", () => {
  it("P-040 Fixum unter Mindestlohn", () => {
    expect(schlaegt({ D1: { ueberpruefung: "keine feste Überprüfung" } }, "P-040", { person: { gehalt: 2000 } })).toBe(true);
    expect(schlaegt({ D1: { ueberpruefung: "keine feste Überprüfung" } }, "P-040", { person: { gehalt: 4500 } })).toBe(false);
  });
  it("P-041 Provision mit zu kleinem Fixum, Garantie hilft", () => {
    expect(schlaegt({ D5 }, "P-041", { person: { gehalt: 1500 } })).toBe(true);
    expect(schlaegt({ D5, D6: { art: "Garantie (nicht rückforderbar)", betrag: "1200", monate: "6" } }, "P-041", { person: { gehalt: 1500 } })).toBe(false);
  });
  it("K-08 reine Provision ohne Absicherung", () => {
    expect(schlaegt({ D5: { ...D5, fixumArt: "reine Provision" } }, "K-08")).toBe(true);
    expect(schlaegt({ D5: { ...D5, fixumArt: "reine Provision", mindestabsicherung: "ja" } }, "K-08")).toBe(false);
  });
  it("P-042 Pauschalstunden drücken den Stundenlohn", () => {
    expect(schlaegt({ C2: { stunden: "20" } }, "P-042", { person: { gehalt: 2500 } })).toBe(true);
    expect(schlaegt({ C2: { stunden: "10" } }, "P-042", { person: { gehalt: 4500 } })).toBe(false);
  });
  it("P-043 Gehaltsumwandlung unter Mindestlohn", () => {
    expect(schlaegt({ D25: { modell: "Gehaltsumwandlung", rate: "300", ende: "Übernahme durch die Person zum Restwert" } }, "P-043", { person: { gehalt: 2600 } })).toBe(true);
    expect(schlaegt({ D25: { modell: "Gehaltsumwandlung", rate: "60", ende: "Übernahme durch die Person zum Restwert" } }, "P-043", { person: { gehalt: 4500 } })).toBe(false);
  });
  it("K-39 Dienstrad", () => {
    expect(schlaegt({ D25: { modell: "Gehaltsumwandlung", rate: "300", ende: "Übernahme durch die Person zum Restwert" } }, "K-39", { person: { gehalt: 2600 } })).toBe(true);
    expect(schlaegt({ D25: { modell: "Zuschuss des Arbeitgebers", rate: "300", ende: "Übernahme durch die Person zum Restwert" } }, "K-39", { person: { gehalt: 2600 } })).toBe(false);
  });
  // Strang 30 (F16): derselbe Rechner wie in der Entgeltumwandlung; Eintritt 01.11.2026, UVP 3.999 € ergibt 9 € im Monat.
  it("P-105 Dienstrad aus Gehaltsumwandlung: geldwerter Vorteil aus der Preisempfehlung", () => {
    const um = { modell: "Gehaltsumwandlung", rate: "90", ende: "Übernahme durch die Person zum Restwert" };
    expect(befund({ D25: { ...um, uvp: "3999" } }, "P-105")[0]?.text).toMatch(/^Geldwerter Vorteil 9,00 € im Monat, als Sachbezug an das Lohnbüro melden: .*900,00 €/);
    expect(befund({ D25: um }, "P-105")[0]?.text).toMatch(/nicht berechnet: Unverbindliche Preisempfehlung fehlt/);
    expect(schlaegt({ D25: { ...um, modell: "Zuschuss des Arbeitgebers", uvp: "3999" } }, "P-105")).toBe(false);
  });
  it("P-106 E-Bike mit Kennzeichen ist kein Dienstrad", () => {
    expect(schlaegt({ D25: { modell: "Zuschuss des Arbeitgebers", rate: "90", ende: "Übernahme durch die Person zum Restwert", kfz: "ja" } }, "P-106")).toBe(true);
    expect(schlaegt({ D25: { modell: "Zuschuss des Arbeitgebers", rate: "90", ende: "Übernahme durch die Person zum Restwert", kfz: "nein" } }, "P-106")).toBe(false);
  });
});

describe("Provision (P-044 bis P-055, K-09, K-32 bis K-34)", () => {
  it("P-044 und K-33 Abrechnungszeitraum", () => {
    expect(schlaegt({ D5: { ...D5, abrechnungMonate: "4" } }, "P-044")).toBe(true);
    expect(schlaegt({ D5: { ...D5, abrechnungMonate: "3" } }, "P-044")).toBe(false);
    expect(schlaegt({ D5: { ...D5, abrechnungMonate: "4" } }, "K-33")).toBe(true);
    expect(schlaegt({ D5 }, "K-33")).toBe(false);
  });
  it("P-045 späte Fälligkeit", () => {
    expect(schlaegt({ D5: { ...D5, faelligkeit: FAELLIG[1] } }, "P-045")).toBe(true);
    expect(schlaegt({ D5 }, "P-045")).toBe(false);
  });
  it("P-046 und K-32 Buchauszug ausgeschlossen", () => {
    expect(schlaegt({ D5: { ...D5, ergaenzung: "Ein Buchauszug ist ausgeschlossen." } }, "P-046")).toBe(true);
    expect(schlaegt({ D5 }, "P-046")).toBe(false);
    expect(schlaegt({ D13: { abrechnungMonate: "1", beanstandungMonate: "3", verfall: "nein", ergaenzung: "Auskunft und Einsicht sind ausgeschlossen" } }, "K-32")).toBe(true);
    expect(schlaegt({ D13: { abrechnungMonate: "1", beanstandungMonate: "3", verfall: "nein" } }, "K-32")).toBe(false);
  });
  it("P-047 und K-09 Garantie mit Rückforderung", () => {
    const g = { art: "Garantie (nicht rückforderbar)", betrag: "1000", monate: "6" };
    expect(schlaegt({ D6: { ...g, rueckforderung: "Rückzahlung des nicht verdienten Vorschusses in Raten im pfändbaren Rahmen" } }, "P-047")).toBe(true);
    expect(schlaegt({ D6: g }, "P-047")).toBe(false);
    expect(schlaegt({ D6: { ...g, rueckforderung: "Rückzahlung des nicht verdienten Vorschusses in Raten im pfändbaren Rahmen" } }, "K-09")).toBe(true);
    expect(schlaegt({ D6: { ...g, rueckforderung: "Verzicht auf Rückforderung" } }, "K-09")).toBe(false);
    expect(schlaegt({ D6: g }, "K-09")).toBe(false);
    expect(text("D6", { ...g, rueckforderung: "x" })).toMatch(/nicht zurückgefordert/);
  });
  it("P-048, K-34 und P-049 Storno", () => {
    const s = { ereignisse: "Stornierung durch den Kunden", haftungMonate: "12", hoehe: "voll" };
    expect(schlaegt({ D8: { ...s, ereignisse: "Produktmangel" } }, "P-048")).toBe(true);
    expect(schlaegt({ D8: { ...s, haftungMonate: "" } }, "P-048")).toBe(true);
    expect(schlaegt({ D8: s }, "P-048")).toBe(false);
    expect(schlaegt({ D8: { ...s, ereignisse: "Lieferausfall des Arbeitgebers" } }, "K-34")).toBe(true);
    expect(schlaegt({ D8: s }, "K-34")).toBe(false);
    expect(schlaegt({ D8: { ...s, haftungMonate: "36" } }, "P-049")).toBe(true);
    expect(schlaegt({ D8: s }, "P-049")).toBe(false);
  });
  it("P-050 Staffel mit Lücke", () => {
    expect(schlaegt({ D11: { staffel: JSON.stringify([{ ab: 100, bis: 120, satz: 3 }, { ab: 125, bis: null, satz: 5 }]), quoteMitteilung: "vor Beginn des Zeitraums in Textform" } }, "P-050")).toBe(true);
    expect(schlaegt({ D11: { staffel: JSON.stringify([{ ab: 0, bis: 120, satz: 3 }, { ab: 120, bis: null, satz: 5 }]), quoteMitteilung: "vor Beginn des Zeitraums in Textform" } }, "P-050")).toBe(false);
  });
  it("P-051 Bemessungsgrundlage ohne Definition oder einseitig änderbar", () => {
    expect(schlaegt({ D5: { ...D5, basisDefinition: "" } }, "P-051")).toBe(true);
    expect(schlaegt({ D5: { ...D5, definitionAenderbar: "ja" } }, "P-051")).toBe(true);
    expect(schlaegt({ D5 }, "P-051")).toBe(false);
  });
  it("P-052 Kappung ohne Zahl, Warnung unter Mindestfaktor", () => {
    expect(schlaegt({ D10: { art: "Betrag je Jahr", betrag: "", ueber: "Verfall" } }, "P-052")).toBe(true);
    expect(schlaegt({ D2, D10: { art: "Betrag je Jahr", betrag: "12000", ueber: "Verfall" } }, "P-052")).toBe(true);
    expect(schlaegt({ D2, D10: { art: "Betrag je Jahr", betrag: "20000", ueber: "Verfall" } }, "P-052")).toBe(false);
  });
  it("P-053 Folgeprovision nach Ausscheiden sehr lang", () => {
    expect(schlaegt({ D9: { fristMonate: "36", folge: "ja" } }, "P-053")).toBe(true);
    expect(schlaegt({ D9: { fristMonate: "6", folge: "ja" } }, "P-053")).toBe(false);
  });
  it("P-054 Teamprämie ohne Teilzeit", () => {
    const t = { berechtigte: "Vertrieb", schluessel: "zu gleichen Teilen", zeitraum: "Q4", kriterien: "Umsatz" };
    expect(schlaegt({ D12: { ...t, teilzeit: "nicht anteilig" } }, "P-054")).toBe(true);
    expect(schlaegt({ D12: { ...t, teilzeit: "anteilig" } }, "P-054")).toBe(false);
  });
  it("P-055 Gebietsänderung ohne Schwelle", () => {
    const g = { zuordnung: "Gebiet", beschreibung: "Hessen", bezirk: "nein", direkt: "provisionspflichtig", splitting: "gleich" };
    expect(schlaegt({ D7: { ...g, aenderungSchwelle: "" } }, "P-055")).toBe(true);
    expect(schlaegt({ D7: { ...g, aenderungSchwelle: "10" } }, "P-055")).toBe(false);
  });
});

describe("Zielbonus (P-056 bis P-059, K-10, K-11)", () => {
  it("P-056 Gewichte", () => { expect(schlaegt({ D2: { ...D2, gewichtPerson: "60" } }, "P-056")).toBe(true); expect(schlaegt({ D2 }, "P-056")).toBe(false); });
  it("P-057 und K-11 ohne Fallback", () => {
    expect(schlaegt({ D2: { ...D2, fallback: "" } }, "P-057")).toBe(true); expect(schlaegt({ D2 }, "P-057")).toBe(false);
    expect(schlaegt({ D2: { ...D2, fallback: "" } }, "K-11")).toBe(true); expect(schlaegt({ D2 }, "K-11")).toBe(false);
  });
  it("P-058 und K-10 Vereinbarung und Vorgabe zugleich", () => {
    expect(schlaegt({ D2, D3 }, "P-058")).toBe(true); expect(schlaegt({ D2 }, "P-058")).toBe(false);
    expect(schlaegt({ D2, D3 }, "K-10")).toBe(true); expect(schlaegt({ D3 }, "K-10")).toBe(false);
  });
  it("P-059 Termin außerhalb der Periode", () => { expect(schlaegt({ D2: { ...D2, zielBisMonate: "13" } }, "P-059")).toBe(true); expect(schlaegt({ D2 }, "P-059")).toBe(false); });
});

describe("Sonderzahlungen und Vorbehalte (P-007, P-060 bis P-069, K-01 bis K-04, K-29, K-30)", () => {
  it("P-007 Vergütungsbestandteil ohne Höhe oder Zweck", () => {
    expect(schlaegt({ D32: { art: "Treueprämie", betrag: "", zweck: "" } }, "P-007")).toBe(true);
    expect(schlaegt({ D32: { art: "Treueprämie", betrag: "500", zweck: "fünf Jahre im Betrieb" } }, "P-007")).toBe(false);
  });
  it("P-060 Pro rata ergänzt bei Vergütungszweck", () => {
    expect(schlaegt({ D16: { bruchteil: "100", zweck: "beides (Vergütung und Betriebstreue)", monat: "November" } }, "P-060")).toBe(true);
    expect(schlaegt({ D16: { bruchteil: "100", zweck: "Betriebstreue", monat: "November" } }, "P-060")).toBe(false);
    expect(text("D16", { bruchteil: "100", zweck: "Vergütung für die Arbeit im Jahr", monat: "November" })).toMatch(/anteilig/);
  });
  it("K-04 Stichtag auf Provision", () => {
    expect(schlaegt({ D19: { leistung: "Provision (D5)", betrag: "500", bindungBis: "31.03. des Folgejahres", gilt: "Eigenkündigung" } }, "K-04")).toBe(true);
    expect(schlaegt({ D19: { leistung: "Weihnachtsgeld (D18)", betrag: "500", bindungBis: "31.03. des Folgejahres", gilt: "Eigenkündigung" } }, "K-04")).toBe(false);
  });
  it("P-061 und K-02 Freiwilligkeit auf laufendes Entgelt", () => {
    expect(schlaegt({ D21: { leistungen: "Provision" } }, "P-061")).toBe(true); expect(schlaegt({ D21: { leistungen: "Weihnachtsgeld (D18)" } }, "P-061")).toBe(false);
    expect(schlaegt({ D21: { leistungen: "Grundgehalt" } }, "K-02")).toBe(true); expect(schlaegt({ D21: { leistungen: "Prämien (D32)" } }, "K-02")).toBe(false);
  });
  it("P-062 Individualabrede im Text", () => {
    expect(schlaegt({ D21: { leistungen: "Prämien (D32)" } }, "P-062")).toBe(true);
    expect(schlaegt({}, "P-062")).toBe(false);
    expect(text("D21", { leistungen: "Prämien (D32)" })).toMatch(/individuelle Vereinbarungen/);
  });
  it("K-01 Freiwilligkeit und Widerruf für dieselbe Leistung", () => {
    expect(schlaegt({ D21: { leistungen: "Zuschüsse (D27)" }, D22: { ...D22, leistungen: "Zuschüsse (D27)" } }, "K-01")).toBe(true);
    expect(schlaegt({ D21: { leistungen: "Prämien (D32)" }, D22 }, "K-01")).toBe(false);
  });
  it("P-064 und K-03 Widerrufsgrenze mit Dienstwagen", () => {
    expect(schlaegt({ D22: { ...D22, betragMonat: "700" } }, "P-064", { person: { gehalt: 2000 } })).toBe(true); // 700 von 2.700 Gesamtvergütung
    expect(schlaegt({ D22 }, "P-064", { person: { gehalt: 4500 } })).toBe(false);
    expect(schlaegt({ D22: { ...D22, leistungen: "Zulage (D20)|Private Nutzung Dienstwagen (D24)", betragMonat: "800" }, D24 }, "K-03", { person: { gehalt: 3000 } })).toBe(true);
    expect(schlaegt({ D22 }, "K-03")).toBe(false);
  });
  it("Aufwendungsersatz hat die höhere Grenze", () => {
    expect(schlaegt({ D22: { ...D22, betragMonat: "1400", aufwendung: "ja" } }, "P-064", { person: { gehalt: 3600 } })).toBe(false);
    expect(schlaegt({ D22: { ...D22, betragMonat: "1400", aufwendung: "nein" } }, "P-064", { person: { gehalt: 3600 } })).toBe(true);
  });
  it("P-065 und P-066", () => {
    expect(schlaegt({ D22: { ...D22, gruende: "" } }, "P-065")).toBe(true); expect(schlaegt({ D22 }, "P-065")).toBe(false);
    expect(schlaegt({ D22: { ...D22, leistungen: "Grundgehalt" } }, "P-066")).toBe(true); expect(schlaegt({ D22 }, "P-066")).toBe(false);
  });
  it("P-067 Bindung nach Höhe", () => {
    const b = { leistung: "Weihnachtsgeld (D18)", gilt: "Eigenkündigung" };
    expect(schlaegt({ D19: { ...b, betrag: "80", bindungBis: "31.03. des Folgejahres" } }, "P-067")).toBe(true);
    expect(schlaegt({ D19: { ...b, betrag: "1000", bindungBis: "30.06. des Folgejahres" } }, "P-067", { person: { gehalt: 4500 } })).toBe(true);
    expect(schlaegt({ D19: { ...b, betrag: "1000", bindungBis: "31.03. des Folgejahres" } }, "P-067")).toBe(false);
  });
  it("P-068 Rückzahlung bei betriebsbedingter Kündigung", () => {
    expect(schlaegt({ D19: { leistung: "Weihnachtsgeld (D18)", betrag: "1000", bindungBis: "31.03. des Folgejahres", gilt: "Eigenkündigung|betriebsbedingter Kündigung" } }, "P-068")).toBe(true);
    expect(schlaegt({ D19: { leistung: "Weihnachtsgeld (D18)", betrag: "1000", bindungBis: "31.03. des Folgejahres", gilt: "Eigenkündigung" } }, "P-068")).toBe(false);
  });
  it("P-069 Dienstwagen bei Krankheit", () => {
    expect(schlaegt({ D24: { ...D24, rueckgabe: "Arbeitsunfähigkeit während der Entgeltfortzahlung" } }, "P-069")).toBe(true);
    expect(schlaegt({ D24 }, "P-069")).toBe(false);
  });
  it("K-29 Privatnutzung ohne Widerrufsregel", () => {
    expect(schlaegt({ D24 }, "K-29")).toBe(true);
    expect(schlaegt({ D24, D22: { ...D22, leistungen: "Private Nutzung Dienstwagen (D24)" } }, "K-29")).toBe(false);
  });
  it("K-30 Herausgabe bei Freistellung", () => {
    expect(schlaegt({ D24: { ...D24, rueckgabe: "Freistellung" } }, "K-30")).toBe(true);
    expect(schlaegt({ D24: { ...D24, rueckgabe: "Freistellung" }, D22: { ...D22, leistungen: "Private Nutzung Dienstwagen (D24)" } }, "K-30")).toBe(false);
  });
  it("P-063 Änderungsvorbehalt", () => {
    const a = { rhythmus: "Beginn eines Kalenderjahres", ankuendigungMonate: "3", gruende: "Änderung der Preise" };
    expect(schlaegt({ D14: { ...a, hoechstAbweichung: "40" } }, "P-063")).toBe(true);
    expect(schlaegt({ D14: { ...a, gruende: "", hoechstAbweichung: "20" } }, "P-063")).toBe(true);
    expect(schlaegt({ D14: { ...a, hoechstAbweichung: "20" } }, "P-063")).toBe(false);
  });
  it("P-099 Beteiligung braucht Planurkunde und Kanzlei", () => {
    expect(schlaegt({ D28: { modell: "virtuelle Anteile (VSOP)", plan: "VSOP 2026" } }, "P-099")).toBe(true);
    expect(schlaegt({}, "P-099")).toBe(false);
  });
});

describe("Provisionsplan aus den Eingaben", () => {
  it("D5 mit D6 Garantie und D10 Kappung", () => {
    const plan = planAus({ D5, D6: { art: "Garantie (nicht rückforderbar)", betrag: "800", monate: "6" }, D10: { art: "Betrag je Abrechnungszeitraum", betrag: "3000", ueber: "Verfall" } }, 4500);
    expect(plan.satz).toBe(0.05);
    expect(rechne(plan, { umsatz: 10000 }).auszahlung).toBe(800);
    expect(rechne(plan, { umsatz: 100000 }).auszahlung).toBe(3000);
  });
});
