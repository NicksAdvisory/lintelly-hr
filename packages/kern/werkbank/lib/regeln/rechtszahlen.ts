/**
 * Sucht Rechtszahlen, die außerhalb des Registers (lib/regeln/werte.ts, lib/regeln/register.ts) im Code stehen.
 * Läuft im Test tests/register.test.ts über app/, lib/ und components/. Reine Textprüfung, kein Dateizugriff.
 *
 * Vier Muster (Konzept 09.10.2026, Abschnitt 5.2):
 * - "einheit": Zahl mit Einheit in Code oder Text, z. B. 72 Stunden, drei Tage, 6 Wochen, 50 €, 5 %.
 * - "schwelle": Vergleich oder Rechnung (mal, geteilt) mit einer Zahl ab 2 oder einem Faktor in Regelcode (lib/regeln, lib/module, lib/analyse),
 *   wenn der Name nach Frist, Dauer, Anzahl oder Betrag klingt (z. B. tage > 6, 20 * arbeitstage, jahr * 0.21); in allen Dateien
 *   außerdem Obergrenzen mit Math.min oder Math.max (Math.min(p.probezeitMonate, 6)).
 * - "datum": Datumsrechnung mit fester Zahl ab 2 (addDays, addMonths, addYears), Stunden in Minuten (9 * 60)
 *   oder ein festes Datum im Jahr in Regelcode (iso(y, 3, 31); Jahresanfang und Jahresende zählen nicht).
 * - "norm": Zeile mit Normverweis (§, Art., ASR, DGUV, ArbMedVV, LStR) und einer Zahl ab 2 im ausführbaren Code (nur .ts, Tabellen mit Fristen und Intervallen).
 * Kommentare zählen nicht. Ausnahme nur mit dem Marker `kein-recht: <Grund>` in derselben Zeile oder in der Zeile direkt darüber.
 */
export type Muster = "einheit" | "schwelle" | "datum" | "norm";
export type Fund = { datei: string; zeile: number; muster: Muster; text: string };

/** Diese Dateien sind das Register selbst oder seine Prüfung. */
export const REGISTER_DATEIEN = ["lib/regeln/werte.ts", "lib/regeln/register.ts", "lib/regeln/rechtszahlen.ts"];

/** Prozent nur mit Leerzeichen davor wie im deutschen Text ("5 %"); "100%" ohne Leerzeichen ist CSS. */
const EINHEIT = String.raw`(?:Stunden|Std\.?|Kalendertage[n]?|Arbeitstage[n]?|Werktage[n]?|Tage[n]?|Wochen|Monate[n]?|Monat|Jahre[n]?|Jahr|Minuten|Prozent|Euro|€|(?<=\s)%)`;
const ZAHLWORT = String.raw`(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|vierzehn|zwanzig|dreißig|zweiundsiebzig)`;
const ZAHL_EINHEIT = new RegExp(String.raw`(?<![\w.$/{-])(?:\d+(?:[.,]\d+)?|${ZAHLWORT})\s*${EINHEIT}(?![\wäöüß])`, "i");
const VERGLEICH = /(?<![=<>])[<>]=?\s*(\d+(?:\.\d+)?)(?![\w.])/g;
/** Linker Ausdruck vor einem Vergleich bis zur nächsten Grenze (&&, ||, ?, :, ;, Komma, Zuweisung oder offene Klammer). */
function linkerAusdruck(code: string, ende: number): string {
  let tiefe = 0;
  for (let i = ende - 1; i >= 0; i--) {
    const c = code[i];
    if (c === ")" || c === "]") tiefe++;
    else if (c === "(" || c === "[") { if (tiefe === 0) return code.slice(i + 1, ende); tiefe--; }
    else if (tiefe === 0 && (/[?:;,=]/.test(c) || code.startsWith("&&", i - 1) || code.startsWith("||", i - 1))) return code.slice(i + 1, ende);
  }
  return code.slice(0, ende);
}
const RECHNUNG = /([\w$]+(?:\.[\w$]+)*\)?)\s*[*/]\s*(\d+(?:\.\d+)?)(?![\w.])|(?<![\w.$])(\d+(?:\.\d+)?)\s*\*\s*\(?\s*([\w$]+(?:\.[\w$]+)*)/g;
/** Kalender- und Umrechnungszahlen in Rechnungen (halbe Tage runden, Wochen, Monate, Prozent, Minuten) sind keine Rechtswerte. */
const KALENDER = [1, 2, 7, 12, 60, 100, 1000];
const SCHWELLEN_NAME = /tage|tag\b|probezeit|urlaub|gehalt|lohn|brutto|beitrag|sv\b|woche|monat|stunde|jahr|std|minute|alter|anzahl|beschaeftigt|mitarbeit|personen|dauer|frist|kopf|zahl|seit|diff|prozent|quote/i;
const REGELCODE = /^lib\/(regeln|module|analyse)\//;
const DATUMSRECHNUNG = /^(?:addDays|addMonths|addYears)\(\s*[^,()]+(?:\([^()]*\))?\s*,\s*(-?\d+)\s*\)/;
/** Zahlen aller Datumsrechnungen einer Zeile, auch verschachtelte (addDays(addMonths(x, 6), -1)). */
const datumsZahlen = (code: string) => [...code.matchAll(/\b(?=addDays|addMonths|addYears)/g)].map((m) => DATUMSRECHNUNG.exec(code.slice(m.index))?.[1]).filter((z): z is string => z !== undefined).map(Number);
const FESTES_DATUM = /\biso\(\s*[^,()]+,\s*(\d+),\s*(\d+)\s*\)/g;
const STUNDEN_IN_MINUTEN = /(?<![\w.*]\s?)(\d+)\s*\*\s*60(?![\w.]|\s*\*|_)/g;
const NORM = /§\s*\d+|Art\.\s*\d+|\bASR A\d|\bDGUV\b|\bArbMedVV\b|\bLStR\b/;
/** Zahl als Wert eines Felds (tage: 14) oder als Argument (addDays(k, 14)), nicht in Rechnungen oder Abschnittsnummern. */
const ZAHL_IM_CODE = /(?:\b[A-Za-z_$][\w$]*\s*:\s*|[,(]\s*)-?(\d+(?:\.\d+)?)(?=\s*[,)}\]])/g;
const MARKER = /kein-recht:\s*\S/;

