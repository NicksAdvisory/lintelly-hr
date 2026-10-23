/**
 * Vertragsbausteine der Gruppen I (Erfindungen und Arbeitsergebnisse), J (Datenschutz und IT) und K (Arbeitsmittel und Haftung).
 * Grundlage: Klauselkatalog 10.10.2026, Abschnitt 4 I bis K, Prüfregeln P-089 bis P-093 und Kombinationen K-31, K-36.
 * Kein Text hier ist Endwortlaut: Die Kanzlei gibt jede Bausteinversion frei. Alle Rechtszahlen kommen aus lib/regeln/werte.ts.
 */
import { WERTE, zahlwort } from "@/lib/regeln/werte";
import type { Baustein, Lage, Werte } from "./typen";
import { ARBEITNEHMER, MIT_AUSBILDUNG } from "./typen";
import { ergaenzungen } from "./allgemein";
import { euro, hat, ja, liste, regel, wenn, wert, zahl } from "./hilfen";

const KATALOG = (id: string) => `Katalog Abschnitt 4, Baustein ${id}`;
const GII = "https://www.gesetze-im-internet.de";
const ARBNERFG = `${GII}/arbnerfg`;
const v = (w: Werte, feld: string, standard = "") => (w[feld] ?? "").trim() || standard;
const monateDativ = (n: number) => (n === 1 ? "einem Monat" : `${zahlwort(n)} Monaten`);
const monateAkk = (n: number) => (n === 1 ? "einen Monat" : `${zahlwort(n)} Monate`);

/** I1: einzige zulässige Form einer Pauschale (P-089, K-31). Die anderen Optionen sind gesperrt und nur auswählbar, damit die Prüfung den Grund nennt. */
export const PAUSCHALE_SICHER = "nach Meldung, zusätzlich zur gesetzlichen Vergütung";
export const PAUSCHALE_VOR_MELDUNG = "im Vertrag vor der Meldung festgelegt, anstelle der gesetzlichen Vergütung";
export const PAUSCHALE_GEHALT = "mit dem Gehalt abgegolten";

/** P-090: Elemente, die der Text von I1 immer enthält. */
export const I1_PFLICHT = ["Meldung unverzüglich in Textform", "Inanspruchnahme durch Erklärung in Textform", "Vergütung nach § 9 ArbnErfG", "Geheimhaltung (§ 24)", "Fortgeltung nach Ende (§ 26)"];
/** P-091: Pflichtsatz in I4. */
export const SATZ_32A = "soweit nicht § 32a UrhG zwingend etwas anderes vorsieht";
/** P-092: Rolle mit Entwicklungsbezug. */
const ENTWICKLUNG = /entwickl|software|engineer|data|technik|developer|programm|informatik|devops|\bIT\b/i;

/** K-31: Klausel in einer freien Ergänzung, die Erfindervergütung abgilt oder ausschließt. */
const ERFINDUNG_ABGELTUNG = /(erfind|erfinder)[^.]{0,120}(abgegolten|verzicht|pauschal|keine vergütung|ohne vergütung|gehört dem arbeitgeber)/i;

/** J2: Kontrollstufen. */
const KONTROLLE_KEINE = "keine Kontrolle von Inhalten oder Verbindungsdaten";
const KONTROLLE_ANLASS = "Verbindungsdaten nur bei konkretem Verdacht, mit Beteiligung der Person";
const KONTROLLE_LAUFEND = "laufende Auswertung von Verbindungsdaten";
const KONTROLLE_TOTAL = "Einsicht in Inhalte und Verlauf jederzeit";

const kontrolleJ2 = (l: Lage) => wert(l, "J2", "kontrolle") || KONTROLLE_KEINE;

