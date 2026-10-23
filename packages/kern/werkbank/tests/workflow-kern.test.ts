import { describe, expect, it } from "vitest";
import { faelligeSchritte, type Lauf, type Schritt } from "@/lib/workflows/kern";

// Workflows (Nick 21.10.2026): ein Schritt wird ab seinem Tag einmal ausgeführt, mit `wiederholen` alle N Tage bis zur Höchstzahl.
const tage = { vorlauf: 7 };
const s = (x: Partial<Schritt> & Pick<Schritt, "id" | "ab">): Schritt => ({ art: "aufgabe", an: "hr", text: () => "x", ...x });
const lauf = (erledigt: Record<string, string[]> = {}): Lauf => ({ id: "w:a", workflow: "w", schluessel: "a", personId: null, start: "2026-10-01", datum: "2026-10-20", titel: "A", status: "laeuft", erledigt, aufgaben: [] });

describe("faelligeSchritte", () => {
  it("Schritt vor seinem Tag nicht, ab seinem Tag einmal", () => {
    const sch = [s({ id: "a", ab: -2 })];
    expect(faelligeSchritte(sch, lauf(), "2026-10-17", tage)).toEqual([]);
    expect(faelligeSchritte(sch, lauf(), "2026-10-18", tage).map((x) => x.id)).toEqual(["a"]);
    expect(faelligeSchritte(sch, lauf({ a: ["2026-10-18"] }), "2026-10-25", tage)).toEqual([]);
  });
  it("Tage aus der Einstellung: ab als Name", () => {
    const sch = [s({ id: "a", ab: "-vorlauf" })];
    expect(faelligeSchritte(sch, lauf(), "2026-10-12", tage)).toEqual([]);
    expect(faelligeSchritte(sch, lauf(), "2026-10-13", tage).map((x) => x.id)).toEqual(["a"]);
  });
  it("wiederholen: alle N Tage, höchstens M-mal insgesamt", () => {
    const sch = [s({ id: "a", ab: 0, wiederholen: { alle: 3, max: 3 } })];
    expect(faelligeSchritte(sch, lauf({ a: ["2026-10-20"] }), "2026-10-22", tage)).toEqual([]);
    expect(faelligeSchritte(sch, lauf({ a: ["2026-10-20"] }), "2026-10-23", tage).map((x) => x.id)).toEqual(["a"]);
    expect(faelligeSchritte(sch, lauf({ a: ["2026-10-20", "2026-10-23", "2026-10-26"] }), "2026-10-29", tage)).toEqual([]);
  });
  it("ohne Datum zählt der Start des Laufs", () => {
    const l = { ...lauf(), datum: null };
    expect(faelligeSchritte([s({ id: "a", ab: 0 })], l, "2026-10-01", tage).map((x) => x.id)).toEqual(["a"]);
  });
  it("geschlossene Läufe tun nichts", () => {
    expect(faelligeSchritte([s({ id: "a", ab: 0 })], { ...lauf(), status: "erledigt" }, "2026-10-30", tage)).toEqual([]);
  });
  it("nie zweimal am selben Tag, auch mit 0 Tagen Abstand", () => {
    const sch = [s({ id: "a", ab: 0, wiederholen: { alle: 0, max: 5 } })];
    expect(faelligeSchritte(sch, lauf({ a: ["2026-10-20"] }), "2026-10-20", tage)).toEqual([]);
    expect(faelligeSchritte(sch, lauf({ a: ["2026-10-20"] }), "2026-10-21", tage).map((x) => x.id)).toEqual(["a"]);
  });
});
