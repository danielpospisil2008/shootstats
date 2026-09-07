#!/usr/bin/env bash
# Serve the app locally at http://localhost:8000
#
# Why a server instead of opening index.html directly: with a file:// URL the
# page has an opaque origin, so Firebase Auth (and localStorage) refuse to work.
# http://localhost is already an authorized domain in Firebase Auth by default,
# so sign-in behaves the same as production.
set -euo pipefail
PORT="${1:-8000}"
cd "$(dirname "$0")"
echo "Shootstats -> http://localhost:${PORT}  (Ctrl+C to stop)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
