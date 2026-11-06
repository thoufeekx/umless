#!/usr/bin/env bash
# Deploy Umless to the Linux Lite laptop (ssh alias umless-box).
#   scripts/deploy.sh staging   push this Mac's code to staging (private, http://100.98.47.6:3210 over Tailscale)
#   scripts/deploy.sh prod      promote exactly what staging runs to prod (public, https://umless-app.thoufeekxlabs.com)
# Each env has its own folder /opt/umless-<env>, compose project, image tag and data volume.
# Prod needs its tunnel credentials first: run deploy/go-public.sh once.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
ENV=${1:-}
HOST=umless-box
[ "$ENV" = staging ] || [ "$ENV" = prod ] || { echo "usage: scripts/deploy.sh staging|prod" >&2; exit 1; }
DIR=/opt/umless-$ENV
if [ "$ENV" = staging ]; then URL=http://100.98.47.6:3210; else URL=https://umless-app.thoufeekxlabs.com; fi

ssh "$HOST" "sudo mkdir -p $DIR/src && sudo chown linuxlite:linuxlite $DIR $DIR/src && chmod 700 $DIR"
if [ "$ENV" = staging ]; then
  echo "1/3 Upload this Mac's code to staging"
  rsync -az --delete --exclude-from=deploy/rsync-exclude.txt ./ "$HOST:$DIR/src/"
else
  ssh "$HOST" "test -f $DIR/cloudflared/credentials.json" || { echo "prod has no tunnel yet: run deploy/go-public.sh once" >&2; exit 1; }
  echo "1/3 Promote staging's code to prod"
  ssh "$HOST" "rsync -a --delete /opt/umless-staging/src/ $DIR/src/"
fi
rsync -az deploy/compose.$ENV.yml "$HOST:$DIR/docker-compose.yml"
rsync -az deploy/uninstall.sh "$HOST:$DIR/uninstall.sh"

# First deploy of an env: start its .env from the other env's keys with a fresh admin key.
ssh "$HOST" "set -e; cd $DIR
  if [ ! -f .env ]; then
    src=\$(ls /opt/umless-staging/.env /opt/umless-prod/.env 2>/dev/null | head -1)
    umask 077; { grep '^OPENROUTER_API_KEY=' \$src; echo ADMIN_KEY=\$(openssl rand -hex 16); echo NEXT_PUBLIC_SITE_URL=$URL; } > .env
  fi
  sed -i 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$URL|' .env"

echo "2/3 Build umless-app:$ENV and start"
ssh "$HOST" "set -e; cd $DIR
  if sudo docker image inspect umless-app:$ENV >/dev/null 2>&1; then sudo docker tag umless-app:$ENV umless-app:$ENV-previous; fi
  sudo docker build -q --label com.umless=1 --build-arg NEXT_PUBLIC_SITE_URL=$URL -t umless-app:$ENV src >/dev/null
  sudo docker compose up -d --wait --remove-orphans
  sudo docker compose ps --format 'table {{.Service}}\t{{.Status}}'"

echo "3/3 Check $URL"
for _ in $(seq 1 20); do curl -fsS -m 10 -o /dev/null "$URL/robots.txt" && { echo "OK: $ENV live at $URL"; exit 0; }; sleep 5; done
echo "$URL not answering yet" >&2; exit 1
