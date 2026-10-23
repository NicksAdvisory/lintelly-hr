/** Rechner für Provision und Zielbonus: jede Variante aus Katalog Abschnitt 5 mit gerechnetem Beispiel. */
import { describe, expect, it } from "vitest";
import { anteilImZeitraum, mindestlohnCheck, provisionAus, rechne, rechneZielbonus, sprungRueckwirkend, staffelFehler, type Plan } from "@/lib/vertragsbausteine/provision";

const basis: Plan = { form: "linear", satz: 0.05, stufen: [], schwelle: 0, basisAnteil: 1, basisName: "Nettoumsatz", teamAnteil: 1, kappung: null, absicherung: null, zeitraumMonate: 1 };
const staffel = [{ ab: 0, bis: 100000, satz: 3 }, { ab: 100000, bis: 200000, satz: 5 }, { ab: 200000, bis: null, satz: 8 }];

describe("Provision: Berechnungsformen", () => {
  it("linear", () => expect(provisionAus(basis, 40000).betrag).toBe(2000));
  it("Mindestschwelle: darunter nichts, darüber voller Satz", () => {
    const p = { ...basis, form: "mindestschwelle" as const, schwelle: 30000 };
    expect(provisionAus(p, 29999).betrag).toBe(0);
    expect(provisionAus(p, 30000).betrag).toBe(1500);
  });
  it("Staffel rückwirkend: höchster erreichter Satz gilt für alles", () => {
    expect(provisionAus({ ...basis, form: "staffel-rueckwirkend", stufen: staffel }, 150000).betrag).toBe(7500);
  });
  it("Staffel marginal (Beschleuniger): jeder Teil zu seinem Satz", () => {
    expect(provisionAus({ ...basis, form: "staffel-marginal", stufen: staffel }, 250000).betrag).toBe(3000 + 5000 + 4000);
  });
  it("Sprung bei rückwirkender Staffel wird gezeigt", () => {
    const s = sprungRueckwirkend(staffel);
    expect(s[0].grenze).toBe(100000);
    expect(s[0].danach - s[0].davor).toBeGreaterThan(1900);
  });
  it("Staffel: Lücke und Überschneidung erkannt, lückenlose Staffel ok", () => {
    expect(staffelFehler(staffel)).toEqual([]);
    expect(staffelFehler([{ ab: 100, bis: 120, satz: 3 }, { ab: 125, bis: 150, satz: 5 }])[0]).toMatch(/Lücke/);
    expect(staffelFehler([{ ab: 100, bis: 130, satz: 3 }, { ab: 125, bis: null, satz: 5 }])[0]).toMatch(/Überschneidung/);
  });
});

describe("Provision: Abrechnung", () => {
  it("Margenbasis und Teamanteil", () => {
    const r = rechne({ ...basis, basisAnteil: 0.3, basisName: "Marge", teamAnteil: 0.5 }, { umsatz: 100000 });
    expect(r.bemessung).toBe(15000);
    expect(r.auszahlung).toBe(750);
  });
  it("Kappung greift", () => {
    const r = rechne({ ...basis, kappung: 1500 }, { umsatz: 40000 });
    expect(r.kappungGegriffen).toBe(true);
    expect(r.auszahlung).toBe(1500);
  });
  it("Storno aus Kundengründen mindert die Bemessung", () => {
    expect(rechne(basis, { umsatz: 40000, stornoUmsatz: 10000 }).auszahlung).toBe(1500);
  });
  it("Pro rata bei Eintritt am 16. eines 30-Tage-Monats", () => {
    const a = anteilImZeitraum("2026-11-01", "2026-11-30", "2026-11-16");
    expect(a).toBe(0.5);
    expect(rechne(basis, { umsatz: 40000, anteil: a }).auszahlung).toBe(1000);
  });
  it("Pro rata bei Austritt", () => expect(anteilImZeitraum("2026-01-01", "2026-12-31", "2020-01-01", "2026-06-30")).toBeCloseTo(181 / 365, 5));
  it("Garantie stockt auf und wird nicht zurückgefordert", () => {
    const r = rechne({ ...basis, absicherung: { art: "garantie", betragMonat: 1000 } }, { umsatz: 10000 });
    expect(r.aufstockung).toBe(500);
    expect(r.auszahlung).toBe(1000);
  });
  it("Vorschuss wird mit späterer Provision verrechnet", () => {
    const r = rechne({ ...basis, absicherung: { art: "vorschuss", betragMonat: 1000 } }, { umsatz: 40000, offenerVorschuss: 1200 });
    expect(r.vorschussVerrechnet).toBe(1200);
    expect(r.auszahlung).toBe(800);
  });
  it("Rechenweg ist vollständig", () => expect(rechne(basis, { umsatz: 40000 }).schritte.join(" ")).toMatch(/Provision: .*Auszahlung: 2\.000,00 €/));
});

describe("Mindestlohn aus dem Register", () => {
  it("Fixum 2.000 € bei 40 Stunden liegt 2026 unter dem Mindestlohn", () => expect(mindestlohnCheck(2000, 40, "2026-11-01").ok).toBe(false));
  it("Fixum 2.500 € bei 40 Stunden reicht 2026", () => expect(mindestlohnCheck(2500, 40, "2026-11-01").ok).toBe(true));
  it("Garantie zählt zur Absicherung", () => expect(mindestlohnCheck(0, 20, "2026-11-01", 1300).ok).toBe(true));
  it("2027 gilt der höhere Mindestlohn", () => expect(mindestlohnCheck(2500, 40, "2027-01-01").mindestlohn).toBeGreaterThan(mindestlohnCheck(2500, 40, "2026-12-31").mindestlohn));
});

describe("Zielbonus", () => {
  const z = { betrag: 10000, ziele: [{ name: "Unternehmen", gewicht: 0.3, erreichung: 1 }, { name: "Person", gewicht: 0.7, erreichung: 1.2 }], schwelle: 0.5, obergrenze: 1.5, kurve: "linear" as const };
  it("gewichtet und linear", () => expect(rechneZielbonus(z).betrag).toBe(11400));
  it("unter der Schwelle nichts", () => expect(rechneZielbonus({ ...z, ziele: [{ name: "Person", gewicht: 1, erreichung: 0.4 }] }).betrag).toBe(0));
  it("Obergrenze", () => expect(rechneZielbonus({ ...z, ziele: [{ name: "Person", gewicht: 1, erreichung: 2 }] }).betrag).toBe(15000));
  it("Stufen runden ab", () => expect(rechneZielbonus({ ...z, kurve: "stufen" }).betrag).toBe(11000));
  it("anteilig im Eintrittsjahr", () => expect(rechneZielbonus({ ...z, anteil: 0.5 }).betrag).toBe(5700));
});
