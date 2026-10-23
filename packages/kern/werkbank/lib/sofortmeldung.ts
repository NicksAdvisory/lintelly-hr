/**
 * Sofortmeldung (§ 28a Abs. 4 SGB IV): In diesen Wirtschaftsbereichen meldet der Arbeitgeber den Beginn der Beschäftigung
 * spätestens bei Arbeitsaufnahme an die Datenstelle der Rentenversicherung. Liste wörtlich aus Satz 1 Nr. 1 bis 11,
 * geprüft am 18.10.2026 auf https://www.gesetze-im-internet.de/sgb_4/__28a.html. Rein, auch im Browser nutzbar.
 */
export const SOFORTMELDUNG_QUELLE = "§ 28a Abs. 4 SGB IV";

export const SOFORTMELDUNG_BEREICHE = [
  { id: "bau", nr: 1, text: "Baugewerbe" },
  { id: "gastro", nr: 2, text: "Gaststätten- und Beherbergungsgewerbe" },
  { id: "personenbefoerderung", nr: 3, text: "Personenbeförderungsgewerbe" },
  { id: "spedition", nr: 4, text: "Speditions-, Transport- und damit verbundenes Logistikgewerbe einschließlich der plattformbasierten Lieferdienste" },
  { id: "schausteller", nr: 5, text: "Schaustellergewerbe" },
  { id: "gebaeudereinigung", nr: 6, text: "Gebäudereinigungsgewerbe" },
  { id: "messebau", nr: 7, text: "Auf- und Abbau von Messen und Ausstellungen" },
  { id: "fleisch", nr: 8, text: "Fleischwirtschaft (ohne Fleischerhandwerk)" },
  { id: "prostitution", nr: 9, text: "Prostitutionsgewerbe" },
  { id: "sicherheit", nr: 10, text: "Wach- und Sicherheitsgewerbe" },
  { id: "friseur", nr: 11, text: "Friseur- und Kosmetikgewerbe" },
] as const;
