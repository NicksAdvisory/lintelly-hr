# Mitmachen

Danke, dass du Lintelly HR besser machen willst. Ein paar Regeln, damit jede Zahl stimmt:

1. **Rechtswerte und Rechner kommen aus einer Quelle.** `packages/kern` ist eine wörtliche Kopie aus der Lintelly-Werkbank
   und von lintelly.com (`scripts/abgleich.mjs`). Änderungen an Werten bitte als Issue mit amtlicher Fundstelle
   (gesetze-im-internet.de, Bundesanzeiger, Sozialversicherung), wir übernehmen sie an der Quelle.
2. **Werkzeuge** liegen in `packages/mcp/src/werkzeuge`. Jede Rechnung braucht einen Test (`packages/mcp/test`), erst rot, dann grün.
3. **Keine Personendaten.** Werkzeuge nehmen Daten, Stunden, Beträge und Auswahl, nie Namen oder Freitext über Personen.
4. **Texte:** Deutsch, du, schlicht, keine Gedankenstriche, keine Werbung. Beschreibungen für das Modell auf Englisch.
5. Vor dem Pull Request: `npm run check` (Typen, alle Tests).

Pull Requests von außen prüft Nick von Hand, einmal pro Woche. Keine Maschine merged sie.
Fragen zu einem Einzelfall (Kündigung, Streit) beantworten wir hier nicht: Allgemeine Auskunft, keine Rechtsberatung im Einzelfall.

---

**Contributing.** Values and calculators are copied verbatim from the Lintelly workbench and lintelly.com; propose value changes
as an issue with an official source. Every calculation needs a test. No personal data in tool inputs. Run `npm run check`.
External pull requests are reviewed by a human weekly and never merged automatically.
