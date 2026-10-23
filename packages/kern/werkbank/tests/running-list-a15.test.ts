import { describe, expect, it } from "vitest";
import { bemLoeschdatum, WERTE } from "@/lib/regeln/werte";
import { naechstePruefungFuer } from "@/lib/regeln/register";
import { isISODate } from "@/lib/regeln/datum";

describe("Running List A15: plus Monate und Jahre bleiben im Monat", () => {
  it("BEM abgeschlossen am 29.02.: Löschdatum ist ein gültiger Tag (28.02.)", () => {
    const d = bemLoeschdatum("2028-02-29")!;
    expect(isISODate(d)).toBe(true);
    expect(d).toBe(`${2028 + WERTE.bemLoeschfrist.jahre}-02-28`);
  });
  it("Prüftermin halbjährlich ab 31.08. ist der 28.02., nicht der 3. März", () => {
    expect(naechstePruefungFuer("Rechtsprechung", "2026-08-31")).toBe("2027-02-28");
  });
});
