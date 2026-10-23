/**
 * "Frist merken" (Nick 10.10.2026): Regeln, die Browser und Server teilen. Ohne Imports, damit Client-Komponente,
 * Route und `node --test` dieselbe Datei nutzen.
 * Gespeichert werden nur E-Mail, ein fester Fristname je Tool, Datum und Tool. Freie Namen lässt die Liste nicht zu,
 * so landen weder Namen von Mitarbeitenden noch fremde Texte in der Bestätigungsmail.
 */
export const FRISTNAMEN = {
  "kuendigungsfrist-rechner": ["Ende des Arbeitsverhältnisses"],
  "befristung-rechner": ["Ende des befristeten Vertrags", "Spätestes Ende ohne Sachgrund"],
  "bem-pflicht-rechner": ["Wiedervorlage BEM-Prüfung"],
  "elternzeit-fristenrechner": ["Spätester Eingang des Elternzeit-Antrags", "Beginn der Elternzeit"],
  "urlaubsverfall-hinweis-generator": ["Verfall des Resturlaubs"],
  "ausgleichsabgabe-rechner": ["Anzeige und Zahlung der Ausgleichsabgabe"],
  "probezeit-rechner": ["Ende der Probezeit"],
  "mutterschutz-rechner": ["Beginn der Schutzfrist vor der Geburt"],
  "aufbewahrungsfristen-rechner": ["Ende der Aufbewahrungsfrist"],
  "entgeltfortzahlung-rechner": ["Ende der Entgeltfortzahlung"],
} as const;

export type ErinnerungsTool = keyof typeof FRISTNAMEN;
/** Props-Paar, bei dem tsc prüft, dass der Fristname zum Tool gehört. */
export type FristAngabe = { [T in ErinnerungsTool]: { tool: T; fristname: (typeof FRISTNAMEN)[T][number] } }[ErinnerungsTool];

export const VORLAEUFE = [
  { tage: 7, label: "7 Tage vorher" },
  { tage: 1, label: "1 Tag vorher" },
  { tage: 0, label: "am Tag" },
] as const;

/** E-Mail-Prüfung, auch für /api/lead. */
export const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;

/** "JJJJ-MM-TT" und ein echter Kalendertag. */
function istDatum(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
}

/** Tag, an dem die Erinnerung rausgeht: Frist minus Vorlauf in Kalendertagen. */
export function sendetag(frist: string, vorlauf: number) {
  return new Date(Date.parse(`${frist}T00:00:00Z`) - vorlauf * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Vorläufe, die für diese Frist noch gehen. Der Versand läuft einmal am Morgen, deshalb muss der Sendetag nach heute
 * liegen. Fristen weiter als 3 Jahre voraus nehmen wir nicht an. ISO-Daten lassen sich als Text vergleichen.
 */
export function moeglicheVorlaeufe(frist: string, heute: string): number[] {
  if (!istDatum(frist) || frist > `${Number(heute.slice(0, 4)) + 3}${heute.slice(4)}`) return [];
  return VORLAEUFE.map((v) => v.tage).filter((t) => sendetag(frist, t) > heute);
}

export type Erinnerung = { email: string; tool: ErinnerungsTool; fristname: string; frist: string; sendenAm: string };

export function pruefeErinnerung(b: unknown, heute: string): ({ ok: true } & Erinnerung) | { ok: false; fehler: string } {
  const x = (b ?? {}) as Record<string, unknown>;
  const email = typeof x.email === "string" ? x.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) return { ok: false, fehler: "Bitte gib eine gültige E-Mail-Adresse ein." };
  const tool = typeof x.tool === "string" && Object.hasOwn(FRISTNAMEN, x.tool) ? (x.tool as ErinnerungsTool) : null;
  if (!tool) return { ok: false, fehler: "Unbekanntes Tool." };
  const namen: readonly string[] = FRISTNAMEN[tool];
  if (typeof x.fristname !== "string" || !namen.includes(x.fristname)) return { ok: false, fehler: "Unbekannte Frist." };
  if (!istDatum(x.frist) || typeof x.vorlauf !== "number" || !moeglicheVorlaeufe(x.frist, heute).includes(x.vorlauf))
    return { ok: false, fehler: "Für dieses Datum geht keine Erinnerung mehr. Das Datum muss nach heute und höchstens 3 Jahre voraus liegen." };
  return { ok: true, email, tool, fristname: x.fristname, frist: x.frist, sendenAm: sendetag(x.frist, x.vorlauf) };
}
