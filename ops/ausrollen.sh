#!/bin/bash
# Holt das neueste GitHub-Release von NicksAdvisory/lintelly-hr-deutschland und rollt es auf hr.lintelly.com aus (cron alle 10 Minuten).
# Ablauf: Prüfsumme prüfen, neben die alte Fassung legen, umschalten, neu starten, /health prüfen, sonst zurück auf die alte.
# Meldung per Telegram bei Erfolg und Fehler. Freigabe: _kanon/freigaben.md, Zeile „Lintelly HR“.
set -euo pipefail
D=/home/nick/lintelly-hr
REPO=NicksAdvisory/lintelly-hr-deutschland
DATEI=lintelly-hr-mcp-server.mjs
. /home/nick/n8n/telegram.env
melde() { curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d chat_id="$TELEGRAM_CHAT_ID" --data-urlencode text="$1" >/dev/null || true; }

tag=$(curl -sf "https://api.github.com/repos/$REPO/releases/latest" | python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"])')
[ -n "$tag" ] || exit 0
alt=$(readlink "$D/aktuell" 2>/dev/null | xargs -r basename || true)
[ "$alt" = "$tag" ] && exit 0

neu="$D/releases/$tag"
mkdir -p "$neu" "$D/zaehler"
basis="https://github.com/$REPO/releases/download/$tag"
curl -sfL "$basis/$DATEI" -o "$neu/$DATEI"
curl -sfL "$basis/$DATEI.sha256" -o "$neu/$DATEI.sha256"
(cd "$neu" && sha256sum -c "$DATEI.sha256" >/dev/null) || { melde "Lintelly HR $tag: Prüfsumme falsch, nicht ausgerollt."; rm -rf "$neu"; exit 1; }

ln -sfn "$neu" "$D/aktuell"
sudo -n systemctl restart lintelly-hr
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 2
  v=$(curl -sf http://127.0.0.1:3610/health | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])' 2>/dev/null || true)
  [ "v$v" = "$tag" ] && { melde "Lintelly HR $tag ist live auf hr.lintelly.com (vorher ${alt:-keine})."; ls -1dt "$D"/releases/* | tail -n +6 | xargs -r rm -rf; exit 0; }
done

if [ -n "$alt" ] && [ -d "$D/releases/$alt" ]; then
  ln -sfn "$D/releases/$alt" "$D/aktuell"
  sudo -n systemctl restart lintelly-hr
  melde "Lintelly HR $tag: /health nicht grün, zurück auf $alt."
else
  melde "Lintelly HR $tag: /health nicht grün, keine alte Fassung zum Zurückspringen."
fi
exit 1
