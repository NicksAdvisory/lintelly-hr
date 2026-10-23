import { describe, expect, it } from "vitest";

/**
 * Strang 29 (11.10.2026), Bauschritte F1 und F7 aus Destillat 20: Werte für den Firmenwagen in lib/regeln/werte.ts mit Norm, Quelle und
 * Registereintrag, Vorteilsrechner rein mit festen Sollwerten (Prüfliste Abschnitt 7, Punkte 2 bis 4).
 */
import { bruchteilFuer, grundlage, type VorteilEingabe } from "@/lib/regeln/dienstwagen";
import { DIENSTWAGEN_BRUCHTEIL, WERTE } from "@/lib/regeln/werte";
import { REGISTER, erlaubteQuelle } from "@/lib/regeln/register";

const V: VorteilEingabe = { listenpreis: 40000, antrieb: "verbrenner", anschaffungAm: "2024-05-01", privat: true, methode: "pauschal", entfernungKm: 20, monat: "2026-10" };

describe("F1 Werte für den Firmenwagen", () => {
  it("Prozentsätze, Einzelbewertung, Rundung, Fristen mit Quelle", () => {
    expect(WERTE.dienstwagenPrivatProzent.wert).toBe(0.01);
  });
  it("Führerscheinkontrolle: 6 Monate als Lintelly-Standard, keine gesetzliche Frist, unbestätigt", () => {
    expect(WERTE.fuehrerscheinIntervallMonate).toMatchObject({ wert: 6, bestaetigt: false });
    expect(WERTE.fuehrerscheinIntervallMonate.quelle).toMatch(/keine gesetzliche Frist/);
    expect(WERTE.fuehrerscheinIntervallMonate.quelle).toMatch(/§ 21 .*StVG/);
  });
  it("nur sekundär belegte Werte sind vorläufig: 70.000-Euro-Grenze und Entfernungspauschale ab dem ersten km", () => {
    expect(DIENSTWAGEN_BRUCHTEIL.find((z) => z.maxListenpreis === 70000)).toMatchObject({ bestaetigt: false, anschaffungAb: "2024-01-01", anschaffungBis: "2025-06-30" });
    expect(DIENSTWAGEN_BRUCHTEIL.find((z) => z.maxListenpreis === 100000)?.bestaetigt).toBeUndefined();
  });
  it("jeder neue Wert steht im Register mit amtlicher Fundstelle; unbestätigte stehen auf Kanzlei prüfen", () => {
    const e = (id: string) => REGISTER.find((x) => x.id === id)!;
    for (const id of ["dienstwagenPrivatProzent"]) {
      expect(e(id).status, id).toBe("bestätigt");
      expect(erlaubteQuelle(e(id).quelleUrl!), id).toBe(true);
    }
    expect(e("fuehrerscheinIntervallMonate").status).toBe("Kanzlei prüfen");
    const reihen = REGISTER.filter((x) => x.id.startsWith("dienstwagenBruchteil."));
    expect(reihen.length).toBe(DIENSTWAGEN_BRUCHTEIL.length);
    expect(reihen.find((x) => x.werte[0].gueltigAb === "2024-01-01")?.status).toBe("Kanzlei prüfen");
    expect(reihen.every((x) => x.quelleUrl && erlaubteQuelle(x.quelleUrl))).toBe(true);
  });
});

describe("F7 Bruchteil des Listenpreises nach Antrieb und Anschaffung", () => {
  it("Verbrenner: ganzer Listenpreis", () => expect(bruchteilFuer({ antrieb: "verbrenner", anschaffungAm: "2026-01-10", listenpreis: 40000 })).toMatchObject({ bruchteil: 1, vorlaeufig: false }));
  it("Elektro ab 01.07.2025: ein Viertel bis 100.000 €, darüber die Hälfte", () => {
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2026-03-01", listenpreis: 99900 })).toMatchObject({ bruchteil: 0.25, vorlaeufig: false });
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2026-03-01", listenpreis: 100000 })).toMatchObject({ bruchteil: 0.25 });
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2026-03-01", listenpreis: 100100 })).toMatchObject({ bruchteil: 0.5, vorlaeufig: false });
  });
  it("Elektro mit Anschaffung 15.03.2025: Grenze 70.000 € nur vorläufig, auch über der Grenze", () => {
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2025-03-15", listenpreis: 69900 })).toMatchObject({ bruchteil: 0.25, vorlaeufig: true });
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2025-03-15", listenpreis: 75000 })).toMatchObject({ bruchteil: 0.5, vorlaeufig: true });
  });
  it("Elektro 2019 bis 2023: Grenze 60.000 €", () => {
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2022-06-01", listenpreis: 60000 })).toMatchObject({ bruchteil: 0.25, vorlaeufig: false });
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2022-06-01", listenpreis: 60100 })).toMatchObject({ bruchteil: 0.5 });
  });
  it("Hybrid 2025: CO2 höchstens 50 g ODER mindestens 80 km elektrisch", () => {
    expect(bruchteilFuer({ antrieb: "hybrid", anschaffungAm: "2025-04-01", listenpreis: 60000, co2: 60, reichweiteKm: 70 })).toMatchObject({ bruchteil: 1 });
    expect(bruchteilFuer({ antrieb: "hybrid", anschaffungAm: "2025-04-01", listenpreis: 60000, co2: 60, reichweiteKm: 85 })).toMatchObject({ bruchteil: 0.5 });
    expect(bruchteilFuer({ antrieb: "hybrid", anschaffungAm: "2025-04-01", listenpreis: 60000, co2: 45, reichweiteKm: 30 })).toMatchObject({ bruchteil: 0.5 });
  });
  it("nicht berechnet statt falsch: Hybrid ohne CO2 und Reichweite, Batterieabzug vor 2023, Elektro vor 2019", () => {
    expect(bruchteilFuer({ antrieb: "hybrid", anschaffungAm: "2025-04-01", listenpreis: 60000 }).nichtBerechnet).toMatch(/CO2/);
    expect(bruchteilFuer({ antrieb: "hybrid", anschaffungAm: "2021-04-01", listenpreis: 60000, co2: 70, reichweiteKm: 30 }).nichtBerechnet).toMatch(/Batterie/);
    expect(bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2018-04-01", listenpreis: 60000 }).nichtBerechnet).toMatch(/Batterie/);
    // Hybrid ab 2023 ohne Bedingung: kein Batterieabzug mehr, ganzer Listenpreis.
    expect(bruchteilFuer({ antrieb: "hybrid", anschaffungAm: "2023-04-01", listenpreis: 60000, co2: 70, reichweiteKm: 30 })).toMatchObject({ bruchteil: 1 });
  });
  it("nach 2030 angeschafft: im heutigen Gesetz keine Sonderregel, ganzer Listenpreis mit Hinweis", () => {
    const b = bruchteilFuer({ antrieb: "elektro", anschaffungAm: "2031-01-02", listenpreis: 40000 });
    expect(b.bruchteil).toBe(1);
    expect(b.hinweis).toMatch(/2030/);
  });
});

describe("F8 Grundlage für die Bestätigung durch das Lohnbüro", () => {
  it("ändert sich mit Listenpreis, Methode, Entfernung, nicht mit den Fahrten des Monats", () => {
    const g = grundlage(V);
    expect(grundlage({ ...V, fahrten: 12, monat: "2026-11" })).toBe(g);
    expect(grundlage({ ...V, listenpreis: 41000 })).not.toBe(g);
    expect(grundlage({ ...V, methode: "einzel" })).not.toBe(g);
    expect(grundlage({ ...V, entfernungKm: 21 })).not.toBe(g);
  });
});
