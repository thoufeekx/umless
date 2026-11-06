#!/usr/bin/env bash
# Run ON the Linux Lite laptop, once: make the Umless app (prod) public at https://umless-app.thoufeekxlabs.com.
#   bash /opt/umless-staging/go-public-local.sh
# Installs cloudflared if needed, logs in to Cloudflare (prints a link the first time), creates the tunnel
# "umless" + its DNS record, then promotes what staging runs to prod (/opt/umless-prod).
# Later promotions from the Mac: scripts/deploy.sh prod
set -Eeuo pipefail
NAME=umless
DOMAIN=umless-app.thoufeekxlabs.com
URL=https://$DOMAIN
STAGING=/opt/umless-staging
DIR=/opt/umless-prod

echo "1/4 cloudflared"
if ! command -v cloudflared >/dev/null; then
  curl -fsSL -o /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i /tmp/cloudflared.deb >/dev/null && rm -f /tmp/cloudflared.deb
fi
[ -f ~/.cloudflared/cert.pem ] || { echo "Open the link below and pick thoufeekxlabs.com:"; cloudflared tunnel login; }

echo "2/4 Tunnel '$NAME' + DNS $DOMAIN"
cloudflared tunnel list 2>/dev/null | awk '{print $2}' | grep -qx "$NAME" || cloudflared tunnel create "$NAME" >/dev/null
TID=$(cloudflared tunnel list 2>/dev/null | awk -v n="$NAME" '$2==n{print $1}')
[ -f ~/.cloudflared/"$TID".json ] || { echo "credentials for tunnel $TID are on another machine (~/.cloudflared/$TID.json)" >&2; exit 1; }
cloudflared tunnel route dns "$NAME" "$DOMAIN" 2>&1 | tail -1 || true

echo "3/4 Prod folder, tunnel credentials, keys"
sudo mkdir -p "$DIR/src" "$DIR/cloudflared" && sudo chown -R "$USER:$USER" "$DIR" && chmod 700 "$DIR"
sed "s/\${TUNNEL_ID}/$TID/" "$STAGING/cloudflared.yml" > "$DIR/cloudflared/config.yml"
cp ~/.cloudflared/"$TID".json "$DIR/cloudflared/credentials.json"
sudo chown -R 65532:65532 "$DIR/cloudflared" && sudo chmod 500 "$DIR/cloudflared" && sudo chmod 400 "$DIR"/cloudflared/*
cp "$STAGING/compose.prod.yml" "$DIR/docker-compose.yml"
cp "$STAGING/uninstall.sh" "$DIR/uninstall.sh"
if [ ! -f "$DIR/.env" ]; then
  (umask 077; { grep '^OPENROUTER_API_KEY=' "$STAGING/.env"; echo "ADMIN_KEY=$(openssl rand -hex 16)"; echo "NEXT_PUBLIC_SITE_URL=$URL"; } > "$DIR/.env")
fi

echo "4/4 Promote staging -> prod"
rsync -a --delete "$STAGING/src/" "$DIR/src/"
cd "$DIR"
sudo docker build -q --label com.umless=1 --build-arg NEXT_PUBLIC_SITE_URL="$URL" -t umless-app:prod src >/dev/null
sudo docker compose up -d --wait --remove-orphans
sudo docker compose ps --format 'table {{.Service}}\t{{.Status}}'
for _ in $(seq 1 24); do curl -fsS -m 10 -o /dev/null "$URL/robots.txt" && { echo "LIVE: $URL"; exit 0; }; sleep 5; done
echo "Not answering yet; DNS can take a few minutes. Try $URL shortly."
