/** Reine Logik des Arbeitszeugnis-Generators. */

/**
 * Gesamtnote aus den Teilnoten 1 bis 5. Bei genau x,5 gilt die bessere Note (Wohlwollensgebot, § 109 Abs. 2 GewO):
 * 2, 2, 3, 3 ergibt 2, nicht 3.
 */
export function gesamtNote(noten: number[]) {
  const schnitt = noten.reduce((s, n) => s + n, 0) / noten.length;
  return { schnitt, note: Math.min(5, Math.max(1, Math.ceil(schnitt - 0.5))) };
}
