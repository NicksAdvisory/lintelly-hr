/**
 * Vertragsbausteine der Gruppen O (Abtretung, Pfändung, Aufrechnung), P (Beendigung), Q (Ausschlussfristen, Tarif,
 * Schlussbestimmungen) und S (weitere Bausteine) nach dem Klauselkatalog 10.10.2026, Abschnitt 4.
 * Prüfregeln P-096 bis P-098 und Sperrkombinationen K-26 bis K-28. Q1 ersetzt § 15, Q4 ersetzt § 17 des Arbeitsvertrags.
 * Kein Text hier ist Endwortlaut: Die Kanzlei gibt jede Bausteinversion frei. Alle Rechtszahlen kommen aus lib/regeln/werte.ts.
 */
import { WERTE, monateText, monateTextDativ, zahlwort } from "@/lib/regeln/werte";
import { formatDE, isISODate } from "@/lib/regeln/datum";
import type { Baustein, Lage } from "./typen";
import { MIT_AUSBILDUNG, OHNE_WS, ARBEITNEHMER } from "./typen";
import { euro, hat, liste, num, regel, wenn, wert, zahl } from "./hilfen";
import { findeGesperrte } from "./rot";

const ja = (s: string | undefined) => (s ?? "").trim().toLowerCase() === "ja";
const gesperrtIn = (l: Lage, id: string, rot: string) => findeGesperrte(wert(l, id, "ergaenzung")).some((r) => r.id === rot);

/* ---------- O: Abtretung, Pfändung, Aufrechnung ---------- */

