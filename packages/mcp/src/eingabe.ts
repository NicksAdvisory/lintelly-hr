/**
 * Eingaben der Werkzeuge als kleines JSON-Schema (die Teilmenge, die Claude und ChatGPT lesen) und ihre Prüfung.
 * Nach dem Muster von lib/werkzeuge/schema.ts der Werkbank, dazu Listen. Unbekannte Felder, falsche Typen, zu lange Texte
 * und zu lange Listen werden abgelehnt, bevor ein Rechner läuft. Freitext gibt es nur, wo ein Werkzeug Text lesen muss.
 */

export type Feld =
  | { type: "string"; description: string; enum?: readonly string[]; pattern?: string; maxLength?: number }
  | { type: "number"; description: string; minimum?: number; maximum?: number }
  | { type: "boolean"; description: string }
  | { type: "array"; description: string; items: Feld | ObjektSchema; maxItems: number };

export type ObjektSchema = { type: "object"; properties: Record<string, Feld>; required?: string[]; additionalProperties: false };
export type Schema = ObjektSchema;
export type Wert = string | number | boolean | Wert[] | { [k: string]: Wert };
export type Eingabe = Record<string, Wert>;

export const DATUM = "^\\d{4}-\\d{2}-\\d{2}$";
const STANDARD_LAENGE = 200;

export const schema = (properties: Record<string, Feld>, required: string[] = []): Schema =>
  ({ type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: false });

export const text = (description: string, extra: { enum?: readonly string[]; pattern?: string; maxLength?: number } = {}): Feld =>
  ({ type: "string", description, ...extra });
export const datum = (description: string): Feld => ({ type: "string", description: `${description} (YYYY-MM-DD)`, pattern: DATUM, maxLength: 10 });
export const zahl = (description: string, minimum?: number, maximum?: number): Feld =>
  ({ type: "number", description, ...(minimum !== undefined ? { minimum } : {}), ...(maximum !== undefined ? { maximum } : {}) });
export const janein = (description: string): Feld => ({ type: "boolean", description });
export const liste = (description: string, items: Feld | ObjektSchema, maxItems: number): Feld => ({ type: "array", description, items, maxItems });

type Ergebnis<T> = { ok: true; wert: T } | { ok: false; fehler: string };

function pruefeWert(f: Feld | ObjektSchema, v: unknown, pfad: string): Ergebnis<Wert> {
  if (f.type === "object") {
    if (typeof v !== "object" || v === null || Array.isArray(v)) return { ok: false, fehler: `${pfad} muss ein Objekt sein.` };
    return pruefeObjekt(f, v as Record<string, unknown>, `${pfad}.`);
  }
  if (f.type === "string") {
    if (typeof v !== "string") return { ok: false, fehler: `${pfad} muss Text sein.` };
    if (v.length > (f.maxLength ?? STANDARD_LAENGE)) return { ok: false, fehler: `${pfad} ist zu lang.` };
    if (f.enum && !f.enum.includes(v)) return { ok: false, fehler: `${pfad} muss einer dieser Werte sein: ${f.enum.join(", ")}` };
    if (f.pattern && !new RegExp(f.pattern).test(v)) return { ok: false, fehler: `${pfad} hat ein ungültiges Format.` };
    return { ok: true, wert: v };
  }
  if (f.type === "number") {
    if (typeof v !== "number" || !Number.isFinite(v)) return { ok: false, fehler: `${pfad} muss eine Zahl sein.` };
    if ((f.minimum !== undefined && v < f.minimum) || (f.maximum !== undefined && v > f.maximum)) return { ok: false, fehler: `${pfad} liegt außerhalb des erlaubten Bereichs.` };
    return { ok: true, wert: v };
  }
  if (f.type === "boolean") return typeof v === "boolean" ? { ok: true, wert: v } : { ok: false, fehler: `${pfad} muss true oder false sein.` };
  if (!Array.isArray(v)) return { ok: false, fehler: `${pfad} muss eine Liste sein.` };
  if (v.length > f.maxItems) return { ok: false, fehler: `${pfad} hat mehr als ${f.maxItems} Einträge.` };
  const out: Wert[] = [];
  for (const [i, x] of v.entries()) {
    const r = pruefeWert(f.items, x, `${pfad}[${i}]`);
    if (!r.ok) return r;
    out.push(r.wert);
  }
  return { ok: true, wert: out };
}

function pruefeObjekt(s: ObjektSchema, ein: Record<string, unknown>, vor = ""): Ergebnis<Eingabe> {
  for (const k of Object.keys(ein)) if (!Object.hasOwn(s.properties, k)) return { ok: false, fehler: `Unbekanntes Feld: ${vor}${k.slice(0, 40)}` };
  for (const k of s.required ?? []) if (ein[k] === undefined || ein[k] === "") return { ok: false, fehler: `Pflichtfeld fehlt: ${vor}${k}` };
  const wert: Eingabe = {};
  for (const [k, f] of Object.entries(s.properties)) {
    if (ein[k] === undefined) continue;
    const r = pruefeWert(f, ein[k], `${vor}${k}`);
    if (!r.ok) return r;
    wert[k] = r.wert;
  }
  return { ok: true, wert };
}

export function pruefeEingabe(s: Schema, roh: unknown): Ergebnis<Eingabe> {
  if (roh === undefined || roh === null) roh = {};
  if (typeof roh !== "object" || Array.isArray(roh)) return { ok: false, fehler: "Die Eingabe muss ein Objekt sein." };
  return pruefeObjekt(s, roh as Record<string, unknown>);
}
