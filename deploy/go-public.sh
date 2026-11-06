#!/usr/bin/env bash
# One-time: create prod's Cloudflare tunnel and DNS, then promote staging to prod.
#   bash ~/Desktop/Millionaire/AudioBet/deploy/go-public.sh
# After this, promoting is just: scripts/deploy.sh prod
# Touches only the tunnel "umless", its DNS record umless-app.thoufeekxlabs.com, and /opt/umless-prod on the laptop.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
HOST=umless-box
NAME=umless
DOMAIN=umless-app.thoufeekxlabs.com
DIR=/opt/umless-prod

echo "1/3 Cloudflare tunnel '$NAME' + DNS $DOMAIN"
cloudflared tunnel list 2>/dev/null | awk '{print $2}' | grep -qx "$NAME" || cloudflared tunnel create "$NAME" >/dev/null
TID=$(cloudflared tunnel list 2>/dev/null | awk -v n="$NAME" '$2==n{print $1}')
[ -f ~/.cloudflared/"$TID".json ] || { echo "credentials for tunnel $TID not found in ~/.cloudflared" >&2; exit 1; }
cloudflared tunnel route dns "$NAME" "$DOMAIN" 2>&1 | tail -1 || true

echo "2/3 Tunnel config + credentials onto the laptop"
ssh "$HOST" "sudo mkdir -p $DIR/cloudflared && sudo chown -R linuxlite:linuxlite $DIR && chmod 700 $DIR"
sed "s/\${TUNNEL_ID}/$TID/" deploy/cloudflared.yml | ssh "$HOST" "cat > $DIR/cloudflared/config.yml"
scp -q ~/.cloudflared/"$TID".json "$HOST:$DIR/cloudflared/credentials.json"
# cloudflared runs as uid 65532 inside its container
ssh "$HOST" "sudo chown -R 65532:65532 $DIR/cloudflared && sudo chmod 500 $DIR/cloudflared && sudo chmod 400 $DIR/cloudflared/*"

echo "3/3 Promote staging to prod"
exec scripts/deploy.sh prod
