#!/usr/bin/env python3
"""
cc-stop-hook.py — Claude Code Stop hook for benchmark token capture.

Defined at project level in .claude/settings.json so it is always present
in the worktree — no dynamic injection by the runner required.

Reads the result-dir from .claude/bench-config.json (written by generate.ts
at prompt-generation time).  Exits 0 on any error — token capture is
best-effort and must never cause the CC session to loop.

Invoked by the CC hook system; never call directly.
Stdin: JSON object { transcript_path, session_id, ... }
"""
import json
import os
import sys
import time
from datetime import datetime, timezone


def load_config() -> dict:
    """Read .claude/bench-config.json, return {} if missing or malformed."""
    try:
        with open(".claude/bench-config.json") as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError):
        return {}


def sum_tokens(path: str) -> tuple[int, int, int]:
    """Return (input_tokens, output_tokens, turns) parsed from a JSONL transcript."""
    inp = out = turns = 0
    try:
        with open(path) as fh:
            for raw in fh:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    rec = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                msg = rec.get("message")
                if not isinstance(msg, dict):
                    continue
                if msg.get("role") != "assistant":
                    continue
                usage = msg.get("usage")
                if not usage:
                    continue
                inp += (
                    (usage.get("input_tokens") or 0)
                    + (usage.get("cache_creation_input_tokens") or 0)
                    + (usage.get("cache_read_input_tokens") or 0)
                )
                out += usage.get("output_tokens") or 0
                turns += 1
    except OSError:
        pass
    return inp, out, turns


def first_timestamp(path: str) -> float:
    """Return the Unix timestamp of the first timestamped record, or now."""
    try:
        with open(path) as fh:
            for raw in fh:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    rec = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                ts = rec.get("timestamp")
                if ts:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    return dt.timestamp()
    except OSError:
        pass
    return time.time()


def main() -> None:
    hook_input: dict = {}
    try:
        hook_input = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, OSError):
        pass

    config = load_config()
    result_dir: str = config.get("resultDir", "")
    if not result_dir:
        # No bench-config.json — not a benchmark run; exit silently.
        sys.exit(0)

    transcript_path: str = hook_input.get("transcript_path", "")
    if not transcript_path or not os.path.exists(transcript_path):
        # No transcript yet (e.g. very first stop of the session).
        sys.exit(0)

    # Main session tokens
    total_inp, total_out, total_turns = sum_tokens(transcript_path)

    # Subagent tokens — stored at <transcript_dir>/<session_id>/subagents/*.jsonl
    session_id = os.path.splitext(os.path.basename(transcript_path))[0]
    subagents_dir = os.path.join(os.path.dirname(transcript_path), session_id, "subagents")
    if os.path.isdir(subagents_dir):
        for fname in sorted(os.listdir(subagents_dir)):
            if fname.endswith(".jsonl"):
                si, so, _ = sum_tokens(os.path.join(subagents_dir, fname))
                total_inp += si
                total_out += so

    # Elapsed time: first timestamped record → now
    start_ts = first_timestamp(transcript_path)
    time_seconds = round(time.time() - start_ts, 1)

    meta = {
        "model": hook_input.get("model", ""),
        "provider": "anthropic",
        "inputTokens": total_inp,
        "outputTokens": total_out,
        "turns": total_turns,
        "retries": total_turns,
        "exitSubtype": "success",
        "timeSeconds": time_seconds,
    }

    out_path = os.path.join(result_dir, "generation-meta.json")
    try:
        os.makedirs(result_dir, exist_ok=True)
        with open(out_path, "w") as fh:
            json.dump(meta, fh, indent=2)
            fh.write("\n")
        print(
            f"[cc-stop-hook] Wrote {out_path} — "
            f"in={total_inp} out={total_out} time={time_seconds}s turns={total_turns}",
            flush=True,
        )
    except OSError as exc:
        # Best-effort only — log the warning but always exit 0 so CC
        # does not feed the error back and trigger an "Acknowledged." loop.
        print(f"[cc-stop-hook] Warning: could not write {out_path}: {exc}", file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
