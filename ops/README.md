# Betrieb auf ops-01

hr.lintelly.com läuft auf ops-01 (nie auf dem Kunden-Server), hinter Caddy, als systemd-Dienst `lintelly-hr` auf 127.0.0.1:3610.

| Datei | Ziel auf ops-01 |
|---|---|
| `lintelly-hr.service` | `/etc/systemd/system/lintelly-hr.service` |
| `lintelly-hr.caddy` | `/etc/caddy/lintelly-hr.caddy`, im Caddyfile `import /etc/caddy/lintelly-hr.caddy` |
| `ausrollen.sh` | `~/lintelly-hr/ausrollen.sh`, cron `*/10 * * * *` |
| `health-ping.sh` | `~/lintelly-hr/health-ping.sh`, cron `*/5 * * * *` |
| `abgleich.sh` | `~/lintelly-hr/abgleich.sh`, cron `10 5 2 * *` (2. des Monats): Werkbank und Website holen, Kern abgleichen, Pull Request; Merge nur bei reinen Rechtswerten und grünen Tests |
| `kennzahlen.mjs` | `~/lintelly-hr/kennzahlen.mjs`, cron `0 9 1 * *` (1. des Monats): Kennzahlen des Vormonats per Telegram |

Ordner `~/lintelly-hr/`: `releases/<tag>/` (die letzten fünf), `aktuell` (Verweis), `zaehler/<tag>.json` (Zähler je Tag), `env` (optional,
z. B. `OPENAI_APPS_CHALLENGE=...` für den Domain-Nachweis bei OpenAI).

Ausrollen: Ein Release auf GitHub (`.github/workflows/release.yml`) legt `lintelly-hr-mcp-server.mjs` und die Prüfsumme an.
`ausrollen.sh` holt es, prüft die Prüfsumme, schaltet um, startet neu, prüft `/health` und springt sonst zurück. Telegram meldet beides.
Kein Zugriffslog in Caddy, der Dienst schreibt keine Eingaben. Bremse je Adresse im Dienst (120 je Minute, 1.200 insgesamt).
