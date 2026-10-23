/** Links auf amtliche Fundstellen, rein und ohne Abhängigkeit, damit Register (lib/regeln/register.ts) und Stufen-Tabelle (lib/dokumente/rechtlich.ts) dieselben nutzen. */
export const gii = (gesetz: string, paragraph: string) => `https://www.gesetze-im-internet.de/${gesetz}/__${paragraph}.html`;
export const EU_DSGVO = "https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32016R0679";
export const BAG = (az: string) => `https://www.bundesarbeitsgericht.de/entscheidung/${az}/`;

/** Gesetzeskürzel zu Verzeichnis auf gesetze-im-internet.de. Nur Kürzel, deren Verzeichnis feststeht; Unbekanntes bekommt keinen Link. */
const GII: Record<string, string> = {
  AAG: "aufag", AGG: "agg", AltTZG: "alttzg_1996", AO: "ao_1977", ArbGG: "arbgg", ArbMedVV: "arbmedvv", ArbnErfG: "arbnerfg", ArbSchG: "arbschg", ArbZG: "arbzg",
  ASiG: "asig", AufenthG: "aufenthg_2004", BBiG: "bbig_2005", BDSG: "bdsg_2018", BEEG: "beeg", BetrAVG: "betravg", BetrSichV: "betrsichv_2015", BetrVG: "betrvg",
  BGB: "bgb", BUrlG: "burlg", BVV: "beitrvv", BZRG: "bzrg", "DEÜV": "de_v", EFZG: "entgfg", EntgFG: "entgfg", EntgTranspG: "entgtranspg", EStG: "estg", FPfZG: "fpfzg", GefStoffV: "gefstoffv_2010",
  GeschGehG: "geschgehg", GewO: "gewo", HGB: "hgb", HinSchG: "hinschg", IfSG: "ifsg", JArbSchG: "jarbschg", KSchG: "kschg", MiLoG: "milog", MiLoV5: "milov5", MuSchG: "muschg_2018",
  NachwG: "nachwg", PflegeZG: "pflegezg", "SGB III": "sgb_3", "SGB IV": "sgb_4", "SGB V": "sgb_5", "SGB VI": "sgb_6", "SGB VII": "sgb_7", "SGB IX": "sgb_9_2018",
  StGB: "stgb", StVG: "stvg", StVZO: "stvzo_2012", "SVBezGrV 2026": "svbezgrv_2026", SvEV: "svev", TVG: "tvg", TzBfG: "tzbfg", UrhG: "urhg", ZPO: "zpo",
};
const KUERZEL = Object.keys(GII).sort((a, b) => b.length - a.length).join("|");
/**
 * "§ 87 Abs. 1 Nr. 6 BetrVG", "§§ 8, 11 JArbSchG", "ArbMedVV § 5": Paragraf und Gesetz, dazwischen kein Semikolon, keine Klammer, kein weiterer
 * Paragraf und ein Komma nur vor einer Zahl ("Abs. 1, 3"), damit "§ 99 X, § 257 HGB" nicht § 99 mit dem HGB verlinkt.
 */
const PARAGRAF = new RegExp(`§+\\s*(\\d+[a-z]?)\\b(?:[^§,;()]|,\\s*(?=\\d))*?\\b(${KUERZEL})\\b`);
const GESETZ_VORN = new RegExp(`\\b(${KUERZEL})\\s+§+\\s*(\\d+[a-z]?)\\b`);
const DSGVO = /Art\.\s*\d+[^§,;()]*?\bDSGVO\b/;
const BAG_AZ = /\bBAG\b[^§;()]*?(\d+)\s+(AZR|ABR)\s+(\d+)\/(\d+)/;

/** Link zur ersten Norm im Text (Rechtsgrundlage eines Rats, Quelle im Chat), sonst null. Nie ein geratener Link. */
export function normLink(text: string): string | null {
  const p = PARAGRAF.exec(text), v = GESETZ_VORN.exec(text), d = DSGVO.exec(text), b = BAG_AZ.exec(text);
  const treffer = [
    p && { i: p.index, href: gii(GII[p[2]], p[1]) },
    v && { i: v.index, href: gii(GII[v[1]], v[2]) },
    d && { i: d.index, href: EU_DSGVO },
    b && { i: b.index, href: BAG(`${b[1]}-${b[2].toLowerCase()}-${b[3]}-${b[4]}`) },
  ].filter((t) => t !== null);
  return treffer.sort((a, b) => a.i - b.i)[0]?.href ?? null;
}
