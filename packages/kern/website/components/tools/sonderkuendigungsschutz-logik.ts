/** Daten und reine Logik des Sonderkündigungsschutz-Checks. */

export type Antwort = "ja" | "nein" | "unklar";
export type Stufe = "zustimmung" | "ausgeschlossen" | "pruefen";

type Schutz = {
  id: string;
  frage: string;
  hilfe: string;
  titel: string;
  grundlage: string;
  stelle: string;
  zeitraum: string;
  stufe: Stufe;
  schritte: string[];
};

export const SCHUTZ: Schutz[] = [
  {
    id: "mutterschutz",
    frage: "Ist die Person schwanger, hat sie vor höchstens 4 Monaten entbunden, ist sie noch in der Schutzfrist nach der Geburt oder hatte sie eine Fehlgeburt nach der 12. Schwangerschaftswoche?",
    hilfe: "Gilt auch, wenn du von der Schwangerschaft nichts weißt: Sie kann sie bis 2 Wochen nach Zugang der Kündigung mitteilen.",
    titel: "Mutterschutz",
    grundlage: "§ 17 MuSchG",
    stelle: "Aufsichtsbehörde für Mutterschutz des Landes (Arbeitsschutz oder Gewerbeaufsicht)",
    zeitraum: "Schwangerschaft bis Ende der Schutzfrist nach der Entbindung, mindestens 4 Monate danach; nach einer Fehlgeburt ab der 13. Woche 4 Monate",
    stufe: "zustimmung",
    schritte: [
      "Keine Kündigung und keine Vorbereitung einer Kündigung (etwa Nachfolge suchen mit Blick auf die Trennung).",
      "Nur in besonderen Fällen, die nichts mit der Schwangerschaft zu tun haben (zum Beispiel Betriebsstilllegung), vorher die Zulässigkeitserklärung der Landesbehörde beantragen.",
    ],
  },
  {
    id: "elternzeit",
    frage: "Hat die Person Elternzeit verlangt oder ist sie in Elternzeit? Oder arbeitet sie in Teilzeit, während sie Elterngeld bezieht?",
    hilfe: "Der Schutz beginnt mit dem Verlangen, frühestens 8 Wochen vor Beginn der Elternzeit, bei Elternzeit zwischen dem 3. und 8. Geburtstag frühestens 14 Wochen vorher.",
    titel: "Elternzeit",
    grundlage: "§ 18 BEEG",
    stelle: "Für den Arbeitsschutz zuständige oberste Landesbehörde oder die von ihr bestimmte Stelle",
    zeitraum: "Ab Verlangen (frühestens 8 bzw. 14 Wochen vor Beginn) bis zum Ende der Elternzeit",
    stufe: "zustimmung",
    schritte: [
      "Keine Kündigung ohne vorherige Zulässigkeitserklärung der Landesbehörde.",
      "Die Erklärung gibt es nur in besonderen Fällen, etwa bei Betriebsstilllegung oder Existenzgefährdung.",
    ],
  },
  {
    id: "pflege",
    frage: "Hat die Person eine kurzzeitige Arbeitsverhinderung, Pflegezeit oder Familienpflegezeit angekündigt oder nimmt sie diese gerade?",
    hilfe: "Kurzzeitige Arbeitsverhinderung (bis 10 Tage) gibt es in jedem Betrieb. Pflegezeit ab mehr als 15, Familienpflegezeit ab mehr als 25 Beschäftigten.",
    titel: "Pflegezeit und Familienpflegezeit",
    grundlage: "§ 5 PflegeZG, § 2 Abs. 3 FPfZG",
    stelle: "Für den Arbeitsschutz zuständige oberste Landesbehörde oder die von ihr bestimmte Stelle",
    zeitraum: "Ab Ankündigung, höchstens 12 Wochen vor dem angekündigten Beginn, bis zum Ende der Freistellung",
    stufe: "zustimmung",
    schritte: ["Keine Kündigung ohne vorherige Zulässigkeitserklärung der Landesbehörde.", "Ankündigung mit Datum dokumentieren, damit der Schutzzeitraum klar ist."],
  },
  {
    id: "betriebsrat",
    frage: "Ist die Person Mitglied im Betriebsrat, in der Jugend- und Auszubildendenvertretung oder Vertrauensperson der Schwerbehinderten? Oder ist sie in den letzten 12 Monaten aus dem Amt ausgeschieden?",
    hilfe: "Auch Ersatzmitglieder, solange sie nachrücken oder vertreten haben.",
    titel: "Amtsträger der Betriebsverfassung",
    grundlage: "§ 15 Abs. 1 KSchG, § 103 BetrVG, § 179 Abs. 3 SGB IX",
    stelle: "Betriebsrat (Zustimmung), ersatzweise Arbeitsgericht",
    zeitraum: "Während der Amtszeit und 1 Jahr nach ihrem Ende",
    stufe: "ausgeschlossen",
    schritte: [
      "Ordentliche Kündigung ist ausgeschlossen (Ausnahme: Stilllegung des Betriebs oder der Abteilung).",
      "Fristlose Kündigung nur aus wichtigem Grund und während der Amtszeit nur mit Zustimmung des Betriebsrats oder deren Ersetzung durch das Arbeitsgericht.",
      "Die 2-Wochen-Frist für die fristlose Kündigung (§ 626 Abs. 2 BGB) läuft parallel. Den Zustimmungsantrag sofort stellen.",
    ],
  },
  {
    id: "wahl",
    frage: "Ist die Person im Wahlvorstand, Wahlbewerber oder hat sie zu einer Betriebsratswahl eingeladen oder eine Wahl beglaubigt vorbereitet?",
    hilfe: "Der Schutz wirkt nach: für Wahlvorstand und Bewerber 6 Monate nach Bekanntgabe des Wahlergebnisses.",
    titel: "Betriebsratswahl",
    grundlage: "§ 15 Abs. 3, 3a, 3b KSchG, § 103 BetrVG",
    stelle: "Betriebsrat oder Arbeitsgericht (Zustimmung zur fristlosen Kündigung)",
    zeitraum: "Ab Bestellung, Aufstellung oder Einladung bis zur Bekanntgabe des Wahlergebnisses, für Wahlvorstand und Bewerber danach 6 Monate nachwirkend",
    stufe: "ausgeschlossen",
    schritte: [
      "Ordentliche Kündigung ist ausgeschlossen.",
      "Fristlose Kündigung nur aus wichtigem Grund, im Zeitraum vor der Bekanntgabe nur mit Zustimmung des Betriebsrats oder des Arbeitsgerichts.",
      "Vorfeld-Initiatoren mit beglaubigter Erklärung (§ 15 Abs. 3b KSchG) sind gegen personen- und verhaltensbedingte Kündigungen geschützt. Diesen Fall einzeln prüfen.",
    ],
  },
  {
    id: "schwerbehindert",
    frage: "Ist die Person schwerbehindert (Grad der Behinderung ab 50) oder einem schwerbehinderten Menschen gleichgestellt?",
    hilfe: "Wähle „unklar“, wenn ein Antrag läuft oder du es nicht weißt. Der Schutz kann auch ohne dein Wissen greifen.",
    titel: "Schwerbehinderung oder Gleichstellung",
    grundlage: "§§ 168 bis 175 SGB IX, § 178 Abs. 2 SGB IX",
    stelle: "Integrationsamt (Inklusionsamt) des Landes",
    zeitraum: "Ab einem Arbeitsverhältnis von mehr als 6 Monaten ohne Unterbrechung",
    stufe: "zustimmung",
    schritte: [
      "Vor der Kündigung die Zustimmung des Integrationsamts beantragen. Bei ordentlicher Kündigung soll es innerhalb eines Monats entscheiden.",
      "Die Schwerbehindertenvertretung vorher unterrichten und anhören. Ohne Anhörung ist die Kündigung unwirksam.",
      "Nach der Zustimmung die Kündigung innerhalb eines Monats zustellen. Die Kündigungsfrist beträgt mindestens 4 Wochen.",
      "Bei fristloser Kündigung den Antrag innerhalb von 2 Wochen ab Kenntnis des Grundes stellen.",
    ],
  },
  {
    id: "dsb",
    frage: "Ist die Person eure benannte Datenschutzbeauftragte, weil ihr eine benennen müsst? Oder wurde sie in den letzten 12 Monaten abberufen?",
    hilfe: "Pflicht in der Regel, wenn mindestens 20 Personen ständig mit der automatisierten Verarbeitung personenbezogener Daten beschäftigt sind. Bei freiwilliger Benennung gilt der Schutz nicht.",
    titel: "Datenschutzbeauftragte",
    grundlage: "§ 38 Abs. 2 in Verbindung mit § 6 Abs. 4 BDSG",
    stelle: "Keine Behörde. Nur Kündigung aus wichtigem Grund (§ 626 BGB)",
    zeitraum: "Während der Benennung und 1 Jahr nach dem Ende der Tätigkeit",
    stufe: "ausgeschlossen",
    schritte: ["Ordentliche Kündigung ist ausgeschlossen.", "Fristlose Kündigung nur aus wichtigem Grund und innerhalb von 2 Wochen ab Kenntnis."],
  },
  {
    id: "azubi",
    frage: "Ist die Person Auszubildende oder Auszubildender und ist die Probezeit vorbei?",
    hilfe: "Die Probezeit in der Ausbildung dauert 1 bis 4 Monate.",
    titel: "Ausbildung nach der Probezeit",
    grundlage: "§ 22 BBiG",
    stelle: "Keine Behörde. Gibt es bei der Kammer einen Schlichtungsausschuss, muss er vor einer Klage angerufen werden.",
    zeitraum: "Vom Ende der Probezeit bis zum Ende der Ausbildung",
    stufe: "ausgeschlossen",
    schritte: [
      "Ordentliche Kündigung durch den Betrieb ist ausgeschlossen.",
      "Fristlose Kündigung nur aus wichtigem Grund, schriftlich und mit Angabe der Gründe, innerhalb von 2 Wochen ab Kenntnis.",
    ],
  },
  {
    id: "beauftragte",
    frage: "Ist die Person bestellte Immissionsschutz-, Störfall-, Abfall- oder Gewässerschutzbeauftragte? Oder wurde sie in den letzten 12 Monaten abberufen?",
    hilfe: "Betrifft vor allem Betriebe mit genehmigungsbedürftigen Anlagen, Abfallerzeuger und Abwassereinleiter.",
    titel: "Betriebsbeauftragte für Umweltschutz",
    grundlage: "§§ 58, 58d BImSchG, § 60 Abs. 3 KrWG, § 66 WHG",
    stelle: "Keine Behörde. Nur Kündigung aus wichtigem Grund",
    zeitraum: "Während der Bestellung und 1 Jahr nach der Abberufung",
    stufe: "ausgeschlossen",
    schritte: ["Ordentliche Kündigung ist ausgeschlossen.", "Fristlose Kündigung nur aus wichtigem Grund."],
  },
  {
    id: "wehrdienst",
    frage: "Hat die Person einen Einberufungsbescheid erhalten oder leistet sie gerade Wehrdienst oder eine Wehrübung?",
    hilfe: "Gilt auch für den freiwilligen Wehrdienst.",
    titel: "Wehrdienst und Wehrübung",
    grundlage: "§ 2 ArbPlSchG",
    stelle: "Keine Behörde. Nur Kündigung aus wichtigem Grund",
    zeitraum: "Ab Zustellung des Einberufungsbescheids bis zum Ende des Wehrdienstes, auch während einer Wehrübung",
    stufe: "ausgeschlossen",
    schritte: ["Ordentliche Kündigung ist ausgeschlossen.", "Die Einberufung ist kein wichtiger Grund für eine fristlose Kündigung."],
  },
  {
    id: "hinweisgeber",
    frage: "Hat die Person in letzter Zeit einen Verstoß gemeldet, intern oder bei einer externen Meldestelle?",
    hilfe: "Es gibt keinen Zustimmungsvorbehalt. Aber eine Kündigung als Reaktion auf die Meldung ist verboten.",
    titel: "Hinweisgeberschutz",
    grundlage: "§ 36 HinSchG",
    stelle: "Keine Behörde. Im Streit musst du beweisen, dass die Kündigung nichts mit der Meldung zu tun hat",
    zeitraum: "Kein fester Zeitraum. Je näher die Kündigung an der Meldung liegt, desto schwerer der Nachweis",
    stufe: "pruefen",
    schritte: [
      "Den Kündigungsgrund unabhängig von der Meldung belegen: Daten, Abmahnungen, Gesprächsnotizen von vor der Meldung.",
      "Bei zeitlicher Nähe zur Meldung vor der Kündigung rechtlich prüfen lassen.",
    ],
  },
];

