/**
 * Prompts (Plan Abschnitt 2): Einstiege, die sich wie eine Personalabteilung anfühlen. Sie fragen nach, statt zu raten, und
 * nutzen die Werkzeuge in der richtigen Reihenfolge. Argumente sind freiwillig und bleiben beim Assistenten, nicht bei uns.
 */
export type Prompt = {
  name: string;
  titel: string;
  beschreibung: string;
  argumente: { name: string; description: string; required: false }[];
  text: (a: Record<string, string>) => string;
};

const arg = (name: string, description: string) => ({ name, description, required: false as const });
const falls = (wert: string | undefined, satz: string) => (wert?.trim() ? `${satz} ${wert.trim().slice(0, 500)}` : "");

const SPIELREGELN = "Arbeite wie eine erfahrene HR-Leitung für eine kleine Firma in Deutschland: erst verstehen, dann rechnen. Frag nach, was für die Rechnung fehlt (Daten, Stunden, Brutto, Zahl der Beschäftigten, Bundesland), statt zu raten. Gib keine Namen oder Gesundheitsdaten in die Werkzeuge. Antworte mit Ergebnis, Rechenweg, Quelle mit Prüfdatum, Fallen und dem nächsten Schritt.";

export const PROMPTS: Prompt[] = [
  {
    name: "hr_sprechstunde", titel: "HR-Sprechstunde",
    beschreibung: "Open HR consultation: describe the situation, Lintelly HR asks what it needs and answers with dates, costs and sources.",
    argumente: [arg("anliegen", "What is going on, in your own words")],
    text: (a) => [SPIELREGELN, "Ich habe eine Frage zu meinen Leuten.", falls(a.anliegen, "Darum geht es:"),
      "Stell mir zuerst höchstens drei Rückfragen, wenn etwas fehlt. Nutz dann ablauf für Lagen wie Einstellung, Krankheit, Schwangerschaft oder Kündigung und die passenden Rechner."].filter(Boolean).join("\n\n"),
  },
  {
    name: "erste_einstellung", titel: "Erste Einstellung",
    beschreibung: "First hire: all steps with dates, from company number and accident insurance to the written terms of employment and the end of probation.",
    argumente: [arg("beginn", "First working day, e.g. 2026-12-01"), arg("stunden", "Hours per week"), arg("brutto", "Gross pay per month in euro")],
    text: (a) => [SPIELREGELN, "Ich stelle meine erste Mitarbeiterin oder meinen ersten Mitarbeiter ein.",
      falls(a.beginn, "Erster Arbeitstag:"), falls(a.stunden, "Stunden pro Woche:"), falls(a.brutto, "Brutto im Monat:"),
      "Ruf ablauf mit art erste_einstellung auf. Prüf danach mindestlohn_check und arbeitgeberkosten, wenn Stunden und Brutto bekannt sind, und frag nach der Branche für sofortmeldepflicht."].filter(Boolean).join("\n\n"),
  },
  {
    name: "jemand_ist_krank", titel: "Jemand ist krank",
    beschreibung: "Someone is sick: how long the employer pays, what the U1 levy refunds, when BEM is due and what to do with the eAU.",
    argumente: [arg("erster_tag", "First day of sickness, e.g. 2026-11-02"), arg("beschaeftigte", "Number of employees")],
    text: (a) => [SPIELREGELN, "Jemand aus meinem Team ist krank.", falls(a.erster_tag, "Erster Krankheitstag:"), falls(a.beschaeftigte, "Beschäftigte in der Firma:"),
      "Ruf ablauf mit art krankheit und entgeltfortzahlung auf. Frag, ob es frühere Krankheitszeiten in den letzten 12 Monaten gab (für Fortsetzungserkrankung und BEM), aber nie nach der Diagnose."].filter(Boolean).join("\n\n"),
  },
  {
    name: "kuendigung_vorbereiten", titel: "Kündigung vorbereiten",
    beschreibung: "Prepare a dismissal: notice period, latest day of receipt, special protection, form and delivery, holiday left, reference and papers. Says clearly when a human should check.",
    argumente: [arg("eintritt", "First day of employment"), arg("beschaeftigte", "Number of employees"), arg("zugang", "Planned day the notice is received")],
    text: (a) => [SPIELREGELN, "Ich will jemandem kündigen.", falls(a.eintritt, "Eintritt:"), falls(a.beschaeftigte, "Beschäftigte in der Firma:"), falls(a.zugang, "Geplanter Zugang:"),
      "Prüf zuerst sonderkuendigungsschutz_check, dann kuendigungsfrist_rechnen, dann ablauf mit art kuendigung_vorbereiten und kuendigung_pflichtangaben. Sag deutlich, dass vor dem Versand ein Mensch drüberschauen sollte."].filter(Boolean).join("\n\n"),
  },
];
