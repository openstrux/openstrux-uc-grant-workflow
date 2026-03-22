#!/usr/bin/env bash
set -euo pipefail

# reset.sh — Restore repo to initial state (frontend + tests, no backend).
# Clears generated output directories so a new benchmark run can start clean.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Reset to baseline ==="

# Clear generated output
rm -rf "$REPO_ROOT/output/direct/"*
rm -rf "$REPO_ROOT/output/openstrux/"*
rm -rf "$REPO_ROOT/.openstrux/build/"*

# Clear any generated backend files that might have been placed in-tree
# (strux source files written during an openstrux benchmark run)
rm -f "$REPO_ROOT/strux.context"
rm -rf "$REPO_ROOT/pipelines/"*/*.strux
rm -f "$REPO_ROOT/pipelines/strux.context"
rm -f "$REPO_ROOT/specs/"*.strux

# Restore scaffolded directories
mkdir -p "$REPO_ROOT/output/direct"
mkdir -p "$REPO_ROOT/output/openstrux"
mkdir -p "$REPO_ROOT/pipelines/intake"
mkdir -p "$REPO_ROOT/pipelines/eligibility"

echo "Cleared: output/direct/, output/openstrux/, .openstrux/build/"
echo "Cleared: strux.context, pipelines/*.strux, specs/*.strux"
echo ""
echo "Ready for a new benchmark run."
