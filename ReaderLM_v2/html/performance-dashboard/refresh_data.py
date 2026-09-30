"""Rebuild runs.js from every ReaderLM performance report under output/.

The dashboard reads runs.js so it can open as a local file. A finished test
rewrites this file; reload the page to pick up the new run.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output"
DEST = Path(__file__).resolve().parent / "runs.js"


def publish() -> int:
    runs: list[dict] = []
    errors: list[dict] = []
    if OUTPUT.is_dir():
        for path in sorted(OUTPUT.rglob("*_performance.json")):
            relative = path.relative_to(ROOT).as_posix()
            try:
                report = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                errors.append({"file": relative, "error": str(exc)})
                continue
            if not isinstance(report, dict):
                errors.append({"file": relative, "error": "performance file is not a JSON object"})
                continue
            runs.append(
                {
                    "id": path.parent.name,
                    "folder": path.parent.name,
                    "file": path.name,
                    "relative_path": relative,
                    "report": report,
                }
            )

    seen: dict[str, int] = {}
    for run in runs:
        base = run["id"]
        seen[base] = seen.get(base, 0) + 1
        if seen[base] > 1:
            run["id"] = f"{base}#{seen[base]}"

    runs.sort(key=lambda item: str((item["report"].get("timing") or {}).get("started_at") or ""), reverse=True)
    payload = {
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "run_count": len(runs),
        "errors": errors,
        "runs": runs,
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2).replace("<", "\\u003c")
    DEST.write_text(f"window.READERLM_RUNS = {body};\n", encoding="utf-8")
    return len(runs)


if __name__ == "__main__":
    count = publish()
    print(f"Wrote {DEST} ({count} runs)")
