/**
 * Bremse im Speicher (Wissen-Konzept Abschnitt 5): je Adresse 120 Aufrufe je Minute, insgesamt 1.200. claude.ai und ChatGPT rufen
 * von ihren eigenen Servern aus, viele Nutzer teilen sich also eine Adresse, deshalb großzügig je Adresse und eine Obergrenze für alle.
 * Festes Fenster: Adressen stehen höchstens 60 Sekunden im Speicher, dann wird alles geleert.
 */
export type Bremse = (adresse: string, jetzt?: number) => boolean;

export function bremse(o = { jeAdresse: 120, gesamt: 1200, fensterMs: 60_000 }): Bremse {
  let start = 0;
  let gesamt = 0;
  const je = new Map<string, number>();
  return (adresse, jetzt = Date.now()) => {
    if (jetzt - start >= o.fensterMs) { start = jetzt; gesamt = 0; je.clear(); }
    const n = je.get(adresse) ?? 0;
    if (gesamt >= o.gesamt || n >= o.jeAdresse) return false;
    gesamt++;
    je.set(adresse, n + 1);
    return true;
  };
}