const O1: Baustein = {
  id: "O1", gruppe: "O", label: "Abtretungs- und Verpfändungsverbot", risiko: "grün", version: 1,
  passt: "Für alle Arbeitsverhältnisse, um Aufwand mit Abtretungen der Vergütung zu vermeiden.",
  fuer: OHNE_WS,
  felder: [
    { id: "zustimmung", label: "Abtretung mit Zustimmung des Arbeitgebers möglich", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => [
    `(1) ${k.vorname} kann Ansprüche auf Vergütung nicht an Dritte abtreten oder verpfänden${ja(w.zustimmung) ? ", es sei denn, der Arbeitgeber stimmt in Textform zu" : ""}.`,
    "(2) Pfändungen durch Gläubiger und der gesetzliche Pfändungsschutz bleiben davon unberührt.",
  ].join("\n"),
  normen: ["§ 399 BGB", "§ 850 ZPO"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__399.html", "https://www.gesetze-im-internet.de/zpo/__850.html", "Katalog Abschnitt 4, Baustein O1"],
  schutz: ["Das Verbot gilt nicht gegenüber Pfändungen."],
  sperren: ["Verbot, das als Verbot der Pfändung formuliert ist."],
  stichwoerter: ["Abtretung", "Verpfändung", "Lohnabtretung"],
};

const O2: Baustein = {
  id: "O2", gruppe: "O", label: "Lohnpfändung: Mitwirkung", risiko: "grün", version: 1,
  passt: "Für alle Arbeitsverhältnisse.",
  fuer: OHNE_WS,
  felder: [
    { id: "mitteilung", label: "Person teilt bekannte Pfändungen mit", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => [
    ja(w.mitteilung) ? `(1) ${k.vorname} teilt dem Arbeitgeber in Textform mit, wenn ${k.vorname} von einer Pfändung oder Abtretung der Vergütung erfährt.` : "",
    "(2) Der Arbeitgeber bearbeitet Pfändungen nach den gesetzlichen Vorschriften. Eine pauschale Bearbeitungsgebühr wird nicht erhoben.",
  ].filter(Boolean).join("\n"),
  normen: ["§ 829 ZPO", "§ 850c ZPO"],
  quellen: ["https://www.gesetze-im-internet.de/zpo/__829.html", "https://www.gesetze-im-internet.de/zpo/__850c.html", "Katalog Abschnitt 4, Baustein O2"],
  urteile: [{ az: "Linie BAG zu Kosten der Lohnpfändung", kennung: "P" }],
  schutz: ["Keine pauschale Kostenumlage."],
  sperren: ["Kostenpauschale pro Pfändung."],
  stichwoerter: ["Lohnpfändung", "Pfändung", "Gläubiger", "Drittschuldner"],
};

const O3: Baustein = {
  id: "O3", gruppe: "O", label: "Aufrechnung und Abzug vom Gehalt", risiko: "grün", version: 1,
  passt: "Für alle Arbeitsverhältnisse, wenn der Arbeitgeber eigene Forderungen verrechnen will.",
  fuer: OHNE_WS,
  felder: [
    { id: "vorab", label: "Vorabinformation vor der Verrechnung", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => [
    `(1) Der Arbeitgeber kann mit eigenen Forderungen gegen die Vergütung von ${k.vorname} nur aufrechnen, soweit die Vergütung pfändbar ist.`,
    ja(w.vorab) ? `(2) Der Arbeitgeber informiert ${k.vorname} vor der Verrechnung in Textform über Grund und Höhe.` : "",
  ].filter(Boolean).join("\n"),
  normen: ["§ 394 BGB", "§ 850c ZPO"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__394.html", "Katalog Abschnitt 4, Baustein O3"],
  schutz: ["Aufrechnung nur im pfändbaren Teil."],
  sperren: ["Abzug vom unpfändbaren Gehalt."],
  stichwoerter: ["Aufrechnung", "Verrechnung", "Abzug", "Gehaltsabzug"],
};

/* ---------- P: Beendigung ---------- */

const REGELALTER = "Regelaltersgrenze der gesetzlichen Rentenversicherung";

const P1: Baustein = {
  id: "P1", gruppe: "P", label: "Ende mit Erreichen der Regelaltersgrenze", risiko: "gelb", version: 1, nass: true, befristung: true,
  passt: "Für Firmen, die das Arbeitsverhältnis mit dem Rentenalter enden lassen wollen.",
  fuer: OHNE_WS,
  felder: [
    { id: "grenze", label: "Altersgrenze", typ: "auswahl", optionen: [REGELALTER], standard: REGELALTER, pflicht: true, hinweis: "Eine frühere Altersgrenze bietet Lintelly nicht an." },
    { id: "weiter", label: "Weiterbeschäftigung danach möglich", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => [
    `(1) Das Arbeitsverhältnis endet, ohne dass es einer Kündigung bedarf, mit Ablauf des Monats, in dem ${k.vorname} die Regelaltersgrenze der gesetzlichen Rentenversicherung erreicht.`,
    ja(w.weiter) ? "(2) Beide Seiten können den Zeitpunkt der Beendigung während des Arbeitsverhältnisses durch Vereinbarung hinausschieben, auch mehrfach (§ 41 Satz 3 SGB VI)." : "",
    "Diese Vereinbarung bedarf der Schriftform.",
  ].filter(Boolean).join("\n"),
  normen: ["§ 41 SGB VI", "§ 14 TzBfG", "AGG"],
  quellen: ["https://www.gesetze-im-internet.de/sgb_6/__41.html", "https://www.gesetze-im-internet.de/tzbfg/__14.html", "Katalog Abschnitt 4, Baustein P1"],
  urteile: [{ az: "Linie BAG zur Altersgrenze bei Regelaltersgrenze", kennung: "P" }],
  schutz: ["Nur Regelaltersgrenze wählbar.", "Schriftform, Signatur Original."],
  sperren: ["Altersgrenze vor dem Regelrentenalter."],
  stichwoerter: ["Altersgrenze", "Rente", "Rentenalter", "Ruhestand"],
};

const P2: Baustein = {
  id: "P2", gruppe: "P", label: "Freistellung nach Kündigung", risiko: "gelb", version: 1,
  passt: "Für Fach- und Führungskräfte, Vertrieb und Positionen mit Zugang zu Geheimnissen.",
  fuer: OHNE_WS,
  felder: [
    { id: "gruende", label: "Gründe", typ: "mehrfach", optionen: ["nach Ausspruch einer Kündigung", "bei Abschluss eines Aufhebungsvertrags", "bei Verdacht auf Tätigkeit für einen Wettbewerber", "bei schwerem Vertrauensverlust"], standard: "nach Ausspruch einer Kündigung", pflicht: true },
    { id: "art", label: "Art der Freistellung", typ: "auswahl", optionen: ["unwiderruflich", "widerruflich"], standard: "unwiderruflich", pflicht: true },
    { id: "urlaub", label: "Resturlaub wird angerechnet", typ: "janein", standard: "ja", bei: { art: ["unwiderruflich"] }, hinweis: "Urlaub lässt sich nur in einer unwiderruflichen Freistellung anrechnen." },
    { id: "ueberstunden", label: "Guthaben aus Überstunden wird angerechnet", typ: "janein", standard: "ja" },
    { id: "verdienst", label: "Anderweitiger Verdienst wird angerechnet", typ: "janein", standard: "ja" },
    { id: "rueckgabe", label: "Rückgabe von Arbeitsmitteln bei Freistellung", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => {
    const unwider = w.art !== "widerruflich";
    return [
      `(1) Der Arbeitgeber kann ${k.vorname} ${liste(w.gruende).join(", ") || "nach Ausspruch einer Kündigung"} bis zum Ende des Arbeitsverhältnisses ${unwider ? "unwiderruflich" : "widerruflich"} von der Arbeit freistellen, wenn sein Interesse an der Freistellung das Interesse an der Beschäftigung überwiegt.`,
      "(2) Während der Freistellung zahlt der Arbeitgeber die Vergütung weiter, einschließlich der variablen Bestandteile im Durchschnitt.",
      unwider && ja(w.urlaub) ? `(3) Mit der unwiderruflichen Freistellung wird der Resturlaub gewährt; die Freistellung erfolgt zunächst unter Anrechnung des Urlaubs. Der Arbeitgeber legt die Lage des Urlaubs in der Erklärung fest.` : "",
      ja(w.ueberstunden) ? "Ein Guthaben aus Überstunden wird mit der Freistellung ausgeglichen." : "",
      ja(w.verdienst) ? `Was ${k.vorname} während der Freistellung durch anderweitige Arbeit verdient, wird nach § 615 Satz 2 BGB angerechnet.` : "",
      ja(w.rueckgabe) ? `${k.vorname} gibt auf Verlangen Arbeitsmittel zurück; für einen Dienstwagen mit privater Nutzung gilt die Regel zum Dienstwagen.` : "",
    ].filter(Boolean).join("\n");
  },
  normen: ["§ 106 GewO", "§ 615 BGB", "§ 11 KSchG", "§ 7 Abs. 1 BUrlG"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__615.html", "https://www.gesetze-im-internet.de/burlg/__7.html", "Katalog Abschnitt 4, Baustein P2"],
  urteile: [{ az: "BAG Großer Senat zum Beschäftigungsanspruch", kennung: "P" }, { az: "Linie BAG zur Freistellungsklausel", kennung: "P" }],
  schutz: ["Gründe benannt.", "Vergütung läuft weiter, auch variable Anteile.", "Dienstwagen nach D24."],
  sperren: ["Freistellung ohne Fortzahlung.", "Freistellung in der Berufsausbildung.", "Widerruf der Dienstwagennutzung ohne wirksamen Vorbehalt."],
  stichwoerter: ["Freistellung", "Garden Leave", "Kündigung", "Resturlaub"],
};

const P3: Baustein = {
  id: "P3", gruppe: "P", label: "Verlängerte Kündigungsfristen", risiko: "grün", version: 1,
  passt: "Für Fach- und Führungskräfte, bei denen beide Seiten mehr Vorlauf wollen.",
  fuer: OHNE_WS,
  felder: [
    { id: "fristMonate", label: "Kündigungsfrist des Arbeitgebers in Monaten", typ: "zahl", pflicht: true, min: 1 },
    { id: "fristPersonMonate", label: "Kündigungsfrist der Person in Monaten", typ: "zahl", pflicht: true, min: 1, hinweis: "Nie länger als die Frist des Arbeitgebers." },
    { id: "termin", label: "Kündigungstermin", typ: "auswahl", optionen: ["zum Monatsende", "zum Quartalsende"], standard: "zum Monatsende", pflicht: true },
  ],
  text: (w, k) => {
    const ag = zahl(w.fristMonate) ?? 0;
    const pe = zahl(w.fristPersonMonate) ?? ag;
    const termin = w.termin || "zum Monatsende";
    return [
      `(1) Nach der Probezeit kann der Arbeitgeber mit einer Frist von ${monateTextDativ(ag)} ${termin} kündigen, ${k.vorname} mit einer Frist von ${monateTextDativ(pe)} ${termin}.`,
      "(2) Verlängert sich die Frist für den Arbeitgeber nach dem Gesetz, gilt die längere gesetzliche Frist für den Arbeitgeber; für die Person darf keine längere Frist gelten als für den Arbeitgeber (§ 622 BGB).",
    ].join("\n");
  },
  normen: ["§ 622 Abs. 5 BGB", "§ 622 Abs. 6 BGB", "§ 624 BGB"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__622.html", "https://www.gesetze-im-internet.de/bgb/__624.html", "Katalog Abschnitt 4, Baustein P3"],
  schutz: ["Beidseitig; die Frist der Person ist nie länger als die des Arbeitgebers."],
  sperren: ["Längere Frist nur für die Person (R14)."],
  stichwoerter: ["Kündigungsfrist", "verlängerte Frist", "Quartalsende"],
  regeln: [
    regel("P-098", "sperre", "Kündigungsfrist der Person länger als die des Arbeitgebers", "§ 622 Abs. 6 BGB (R14)", ["P3"], (l) => {
      const ag = num(l, "P3", "fristMonate");
      const pe = num(l, "P3", "fristPersonMonate");
      return wenn(ag !== null && pe !== null && pe > ag, `Die Person hätte ${monateText(pe ?? 0)} Frist, der Arbeitgeber nur ${monateText(ag ?? 0)}. Für die Person darf keine längere Frist gelten. Sicher: gleiche Frist für beide Seiten.`);
    }),
    regel("K-28", "sperre", "Verlängerte Kündigungsfrist nur für die Person", "§ 622 Abs. 6 BGB (R14)", ["P3"], (l) => {
      const nurPerson = hat(l, "P3") && num(l, "P3", "fristMonate") === null && num(l, "P3", "fristPersonMonate") !== null;
      return wenn(nurPerson || gesperrtIn(l, "P3", "R14"), "Eine verlängerte Frist nur für die Person ist unwirksam. Die Frist gilt für beide Seiten, trage auch die Frist des Arbeitgebers ein.");
    }),
  ],
};

const P4: Baustein = {
  id: "P4", gruppe: "P", label: "Zeugnis, Arbeitspapiere, Meldung als arbeitsuchend", risiko: "grün", version: 1,
  passt: "Für alle Arbeitsverhältnisse als Hinweis zum Ende.",
  fuer: OHNE_WS,
  felder: [
    { id: "zwischenzeugnis", label: "Zwischenzeugnis auf Wunsch bei triftigem Grund", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => [
    `(1) ${k.vorname} erhält bei Ende des Arbeitsverhältnisses ein schriftliches Zeugnis, auf Wunsch ein qualifiziertes Zeugnis über Leistung und Verhalten (§ 109 GewO).${ja(w.zwischenzeugnis) ? " Bei einem triftigen Grund gibt es auf Wunsch ein Zwischenzeugnis." : ""}`,
    "(2) Der Arbeitgeber händigt die Arbeitspapiere und eine Bescheinigung über den im Kalenderjahr gewährten Urlaub aus (§ 6 BUrlG).",
    `(3) Hinweis: Wer arbeitsuchend wird, muss sich spätestens ${monateText(WERTE.arbeitsuchendMeldung.monate)} vor dem Ende bei der Agentur für Arbeit melden; liegen zwischen Kenntnis und Ende weniger als ${monateText(WERTE.arbeitsuchendMeldung.monate)}, innerhalb von ${zahlwort(WERTE.arbeitsuchendMeldung.tage)} Tagen nach Kenntnis (§ 38 SGB III).`,
  ].join("\n"),
  normen: ["§ 109 GewO", "§ 38 SGB III", "§ 2 Abs. 2 SGB III", "§ 6 BUrlG"],
  quellen: ["https://www.gesetze-im-internet.de/gewo/__109.html", "https://www.gesetze-im-internet.de/sgb_3/__38.html", "Katalog Abschnitt 4, Baustein P4"],
  schutz: ["Nur Hinweise, keine Pflichten der Person über das Gesetz hinaus."],
  sperren: ["Zeugnisverzicht im Voraus (R7)."],
  stichwoerter: ["Zeugnis", "Arbeitszeugnis", "Arbeitspapiere", "arbeitsuchend", "Agentur für Arbeit"],
};

/* ---------- Q: Ausschlussfristen, Tarif, Betriebsvereinbarungen, Schlussbestimmungen ---------- */

const MIN_AUSSCHLUSS = WERTE.ausschlussfristMonate.wert;

const Q1: Baustein = {
  id: "Q1", gruppe: "Q", label: "Ausschlussfrist", risiko: "grün", version: 1, ersetzt: "§ 15",
  passt: "Standard für alle Verträge: Ansprüche werden zügig geklärt.",
  fuer: MIT_AUSBILDUNG,
  felder: [
    { id: "dauerMonate", label: "Frist der ersten Stufe in Monaten ab Fälligkeit", typ: "zahl", pflicht: true, min: MIN_AUSSCHLUSS, standard: String(MIN_AUSSCHLUSS) },
    { id: "stufen", label: "Stufen", typ: "auswahl", optionen: ["zweistufig", "einstufig"], standard: "zweistufig", pflicht: true },
    { id: "zweiteMonate", label: "Frist der zweiten Stufe (Klage) in Monaten", typ: "zahl", min: MIN_AUSSCHLUSS, standard: String(MIN_AUSSCHLUSS), bei: { stufen: ["zweistufig"] } },
  ],
  text: (w) => {
    const m = zahl(w.dauerMonate) ?? MIN_AUSSCHLUSS;
    const z = zahl(w.zweiteMonate) ?? MIN_AUSSCHLUSS;
    const reaktion = zahlwort(WERTE.ausschlussfristMonate.zweiteStufeWochen);
    const zweite = w.stufen === "einstufig" ? "" : ` Lehnt die andere Seite den Anspruch ab oder äußert sie sich nicht innerhalb von ${reaktion} Wochen nach der Geltendmachung, verfällt er, wenn er nicht innerhalb von weiteren ${monateTextDativ(z)} gerichtlich geltend gemacht wird.`;
    return [
      `(1) Ansprüche beider Seiten aus dem Arbeitsverhältnis und solche, die damit zusammenhängen, verfallen, wenn sie nicht innerhalb von ${monateTextDativ(m)} nach Fälligkeit in Textform gegenüber der anderen Seite geltend gemacht werden.${zweite}`,
      "(2) Die Fristen gelten nicht für Ansprüche auf den gesetzlichen Mindestlohn, für Haftung wegen Vorsatzes oder grober Fahrlässigkeit, für Schäden aus der Verletzung von Leben, Körper oder Gesundheit und für Ansprüche, die nach dem Gesetz nicht ausgeschlossen werden können.",
    ].join("\n");
  },
  normen: ["§ 3 MiLoG", "§ 202 BGB", "§ 309 Nr. 7 BGB", "§ 309 Nr. 13 BGB", "§ 307 BGB", "§ 12 EFZG"],
  quellen: ["https://www.gesetze-im-internet.de/milog/__3.html", "https://www.gesetze-im-internet.de/bgb/__309.html", "https://www.gesetze-im-internet.de/bgb/__202.html", "Katalog Abschnitt 4, Baustein Q1"],
  urteile: [{ az: "BAG 5 AZR 572/04", kennung: "P" }, { az: "BAG 5 AZR 52/05", kennung: "P" }, { az: "BAG 9 AZR 162/18", kennung: "B" }],
  schutz: ["Dauer mindestens der Wert aus dem Register.", "Nur Textform.", "Gilt für beide Seiten.", "Ausnahmen für Mindestlohn, Vorsatz, Leben, Körper und Gesundheit und nicht ausschließbare Ansprüche stehen immer im Text."],
  sperren: ["Schriftform für die Geltendmachung (R6).", "Frist unter dem Mindestwert (R6).", "Ohne Ausnahme für Mindestlohn (R6)."],
  stichwoerter: ["Ausschlussfrist", "Verfallfrist", "Verfall", "Verfallklausel"],
  regeln: [
    regel("P-096", "sperre", "Ausschlussfrist zu kurz, ohne Pflichtausnahmen oder mit Schriftform", `${WERTE.ausschlussfristRecht.quelle} (R6)`, ["Q1"], (l) => {
      if (!hat(l, "Q1")) return null;
      const m = num(l, "Q1", "dauerMonate");
      const z = wert(l, "Q1", "stufen") === "einstufig" ? null : num(l, "Q1", "zweiteMonate");
      if ((m !== null && m < MIN_AUSSCHLUSS) || (z !== null && z < MIN_AUSSCHLUSS)) return `Jede Stufe der Ausschlussfrist braucht mindestens ${monateText(MIN_AUSSCHLUSS)}. Kürzere Fristen machen die ganze Klausel unwirksam.`;
      return wenn(/schriftlich|schriftform|ohne (die )?ausnahme|nur für (den arbeitnehmer|die person|ansprüche der person)/i.test(wert(l, "Q1", "ergaenzung")), "Die Ergänzung verlangt Schriftform, streicht Ausnahmen oder macht die Frist einseitig. Erlaubt ist nur Textform, für beide Seiten und mit allen Ausnahmen.");
    }),
    regel("K-26", "sperre", "Ausschlussfrist ohne Mindestlohn- und Vorsatzausnahme, unter dem Mindestwert oder mit Schriftform", "§ 3 MiLoG, § 202 BGB, § 309 Nr. 13 BGB (R6)", ["Q1"],
      (l) => wenn(hat(l, "Q1") && gesperrtIn(l, "Q1", "R6"), `Die Ergänzung in Q1 enthält eine gesperrte Form der Ausschlussfrist. Sicher: Textform, beidseitig, mindestens ${monateText(MIN_AUSSCHLUSS)}, mit Ausnahme für Mindestlohn und Vorsatz.`)),
  ],
};

const Q2: Baustein = {
  id: "Q2", gruppe: "Q", label: "Bezugnahme auf einen Tarifvertrag", risiko: "gelb", version: 1, ersetzt: "§ 14",
  passt: "Für tarifgebundene und tarifnahe Firmen.",
  fuer: MIT_AUSBILDUNG,
  felder: [
    { id: "tarifvertrag", label: "Tarifvertrag (genaue Bezeichnung)", typ: "text", pflicht: true, hinweis: "Nie „der jeweils einschlägige Tarifvertrag“." },
    { id: "fassung", label: "Fassung (Datum)", typ: "text", pflicht: true },
    { id: "art", label: "Art der Bezugnahme", typ: "auswahl", optionen: ["dynamisch", "statisch"], standard: "dynamisch", pflicht: true, hinweis: "Dynamisch folgt jeder neuen Fassung, statisch bleibt beim genannten Stand. Bei Tarifwechsel oder Firmentarif Kanzlei prüfen." },
    { id: "umfang", label: "Umfang", typ: "auswahl", optionen: ["vollständig", "nur einzelne Teile"], standard: "vollständig", pflicht: true },
    { id: "teile", label: "Welche Teile", typ: "text", pflicht: true, bei: { umfang: ["nur einzelne Teile"] } },
  ],
  text: (w, k) => [
    `(1) Auf das Arbeitsverhältnis findet ${w.umfang === "nur einzelne Teile" ? `mit folgenden Teilen (${w.teile || "[Teile]"}) ` : ""}der ${w.tarifvertrag || "[Tarifvertrag]"} ${w.art === "statisch" ? `in der Fassung vom ${w.fassung || "[Datum]"}` : `in seiner jeweils geltenden Fassung, derzeit in der Fassung vom ${w.fassung || "[Datum]"},`} Anwendung.`,
    `(2) Diese Bezugnahme gilt auch dann, wenn der Arbeitgeber nicht oder nicht mehr tarifgebunden ist. Günstigere Vereinbarungen in diesem Vertrag zugunsten von ${k.vorname} gehen vor.`,
  ].join("\n"),
  normen: ["§ 2 Abs. 1 Satz 2 Nr. 15 NachwG", "§ 3 TVG", "§ 4 TVG", "§ 305c BGB", "§ 307 BGB"],
  quellen: ["https://www.gesetze-im-internet.de/nachwg/__2.html", "https://www.gesetze-im-internet.de/tvg/__4.html", "Katalog Abschnitt 4, Baustein Q2"],
  urteile: [{ az: "BAG 4 AZR 652/05", kennung: "P" }],
  schutz: ["Tarifvertrag und Fassung genannt.", "Wahl dynamisch oder statisch mit Hinweis auf die Folgen."],
  sperren: ["Verweis auf „den jeweils einschlägigen Tarifvertrag“ ohne Bezeichnung.", "Verweis auf nicht vorliegende Regelwerke."],
  stichwoerter: ["Tarifvertrag", "Tarif", "Bezugnahmeklausel", "dynamisch"],
};

const Q3: Baustein = {
  id: "Q3", gruppe: "Q", label: "Betriebsvereinbarungen und Richtlinien", risiko: "grün", version: 1, ersetzt: "§ 14",
  passt: "Für Firmen mit Betriebsrat oder internen Richtlinien (Reisekosten, Homeoffice).",
  fuer: MIT_AUSBILDUNG,
  felder: [
    { id: "regelwerke", label: "Betriebsvereinbarungen und Richtlinien (Liste)", typ: "lang", pflicht: true },
    { id: "zugriff", label: "Zugang", typ: "auswahl", optionen: ["im Intranet", "als Aushändigung in Kopie", "zur Einsicht in der Personalabteilung"], standard: "im Intranet", pflicht: true },
  ],
  text: (w, k) => [
    `(1) Für das Arbeitsverhältnis gelten die Betriebsvereinbarungen und Richtlinien in ihrer jeweiligen Fassung, derzeit: ${w.regelwerke?.trim() || "[Liste]"}. ${k.vorname} kann sie ${w.zugriff || "im Intranet"} einsehen.`,
    `(2) Betriebsvereinbarungen gelten unmittelbar und zwingend. Günstigere Regeln in diesem Vertrag zugunsten von ${k.vorname} gehen vor.`,
  ].join("\n"),
  normen: ["§ 77 BetrVG", "§ 2 Abs. 1 Satz 2 Nr. 15 NachwG"],
  quellen: ["https://www.gesetze-im-internet.de/betrvg/__77.html", "Katalog Abschnitt 4, Baustein Q3"],
  schutz: ["Verweis ohne Verschlechterung einer Betriebsvereinbarung."],
  sperren: ["Klausel, die eine Betriebsvereinbarung zu Lasten der Person ändert."],
  stichwoerter: ["Betriebsvereinbarung", "Richtlinie", "Policy", "Betriebsrat"],
};

const DOPPELT = "doppelte Schriftform (auch für die Aufhebung dieser Klausel)";

const Q4: Baustein = {
  id: "Q4", gruppe: "Q", label: "Schlussbestimmungen", risiko: "grün", version: 1, ersetzt: "§ 17",
  passt: "Standard für alle Verträge.",
  fuer: MIT_AUSBILDUNG,
  felder: [
    { id: "form", label: "Form für Änderungen", typ: "auswahl", optionen: ["Textform", DOPPELT], standard: "Textform", pflicht: true, hinweis: "Die doppelte Schriftform ist unwirksam und gesperrt." },
    { id: "salvatorisch", label: "Salvatorische Klausel", typ: "janein", standard: "ja" },
  ],
  text: (w) => [
    "(1) Änderungen und Ergänzungen dieses Vertrags bedürfen der Textform.",
    "(2) Individuelle Vereinbarungen haben Vorrang, auch wenn sie mündlich getroffen werden (§ 305b BGB).",
    ja(w.salvatorisch) || !w.salvatorisch ? "(3) Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam. Das gilt nicht als Ersatz für eine fehlende Karenzentschädigung." : "",
  ].filter(Boolean).join("\n"),
  normen: ["§ 305b BGB", "§ 309 Nr. 13 BGB", "§ 125 BGB"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__305b.html", "https://www.gesetze-im-internet.de/bgb/__309.html", "Katalog Abschnitt 4, Baustein Q4"],
  urteile: [{ az: "BAG 9 AZR 382/07", kennung: "P" }, { az: "BAG 10 AZR 448/15", kennung: "V" }],
  schutz: ["Nur Textform, mit Satz zum Vorrang der Individualabrede."],
  sperren: ["Doppelte Schriftformklausel (R9)."],
  stichwoerter: ["Schlussbestimmungen", "Schriftform", "Textform", "salvatorische Klausel"],
  regeln: [
    regel("P-097", "sperre", "Doppelte Schriftform gewählt", "§ 305b BGB, BAG 9 AZR 382/07 (R9)", ["Q4"],
      (l) => wenn(wert(l, "Q4", "form") === DOPPELT, "Die doppelte Schriftformklausel ist unwirksam, weil sie den Vorrang mündlicher Abreden verschleiert. Wähle „Textform“.")),
    regel("K-27", "sperre", "Doppelte Schriftform in der Ergänzung", "§ 305b BGB (R9)", ["Q4"],
      (l) => wenn(hat(l, "Q4") && gesperrtIn(l, "Q4", "R9"), "Die Ergänzung in Q4 enthält eine doppelte Schriftformklausel. Sicher: Textform mit Vorrang der Individualabrede.")),
  ],
};

const Q5: Baustein = {
  id: "Q5", gruppe: "Q", label: "Anwendbares Recht, Gerichtsstand, Vertragssprache", risiko: "grün", version: 1,
  passt: "Für alle Verträge, Eingaben vor allem bei Auslandsbezug.",
  fuer: MIT_AUSBILDUNG,
  felder: [
    { id: "sprache", label: "Vertragssprache", typ: "auswahl", optionen: ["Deutsch", "Deutsch mit Übersetzung"], standard: "Deutsch", pflicht: true },
    { id: "uebersetzung", label: "Sprache der Übersetzung", typ: "text", pflicht: true, bei: { sprache: ["Deutsch mit Übersetzung"] } },
  ],
  text: (w) => [
    "(1) Für das Arbeitsverhältnis gilt deutsches Recht. Zwingende Schutzvorschriften des Staates, in dem gewöhnlich gearbeitet wird, bleiben unberührt (Art. 8 Rom-I-VO).",
    "(2) Für Streitigkeiten sind die Arbeitsgerichte nach den gesetzlichen Regeln zuständig.",
    w.sprache === "Deutsch mit Übersetzung" ? `(3) Der Vertrag ist in deutscher Sprache geschlossen. Die Übersetzung in ${w.uebersetzung || "[Sprache]"} dient dem Verständnis; maßgeblich ist die deutsche Fassung.` : "",
  ].filter(Boolean).join("\n"),
  normen: ["§ 38 ZPO", "§ 48 ArbGG", "Art. 8 Rom-I-VO", "§ 101 ArbGG"],
  quellen: ["https://www.gesetze-im-internet.de/arbgg/__48.html", "https://eur-lex.europa.eu/eli/reg/2008/593/oj", "Katalog Abschnitt 4, Baustein Q5"],
  schutz: ["Kein Gerichtsstand außerhalb des gesetzlichen.", "Bei Beschäftigung im Ausland Hinweis auf B7."],
  sperren: ["Schiedsabrede (R10)."],
  stichwoerter: ["Gerichtsstand", "anwendbares Recht", "Vertragssprache", "Übersetzung"],
};

const Q6: Baustein = {
  id: "Q6", gruppe: "Q", label: "Ausschluss betrieblicher Übung", risiko: "gelb", version: 1,
  passt: "Für Firmen, die bei freiwilligen Leistungen Ansprüche aus Wiederholung vermeiden wollen.",
  fuer: ARBEITNEHMER,
  felder: [
    { id: "leistungen", label: "Freiwillige Leistungen, für die der Vorbehalt gilt", typ: "lang", pflicht: true, hinweis: "Nur Leistungen mit Freiwilligkeitsvorbehalt (D21), nie laufendes Entgelt." },
  ],
  text: (w, k) => [
    `(1) Für folgende Leistungen gilt der Freiwilligkeitsvorbehalt${"D21" in k.auswahl ? " nach der Regel zu freiwilligen Leistungen in diesem Vertrag" : " (Baustein D21)"}: ${w.leistungen?.trim() || "[Leistungen]"}. Auch eine wiederholte Zahlung begründet für diese Leistungen keinen Anspruch für die Zukunft, wenn der Arbeitgeber bei jeder Zahlung auf die Freiwilligkeit hinweist.`,
    "(2) Für laufendes Entgelt gilt dieser Absatz nicht.",
  ].join("\n"),
  normen: ["§ 305b BGB", "§ 307 BGB"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__305b.html", "Katalog Abschnitt 4, Baustein Q6 und D21"],
  schutz: ["Nur mit Verweis auf den Freiwilligkeitsvorbehalt D21, kein pauschaler Ausschluss."],
  sperren: ["Pauschalklausel „aus wiederholter Zahlung entsteht kein Anspruch“ für laufendes Entgelt."],
  stichwoerter: ["betriebliche Übung", "Wiederholung", "freiwillige Leistung"],
};

const Q7: Baustein = {
  id: "Q7", gruppe: "Q", label: "Empfangsbestätigung für Unterlagen", risiko: "grün", version: 1,
  passt: "Für alle Verträge, wenn Unterlagen mit ausgehändigt werden.",
  fuer: MIT_AUSBILDUNG,
  felder: [
    { id: "unterlagen", label: "Ausgehändigte Unterlagen", typ: "mehrfach", optionen: ["Ausfertigung dieses Vertrags", "Stellenbeschreibung", "Richtlinien", "Datenschutzinformation", "Betriebsvereinbarungen"], standard: "Ausfertigung dieses Vertrags|Datenschutzinformation", pflicht: true },
  ],
  text: (w, k) => [
    `Empfangsbestätigung (eigene Seite, gesondert unterschrieben)`,
    `${k.vorname} bestätigt, folgende Unterlagen erhalten zu haben: ${liste(w.unterlagen).join(", ") || "[Unterlagen]"}.`,
    "Diese Bestätigung steht auf einer eigenen Seite und wird gesondert unterschrieben. Sie bestätigt nur den Erhalt, nicht das Verständnis oder die Richtigkeit des Inhalts.",
    `Ort, Datum, Unterschrift ${k.vorname}`,
  ].join("\n"),
  normen: ["§ 309 Nr. 12 BGB", "§ 2 NachwG", "§ 3 NachwG"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__309.html", "https://www.gesetze-im-internet.de/nachwg/__2.html", "Katalog Abschnitt 4, Baustein Q7"],
  schutz: ["Eigene Seite mit eigener Unterschrift."],
  sperren: ["Bestätigung im Fließtext des Vertrags."],
  stichwoerter: ["Empfangsbestätigung", "erhalten", "Unterlagen", "Quittung"],
};

const Q8: Baustein = {
  id: "Q8", gruppe: "Q", label: "Mitteilung geänderter Personaldaten", risiko: "grün", version: 1,
  passt: "Für alle Verträge.",
  fuer: MIT_AUSBILDUNG,
  felder: [
    { id: "angaben", label: "Mitzuteilende Angaben", typ: "mehrfach", optionen: ["Anschrift", "Bankverbindung", "Name", "Staatsangehörigkeit und Aufenthaltstitel", "Lohnsteuermerkmale"], standard: "Anschrift|Bankverbindung|Name|Staatsangehörigkeit und Aufenthaltstitel|Lohnsteuermerkmale", pflicht: true },
  ],
  text: (w, k) => [
    `(1) ${k.vorname} teilt Änderungen folgender Angaben unverzüglich in Textform mit: ${liste(w.angaben).join(", ") || "[Angaben]"}.`,
    "(2) Angaben zur Gesundheit oder zur Familienplanung muss niemand mitteilen.",
  ].join("\n"),
  normen: ["§ 241 Abs. 2 BGB", "Art. 5 DSGVO"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__241.html", "https://eur-lex.europa.eu/eli/reg/2016/679/oj", "Katalog Abschnitt 4, Baustein Q8"],
  schutz: ["Textform."],
  sperren: ["Mitteilung zur Gesundheit oder Familienplanung."],
  stichwoerter: ["Adresse", "Bankverbindung", "Umzug", "Namensänderung", "Personaldaten"],
};

/* ---------- S: Weitere Bausteine ---------- */

const S1: Baustein = {
  id: "S1", gruppe: "S", label: "Compliance, Geschenke, Interessenkonflikte", risiko: "grün", version: 1,
  passt: "Für Firmen mit Kundenkontakt, Einkauf oder Vertrieb.",
  fuer: OHNE_WS,
  felder: [
    { id: "wertgrenze", label: "Wertgrenze für Geschenke in Euro", typ: "betrag", min: 0 },
    { id: "kodex", label: "Verhaltenskodex als Anlage", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => {
    const g = zahl(w.wertgrenze);
    return [
      `(1) ${k.vorname} nimmt im Zusammenhang mit der Arbeit keine Geschenke oder Vorteile an und gewährt keine${g !== null ? `, die über ${euro(g)} im Einzelfall hinausgehen` : ", die über übliche Gelegenheitsgeschenke hinausgehen"}.`,
      `(2) ${k.vorname} zeigt Interessenkonflikte und Beteiligungen an Geschäftspartnern in Textform an.`,
      ja(w.kodex) ? "(3) Der Verhaltenskodex des Arbeitgebers liegt als Anlage bei." : "",
    ].filter(Boolean).join("\n");
  },
  normen: ["§ 299 StGB", "§ 331 StGB", "§ 241 Abs. 2 BGB", "§ 87 Abs. 1 Nr. 1 BetrVG"],
  quellen: ["https://www.gesetze-im-internet.de/stgb/__299.html", "Katalog Abschnitt 4, Baustein S1"],
  schutz: ["Kodex als Anlage."],
  sperren: [],
  stichwoerter: ["Compliance", "Geschenke", "Interessenkonflikt", "Bestechung", "Kodex"],
};

const S2: Baustein = {
  id: "S2", gruppe: "S", label: "Alkohol, Drogen, Rauchen, Ordnung im Betrieb", risiko: "grün", version: 1,
  passt: "Für Produktion, Fahrdienst und Pflege.",
  fuer: OHNE_WS,
  felder: [
    { id: "regel", label: "Regel", typ: "auswahl", optionen: ["Verweis auf die Betriebsordnung", "kein Alkohol und keine Drogen während der Arbeit"], standard: "Verweis auf die Betriebsordnung", pflicht: true },
  ],
  text: (w, k) => w.regel === "kein Alkohol und keine Drogen während der Arbeit"
    ? `${k.vorname} tritt die Arbeit nicht unter dem Einfluss von Alkohol oder Drogen an und nimmt sie während der Arbeit nicht zu sich. Im Übrigen gilt die Betriebsordnung.`
    : `Für Alkohol, Drogen, Rauchen und die Ordnung im Betrieb gilt die Betriebsordnung in ihrer jeweiligen Fassung.`,
  normen: ["DGUV Vorschrift 1", "§ 87 Abs. 1 Nr. 1 BetrVG"],
  quellen: ["https://www.gesetze-im-internet.de/betrvg/__87.html", "Katalog Abschnitt 4, Baustein S2"],
  schutz: ["Verweis auf Betriebsordnung, keine Strafen."],
  sperren: [],
  stichwoerter: ["Alkohol", "Drogen", "Rauchen", "Betriebsordnung"],
};

const S3: Baustein = {
  id: "S3", gruppe: "S", label: "Arbeitsschutz, Vorsorge, Unterweisung", risiko: "grün", version: 1,
  passt: "Für alle Arbeitsverhältnisse.",
  fuer: OHNE_WS,
  felder: [
    { id: "pflichtvorsorge", label: "Tätigkeit löst Pflichtvorsorge aus (Gefährdungsbeurteilung)", typ: "janein", standard: "nein" },
    { id: "ersthelfer", label: "Einsatz als Ersthelfer:in", typ: "janein", standard: "nein" },
  ],
  text: (w, k) => [
    `(1) ${k.vorname} nimmt an den Unterweisungen zum Arbeitsschutz teil, befolgt die Anweisungen zur Sicherheit und meldet Mängel und Gefahren unverzüglich (§§ 15, 16 ArbSchG).`,
    ja(w.pflichtvorsorge) ? `(2) Die Tätigkeit setzt eine arbeitsmedizinische Pflichtvorsorge voraus. ${k.vorname} nimmt an ihr teil. Der Arbeitgeber erhält nur die Bescheinigung über die Teilnahme, nicht das Ergebnis.` : "",
    ja(w.ersthelfer) ? `${k.vorname} wird nach Ausbildung als Ersthelfer:in eingesetzt; die Ausbildung zahlt der Arbeitgeber und sie findet in der Arbeitszeit statt.` : "",
  ].filter(Boolean).join("\n"),
  normen: ["§ 12 ArbSchG", "§ 15 ArbSchG", "§ 16 ArbSchG", "ASiG", "ArbMedVV"],
  quellen: ["https://www.gesetze-im-internet.de/arbschg/__15.html", "https://www.gesetze-im-internet.de/arbmedvv/", "Katalog Abschnitt 4, Baustein S3"],
  schutz: ["Pflichtvorsorge nur, wenn die Tätigkeit sie auslöst.", "Ergebnis geht nicht an den Arbeitgeber."],
  sperren: [],
  stichwoerter: ["Arbeitsschutz", "Unterweisung", "Vorsorge", "Ersthelfer", "Betriebsarzt"],
};

const S4: Baustein = {
  id: "S4", gruppe: "S", label: "Dienstwohnung, Werkswohnung", risiko: "gelb", version: 1,
  passt: "Für Hausmeister, Pflege und Gastronomie mit Wohnung beim Arbeitgeber.",
  fuer: OHNE_WS,
  felder: [
    { id: "art", label: "Art", typ: "auswahl", optionen: ["Werkmietwohnung (eigener Mietvertrag)", "Werkdienstwohnung (Teil des Arbeitsverhältnisses)"], standard: "Werkmietwohnung (eigener Mietvertrag)", pflicht: true },
    { id: "wohnung", label: "Wohnung (Anschrift)", typ: "text", pflicht: true },
    { id: "sachbezug", label: "Sachbezugswert oder Miete je Monat in Euro", typ: "betrag", min: 0 },
  ],
  text: (w, k) => {
    const s = zahl(w.sachbezug);
    const miet = w.art?.startsWith("Werkmietwohnung");
    return [
      `(1) ${k.vorname} ${miet ? "mietet" : "nutzt"} die Wohnung ${w.wohnung || "[Anschrift]"}${miet ? " auf Grund eines eigenen Mietvertrags" : " als Teil des Arbeitsverhältnisses"}.${s !== null ? ` ${miet ? "Die Miete" : "Der Sachbezugswert"} beträgt ${euro(s)} im Monat.` : ""}`,
      `(2) Nach dem Ende des Arbeitsverhältnisses gelten für die Räumung die gesetzlichen Kündigungsfristen und der Mieterschutz (${miet ? "§ 576 BGB" : "§ 576b BGB"}).`,
    ].join("\n");
  },
  normen: ["§ 576 BGB", "§ 576b BGB"],
  quellen: ["https://www.gesetze-im-internet.de/bgb/__576.html", "https://www.gesetze-im-internet.de/bgb/__576b.html", "Katalog Abschnitt 4, Baustein S4"],
  schutz: ["Arbeits- und Mietvertrag getrennt.", "Räumungsfristen nach Gesetz."],
  sperren: ["Räumung ohne Frist."],
  stichwoerter: ["Dienstwohnung", "Werkswohnung", "Wohnung", "Hausmeister"],
};

const S5: Baustein = {
  id: "S5", gruppe: "S", label: "Altersteilzeit", risiko: "gelb", version: 1,
  passt: "Für Firmen mit Altersteilzeit als Übergang in den Ruhestand.",
  fuer: OHNE_WS,
  felder: [
    { id: "modell", label: "Modell", typ: "auswahl", optionen: ["Blockmodell", "kontinuierlich"], standard: "kontinuierlich", pflicht: true },
    { id: "beginn", label: "Beginn", typ: "datum", pflicht: true },
    { id: "ende", label: "Ende", typ: "datum", pflicht: true },
    { id: "aufstockung", label: "Aufstockung (Beschreibung)", typ: "text", standard: "in gesetzlicher Höhe nach dem AltTZG" },
  ],
  text: (w, k) => [
    `(1) ${k.vorname} arbeitet vom ${isISODate(w.beginn) ? formatDE(w.beginn) : "[Beginn]"} bis zum ${isISODate(w.ende) ? formatDE(w.ende) : "[Ende]"} in Altersteilzeit im ${w.modell === "Blockmodell" ? "Blockmodell (Arbeitsphase, dann Freistellungsphase)" : "kontinuierlichen Modell (gleichmäßig verringerte Arbeitszeit)"}.`,
    `(2) Der Arbeitgeber stockt das Entgelt ${w.aufstockung?.trim() || "in gesetzlicher Höhe nach dem AltTZG"} auf.`,
    "(3) Wertguthaben sind gegen Insolvenz des Arbeitgebers gesichert (§ 8a AltTZG). Der Arbeitgeber weist die Sicherung in Textform nach.",
  ].join("\n"),
  normen: ["AltTZG", "§ 8a AltTZG"],
  quellen: ["https://www.gesetze-im-internet.de/alttzg_1996/__8a.html", "Katalog Abschnitt 4, Baustein S5"],
  schutz: ["Insolvenzsicherung Pflicht und immer im Text."],
  sperren: ["Blockmodell ohne Insolvenzsicherung."],
  stichwoerter: ["Altersteilzeit", "Blockmodell", "Ruhestand", "Übergang"],
};

const S6: Baustein = {
  id: "S6", gruppe: "S", label: "Teilzeit, Aufstockung und Rückkehr zur Vollzeit", risiko: "grün", version: 1,
  passt: "Für Teilzeitbeschäftigte.",
  fuer: OHNE_WS,
  felder: [
    { id: "vorrang", label: "Hinweis auf Vorrang bei freien Stellen", typ: "janein", standard: "ja" },
  ],
  text: (w, k) => [
    ja(w.vorrang) ? `(1) Wünscht ${k.vorname} eine längere Arbeitszeit, berücksichtigt der Arbeitgeber das bei der Besetzung eines passenden freien Arbeitsplatzes bevorzugt (§ 9 TzBfG).` : "",
    `(2) Die gesetzlichen Rechte auf Verringerung der Arbeitszeit (§ 8 TzBfG) und auf Brückenteilzeit (§ 9a TzBfG) bleiben unberührt. ${k.vorname} teilt Wünsche zur Arbeitszeit in Textform mit.`,
  ].filter(Boolean).join("\n"),
  normen: ["§ 8 TzBfG", "§ 9 TzBfG", "§ 9a TzBfG"],
  quellen: ["https://www.gesetze-im-internet.de/tzbfg/__9.html", "https://www.gesetze-im-internet.de/tzbfg/__9a.html", "Katalog Abschnitt 4, Baustein S6"],
  schutz: ["Hinweis auf gesetzliche Rechte, keine Einschränkung."],
  sperren: [],
  stichwoerter: ["Teilzeit", "Aufstockung", "Vollzeit", "Brückenteilzeit"],
};

export const BAUSTEINE_OPQS: Baustein[] = [O1, O2, O3, P1, P2, P3, P4, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, S1, S2, S3, S4, S5, S6];