export const BAUSTEINE_IJK: Baustein[] = [
  // I1 Diensterfindungen
  {
    id: "I1", gruppe: "I", label: "Diensterfindungen", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Firmen mit technischer Entwicklung, Software mit Hardwarebezug, Produktion oder Labor.",
    felder: [
      { id: "meldestelle", label: "Stelle für Erfindungsmeldungen", typ: "text", pflicht: true, standard: "die Geschäftsführung", hinweis: "Person oder Abteilung, die Meldungen annimmt und den Eingang bestätigt." },
      { id: "pauschale", label: "Zusätzliche Erfinderprämie vereinbaren", typ: "janein", pflicht: true, standard: "nein", hinweis: "Nur zusätzlich zur gesetzlichen Vergütung. Eine Abgeltung im Gehalt oder eine feste Pauschale vor der Meldung ist unwirksam (§ 22 ArbnErfG)." },
      { id: "pauschaleZeitpunkt", label: "Art der Prämie", typ: "auswahl", pflicht: true, optionen: [PAUSCHALE_SICHER, PAUSCHALE_VOR_MELDUNG, PAUSCHALE_GEHALT], standard: PAUSCHALE_SICHER, bei: { pauschale: ["ja"] } },
      { id: "pauschaleBetrag", label: "Prämie je ordnungsgemäßer Meldung", typ: "betrag", pflicht: true, min: 0.01, bei: { pauschale: ["ja"] } },
    ],
    text: (w, k) => {
      const praemie = ja(w, "pauschale") && v(w, "pauschaleZeitpunkt", PAUSCHALE_SICHER) === PAUSCHALE_SICHER && zahl(w.pauschaleBetrag);
      const absaetze = [
        `(1) Für Erfindungen von ${k.vorname} gilt das Gesetz über Arbeitnehmererfindungen. Diensterfindungen sind patent- oder gebrauchsmusterfähige Erfindungen, die während des Arbeitsverhältnisses entstehen und aus der Tätigkeit im Betrieb hervorgehen oder maßgeblich auf dessen Erfahrungen oder Arbeiten beruhen (§ 4 ArbnErfG).`,
        `(2) ${k.vorname} meldet jede Diensterfindung unverzüglich gesondert in Textform an ${v(w, "meldestelle", "[Stelle]")} und kennzeichnet sie als Erfindungsmeldung. Die Meldung beschreibt die technische Aufgabe, ihre Lösung und das Zustandekommen der Erfindung und nennt Miterfinder (§ 5 ArbnErfG). Der Arbeitgeber bestätigt den Eingang unverzüglich in Textform. Verlangt er nicht binnen ${monateDativ(WERTE.erfindungBeanstandungMonate.wert)} nach Eingang eine Ergänzung, gilt die Meldung als ordnungsgemäß.`,
        `(3) Der Arbeitgeber kann die Diensterfindung durch Erklärung in Textform gegenüber ${k.vorname} in Anspruch nehmen oder freigeben. Gibt er sie nicht binnen ${monateDativ(WERTE.erfindungInanspruchnahmeMonate.wert)} nach Eingang der ordnungsgemäßen Meldung in Textform frei, gilt die Inanspruchnahme als erklärt (§ 6 ArbnErfG). Mit der Inanspruchnahme gehen alle vermögenswerten Rechte an der Diensterfindung auf den Arbeitgeber über (§ 7 ArbnErfG).`,
        `(4) Der Arbeitgeber meldet eine in Anspruch genommene Diensterfindung unverzüglich im Inland zur Erteilung eines Schutzrechts an, soweit das Gesetz keine Ausnahme vorsieht (§ 13 ArbnErfG). Im Ausland kann er sie anmelden; für Staaten, in denen er das nicht will, gibt er sie auf Verlangen frei (§ 14 ArbnErfG). Will er eine Anmeldung oder ein Schutzrecht aufgeben, teilt er das ${k.vorname} mit und überträgt das Recht auf Verlangen (§ 16 ArbnErfG).`,
        `(5) Für eine in Anspruch genommene Diensterfindung hat ${k.vorname} Anspruch auf eine angemessene Vergütung nach § 9 ArbnErfG. Sie richtet sich nach der wirtschaftlichen Verwertbarkeit, den Aufgaben und der Stellung im Betrieb und dem Anteil des Betriebs an der Erfindung; Grundlage sind die Richtlinien für die Vergütung von Arbeitnehmererfindungen im privaten Dienst (Vergütungsrichtlinien). Die Vergütung ist nicht mit dem Gehalt abgegolten.`,
        `(6) Art und Höhe der Vergütung werden durch Vereinbarung festgestellt. Eine Vereinbarung über die Höhe wird erst nach der Meldung der Diensterfindung geschlossen (§ 22 ArbnErfG). Kommt keine Vereinbarung zustande, setzt der Arbeitgeber die Vergütung durch begründete Erklärung in Textform fest, spätestens ${monateAkk(WERTE.erfindungFestsetzungMonate.wert)} nach Erteilung des Schutzrechts. ${k.vorname} kann der Festsetzung binnen ${monateDativ(WERTE.erfindungWiderspruchMonate.wert)} in Textform widersprechen (§ 12 ArbnErfG).`,
      ];
      if (praemie) absaetze.push(`(7) Zusätzlich zahlt der Arbeitgeber nach Eingang jeder ordnungsgemäßen Meldung einer Diensterfindung eine Prämie von ${euro(praemie)}. Die Prämie wird auf die Vergütung nach § 9 ArbnErfG nicht angerechnet.`);
      const n = absaetze.length;
      absaetze.push(
        `(${n + 1}) Vereinbarungen über Diensterfindungen, die in erheblichem Maße unbillig sind, sind unwirksam. Beide Seiten können sich darauf in Textform berufen, spätestens ${monateAkk(WERTE.erfindungUnbilligkeitMonate.wert)} nach Ende des Arbeitsverhältnisses (§ 23 ArbnErfG).`,
        `(${n + 2}) Beide Seiten halten eine gemeldete Diensterfindung geheim, solange berechtigte Belange der anderen Seite das erfordern; für eine frei gewordene Erfindung gilt das, soweit der Arbeitgeber berechtigte Belange hat (§ 24 ArbnErfG).`,
        `(${n + 3}) Die Rechte und Pflichten aus dem Gesetz über Arbeitnehmererfindungen bleiben nach Ende des Arbeitsverhältnisses bestehen (§ 26 ArbnErfG). Von den Vorschriften des Gesetzes wird nicht zu Ungunsten von ${k.vorname} abgewichen (§ 22 ArbnErfG).`,
      );
      return absaetze.join("\n");
    },
    normen: [
      "§§ 4, 5, 6, 7 ArbnErfG",
      "§ 9 ArbnErfG",
      "§ 12 ArbnErfG",
      "§§ 13, 14, 16 ArbnErfG",
      "§§ 22, 23, 24, 26 ArbnErfG",
      "Vergütungsrichtlinien für Arbeitnehmererfindungen im privaten Dienst",
    ],
    quellen: [`${ARBNERFG}/__5.html`, `${ARBNERFG}/__6.html`, `${ARBNERFG}/__9.html`, `${ARBNERFG}/__12.html`, `${ARBNERFG}/__22.html`, `${ARBNERFG}/__23.html`, `${GII}/arbnerfgrl/`, "https://www.dpma.de/patente/arbeitnehmererfindungen/", KATALOG("I1")],
    urteile: [{ az: "Linie zur Pauschalabgeltung der Erfindervergütung nur nach Meldung und in angemessener Höhe (Aktenzeichen prüfen)", kennung: "P" }],
    schutz: ["Gibt das Gesetz wieder und regelt Verfahren und optionale Prämie", "Pflicht: Meldung in Textform, Inanspruchnahme, Vergütung nach § 9, Geheimhaltung, Fortgeltung nach Ende", "Prämie nur zusätzlich zur gesetzlichen Vergütung"],
    sperren: ["„Erfindungen gehören dem Arbeitgeber, die Vergütung ist im Gehalt abgegolten“ (§ 22)", "Pauschalvergütung vor Meldung", "Verkürzung der Meldepflicht"],
    regeln: [
      regel("P-089", "sperre", "Diensterfindung: Pauschalvergütung vor Meldung oder Abgeltung im Gehalt", "§ 22 ArbnErfG", ["I1"], (l) => {
        if (!ja(l.auswahl.I1, "pauschale")) return null;
        const z = wert(l, "I1", "pauschaleZeitpunkt");
        if (z === PAUSCHALE_GEHALT) return "Erfindervergütung kann nicht mit dem Gehalt abgegolten werden. Das weicht vor der Meldung zu Lasten der Person vom Gesetz ab und ist unwirksam (§ 22 ArbnErfG). Sicher: Vergütung nach § 9 ArbnErfG, auf Wunsch zusätzlich eine Prämie nach Meldung.";
        if (z === PAUSCHALE_VOR_MELDUNG) return "Eine Pauschale anstelle der gesetzlichen Vergütung darf erst nach der Meldung vereinbart werden (§ 22 Satz 2 ArbnErfG). Sicher: Prämie nach Meldung, zusätzlich zur gesetzlichen Vergütung.";
        return null;
      }),
      regel("K-31", "sperre", "I1 mit Pauschalvergütung vor Meldung oder Verzicht auf Vergütung", "§ 22 ArbnErfG", ["I1"], (l) => {
        const f = ergaenzungen(l).find((x) => ERFINDUNG_ABGELTUNG.test(x.text));
        return f ? `In ${f.id}: Die Ergänzung schließt die Erfindervergütung aus oder gilt sie pauschal ab. Neben I1 ist das unwirksam (§ 22 ArbnErfG). Ergänzung streichen; die Vergütung richtet sich nach § 9 ArbnErfG.` : null;
      }),
      regel("P-090", "pflicht", "Diensterfindungen: Pflichtelemente im Text", "ArbnErfG", ["I1"],
        (l) => wenn(hat(l, "I1"), `Der Text von I1 enthält: ${I1_PFLICHT.join(", ")}.`)),
    ],
    stichwoerter: ["Erfindung", "Patent", "Gebrauchsmuster", "Erfindervergütung", "ArbnErfG", "Erfindungsmeldung", "Diensterfindung"],
  },
  // I2 Freie Erfindungen
  {
    id: "I2", gruppe: "I", label: "Freie Erfindungen: Mitteilung und Angebot", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Wie I1: Firmen mit technischer Entwicklung.",
    felder: [
      { id: "meldestelle", label: "Stelle für Mitteilungen", typ: "text", pflicht: true, standard: "die Geschäftsführung" },
    ],
    text: (w, k) => [
      `(1) Macht ${k.vorname} während des Arbeitsverhältnisses eine freie Erfindung, teilt ${k.vorname} sie unverzüglich in Textform ${v(w, "meldestelle", "dem Arbeitgeber")} mit. Die Mitteilung enthält so viel über die Erfindung und ihre Entstehung, dass der Arbeitgeber beurteilen kann, ob sie frei ist (§ 18 ArbnErfG). Die Pflicht entfällt, wenn die Erfindung offensichtlich im Arbeitsbereich des Betriebs nicht verwendbar ist.`,
      `(2) Bestreitet der Arbeitgeber nicht binnen ${monateDativ(WERTE.erfindungFreiMonate.wert)} nach Eingang der Mitteilung in Textform, dass die Erfindung frei ist, kann er sie nicht mehr als Diensterfindung in Anspruch nehmen.`,
      `(3) Fällt die freie Erfindung in den vorhandenen oder vorbereiteten Arbeitsbereich des Betriebs, bietet ${k.vorname} dem Arbeitgeber vor einer anderen Verwertung während des Arbeitsverhältnisses ein nicht ausschließliches Recht zur Benutzung zu angemessenen Bedingungen an. Nimmt der Arbeitgeber das Angebot nicht binnen ${monateDativ(WERTE.erfindungAnbietungMonate.wert)} an, erlischt sein Vorrecht (§ 19 ArbnErfG).`,
      `(4) Eine Pflicht, freie Erfindungen ohne Entgelt zu übertragen, besteht nicht.`,
    ].join("\n"),
    normen: ["§ 4 Abs. 3 ArbnErfG", "§ 18 ArbnErfG", "§ 19 ArbnErfG"],
    quellen: [`${ARBNERFG}/__18.html`, `${ARBNERFG}/__19.html`, KATALOG("I2")],
    schutz: ["Fristen wie im Gesetz, aus dem Register"],
    sperren: ["Pflicht, freie Erfindungen ohne Entgelt zu übertragen"],
    stichwoerter: ["freie Erfindung", "Erfindung privat", "Anbietungspflicht", "Mitteilung"],
  },
  // I3 Verbesserungsvorschläge
  {
    id: "I3", gruppe: "I", label: "Technische Verbesserungsvorschläge", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Produktion, Technik und Firmen mit Ideenmanagement.",
    felder: [
      { id: "stelle", label: "Zuständig für Vorschläge", typ: "text", pflicht: true, standard: "das Ideenmanagement" },
      { id: "praemie", label: "Prämie für einfache Vorschläge", typ: "auswahl", pflicht: true, optionen: ["einmalige Prämie nach Entscheidung im Einzelfall", "Anteil am Nutzen im ersten Jahr", "nach Betriebsvereinbarung"], standard: "einmalige Prämie nach Entscheidung im Einzelfall" },
    ],
    text: (w, k) => [
      `(1) ${k.vorname} kann technische Verbesserungsvorschläge an ${v(w, "stelle", "den Arbeitgeber")} richten. Der Eingang wird in Textform bestätigt.`,
      `(2) Qualifizierte Verbesserungsvorschläge, die dem Arbeitgeber eine ähnliche Vorzugsstellung wie ein Patent oder Gebrauchsmuster geben, vergütet der Arbeitgeber angemessen, sobald er sie verwertet (§ 20 Abs. 1 ArbnErfG). Für die Vergütung gelten § 9 und § 12 ArbnErfG entsprechend.`,
      `(3) Für einfache Verbesserungsvorschläge gilt: ${v(w, "praemie") === "nach Betriebsvereinbarung" ? "Prämien richten sich nach der Betriebsvereinbarung über das Vorschlagswesen." : v(w, "praemie").startsWith("Anteil") ? "Wird der Vorschlag umgesetzt, erhält " + k.vorname + " einen Anteil am nachweisbaren Nutzen im ersten Jahr nach der Umsetzung, den der Arbeitgeber in Textform mitteilt." : "Wird der Vorschlag umgesetzt, entscheidet der Arbeitgeber über eine einmalige Prämie und teilt die Entscheidung in Textform mit."} Tarifverträge und Betriebsvereinbarungen gehen vor (§ 20 Abs. 2 ArbnErfG).`,
      "(4) Eine Pflicht, qualifizierte Vorschläge ohne Vergütung abzutreten, besteht nicht.",
    ].join("\n"),
    normen: ["§ 20 ArbnErfG", "§ 87 Abs. 1 Nr. 12 BetrVG"],
    quellen: [`${ARBNERFG}/__20.html`, `${GII}/betrvg/__87.html`, KATALOG("I3")],
    schutz: ["Unterscheidung qualifiziert und einfach", "Verweis auf Betriebsvereinbarung, falls vorhanden"],
    sperren: ["Pflicht zur kostenlosen Abtretung qualifizierter Vorschläge"],
    stichwoerter: ["Verbesserungsvorschlag", "Ideenmanagement", "Vorschlagswesen", "Prämie", "Idee"],
  },
  // I4 Urheber- und Nutzungsrechte
  {
    id: "I4", gruppe: "I", label: "Urheberrechte und Nutzungsrechte", risiko: "grün", version: 1, fuer: ARBEITNEHMER, ersetzt: "§ 9",
    passt: "Alle Arbeitsverträge; ersetzt den festen § 9.",
    felder: [
      { id: "umfang", label: "Umfang der Rechte", typ: "auswahl", pflicht: true, optionen: ["ausschließlich, zeitlich, räumlich und inhaltlich unbeschränkt", "einfach (nicht ausschließlich), zeitlich und räumlich unbeschränkt"], standard: "ausschließlich, zeitlich, räumlich und inhaltlich unbeschränkt" },
      { id: "weitergabe", label: "Übertragung an Dritte, insbesondere Kunden", typ: "janein", pflicht: true, standard: "ja" },
      { id: "bearbeitung", label: "Bearbeitung und Umgestaltung", typ: "janein", pflicht: true, standard: "ja" },
    ],
    text: (w, k) => [
      `(1) ${k.vorname} räumt dem Arbeitgeber an allen urheberrechtlich geschützten Werken und Leistungen, die ${k.vorname} in Erfüllung der Pflichten aus dem Arbeitsverhältnis schafft (§ 43 UrhG), ${v(w, "umfang").startsWith("einfach") ? "einfache, zeitlich und räumlich unbeschränkte" : "ausschließliche, zeitlich, räumlich und inhaltlich unbeschränkte"} Nutzungsrechte für alle bekannten Nutzungsarten ein.`,
      `(2) Die Nutzungsrechte umfassen ${[v(w, "bearbeitung") === "nein" ? "" : "das Recht zur Bearbeitung und Umgestaltung", v(w, "weitergabe") === "nein" ? "" : "das Recht, sie ganz oder teilweise auf Dritte, insbesondere Kunden, zu übertragen oder Dritten Rechte einzuräumen, ohne dass es einer weiteren Zustimmung bedarf"].filter(Boolean).join(" sowie ") || "die Nutzung im Betrieb des Arbeitgebers"}.`,
      `(3) Werke, die ${k.vorname} außerhalb der Arbeitspflicht und ohne Mittel des Arbeitgebers schafft, erfasst diese Regel nicht. Rechte für unbekannte Nutzungsarten (§ 31a UrhG) bedürfen einer gesonderten schriftlichen Vereinbarung.`,
      "(4) Die eingeräumten Rechte bleiben nach Ende des Arbeitsverhältnisses beim Arbeitgeber.",
      `(5) Die Einräumung ist mit der Vergütung abgegolten, ${SATZ_32A}. Steht die Vergütung in einem auffälligen Missverhältnis zu den Erträgen aus der Nutzung, kann ${k.vorname} eine weitere angemessene Beteiligung verlangen (§ 32a UrhG).`,
      `(6) Für Computerprogramme gilt § 69b UrhG.`,
    ].join("\n"),
    normen: ["§ 43 UrhG", "§ 31 Abs. 5 UrhG", "§ 31a UrhG", "§ 32 UrhG", "§ 32a UrhG"],
    quellen: [`${GII}/urhg/__43.html`, `${GII}/urhg/__31.html`, `${GII}/urhg/__31a.html`, `${GII}/urhg/__32a.html`, KATALOG("I4")],
    schutz: ["Rechte nur an Werken, die in Erfüllung der Arbeitspflicht entstehen", "Pflichttext „soweit nicht § 32a UrhG zwingend etwas anderes vorsieht“", "Rechte bleiben nach Ende beim Arbeitgeber"],
    sperren: ["Rechteeinräumung für alle Werke, auch privat geschaffene"],
    regeln: [
      regel("P-091", "pflicht", "Nutzungsrechte: Satz zu § 32a UrhG", "§ 32a UrhG", ["I4"],
        (l) => wenn(hat(l, "I4"), "Ergänzt: Die Abgeltung der Nutzungsrechte gilt nur, soweit § 32a UrhG nichts anderes vorsieht; bei auffälligem Missverhältnis besteht Anspruch auf weitere Beteiligung.")),
    ],
    stichwoerter: ["Urheberrecht", "Nutzungsrechte", "Rechte an Arbeitsergebnissen", "Texte", "Design", "Fotos", "geistiges Eigentum"],
  },
  // I5 Software
  {
    id: "I5", gruppe: "I", label: "Software und Computerprogramme", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Entwicklung, Technik und Data Science.",
    felder: [
      { id: "openSource", label: "Einsatz von Open-Source-Komponenten", typ: "auswahl", pflicht: true, optionen: ["Freigabe vor dem Einsatz in Textform", "nur Komponenten aus der freigegebenen Liste (Anlage)"], standard: "Freigabe vor dem Einsatz in Textform" },
      { id: "dokumentation", label: "Pflicht zur Dokumentation", typ: "janein", pflicht: true, standard: "ja" },
      { id: "eigenprojekte", label: "Private Projekte", typ: "auswahl", pflicht: true, optionen: ["erlaubt, Anzeige in Textform bei Bezug zum Arbeitsgebiet", "erlaubt ohne Anzeige"], standard: "erlaubt, Anzeige in Textform bei Bezug zum Arbeitsgebiet" },
    ],
    text: (w, k) => [
      `(1) An Computerprogrammen, die ${k.vorname} in Wahrnehmung der Aufgaben oder nach Anweisung des Arbeitgebers schafft, ist ausschließlich der Arbeitgeber zur Ausübung aller vermögensrechtlichen Befugnisse berechtigt (§ 69b UrhG). Einer gesonderten Rechtseinräumung bedarf es nicht. Das gilt auch für Quellcode, Dokumentation und Entwurfsmaterial.`,
      `(2) Open-Source-Komponenten setzt ${k.vorname} ${v(w, "openSource").startsWith("nur") ? "nur aus der freigegebenen Liste in der Anlage ein" : "erst nach Freigabe des Arbeitgebers in Textform ein"} und beachtet deren Lizenzbedingungen.`,
      `(3) Quellcode wird in den Systemen des Arbeitgebers gespeichert.${v(w, "dokumentation") === "nein" ? "" : " Der Code wird so dokumentiert, dass andere ihn weiterführen können."}`,
      `(4) Programme, die ${k.vorname} außerhalb der Arbeitszeit, ohne Mittel und ohne Geschäftsgeheimnisse des Arbeitgebers und nicht in Wahrnehmung der Aufgaben schafft, stehen ${k.vorname} zu.${v(w, "eigenprojekte").startsWith("erlaubt, Anzeige") ? " Private Projekte mit Bezug zum Arbeitsgebiet zeigt " + k.vorname + " in Textform an." : ""}`,
    ].join("\n"),
    normen: ["§ 69b UrhG"],
    quellen: [`${GII}/urhg/__69b.html`, KATALOG("I5")],
    schutz: ["Erinnert, dass für Programme keine gesonderte Rechtseinräumung nötig ist", "Regelt nur Ausnahmen (Eigenprojekte)", "Open-Source-Regel als Pflicht"],
    sperren: ["Verbot jeder privaten Programmiertätigkeit"],
    regeln: [
      regel("P-092", "hinweis", "Software-Baustein bei Rolle ohne Entwicklungsbezug", "§ 69b UrhG", ["I5"],
        (l) => wenn(hat(l, "I5") && !ENTWICKLUNG.test(l.person.rolle), `Die Rolle „${l.person.rolle}“ hat keinen erkennbaren Bezug zur Softwareentwicklung. § 69b UrhG gilt nur für Programme, die in Wahrnehmung der Aufgaben entstehen. Prüfe, ob I4 genügt.`)),
    ],
    stichwoerter: ["Software", "Programm", "Quellcode", "Open Source", "Code", "Entwickler", "Nebenprojekt"],
  },
  // I6 Namensnennung und Portfolio
  {
    id: "I6", gruppe: "I", label: "Namensnennung, Bildnis und Portfolio", risiko: "gelb", version: 1, fuer: ARBEITNEHMER,
    passt: "Kreative und Beratende mit Referenzen.",
    felder: [
      { id: "nennung", label: "Nennung als Urheber:in", typ: "auswahl", pflicht: true, optionen: ["ja, bei Veröffentlichung", "nur auf Wunsch der Person", "nach Branchenübung"], standard: "ja, bei Veröffentlichung" },
      { id: "referenzArbeitgeber", label: "Arbeitgeber nennt Arbeiten als Referenz", typ: "janein", pflicht: true, standard: "ja" },
      { id: "portfolio", label: "Person darf Arbeiten im eigenen Portfolio zeigen", typ: "janein", pflicht: true, standard: "ja" },
    ],
    text: (w, k) => [
      `(1) ${v(w, "nennung").startsWith("nur") ? `${k.vorname} wird bei der Veröffentlichung eines Werks als Urheber:in genannt, wenn ${k.vorname} das wünscht.` : v(w, "nennung").startsWith("nach") ? `Ob ${k.vorname} als Urheber:in genannt wird, richtet sich nach der Übung der Branche. Das Recht auf Anerkennung der Urheberschaft (§ 13 UrhG) bleibt unberührt.` : `${k.vorname} wird bei der Veröffentlichung eines Werks als Urheber:in genannt, soweit das praktisch möglich ist.`}`,
      `(2) ${v(w, "referenzArbeitgeber") === "nein" ? "Der Arbeitgeber nennt Arbeiten von " + k.vorname + " nicht als Referenz." : "Der Arbeitgeber darf Arbeitsergebnisse als Referenz zeigen."} ${v(w, "portfolio") === "nein" ? "" : `${k.vorname} darf veröffentlichte Arbeitsergebnisse im eigenen Portfolio zeigen, ohne Geschäftsgeheimnisse und vertrauliche Kundendaten und mit Zustimmung des Kunden, wo sie nötig ist.`}`.trim(),
      `(3) Fotos, Videos und Tonaufnahmen von ${k.vorname} nutzt der Arbeitgeber nur mit gesonderter Einwilligung. Die Einwilligung ist freiwillig, nicht Teil dieses Vertrags und jederzeit für die Zukunft widerruflich. Eine Ablehnung hat keine Nachteile.`,
    ].join("\n"),
    normen: ["§ 13 UrhG", "§§ 22, 23 KUG", "Art. 6 und 7 DSGVO", "§ 26 Abs. 2 BDSG"],
    quellen: [`${GII}/urhg/__13.html`, `${GII}/kunsturhg/__22.html`, "https://eur-lex.europa.eu/eli/reg/2016/679/oj", KATALOG("I6")],
    schutz: ["Einwilligung in Bildnisse nicht im Arbeitsvertrag, sondern gesondert und widerruflich"],
    sperren: ["Einwilligung als Vertragsbestandteil (Freiwilligkeit fehlt)"],
    stichwoerter: ["Portfolio", "Referenz", "Namensnennung", "Foto", "Bild", "Website", "Credits"],
  },
  // I7 Mitgebrachte Rechte
  {
    id: "I7", gruppe: "I", label: "Mitgebrachte Rechte und fremde Geschäftsgeheimnisse", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Bei Wechsel aus der Konkurrenz oder aus einem Umfeld mit Geheimnissen.",
    felder: [
      { id: "bestehendePflichten", label: "Bestehende Pflichten aus früheren Verträgen (optional)", typ: "lang", hinweis: "Zum Beispiel nachvertragliches Wettbewerbsverbot oder Geheimhaltung beim früheren Arbeitgeber." },
    ],
    text: (w, k) => [
      `(1) ${k.vorname} nutzt und bringt keine Geschäftsgeheimnisse früherer Arbeitgeber oder Dritter in die Arbeit ein und bringt keine Unterlagen oder Daten mit, die ${k.vorname} nicht verwenden darf. Rechte Dritter an Software, Texten und anderen Werken werden beachtet.`,
      `(2) ${v(w, "bestehendePflichten") ? `Bekannt sind folgende Pflichten aus früheren Verträgen: ${v(w, "bestehendePflichten")}. Der Arbeitgeber setzt ${k.vorname} so ein, dass diese Pflichten eingehalten werden können.` : `Pflichten aus früheren Verträgen, die die Tätigkeit beschränken, teilt ${k.vorname} dem Arbeitgeber vor Beginn mit.`}`,
      "(3) Für Pflichtverletzungen gelten die gesetzlichen Regeln einschließlich der Grundsätze zur Haftung im Arbeitsverhältnis. Eine Vertragsstrafe oder eine Übernahme von Ansprüchen früherer Arbeitgeber ist nicht vereinbart.",
    ].join("\n"),
    normen: ["§§ 3, 4, 6 GeschGehG"],
    quellen: [`${GII}/geschgehg/__4.html`, `${GII}/geschgehg/__6.html`, KATALOG("I7")],
    schutz: ["Reine Pflicht zur Rücksicht, keine Vertragsstrafe"],
    sperren: ["Haftungsübernahme der Person für alle Ansprüche des früheren Arbeitgebers"],
    stichwoerter: ["früherer Arbeitgeber", "Konkurrenz", "Geschäftsgeheimnisse Dritter", "Wechsel", "Altlasten"],
  },
  // J1 Datenschutz
  {
    id: "J1", gruppe: "J", label: "Datenschutz und Information", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Alle Arbeitsverträge (heute Teil von § 16).",
    felder: [
      { id: "ansprechpartner", label: "Ansprechperson für Datenschutz (optional)", typ: "text" },
    ],
    text: (w, k) => [
      `(1) Der Arbeitgeber verarbeitet personenbezogene Daten von ${k.vorname}, soweit sie für die Begründung, Durchführung und Beendigung des Arbeitsverhältnisses erforderlich sind (§ 26 BDSG, Art. 88 DSGVO).`,
      `(2) Die Informationen nach Art. 13 DSGVO erhält ${k.vorname} gesondert.${v(w, "ansprechpartner") ? ` Ansprechperson für Datenschutzfragen ist ${v(w, "ansprechpartner")}.` : ""}`,
    ].join("\n"),
    normen: ["§ 26 BDSG", "Art. 13 DSGVO", "Art. 88 DSGVO"],
    quellen: [`${GII}/bdsg_2018/__26.html`, "https://eur-lex.europa.eu/eli/reg/2016/679/oj", KATALOG("J1")],
    schutz: ["Informationen nach Art. 13 DSGVO gesondert"],
    sperren: [],
    stichwoerter: ["Datenschutz", "DSGVO", "personenbezogene Daten", "Datenschutzinformation"],
  },
  // J2 Private Nutzung erlaubt
  {
    id: "J2", gruppe: "J", label: "Private Nutzung von Internet und E-Mail erlaubt", risiko: "gelb", version: 1, fuer: ARBEITNEHMER,
    passt: "Firmen, die private Nutzung dulden oder gestatten.",
    felder: [
      { id: "umfang", label: "Umfang", typ: "auswahl", pflicht: true, optionen: ["nur in Pausen und außerhalb der Arbeitszeit", "in geringem Umfang, ohne die Arbeit zu beeinträchtigen"], standard: "nur in Pausen und außerhalb der Arbeitszeit" },
      { id: "kanal", label: "Private E-Mails", typ: "auswahl", pflicht: true, optionen: ["nur über private Konten oder Webmail, nicht über das dienstliche Postfach", "auch über das dienstliche Postfach"], standard: "nur über private Konten oder Webmail, nicht über das dienstliche Postfach", hinweis: "Empfehlung: getrennte Postfächer. Sonst greift das Fernmeldegeheimnis für das dienstliche Postfach." },
      { id: "kontrolle", label: "Kontrolle", typ: "auswahl", pflicht: true, optionen: [KONTROLLE_KEINE, KONTROLLE_ANLASS, KONTROLLE_LAUFEND, KONTROLLE_TOTAL], standard: KONTROLLE_KEINE },
      { id: "einwilligung", label: "Getrennte Einwilligung in die Kontrolle liegt vor", typ: "janein", pflicht: true, standard: "nein", bei: { kontrolle: [KONTROLLE_ANLASS, KONTROLLE_LAUFEND, KONTROLLE_TOTAL] } },
      { id: "vertretung", label: "Abwesenheit", typ: "auswahl", pflicht: true, optionen: ["Abwesenheitsnotiz mit Vertretung, keine Weiterleitung", "Weiterleitung dienstlicher E-Mails an die Vertretung"], standard: "Abwesenheitsnotiz mit Vertretung, keine Weiterleitung" },
    ],
    text: (w, k) => {
      const kontrolle = v(w, "kontrolle", KONTROLLE_KEINE);
      const kontrollText = kontrolle === KONTROLLE_KEINE
        ? "Der Arbeitgeber kontrolliert die private Nutzung nicht, weder Inhalte noch Verbindungsdaten."
        : kontrolle === KONTROLLE_ANLASS
          ? `Verbindungsdaten werden nur bei konkretem Verdacht auf eine Pflichtverletzung oder Straftat ausgewertet, verhältnismäßig und unter Beteiligung von ${k.vorname}. Inhalte privater Nachrichten werden nicht eingesehen.`
          : `Kontrollen erfolgen nur mit gesonderter, freiwilliger Einwilligung von ${k.vorname} und nur im Rahmen der Verhältnismäßigkeit. Inhalte privater Nachrichten werden nicht eingesehen. Kanzlei prüfen.`;
      return [
        `(1) ${k.vorname} darf Internet und E-Mail privat nutzen, ${v(w, "umfang").startsWith("in geringem") ? "in geringem Umfang, wenn die Arbeit nicht beeinträchtigt wird" : "in den Pausen und außerhalb der Arbeitszeit"}. ${v(w, "kanal").startsWith("auch") ? "Private E-Mails dürfen auch über das dienstliche Postfach laufen und werden in einem eigenen Ordner „Privat“ abgelegt." : "Private E-Mails laufen nur über private Konten oder Webmail, nicht über das dienstliche Postfach."}`,
        "(2) Verboten sind rechtswidrige, pornografische, gewaltverherrlichende und diskriminierende Inhalte, das Herunterladen von Software ohne Freigabe und jede Nutzung, die die Sicherheit der Systeme gefährdet.",
        `(3) ${kontrollText}`,
        `(4) ${v(w, "vertretung").startsWith("Weiterleitung") ? `Bei Abwesenheit werden dienstliche E-Mails an die Vertretung weitergeleitet; als privat erkennbare Nachrichten werden nicht geöffnet.` : "Bei Abwesenheit richtet " + k.vorname + " eine Abwesenheitsnotiz mit Vertretung ein. Das Postfach wird nicht weitergeleitet."}`,
        `(5) Private Daten löscht ${k.vorname} vor dem Ende des Arbeitsverhältnisses. Danach löscht der Arbeitgeber verbliebene private Daten, ohne sie einzusehen.`,
        "(6) Der Arbeitgeber kann die Erlaubnis aus sachlichem Grund mit einer Ankündigung von einem Monat für die Zukunft widerrufen.",
      ].join("\n");
    },
    normen: ["TDDDG (Fernmeldegeheimnis, Stand prüfen)", "§ 26 BDSG", "Art. 88 DSGVO", "§ 87 Abs. 1 Nr. 6 BetrVG"],
    quellen: [`${GII}/ttdsg/`, `${GII}/bdsg_2018/__26.html`, `${GII}/betrvg/__87.html`, KATALOG("J2")],
    schutz: ["Regeln zu Vertretung und Einsicht werden ergänzt", "Hinweis auf getrennte Einwilligung", "Empfehlung: getrennte Postfächer oder Webmail"],
    sperren: ["Erlaubnis kombiniert mit unbegrenzter Kontrolle des Postfachs"],
    regeln: [
      regel("P-093", "warnung", "Private Nutzung erlaubt und Kontrolle ohne Einwilligung oder Verhältnismäßigkeit", "TDDDG (Stand prüfen), § 26 BDSG", ["J2"], (l) => {
        const k = kontrolleJ2(l);
        if (k === KONTROLLE_KEINE) return null;
        const ohneEinwilligung = !ja(l.auswahl.J2, "einwilligung");
        const unverhaeltnis = k === KONTROLLE_LAUFEND || k === KONTROLLE_TOTAL;
        return wenn(ohneEinwilligung || unverhaeltnis, `Bei erlaubter Privatnutzung kann das Fernmeldegeheimnis gelten. ${ohneEinwilligung ? "Für die gewählte Kontrolle fehlt die gesonderte Einwilligung der Person. " : ""}${unverhaeltnis ? "Laufende Kontrolle ist ohne konkreten Anlass kaum verhältnismäßig. " : ""}Sicher: keine Kontrolle oder nur bei konkretem Verdacht mit Beteiligung der Person.`);
      }),
      regel("K-36", "warnung", "J2 (Privatnutzung erlaubt) mit Totalüberwachung", "Fernmeldegeheimnis, TDDDG (Stand prüfen), § 26 BDSG", ["J2"],
        (l) => wenn(hat(l, "J2") && kontrolleJ2(l) === KONTROLLE_TOTAL, "Privatnutzung erlaubt und zugleich jederzeitige Einsicht in Inhalte und Verlauf: Das verletzt bei erlaubter Privatnutzung das Fernmeldegeheimnis und ist unverhältnismäßig. Entweder Privatnutzung verbieten (J3) oder Kontrolle auf konkrete Verdachtsfälle beschränken.")),
    ],
    stichwoerter: ["private Nutzung", "Internet", "E-Mail privat", "Surfen", "Postfach", "Kontrolle"],
  },
  // J3 Private Nutzung verboten
  {
    id: "J3", gruppe: "J", label: "Private Nutzung von Internet und E-Mail verboten", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Standard in vielen Firmen; heute Absatz 3 in „Datenschutz und Arbeitsmittel“.",
    felder: [
      { id: "notfall", label: "Ausnahme in Notfällen", typ: "janein", pflicht: true, standard: "ja" },
      { id: "kontrolle", label: "Kontrolle", typ: "auswahl", pflicht: true, optionen: ["nur bei konkretem Anlass, mit Beteiligung der Person", "stichprobenartig, vorher angekündigt, ohne Inhalte"], standard: "nur bei konkretem Anlass, mit Beteiligung der Person" },
    ],
    text: (w, k) => [
      `(1) Internet, E-Mail und andere Kommunikationsdienste des Arbeitgebers dienen nur dienstlichen Zwecken. Eine private Nutzung bedarf der vorherigen Zustimmung in Textform.${v(w, "notfall") === "nein" ? "" : " Kurze private Kommunikation in dringenden Fällen bleibt erlaubt."}`,
      `(2) ${v(w, "kontrolle").startsWith("stichproben") ? `Der Arbeitgeber kann die dienstliche Nutzung stichprobenartig und nach vorheriger Ankündigung kontrollieren, ohne Inhalte privater Nachrichten einzusehen.` : `Der Arbeitgeber kontrolliert die Nutzung nur bei konkretem Anlass, verhältnismäßig und unter Beteiligung von ${k.vorname}.`} Eine dauerhafte Überwachung findet nicht statt.`,
    ].join("\n"),
    normen: ["§ 26 BDSG", "Art. 88 DSGVO"],
    quellen: [`${GII}/bdsg_2018/__26.html`, KATALOG("J3")],
    schutz: ["Kontrolle nur bei konkretem Anlass und mit Beteiligung der Betroffenen"],
    sperren: ["Dauerüberwachung"],
    stichwoerter: ["private Nutzung verboten", "Internetverbot", "dienstliche E-Mail", "Kontrolle"],
  },
  // J4 BYOD
  {
    id: "J4", gruppe: "J", label: "Private Geräte für die Arbeit (BYOD)", risiko: "gelb", version: 1, fuer: ARBEITNEHMER,
    passt: "Firmen ohne eigene Geräte für alle.",
    felder: [
      { id: "sicherheit", label: "Sicherheitsstandard", typ: "mehrfach", pflicht: true, optionen: ["Verschlüsselung", "Gerätesperre mit PIN oder Biometrie", "Verwaltung mit getrenntem Arbeitsbereich"], standard: "Verschlüsselung|Gerätesperre mit PIN oder Biometrie|Verwaltung mit getrenntem Arbeitsbereich" },
      { id: "kosten", label: "Kostenerstattung", typ: "auswahl", pflicht: true, optionen: ["monatliche Pauschale", "Erstattung nach Nachweis"], standard: "monatliche Pauschale" },
      { id: "pauschale", label: "Monatliche Pauschale", typ: "betrag", pflicht: true, min: 0.01, bei: { kosten: ["monatliche Pauschale"] } },
    ],
    text: (w, k) => [
      `(1) ${k.vorname} kann freiwillig ein privates Gerät für die Arbeit nutzen. Eine Pflicht dazu besteht nicht.`,
      `(2) Auf dem Gerät gelten diese Sicherheitsvorgaben: ${(liste(w.sicherheit).length ? liste(w.sicherheit) : ["Verschlüsselung"]).join("; ")}. Dienstliche und private Daten werden getrennt gehalten.`,
      `(3) Der Arbeitgeber darf aus der Ferne nur dienstliche Daten im Arbeitsbereich löschen, nie das ganze Gerät. Auf private Daten greift er nicht zu.`,
      `(4) ${v(w, "kosten").startsWith("Erstattung") ? `Der Arbeitgeber erstattet die nachgewiesenen dienstlich veranlassten Kosten (§ 670 BGB).` : `Für die dienstliche Nutzung zahlt der Arbeitgeber eine Pauschale von ${euro(zahl(w.pauschale) ?? 0)} im Monat (§ 670 BGB).`}`,
      `(5) ${k.vorname} kann die Nutzung mit einer Ankündigung von einem Monat beenden. Bei Ende des Arbeitsverhältnisses oder der Nutzung werden dienstliche Daten gelöscht.`,
    ].join("\n"),
    normen: ["Art. 32 DSGVO", "§ 670 BGB", "§ 87 Abs. 1 Nr. 6 BetrVG"],
    quellen: ["https://eur-lex.europa.eu/eli/reg/2016/679/oj", `${GII}/bgb/__670.html`, KATALOG("J4")],
    schutz: ["Kostenerstattung Pflicht (Pauschale oder Nachweis)", "Keine Gesamtlöschung des Geräts"],
    sperren: ["Nutzung privater Geräte ohne Kostenregel", "Totalzugriff auf das Gerät"],
    stichwoerter: ["BYOD", "privates Handy", "eigenes Gerät", "Smartphone", "Laptop privat"],
  },
  // J5 Vertraulichkeit Datenschutz
  {
    id: "J5", gruppe: "J", label: "Verpflichtung auf Vertraulichkeit und Datenschutzregeln", risiko: "grün", version: 1, fuer: ARBEITNEHMER,
    passt: "Alle, die personenbezogene Daten verarbeiten.",
    felder: [
      { id: "schulung", label: "Schulung bei Beginn und regelmäßig", typ: "janein", pflicht: true, standard: "ja" },
    ],
    text: (w, k) => [
      `(1) ${k.vorname} verarbeitet personenbezogene Daten nur auf Weisung des Arbeitgebers und nur, soweit es für die Aufgaben nötig ist (Art. 29 DSGVO, Art. 32 Abs. 4 DSGVO).`,
      `(2) ${k.vorname} behandelt personenbezogene Daten vertraulich. Diese Pflicht gilt auch nach Ende des Arbeitsverhältnisses.`,
      `(3) ${v(w, "schulung") === "nein" ? "" : "Der Arbeitgeber schult zu Beginn und danach regelmäßig zum Datenschutz. "}Für Verstöße haftet ${k.vorname} nur nach den gesetzlichen Regeln und den Grundsätzen zur Haftung im Arbeitsverhältnis.`,
    ].join("\n"),
    normen: ["Art. 29 DSGVO", "Art. 32 Abs. 4 DSGVO"],
    quellen: ["https://eur-lex.europa.eu/eli/reg/2016/679/oj", KATALOG("J5")],
    schutz: ["Verpflichtung auf Weisungen und Vertraulichkeit, kein Datengeheimnis nach altem BDSG"],
    sperren: ["Haftung der Person für Verstöße ohne Verschulden"],
    stichwoerter: ["Vertraulichkeit", "Datenschutzverpflichtung", "Datengeheimnis", "Schulung Datenschutz"],
  },
  // J6 Ortung
  {
    id: "J6", gruppe: "J", label: "Ortung von Fahrzeugen und Geräten", risiko: "gelb", version: 1, fuer: ARBEITNEHMER,
    passt: "Außendienst und Logistik.",
    felder: [
      { id: "zweck", label: "Zweck", typ: "mehrfach", pflicht: true, optionen: ["Schutz vor Diebstahl und Verlust", "Fahrtenbuch", "Einsatzplanung", "Arbeitssicherheit bei Alleinarbeit"], standard: "Schutz vor Diebstahl und Verlust" },
      { id: "umfang", label: "Umfang", typ: "auswahl", pflicht: true, optionen: ["nur bei Diebstahl oder Verlust", "nur während der Arbeitszeit, in der Freizeit abschaltbar"], standard: "nur bei Diebstahl oder Verlust" },
      { id: "speicherTage", label: "Speicherdauer der Standortdaten (Tage)", typ: "zahl", pflicht: true, min: 1, hinweis: "So kurz wie für den Zweck nötig. Kanzlei prüfen." },
      { id: "betriebsvereinbarung", label: "Betriebsvereinbarung vorhanden", typ: "janein", pflicht: true, standard: "nein" },
    ],
    text: (w, k) => {
      const tage = zahl(w.speicherTage) ?? 1;
      return [
        `(1) Fahrzeuge und Geräte, die ${k.vorname} nutzt, können geortet werden, ausschließlich zu diesen Zwecken: ${(liste(w.zweck).length ? liste(w.zweck) : ["Schutz vor Diebstahl und Verlust"]).join("; ")}.`,
        `(2) ${v(w, "umfang").startsWith("nur während") ? `Die Ortung läuft nur während der Arbeitszeit. ${k.vorname} kann sie in der Freizeit abschalten.` : "Die Ortung wird nur bei Diebstahl oder Verlust aktiviert."} Eine Leistungs- und Verhaltenskontrolle findet nicht statt.`,
        `(3) Standortdaten werden nach ${tage === 1 ? "einem Tag" : `${tage} Tagen`} gelöscht, soweit sie nicht für einen konkreten Vorfall gebraucht werden. ${k.vorname} kann Auskunft über die gespeicherten Daten verlangen.${v(w, "betriebsvereinbarung") === "ja" ? " Im Übrigen gilt die Betriebsvereinbarung." : ""}`,
      ].join("\n");
    },
    normen: ["§ 26 BDSG", "Art. 15 DSGVO", "§ 87 Abs. 1 Nr. 6 BetrVG"],
    quellen: [`${GII}/bdsg_2018/__26.html`, `${GII}/betrvg/__87.html`, KATALOG("J6")],
    schutz: ["Zweckbindung", "Löschfrist im Text"],
    sperren: ["Dauerhafte Ortung bei erlaubter Privatnutzung"],
    stichwoerter: ["GPS", "Ortung", "Tracking", "Fahrzeug", "Standort", "Telematik"],
  },
  // K1 Rückgabe
  {
    id: "K1", gruppe: "K", label: "Rückgabe von Arbeitsmitteln", risiko: "grün", version: 1, fuer: MIT_AUSBILDUNG,
    passt: "Alle Verträge; heute Absatz 2 in „Datenschutz und Arbeitsmittel“.",
    felder: [
      { id: "anlage", label: "Liste der Arbeitsmittel als Anlage", typ: "janein", pflicht: true, standard: "ja" },
      { id: "zeitpunkt", label: "Rückgabe", typ: "auswahl", pflicht: true, optionen: ["bei Ende des Arbeitsverhältnisses", "bei Ende oder auf Verlangen bei Freistellung"], standard: "bei Ende oder auf Verlangen bei Freistellung" },
    ],
    text: (w, k) => [
      `(1) Arbeitsmittel, Zugangsdaten, Schlüssel und Unterlagen${v(w, "anlage") === "nein" ? "" : " nach der Liste in der Anlage"} bleiben Eigentum des Arbeitgebers. ${k.vorname} gibt sie ${v(w, "zeitpunkt").startsWith("bei Ende oder") ? "bei Ende des Arbeitsverhältnisses und auf Verlangen bei einer Freistellung" : "bei Ende des Arbeitsverhältnisses"} unaufgefordert zurück.`,
      `(2) Private Daten auf Geräten des Arbeitgebers löscht ${k.vorname} vor der Rückgabe.`,
      `(3) An Arbeitsmitteln des Arbeitgebers besteht kein Zurückbehaltungsrecht. Der Arbeitgeber behält wegen einer ausstehenden Rückgabe keine Vergütung ein.`,
    ].join("\n"),
    normen: ["§ 985 BGB", "§ 273 BGB"],
    quellen: [`${GII}/bgb/__985.html`, `${GII}/bgb/__273.html`, KATALOG("K1")],
    schutz: ["Zurückbehaltungsrecht nur an Arbeitsmitteln ausgeschlossen, nicht am Gehalt"],
    sperren: ["Zurückbehaltung des Gehalts bis zur Rückgabe"],
    stichwoerter: ["Rückgabe", "Laptop zurück", "Schlüssel", "Arbeitsmittel", "Austritt"],
  },
  // K2 Arbeitskleidung
  {
    id: "K2", gruppe: "K", label: "Arbeitskleidung und Schutzausrüstung", risiko: "grün", version: 1, fuer: MIT_AUSBILDUNG,
    passt: "Handwerk, Produktion, Pflege und Gastronomie.",
    felder: [
      { id: "dienstkleidung", label: "Vorgeschriebene Dienstkleidung", typ: "janein", pflicht: true, standard: "nein" },
      { id: "reinigung", label: "Reinigung der Dienstkleidung", typ: "auswahl", pflicht: true, optionen: ["Arbeitgeber", "Person gegen Pflegepauschale"], standard: "Arbeitgeber", bei: { dienstkleidung: ["ja"] } },
      { id: "pflegepauschale", label: "Pflegepauschale im Monat", typ: "betrag", pflicht: true, min: 0.01, bei: { dienstkleidung: ["ja"], reinigung: ["Person gegen Pflegepauschale"] } },
    ],
    text: (w, k) => {
      return [
        "(1) Persönliche Schutzausrüstung stellt der Arbeitgeber kostenlos, hält sie instand und ersetzt sie. Die Kosten des Arbeitsschutzes trägt der Arbeitgeber (§ 3 Abs. 3 ArbSchG).",
        `(2) ${k.vorname} trägt die Schutzausrüstung bei den Tätigkeiten, für die sie vorgeschrieben ist, und meldet Mängel unverzüglich.`,
        ...(ja(w, "dienstkleidung")
          ? [`(3) Die vorgeschriebene Dienstkleidung stellt der Arbeitgeber. ${v(w, "reinigung").startsWith("Person") ? `${k.vorname} reinigt sie selbst und erhält dafür eine Pauschale von ${euro(zahl(w.pflegepauschale) ?? 0)} im Monat.` : "Der Arbeitgeber reinigt sie."}`]
          : []),
      ].join("\n");
    },
    normen: ["§ 3 Abs. 3 ArbSchG", "PSA-Benutzungsverordnung"],
    quellen: [`${GII}/arbschg/__3.html`, `${GII}/psa-bv/`, KATALOG("K2")],
    schutz: ["Persönliche Schutzausrüstung stellt der Arbeitgeber kostenlos (R15)", "Dienstkleidung mit Pflegepauschale möglich"],
    sperren: ["Kosten der Schutzausrüstung auf die Person (R15)"],
    stichwoerter: ["Arbeitskleidung", "Schutzkleidung", "PSA", "Dienstkleidung", "Uniform", "Sicherheitsschuhe"],
  },
  // K3 Haftung
  {
    id: "K3", gruppe: "K", label: "Haftung und Schäden an Arbeitsmitteln", risiko: "grün", version: 1, fuer: MIT_AUSBILDUNG,
    passt: "Alle Verträge.",
    felder: [
      { id: "meldung", label: "Meldung von Schäden", typ: "auswahl", pflicht: true, optionen: ["unverzüglich in Textform", "unverzüglich mündlich und danach in Textform"], standard: "unverzüglich in Textform" },
    ],
    text: (w, k) => [
      `(1) ${k.vorname} meldet Schäden an Arbeitsmitteln und Schäden, die bei der Arbeit entstehen, ${v(w, "meldung", "unverzüglich in Textform")}.`,
      "(2) Für Schäden bei betrieblich veranlasster Tätigkeit gelten die Grundsätze des innerbetrieblichen Schadensausgleichs: Bei leichter Fahrlässigkeit besteht keine Haftung, bei mittlerer Fahrlässigkeit wird der Schaden nach den Umständen geteilt, bei grober Fahrlässigkeit und Vorsatz besteht in der Regel volle Haftung, im Einzelfall begrenzt.",
      "(3) Der Arbeitgeber trägt die Beweislast für eine Pflichtverletzung und das Verschulden (§ 619a BGB).",
    ].join("\n"),
    normen: ["Grundsätze des innerbetrieblichen Schadensausgleichs", "§ 619a BGB"],
    quellen: [`${GII}/bgb/__619a.html`, KATALOG("K3")],
    urteile: [{ az: "BAG GS 1/89", kennung: "P" }],
    schutz: ["Gibt nur Meldepflicht und das geltende Recht wieder"],
    sperren: ["Haftung ohne Verschulden (R17)"],
    stichwoerter: ["Haftung", "Schaden", "kaputt", "Fahrlässigkeit", "Laptop beschädigt", "Dienstwagen Unfall"],
  },
  // K4 Mankoabrede
  {
    id: "K4", gruppe: "K", label: "Mankoabrede und Kassenführung", risiko: "gelb", version: 1, fuer: ARBEITNEHMER,
    passt: "Kasse oder Lager mit Warenbestand, auf den die Person allein zugreift.",
    felder: [
      { id: "bereich", label: "Kasse oder Bestand", typ: "text", pflicht: true, hinweis: "Nur ein Bereich, auf den die Person allein Zugriff hat." },
      { id: "mankogeld", label: "Mankogeld im Monat", typ: "betrag", pflicht: true, min: 0.01 },
      { id: "vorgaben", label: "Vorgaben für die Kassenführung (optional)", typ: "lang" },
    ],
    text: (w, k) => {
      const geld = zahl(w.mankogeld) ?? 0;
      return [
        `(1) ${k.vorname} führt ${v(w, "bereich", "[Kasse oder Bestand]")} und hat darauf allein Zugriff. ${k.vorname} erhält dafür ein Mankogeld von ${euro(geld)} im Monat zusätzlich zur Vergütung.`,
        `(2) Für Fehlbeträge in diesem Bereich haftet ${k.vorname} auch ohne Verschulden, aber nur bis zur Höhe des Mankogelds, das für den Zeitraum gezahlt wurde, in dem der Fehlbetrag entstanden ist. Darüber hinaus gelten die gesetzlichen Regeln und die Grundsätze zur Haftung im Arbeitsverhältnis.`,
        `(3) Die Haftung nach Absatz 2 entfällt für Zeiten, in denen andere Zugriff hatten.${v(w, "vorgaben") ? ` Für die Kassenführung gilt: ${v(w, "vorgaben")}.` : ""}`,
      ].join("\n");
    },
    normen: ["§ 619a BGB", "Grundsätze zur Mankohaftung"],
    quellen: [`${GII}/bgb/__619a.html`, KATALOG("K4")],
    urteile: [{ az: "BAG, Linie zur Mankoabrede mit Mankogeld bei alleinigem Zugriff (Aktenzeichen prüfen)", kennung: "P" }],
    schutz: ["Mankoabrede nur zusammen mit Mankogeld und Begrenzung auf dessen Höhe", "Nur bei alleinigem Zugriff"],
    sperren: ["Verschuldensunabhängige Haftung ohne Mankogeld (R17)"],
    stichwoerter: ["Manko", "Kassendifferenz", "Fehlbetrag", "Kasse", "Lager", "Mankogeld"],
  },
];