export type Treffer = Schutz & { antwort: Antwort; effektiv: Stufe; zusatz?: string };

export function auswerten(a: Record<string, Antwort>, sechsMonate: Antwort): Treffer[] {
  const out: Treffer[] = [];
  for (const s of SCHUTZ) {
    const ant = a[s.id];
    if (ant !== "ja" && ant !== "unklar") continue;
    let effektiv: Stufe = ant === "unklar" ? "pruefen" : s.stufe;
    let zusatz: string | undefined;
    if (s.id === "schwerbehindert") {
      if (ant === "unklar") {
        zusatz =
          "Wenn ein Antrag läuft: Der Schutz greift, wenn der Antrag mindestens 3 Wochen vor Zugang der Kündigung gestellt wurde und später positiv beschieden wird. Im Zweifel die Zustimmung vorsorglich beantragen (das Integrationsamt erteilt dann ein Negativattest, wenn sie nicht nötig ist).";
      } else if (sechsMonate === "nein") {
        effektiv = "pruefen";
        zusatz =
          "Das Arbeitsverhältnis besteht noch keine 6 Monate. Die Zustimmung des Integrationsamts ist dann nicht nötig. Die Schwerbehindertenvertretung musst du trotzdem anhören, und die Kündigung musst du dem Integrationsamt innerhalb von 4 Tagen anzeigen.";
      } else if (sechsMonate === "unklar") {
        zusatz = "Kläre, ob das Arbeitsverhältnis länger als 6 Monate ohne Unterbrechung besteht. Ab dann ist die Zustimmung Pflicht.";
      }
    } else if (ant === "unklar") {
      zusatz = "Kläre den Sachverhalt vor jeder Kündigung. Behandle den Fall bis dahin so, als bestünde der Schutz.";
    }
    out.push({ ...s, antwort: ant, effektiv, zusatz });
  }
  const rank = { zustimmung: 0, ausgeschlossen: 1, pruefen: 2 } as const;
  return out.sort((x, y) => rank[x.effektiv] - rank[y.effektiv]);
}
