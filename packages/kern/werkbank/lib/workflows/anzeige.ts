import { tageWert, type Empfaenger, type Schritt } from "@/lib/workflows/kern";
import type { Ausloeser, Workflow } from "@/lib/workflows/vorlagen";

/** Lesbare Kette je Workflow für die Seite Workflows: Auslöser und Schritte mit den eingestellten Tagen. Rein. */
const REGEL: Record<string, string> = {
  "probezeit-ende": "Probezeit endet", "au-fehlt": "AU fehlt", bem: "6 Wochen krank (BEM)", "efz-ende": "Entgeltfortzahlung endet", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
  "mutterschutz-meldung": "Schwangerschaft mitgeteilt", "mutterschutz-gefaehrdung": "Gefährdungsbeurteilung offen", "urlaub-hinweis": "Resturlaub droht zu verfallen",
  mindestlohn: "Lohn unter Mindestlohn", "minijob-grenze": "Minijob über der Grenze", "minijob-mindestlohn": "Minijob unter Mindestlohn",
};
const PLAN: Record<string, string> = {
  "fragebogen-da": "Personalfragebogen fehlt", vertrag: "Vertrag nicht zurück", sofortmeldung: "Sofortmeldung", entzug: "Zugänge sperren", rueckgabe: "Rückgabe",
  "checkin-30": "Gespräch nach 30 Tagen", "checkin-90": "Gespräch nach 90 Tagen", "befristung-schrift": "Befristung nicht unterschrieben", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
};
const AN: Record<Empfaenger, string> = { hr: "HR-Leitung", gf: "Geschäftsführung", person: "Person", fuehrung: "Führungskraft", "alle-fuehrung": "alle Führungskräfte" };

export function ausloeserText(a: Ausloeser): string {
  if (a.art === "befund") return a.regeln.map((r) => REGEL[r] ?? r).join(" oder ");
  if (a.art === "plan") return a.aufgaben.map((x) => PLAN[x] ?? x).join(" oder ");
  return a.art === "lohn" ? "Abgabetag Lohn-Input" : "Lesebestätigung offen";
}

const wann = (n: number) => (n < 0 ? `${-n} ${n === -1 ? "Tag" : "Tage"} vorher` : n === 0 ? "am Tag" : `nach ${n} ${n === 1 ? "Tag" : "Tagen"}`);

export function schrittText(s: Schritt, tage: Record<string, number>): string {
  const w = s.wiederholen ? `, erinnert alle ${tageWert(s.wiederholen.alle, tage)} Tage` : "";
  return `${s.eskalation ? "Nachfassen: " : ""}${s.art === "aufgabe" ? "Aufgabe" : "Mitteilung"} an ${AN[s.an]}, ${wann(tageWert(s.ab, tage))}${w}`;
}

export const kette = (w: Workflow, tage: Record<string, number>) => w.teile.map((t) => ({ wenn: ausloeserText(t.ausloeser), dann: t.schritte.map((s) => schrittText(s, tage)) }));
