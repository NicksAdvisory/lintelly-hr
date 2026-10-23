/** Auszug aus lib/regeln/engine.ts der Werkbank: nur die Typen, die module/plaene.ts braucht (scripts/abgleich.mjs). */
import type { ISODate } from "./datum";

export type Kategorie = "frist" | "risiko" | "vorausschauend" | "datencheck";
export type Dringlichkeit = "ueberfaellig" | "bald" | "demnaechst" | "info";
export type Zustaendig = "gf" | "hr" | "lintelly";

export type Befund = {
  id: string;
  /** Stabile Kennung für Entscheidungen: ändert sich nicht, wenn nur das Datum korrigiert wird (HR-Tag Nr. 11). Ohne Angabe gilt die id. */
  stabilId?: string;
  regel: string;
  kategorie: Kategorie;
  personId: string | null;
  titel: string;
  /** Fälligkeit, null wenn ohne festes Datum. Gibt es eine gesetzliche Frist (frist), ist das der empfohlene Tag zum Handeln davor. */
  datum: ISODate | null;
  /** Gesetzliche oder vertragliche Deadline, wenn sie später liegt als der empfohlene Tag (datum). */
  frist?: ISODate | null;
  /** Seite, auf der der Vorgang liegt (z. B. der Vorfall oder der Ein- und Austrittsplan). */
  href?: string;
  tageBis: number | null;
  dringlichkeit: Dringlichkeit;
  rechenweg: string[];
  quelle: string;
  /** Amtliche Fundstelle zur Quelle (Gesetz, Urteil), in der Ansicht als Link. */
  quelleUrl?: string;
  vorschlag: string;
  /** true, wenn die Geschäftsführung entscheiden muss. */
  entscheidung?: boolean;
  /** Von der Ansicht gesetzt, wenn die Entscheidung schon gefallen ist. */
  entschieden?: boolean;
  /** Wer sich kümmert: Geschäftsführung entscheidet, HR-Leitung erledigt, Lintelly läuft automatisch. */
  zustaendig: Zustaendig;
  /** Sensibles Thema (Gesundheit, Schwangerschaft). Die Geschäftsführung sieht es, außer die Person hat um Verschwiegenheit gebeten. */
  vertraulich?: string;
  /** Von der Ansicht gesetzt: für die aktuelle Rolle ausgeblendet, weil die Person um Verschwiegenheit gebeten hat. */
  maskiert?: boolean;
  /** Urlaubsantrag, der bei einer Führungskraft liegen geblieben ist: an sie zurückgeben (Nick 16.10.2026). */
  zurueckAn?: { id: string; name: string };
};
