# Changelog

Versionen nach SemVer. Jede Version geht über die Release-Pipeline auf npm, ghcr.io und hr.lintelly.com.

## 0.1.3

- Erstes npm-Paket `@lintelly/hr-mcp` (0.1.2 kam wegen des Tokens nicht auf npm).
- GitHub Actions auf neue Versionen, Stammdaten und HR-Icon für Verzeichnisse.

## 0.1.2

- npm-Paket `@lintelly/hr-mcp` für den lokalen Start über stdio (`npx -y @lintelly/hr-mcp`).
- Monatlicher Abgleich mit Werkbank und lintelly.com und Kennzahlen per Telegram (ops/).

## 0.1.1

- Der Hinweis auf menschliche Prüfung bei Vertrag, Kündigung und Abmahnung steht jetzt auch im Feld `hinweis`, das Assistenten zuverlässig weitergeben.

## 0.1.0

Erste Version von Lintelly HR (23.10.2026).

- Offener MCP-Server ohne Anmeldung, über stdio (Docker, ghcr.io) und Streamable HTTP (`https://hr.lintelly.com/mcp`).
- Alle 24 Werkzeuge von lintelly.com/tools, die Werkzeuge aus dem Wissen-Konzept, zehn Abläufe mit Daten, alle 126 Vertragsbausteine mit Text,
  Generatoren für Kündigungsschreiben, Abmahnung und Arbeitszeugnis, Rechtswerte mit Quelle und Prüfdatum.
- Vier Prompts (HR-Sprechstunde, Erste Einstellung, Jemand ist krank, Kündigung vorbereiten), Ressourcen (Rechtswerte als JSON, Abläufe als Markdown).
- Claude-Plugin mit fünf Skills und dem Befehl `/hr-woche`.
- Keine Personendaten: nur Zähler je Werkzeug und Tag mit groben Bändern.
