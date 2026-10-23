// Ruft ein Werkzeug so auf wie der Server: Eingabe prüfen, rechnen, Antwort zurück. Fester Tag, damit Tests nicht altern.
import { pruefeEingabe } from "../src/eingabe";
import { WERKZEUGE } from "../src/werkzeuge";

export const HEUTE = "2026-10-23";

export function rufe(name: string, eingabe: Record<string, unknown>, heute = HEUTE) {
  const w = WERKZEUGE.find((x) => x.name === name);
  if (!w) throw new Error(`Werkzeug fehlt: ${name}`);
  const e = pruefeEingabe(w.eingabe, eingabe);
  if (!e.ok) throw new Error(e.fehler);
  // Im Test darf das Ergebnis frei gelesen werden.
  return w.ausfuehren(e.wert, heute) as ReturnType<typeof w.ausfuehren> & { ergebnis: any; fallen: string[] };
}
