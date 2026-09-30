"""Send samples/gistfile1.txt to a local ReaderLM-v2 server for JSON extraction.

Procedure: documentation/running-tests.md and documentation/prompting.md.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

import lmstudio_client
import perf_stats
import readerlm

_UNSAFE_PATH = re.compile(r'[<>:"/\\|?*\x00-\x1f]+')


def configure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


def build_message(args: argparse.Namespace, sample_text: str) -> tuple[str, str]:
    """Return (user message, a short log of how it was built)."""
    if args.as_is:
        return sample_text, "Sending the sample file unchanged."

    parts = readerlm.parse_prompt_file(sample_text)
    html = parts["html"] or ""
    notes = []
    if args.clean:
        before = len(html)
        html = readerlm.clean_html(html, clean_svg=args.clean_svg, clean_base64=args.clean_base64)
        notes.append(f"Cleaned HTML from {before} to {len(html)} characters.")
    else:
        notes.append("Left HTML uncleaned.")

    schema = parts["schema"]
    if not schema:
        raise SystemExit("The sample has no ```json schema fence. Nothing to extract.")

    schema, added = readerlm.repair_json_schema(schema)
    if added:
        notes.append(f"Repaired schema by adding {added} closing brace(s).")
    else:
        notes.append("Schema parsed without added braces.")

    if args.news_instruction:
        instruction = readerlm.DEFAULT_JSON_INSTRUCTION
        notes.append("Using the model-card news-thread instruction.")
    else:
        instruction = parts["instruction"] or readerlm.DEFAULT_JSON_INSTRUCTION
        notes.append("Using the instruction stored in the sample file.")

    message = readerlm.create_user_content(html, instruction=instruction, schema=schema)
    return message, " ".join(notes)


def path_token(value: str) -> str:
    """A single path segment that Windows can store."""
    token = _UNSAFE_PATH.sub("-", value.strip())
    token = re.sub(r"\s+", "-", token)
    token = re.sub(r"-{2,}", "-", token).strip(".-")
    return token or "unnamed"


def run_stamp() -> str:
    now = datetime.now()
    return now.strftime("%Y-%m-%d_%H%M%S") + f"-{now.microsecond // 1000:03d}"


def run_folder_name(
    stamp: str,
    sample_stem: str,
    *,
    model: str | None = None,
    clean: bool = True,
    as_is: bool = False,
    news_instruction: bool = False,
    dry_run: bool = False,
) -> str:
    """Timestamp first so folders sort in run order, then what the run was."""
    parts = [stamp, "json", path_token(sample_stem)]
    if model:
        parts.append(path_token(model))
    if as_is:
        parts.append("as-is")
    elif clean:
        parts.append("cleaned")
    else:
        parts.append("raw-html")
    if news_instruction:
        parts.append("news-instruction")
    if dry_run:
        parts.append("dry-run")
    return "_".join(parts)


def create_run_dir(sample_stem: str, **flags) -> tuple[Path, str]:
    stamp = run_stamp()
    root = readerlm.OUTPUT_DIR
    root.mkdir(parents=True, exist_ok=True)
    folder = root / run_folder_name(stamp, sample_stem, **flags)
    extra = 2
    while folder.exists():
        folder = root / f"{run_folder_name(stamp, sample_stem, **flags)}_{extra}"
        extra += 1
    folder.mkdir()
    return folder, stamp


def artifact_paths(folder: Path, stamp: str, sample_stem: str) -> tuple[Path, Path, Path, Path]:
    token = path_token(sample_stem)
    return (
        folder / f"{stamp}_{token}_prompt.txt",
        folder / f"{stamp}_{token}_response.txt",
        folder / f"{stamp}_{token}.json",
        folder / f"{stamp}_{token}_performance.json",
    )


def adopt_model(folder: Path, stamp: str, sample_stem: str, model: str, **flags) -> Path:
    renamed = folder.parent / run_folder_name(stamp, sample_stem, model=model, **flags)
    if renamed == folder or renamed.exists():
        return folder
    folder.rename(renamed)
    return renamed


def execute_json_run(
    message: str,
    sample_stem: str,
    *,
    base_url: str,
    api_key: str,
    model: str | None,
    temperature: float,
    repeat_penalty: float,
    max_tokens: int,
    timeout: float,
    clean: bool = True,
    as_is: bool = False,
    news_instruction: bool = False,
    dry_run: bool = False,
) -> dict:
    """Write a run folder, call LM Studio, and return the parsed seasons array.

    ``rows`` is the parsed array only when it matches the seasons schema.
    ``LMStudioError`` is left to the caller.
    """
    flags = {
        "clean": clean,
        "as_is": as_is,
        "news_instruction": news_instruction,
        "dry_run": dry_run,
    }
    run_dir, stamp = create_run_dir(sample_stem, **flags)
    prompt_path, response_path, parsed_path, performance_path = artifact_paths(run_dir, stamp, sample_stem)
    prompt_path.write_text(message, encoding="utf-8")

    estimate = readerlm.rough_token_estimate(message)
    print(f"User message: {len(message)} characters, roughly {estimate} tokens.")
    print(f"Set LM Studio context above {estimate + max_tokens} tokens (estimate plus max_tokens).")
    print(f"Run folder: {run_dir}")
    print(f"Wrote {prompt_path}")

    if dry_run:
        print("Dry run. LM Studio was not called.")
        return {
            "exit_code": 0,
            "folder_name": run_dir.name,
            "rows": None,
            "detail": "Dry run. LM Studio was not called.",
            "finish_reason": None,
            "error": None,
            "warning": None,
        }

    resolved = lmstudio_client.resolve_model(base_url, api_key, model, timeout=min(timeout, 30))
    run_dir = adopt_model(run_dir, stamp, sample_stem, resolved, **flags)
    prompt_path, response_path, parsed_path, performance_path = artifact_paths(run_dir, stamp, sample_stem)
    print(f"Run folder: {run_dir}")
    print(f"Requesting JSON from {base_url} model={resolved} max_tokens={max_tokens} temperature={temperature}")
    text, report = perf_stats.measure_chat(
        base_url=base_url,
        api_key=api_key,
        model=resolved,
        user_content=message,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        repeat_penalty=repeat_penalty,
        prompt_characters=len(message),
    )
    response_path.write_text(text, encoding="utf-8")
    finish = report["result"].get("finish_reason")
    speed = report["speed"]
    print(
        f"finish_reason={finish} "
        f"tokens/s={speed.get('tokens_per_second')} "
        f"ttft_s={speed.get('time_to_first_token_seconds')} "
        f"wall_s={speed.get('wall_clock_seconds')}"
    )
    print(f"Wrote {response_path}")

    warning = None
    if finish == "length":
        warning = "The server stopped because max_tokens was reached. The array may be cut off."
        print("The server stopped because max_tokens was reached. Raise --max-tokens if the array is cut off.")

    try:
        value = readerlm.extract_json_value(text)
    except (ValueError, json.JSONDecodeError) as exc:
        report["result"]["json_parsed"] = False
        report["result"]["schema_ok"] = False
        report["result"]["schema_detail"] = str(exc)
        text_path = perf_stats.write_performance(performance_path, report)
        print(f"Could not parse JSON from the assistant text: {exc}")
        print(f"Wrote {performance_path}")
        print(f"Wrote {text_path}")
        return {
            "exit_code": 2,
            "folder_name": run_dir.name,
            "rows": None,
            "detail": str(exc),
            "finish_reason": finish,
            "error": f"Could not parse JSON from the assistant text: {exc}",
            "warning": warning,
        }

    parsed_path.write_text(json.dumps(value, indent=2), encoding="utf-8")
    print(f"Wrote {parsed_path}")
    ok, detail = readerlm.json_rows_match_schema(value)
    report["result"]["json_parsed"] = True
    report["result"]["json_object_count"] = len(value) if isinstance(value, list) else None
    report["result"]["schema_ok"] = ok
    report["result"]["schema_detail"] = detail
    text_path = perf_stats.write_performance(performance_path, report)
    print(detail)
    print(f"Wrote {performance_path}")
    print(f"Wrote {text_path}")
    return {
        "exit_code": 0 if ok else 2,
        "folder_name": run_dir.name,
        "rows": value if ok else None,
        "detail": detail,
        "finish_reason": finish,
        "error": None if ok else detail,
        "warning": warning,
    }


def main() -> int:
    configure_stdio()
    parser = argparse.ArgumentParser(description="HTML-to-JSON test of ReaderLM-v2 through LM Studio.")
    parser.add_argument("--sample", type=Path, default=readerlm.DEFAULT_SAMPLE, help="Prompt file. Default: samples/gistfile1.txt")
    parser.add_argument("--base-url", default=lmstudio_client.base_url_from_env())
    parser.add_argument("--api-key", default=lmstudio_client.api_key_from_env())
    parser.add_argument("--model", default=lmstudio_client.model_from_env(), help="LM Studio model id. Default: an id containing 'reader'.")
    parser.add_argument("--temperature", type=float, default=readerlm.TEMPERATURE)
    parser.add_argument("--repeat-penalty", type=float, default=readerlm.REPEAT_PENALTY)
    parser.add_argument("--max-tokens", type=int, default=2048, help="New tokens. Model-card examples use 1024; 2048 fits this table better.")
    parser.add_argument("--timeout", type=float, default=600)
    parser.add_argument("--dry-run", action="store_true", help="Write the prompt and skip the server.")
    parser.add_argument("--as-is", action="store_true", help="Send the file text without cleaning or rebuilding.")
    parser.add_argument("--no-clean", action="store_false", dest="clean", help="Keep scripts and styles inside the rebuilt prompt.")
    parser.add_argument("--clean-svg", action="store_true")
    parser.add_argument("--clean-base64", action="store_true")
    parser.add_argument("--news-instruction", action="store_true", help="Use the model-card Hacker News instruction instead of the sample's.")
    parser.set_defaults(clean=True)
    args = parser.parse_args()

    sample_path = args.sample.resolve()
    sample_text = sample_path.read_text(encoding="utf-8")
    message, notes = build_message(args, sample_text)
    print(notes)
    result = execute_json_run(
        message,
        sample_path.stem,
        base_url=args.base_url,
        api_key=args.api_key,
        model=args.model,
        temperature=args.temperature,
        repeat_penalty=args.repeat_penalty,
        max_tokens=args.max_tokens,
        timeout=args.timeout,
        clean=args.clean,
        as_is=args.as_is,
        news_instruction=args.news_instruction,
        dry_run=args.dry_run,
    )
    return result["exit_code"]


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except lmstudio_client.LMStudioError as exc:
        print(exc, file=sys.stderr)
        raise SystemExit(1)