/** Entfernt Kommentare. `block` merkt sich, ob ein mehrzeiliger Kommentar offen ist. */
function ohneKommentar(zeile: string, block: { offen: boolean }): string {
  let s = zeile;
  if (block.offen) {
    const ende = s.indexOf("*/");
    if (ende < 0) return "";
    s = s.slice(ende + 2);
    block.offen = false;
  }
  s = s.replace(/\{\/\*.*?\*\/\}/g, "").replace(/\/\*.*?\*\//g, "");
  const anfang = s.indexOf("/*");
  if (anfang >= 0) { block.offen = true; s = s.slice(0, anfang); }
  if (/^\s*\*/.test(s)) return "";
  return s.replace(/(^|[^:"'`\w\\])\/\/.*$/, "$1");
}

/**
 * Code ohne Inhalt von Zeichenketten, damit Zahlen im Text nicht als Logik gelten. Ausdrücke in `${...}` bleiben Code,
 * auch verschachtelt (`a ${b ? "x" : `y ${c}`} d`). Arbeitet je Zeile; eine über die Zeile offene Zeichenkette endet am Zeilenende.
 */
function ohneStrings(s: string): string {
  let out = "";
  const stapel: ("code" | "vorlage")[] = [];
  let i = 0;
  const imCode = () => stapel.length === 0 || stapel[stapel.length - 1] === "code";
  while (i < s.length) {
    const c = s[i];
    if (imCode()) {
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < s.length && s[j] !== c) j += s[j] === "\\" ? 2 : 1;
        out += '""'; i = j + 1; continue;
      }
      if (c === "`") { stapel.push("vorlage"); out += '"'; i++; continue; }
      if (c === "}" && stapel.length) { stapel.pop(); out += c; i++; continue; }
      if (c === "{" && stapel.length) { stapel.push("code"); out += c; i++; continue; }
      out += c; i++; continue;
    }
    // in einer Vorlage
    if (c === "\\") { i += 2; continue; }
    if (c === "`") { stapel.pop(); out += '"'; i++; continue; }
    if (c === "$" && s[i + 1] === "{") { stapel.push("code"); out += "${"; i += 2; continue; }
    i++;
  }
  return out;
}

/** Alle Funde einer Datei. `datei` ist der Pfad relativ zum Projekt mit "/". */
export function findeRechtszahlen(datei: string, inhalt: string): Fund[] {
  if (REGISTER_DATEIEN.includes(datei)) return [];
  const funde: Fund[] = [];
  const block = { offen: false };
  const zeilen = inhalt.split("\n");
  zeilen.forEach((roh, i) => {
    const text = ohneKommentar(roh, block);
    if (!text.trim()) return;
    if (MARKER.test(roh) || (i > 0 && MARKER.test(zeilen[i - 1]))) return;
    const code = ohneStrings(text);
    const neu = (muster: Muster) => funde.push({ datei, zeile: i + 1, muster, text: roh.trim().slice(0, 200) });
    if (ZAHL_EINHEIT.test(text)) neu("einheit");
    const vergleich = [...code.matchAll(VERGLEICH)].some((m) => {
      const links = linkerAusdruck(code, m.index).trim();
      return !/length\)?$/.test(links) && SCHWELLEN_NAME.test(links) && Number(m[1]) >= 2;
    });
    const rechnung = [...code.matchAll(RECHNUNG)].some((m) => {
      const [name, zahl] = m[1] !== undefined ? [m[1], Number(m[2])] : [m[4], Number(m[3])];
      return SCHWELLEN_NAME.test(name) && !KALENDER.includes(zahl);
    });
    // Obergrenzen wie Math.min(p.probezeitMonate, 6) zählen in jeder Datei.
    const grenze = [...code.matchAll(/Math\.(?:min|max)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)].some((m) => SCHWELLEN_NAME.test(m[1]) && [...m[1].matchAll(/(?<![\w.$])(\d+(?:\.\d+)?)(?![\w.])/g)].some((z) => Number(z[1]) >= 2 && !KALENDER.includes(Number(z[1]))));
    if ((REGELCODE.test(datei) && (vergleich || rechnung)) || grenze) neu("schwelle");
    const festesDatum = REGELCODE.test(datei) && [...code.matchAll(FESTES_DATUM)].some((m) => !["1.1", "12.31"].includes(`${Number(m[1])}.${Number(m[2])}`));
    const datum = festesDatum || datumsZahlen(code).some((z) => Math.abs(z) >= 2) || [...code.matchAll(STUNDEN_IN_MINUTEN)].some((m) => Number(m[1]) !== 60);
    if (datum) neu("datum");
    // Zugriffe wie slice(0, 10) und Absatznummern wie (2) aus verschachteltem Text sind keine Rechtszahlen.
    const codeOhneZugriffe = code.replace(/\.(?:slice|padStart|substring|toFixed|at)\([^)]*\)/g, "").replace(/\(\d+\)/g, "");
    if (datei.endsWith(".ts") && NORM.test(text) && [...codeOhneZugriffe.matchAll(ZAHL_IM_CODE)].some((m) => Number(m[1]) >= 2)) neu("norm");
  });
  return funde;
}
