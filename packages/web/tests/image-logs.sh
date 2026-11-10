#!/usr/bin/env bash
# Builds the web image, sends it requests with an X-Forwarded-For, and fails when a line of the
# container's logs holds a client's address: mise run web:test-image
set -euo pipefail

root=$(cd "$(dirname "$0")/../../.." && pwd)
visitor=203.0.113.7
image=guessir-web-test-image

docker build -q -t "$image" -f "$root/packages/web/Dockerfile" "$root" >/dev/null
container=$(docker run -d "$image")
trap 'docker rm -f "$container" >/dev/null; docker rmi "$image" >/dev/null' EXIT

# The requests come from inside the container, so the check needs no published port. nginx then
# sees 127.0.0.1 as the client's address.
get() {
  docker exec "$container" wget -q -O /dev/null --header "X-Forwarded-For: $visitor" "http://127.0.0.1$1"
}
for _ in $(seq 50); do
  get / 2>/dev/null && break
  sleep 0.2
done
get /
! get /missing 2>/dev/null || { echo "✕ /missing did not fail as a missing file" >&2; exit 1; }
# Docker reads the container's output on its own, so the last lines may arrive a moment late
sleep 1

if docker logs "$container" 2>&1 | grep -nE "$visitor|127\.0\.0\.1"; then
  echo "✕ the lines above of the web image's logs hold a client's address" >&2
  exit 1
fi
echo "✓ the web image's logs hold no client's address"
