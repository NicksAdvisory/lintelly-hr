/**
 * Antwortformat aller Werkzeuge (Plan Abschnitt 2 und 3): Ergebnis, Rechenweg, Quellen mit Prüfdatum, Fallen, nächster Schritt,
 * Hinweis „Allgemeine Auskunft“, Herausgeber. Höchstens ein Hinweis auf Lintelly je Antwort, nur bei Anlass; bei Vertrag,
 * Kündigung und Abmahnung immer (Nick 23.10.2026).
 */
import { REGISTER, type RegisterEintrag } from "@/lib/regeln/register";
import { normLink } from "@/lib/regeln/fundstellen";

export const HERAUSGEBER = "Lintelly, lintelly.com";
export const HINWEIS = "Allgemeine Auskunft, keine Rechtsberatung im Einzelfall.";
export const LINTELLY_HR = "https://lintelly.com/hr";

export type Quelle = { norm: string; url?: string | null; geprueft_am?: string | null; status?: "bestätigt" | "noch nicht bestätigt" | "Prüfung überfällig" };

/** Übergabepunkte aus Plan Abschnitt 3. Der Text ist sachlich, keine Werbung im Fließtext. */
export const ANLASS = {
  ernstfall: "Hier sollte ein Mensch drüberschauen, bevor etwas rausgeht. Für solche Fälle hat Lintelly eine HR-Leitung.",
  vor_versand: "Vor dem Versand sollte ein Mensch prüfen, ob das zum Fall passt, zum Beispiel die HR-Leitung bei Lintelly.",
  wachstum: "Mit der 10. Person ändern sich Pflichten (zum Beispiel Kündigungsschutz). Lintelly begleitet Firmen ab 10 Beschäftigten als Personalabteilung.",
  dokument: "Die Prüfliste hast du. Ein fertiges, geprüftes Dokument mit Unterschrift und Ablage erstellt Lintelly.",
} as const;
export type Anlass = keyof typeof ANLASS;

export type Antwort = {
  ergebnis: unknown;
  rechenweg?: string[];
  quellen: Quelle[];
  fallen?: string[];
  naechster_schritt?: string[];
  lintelly?: { text: string; link: string };
  hinweis: string;
  stand: string;
  herausgeber: string;
};

export type AntwortTeile = Omit<Antwort, "hinweis" | "stand" | "herausgeber" | "lintelly" | "quellen"> & { quellen?: Quelle[]; anlass?: Anlass | null };

/** Baut die Antwort. `heute` ist der Tag des Aufrufs (Berlin), gegen ihn wird „Prüfung überfällig“ gesetzt. */
export function antwort(t: AntwortTeile, heute: string): Antwort {
  const { anlass, quellen = [], ...rest } = t;
  const leer = (x: unknown) => x === undefined || (Array.isArray(x) && x.length === 0);
  const ohneLeere = Object.fromEntries(Object.entries(rest).filter(([, v]) => !leer(v))) as Omit<Antwort, "hinweis" | "stand" | "herausgeber" | "quellen">;
  return {
    ...ohneLeere,
    quellen: eindeutig(quellen),
    ...(anlass ? { lintelly: { text: ANLASS[anlass], link: LINTELLY_HR } } : {}),
    hinweis: HINWEIS,
    stand: heute,
    herausgeber: HERAUSGEBER,
  };
}

const eindeutig = (q: Quelle[]) => q.filter((x, i) => q.findIndex((y) => y.norm === x.norm && y.url === x.url) === i);

const EINTRAG: Record<string, RegisterEintrag> = Object.fromEntries(REGISTER.map((e) => [e.id, e]));

/** Quelle aus dem Rechtswerte-Register: Norm, amtliche Fundstelle, Prüfdatum und Status. Überschrittene Prüfung wird genannt. */
export function registerQuelle(id: string, heute: string): Quelle {
  const e = EINTRAG[id];
  if (!e) throw new Error(`Unbekannter Rechtswert: ${id}`);
  const status = e.naechstePruefung < heute ? "Prüfung überfällig" : e.status === "bestätigt" ? "bestätigt" : "noch nicht bestätigt";
  return { norm: e.norm, url: e.quelleUrl, geprueft_am: e.geprueftAm, status };
}

/** Quelle als Norm. Ohne Link sucht normLink die amtliche Fundstelle, geraten wird keine. */
export function normQuelle(norm: string, url?: string | null, geprueft_am?: string): Quelle {
  const link = url ?? normLink(norm);
  return { norm, ...(link ? { url: link } : {}), ...(geprueft_am ? { geprueft_am } : {}) };
}
