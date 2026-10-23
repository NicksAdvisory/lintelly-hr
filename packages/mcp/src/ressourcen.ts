/**
 * Ressourcen (Plan Abschnitt 2): die Rechtswerte als JSON und die Abläufe als Markdown-Vorlagen zum Lesen und Kopieren.
 */
import { REGISTER } from "@/lib/regeln/register";
import { registerQuelle } from "./antwort";
import { ABLAUF_VORLAGEN } from "./werkzeuge/ablauf";

export type Ressource = { uri: string; name: string; titel: string; beschreibung: string; mimeType: string; lesen: (heute: string) => string };

const rechtswerte: Ressource = {
  uri: "lintelly-hr://rechtswerte",
  name: "rechtswerte",
  titel: "Rechtswerte mit Quelle",
  beschreibung: "All German employment law values in the register with dated values, norm, official source, review date and status (JSON).",
  mimeType: "application/json",
  lesen: (heute) => JSON.stringify({
    stand: heute,
    herausgeber: "Lintelly, lintelly.com",
    lizenz: "Amtliche Werte frei, Zusammenstellung CC BY 4.0, Quelle: Lintelly",
    werte: REGISTER.filter((e) => e.rhythmus !== "Lintelly").map((e) => ({
      kennung: e.id, titel: e.titel, gebiet: e.gebiet, werte: e.werte, erlaeuterung: e.hinweis, naechste_pruefung: e.naechstePruefung, ...registerQuelle(e.id, heute),
    })),
  }),
};

export const RESSOURCEN: Ressource[] = [
  rechtswerte,
  ...ABLAUF_VORLAGEN.map((v): Ressource => ({
    uri: `lintelly-hr://ablauf/${v.art}`, name: `ablauf-${v.art}`, titel: `Ablauf: ${v.titel}`,
    beschreibung: `HR workflow template as Markdown: ${v.titel}.`, mimeType: "text/markdown", lesen: v.markdown,
  })),
];
