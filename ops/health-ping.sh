#!/bin/bash
# Health-Ping für hr.lintelly.com (cron alle 5 Minuten). Meldet per Telegram nur beim Wechsel: ausgefallen und wieder da.
S=/home/nick/lintelly-hr/health.stand
. /home/nick/n8n/telegram.env
melde() { curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d chat_id="$TELEGRAM_CHAT_ID" --data-urlencode text="$1" >/dev/null || true; }
if curl -sf --max-time 10 https://hr.lintelly.com/health | grep -q '"ok":true'; then jetzt=ok; else jetzt=aus; fi
vorher=$(cat "$S" 2>/dev/null || echo ok)
[ "$jetzt" = "$vorher" ] && exit 0
echo "$jetzt" > "$S"
[ "$jetzt" = aus ] && melde "Nick, Lintelly HR ist nicht erreichbar: https://hr.lintelly.com/health antwortet nicht. Log: journalctl -u lintelly-hr auf ops-01." \
  || melde "Lintelly HR ist wieder erreichbar (https://hr.lintelly.com/health)."
