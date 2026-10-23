#!/bin/bash
# Monatlicher Abgleich (Plan Abschnitt 7): holt Werkbank und lintelly.com, zieht geänderte Rechtswerte und Rechner mit
# scripts/abgleich.mjs in packages/kern, setzt die nächste Patch-Version und öffnet einen Pull Request im offenen Repo.
# Gemergt wird automatisch nur, wenn sich ausschließlich Rechtswerte geändert haben und alle Tests grün sind (die Tests prüfen
# auch, dass jede Fundstelle amtlich ist). Alles andere bleibt als Pull Request für Nick. Freigabe: _kanon/freigaben.md „Lintelly HR“.
# cron auf ops-01: am 2. jedes Monats, nach der Rechtswerte-Prüfung vom 1. Meldung per Telegram.
set -uo pipefail
D=$HOME/lintelly-hr
Q=$D/quellen
R=$D/repo
. "$HOME/n8n/telegram.env"
melde() { curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d chat_id="$TELEGRAM_CHAT_ID" --data-urlencode text="$1" >/dev/null || true; }
fehler() { melde "Lintelly HR Abgleich: $1 (Log ~/logs/lintelly-hr-abgleich.log auf ops-01)"; exit 1; }

holen() {
  [ -d "$2/.git" ] || git clone -q "$1" "$2" || return 1
  # -f und clean: Reste eines abgebrochenen Laufs dürfen den nächsten nicht blockieren.
  git -C "$2" fetch -q origin main && git -C "$2" checkout -q -f main && git -C "$2" reset -q --hard origin/main && git -C "$2" clean -fdq
}
mkdir -p "$Q"
holen https://github.com/NicksAdvisory/lintelly-werkbank.git "$Q/werkbank" || fehler "Werkbank nicht geholt"
holen https://github.com/NicksAdvisory/lintelly-web.git "$Q/website" || fehler "Website nicht geholt"
holen https://github.com/NicksAdvisory/lintelly-hr-deutschland.git "$R" || fehler "lintelly-hr nicht geholt"
cd "$R" || exit 1

WERKBANK="$Q/werkbank" WEBSITE="$Q/website" node scripts/abgleich.mjs > /dev/null || fehler "abgleich.mjs gescheitert"
geaendert=$(git status --porcelain -- packages/kern | awk '{print $2}')
if [ -z "$geaendert" ]; then
  melde "Lintelly HR Abgleich $(date +%m/%Y): Der Kern ist auf dem Stand von Werkbank und lintelly.com, nichts zu tun."
  exit 0
fi

alt=$(node -p "require('./packages/mcp/package.json').version")
neu=$(echo "$alt" | awk -F. '{print $1"."$2"."$3+1}')
node scripts/version.mjs "$neu" > /dev/null
dateien=$(echo "$geaendert" | sed 's#packages/kern/##' | tr '\n' ' ')
node -e 'const fs=require("fs");const p="CHANGELOG.md";fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace(/\n- \n/,`\n- Monatlicher Abgleich mit Werkbank und lintelly.com: ${process.argv[1]}\n`))' "$dateien"

npm ci --silent > /dev/null 2>&1 && npm run --silent check > /dev/null 2>&1 && gruen=ja || gruen=nein
nur_rechtswerte=ja
for f in $geaendert; do case "$f" in packages/kern/werkbank/lib/regeln/werte.ts|packages/kern/werkbank/lib/regeln/register.ts|packages/kern/werkbank/lib/regeln/fundstellen.ts) ;; *) nur_rechtswerte=nein ;; esac; done

zweig="abgleich-$(date +%Y-%m)"
git checkout -q -B "$zweig"
git add packages/kern packages/mcp/package.json server.json plugins/claude/.claude-plugin/plugin.json plugins/agent/plugin.json plugins/cursor/.cursor-plugin/plugin.json .cursor-plugin/marketplace.json .claude-plugin/marketplace.json CHANGELOG.md
git -c user.name="Nick Schäfer" -c user.email="nick@nicksadvisory.com" commit -q -m "Abgleich $(date +%m/%Y): $dateien" || fehler "Commit gescheitert"
git push -q -f -u origin "$zweig" || fehler "Push gescheitert"
url=$(gh pr create --head "$zweig" --base main --title "Abgleich $(date +%m/%Y): Version $neu" \
  --body "Monatlicher Abgleich mit Werkbank und lintelly.com (ops/abgleich.sh). Geändert: $dateien. Tests: $gruen. Nur Rechtswerte: $nur_rechtswerte." 2>/dev/null \
  || gh pr view "$zweig" --json url --jq .url)

if [ "$gruen" = ja ] && [ "$nur_rechtswerte" = ja ]; then
  gh pr merge "$url" --squash --delete-branch > /dev/null && melde "Lintelly HR Abgleich: neue Rechtswerte ($dateien), Tests grün, gemergt. Release $neu läuft über die Pipeline, hr.lintelly.com zieht in 10 Minuten nach. $url" \
    || melde "Lintelly HR Abgleich: Merge gescheitert, bitte prüfen: $url"
else
  melde "Nick, Lintelly HR Abgleich: Änderungen außer Rechtswerten oder Tests rot (Tests: $gruen). Bitte prüfen und mergen: $url"
fi
