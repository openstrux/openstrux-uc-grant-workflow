#!/usr/bin/env bash
set -euo pipefail

# view-results.sh — Start local dev server for the results viewer page.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$REPO_ROOT/app/web"

if [[ ! -d "$WEB_DIR/node_modules" ]]; then
  echo "Installing dependencies..."
  (cd "$WEB_DIR" && pnpm install)
fi

echo "Starting dev server — results viewer at http://localhost:3000/results"
cd "$WEB_DIR" && pnpm dev
