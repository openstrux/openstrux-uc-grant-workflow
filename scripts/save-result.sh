#!/usr/bin/env bash
set -euo pipefail

# save-result.sh — Archive a benchmark run: zip generated files, snapshot prompts used,
# create benchmark JSON, prompt for manual input, store in results/

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- Select path ---
if [[ -z "${1:-}" ]]; then
  echo "Usage: scripts/save-result.sh <direct|openstrux>"
  exit 1
fi

PATH_NAME="$1"
case "$PATH_NAME" in
  direct)    OUTPUT_DIR="$REPO_ROOT/output/direct" ;;
  openstrux) OUTPUT_DIR="$REPO_ROOT/.openstrux/build" ;;
  *)         echo "Error: path must be 'direct' or 'openstrux'"; exit 1 ;;
esac

if [[ ! -d "$OUTPUT_DIR" ]] || [[ -z "$(ls -A "$OUTPUT_DIR" 2>/dev/null)" ]]; then
  echo "Error: $OUTPUT_DIR is empty or does not exist. Run generation first."
  exit 1
fi

# --- Auto-populate fields ---
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DATE_SLUG="$(date -u +%Y%m%d-%H%M%S)"
RESULT_DIR="$REPO_ROOT/results/${DATE_SLUG}-${PATH_NAME}"
FILE_COUNT="$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')"
TOTAL_LINES="$(find "$OUTPUT_DIR" -type f -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')"

# --- Compute prompt version (git hash of prompts/) ---
PROMPT_VERSION="$(cd "$REPO_ROOT" && git log -1 --format=%h -- prompts/ 2>/dev/null || echo "uncommitted")"

# --- Prompt for manual input ---
echo ""
echo "=== Save Benchmark Result: $PATH_NAME ==="
echo ""
echo "Generated files: $FILE_COUNT ($TOTAL_LINES lines)"
echo "Prompt version:  $PROMPT_VERSION"
echo ""

read -rp "LLM model used: " LLM
read -rp "Test results (e.g., 12/14 pass): " TEST_RESULTS
read -rp "Result note: " RESULT_NOTE
echo "Feedback (press Ctrl-D when done):"
FEEDBACK="$(cat)"

# --- Create result directory ---
mkdir -p "$RESULT_DIR"

# --- Zip generated files ---
ZIP_FILE="$RESULT_DIR/generated.zip"
(cd "$OUTPUT_DIR" && zip -r "$ZIP_FILE" . -x '*.DS_Store' > /dev/null)
echo ""
echo "Zipped generated files to $ZIP_FILE"

# --- Also zip manual gap-fills for openstrux path ---
if [[ "$PATH_NAME" == "openstrux" ]] && [[ -d "$REPO_ROOT/output/openstrux" ]] && [[ -n "$(ls -A "$REPO_ROOT/output/openstrux" 2>/dev/null)" ]]; then
  GAPFILL_ZIP="$RESULT_DIR/gapfills.zip"
  (cd "$REPO_ROOT/output/openstrux" && zip -r "$GAPFILL_ZIP" . -x '*.DS_Store' > /dev/null)
  echo "Zipped gap-fill files to $GAPFILL_ZIP"
fi

# --- Snapshot prompts used ---
PROMPTS_ZIP="$RESULT_DIR/prompts.zip"
(cd "$REPO_ROOT" && zip -r "$PROMPTS_ZIP" \
  prompts/shared/ \
  "prompts/$PATH_NAME/" \
  specs/prompt-contract.md \
  -x '*.DS_Store' > /dev/null)
echo "Snapshotted prompts to $PROMPTS_ZIP"

# --- Write benchmark JSON ---
cat > "$RESULT_DIR/benchmark.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "path": "$PATH_NAME",
  "promptVersion": "$PROMPT_VERSION",
  "llm": "$LLM",
  "generatedFileCount": $FILE_COUNT,
  "totalLines": $TOTAL_LINES,
  "testResults": "$TEST_RESULTS",
  "resultNote": "$RESULT_NOTE",
  "feedback": $(printf '%s' "$FEEDBACK" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')
}
EOF

echo "Wrote $RESULT_DIR/benchmark.json"
echo ""
echo "Done. View results at /results in the web app."
