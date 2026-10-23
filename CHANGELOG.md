# Changelog

Versionen nach SemVer. Jede Version geht über die Release-Pipeline auf npm, ghcr.io und hr.lintelly.com.

## 0.1.0

Erste Version von Lintelly HR (23.10.2026).

- Offener MCP-Server ohne Anmeldung, über stdio (Docker, ghcr.io) und Streamable HTTP (`https://hr.lintelly.com/mcp`).
- Alle 24 Werkzeuge von lintelly.com/tools, die Werkzeuge aus dem Wissen-Konzept, zehn Abläufe mit Daten, alle 126 Vertragsbausteine mit Text,
  Generatoren für Kündigungsschreiben, Abmahnung und Arbeitszeugnis, Rechtswerte mit Quelle und Prüfdatum.
- Vier Prompts (HR-Sprechstunde, Erste Einstellung, Jemand ist krank, Kündigung vorbereiten), Ressourcen (Rechtswerte als JSON, Abläufe als Markdown).
- Claude-Plugin mit fünf Skills und dem Befehl `/hr-woche`.
- Keine Personendaten: nur Zähler je Werkzeug und Tag mit groben Bändern.
