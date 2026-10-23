# Sicherheit

Lintelly HR ist ein offener Server ohne Anmeldung, der nur rechnet. Er speichert keine Eingaben, hat keine Datenbank und
ruft keine KI auf. Gezählt werden nur Aufrufe je Werkzeug und Tag mit groben Bändern, nie Freitext, Beträge oder Daten.

## Lücke melden

Bitte **nicht** als öffentliches Issue. Stattdessen:
- auf GitHub unter „Security“ > „Report a vulnerability“ (privat), oder
- per Mail an support@lintelly.com mit dem Betreff „Sicherheit Lintelly HR“.

Wir antworten innerhalb von 72 Stunden, sagen, ob und wann wir es beheben, und nennen dich im Changelog, wenn du willst.

## Was zählt

- Wege, über die der Server Daten speichert, ausgibt oder weiterleitet, die er nicht soll.
- Umgehen der Bremse oder der Eingabeprüfung, Lahmlegen mit kleinen Anfragen.
- Falsche Zahlen mit Rechtsfolgen (zum Beispiel eine falsch gerechnete Frist) bitte auch hier melden.

## Unterstützte Versionen

Nur die jeweils neueste Version auf npm, ghcr.io und unter https://hr.lintelly.com/mcp.

---

**Security.** Report vulnerabilities privately via GitHub "Report a vulnerability" or support@lintelly.com. We reply within 72 hours.
