#!/usr/bin/env bash
# Remove Umless from this machine: both envs' compose projects (containers, networks, data volumes),
# their images and /opt/umless-staging + /opt/umless-prod. Run: bash /opt/umless-staging/uninstall.sh [--yes]
set -Eeuo pipefail
[ "${1:-}" = "--yes" ] || { read -r -p "This deletes Umless staging + prod and their waitlist data. Type DELETE: " a; [ "$a" = DELETE ] || exit 1; }
for env in staging prod; do
  d=/opt/umless-$env
  [ -d "$d" ] && (cd "$d" && sudo docker compose down --volumes --remove-orphans) || true
done
for kind in container volume network; do
  all=""; [ $kind = container ] && all="-a"
  ids=$(sudo docker $kind ls $all -q --filter label=com.umless=1 2>/dev/null || true)
  [ -n "$ids" ] && sudo docker $kind rm -f $ids >/dev/null 2>&1 || true
done
sudo docker image ls umless-app -q | sort -u | xargs -r sudo docker image rm -f >/dev/null 2>&1 || true
sudo rm -rf /opt/umless-staging /opt/umless-prod
echo "Umless removed. The Cloudflare tunnel 'umless' and its DNS record live in Cloudflare."
