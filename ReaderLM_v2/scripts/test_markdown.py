"""HTML-to-Markdown smoke test against LM Studio.

With no --file, this sends the one-line HTML example from the ReaderLM-v2
model card. With --file, HTML is taken from that file (a raw page or a
fenced prompt such as samples/gistfile1.txt) and converted to Markdown.

See documentation/running-tests.md.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import lmstudio_client
import readerlm

DEMO_HTML = "<html><body><h1>Hello, world!</h1></body></html>"


def configure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


def html_from_file(path: Path, clean: bool, clean_svg: bool, clean_base64: bool) -> tuple[str, str]:
    raw = path.read_text(encoding="utf-8")
    parts = readerlm.parse_prompt_file(raw)
    html = parts["html"] or ""
    notes = []
    if parts["instruction"] or parts["schema"]:
        notes.append("File has its own instruction or schema. This script uses the Markdown instruction instead.")
    if clean:
        before = len(html)
        html = readerlm.clean_html(html, clean_svg=clean_svg, clean_base64=clean_base64)
        notes.append(f"Cleaned HTML from {before} to {len(html)} characters.")
    else:
        notes.append("Left HTML uncleaned.")
    return html, " ".join(notes)


def main() -> int:
    configure_stdio()
    parser = argparse.ArgumentParser(description="HTML-to-Markdown test of ReaderLM-v2 through LM Studio.")
    parser.add_argument("--file", type=Path, help="HTML file or a fenced prompt. Default: the model-card hello-world page.")
    parser.add_argument("--base-url", default=lmstudio_client.base_url_from_env())
    parser.add_argument("--api-key", default=lmstudio_client.api_key_from_env())
    parser.add_argument("--model", default=lmstudio_client.model_from_env())
    parser.add_argument("--temperature", type=float, default=readerlm.TEMPERATURE)
    parser.add_argument("--repeat-penalty", type=float, default=readerlm.REPEAT_PENALTY)
    parser.add_argument("--max-tokens", type=int, default=None, help="Default 1024 for the demo, 4096 when --file is set.")
    parser.add_argument("--timeout", type=float, default=600)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--no-clean", action="store_false", dest="clean")
    parser.add_argument("--clean-svg", action="store_true")
    parser.add_argument("--clean-base64", action="store_true")
    parser.add_argument("--instruction", default=readerlm.DEFAULT_MARKDOWN_INSTRUCTION)
    parser.set_defaults(clean=True)
    args = parser.parse_args()

    max_tokens = args.max_tokens
    if args.file:
        html, notes = html_from_file(args.file, args.clean, args.clean_svg, args.clean_base64)
        if max_tokens is None:
            max_tokens = 4096
    else:
        html = readerlm.clean_html(DEMO_HTML) if args.clean else DEMO_HTML
        notes = "Using the model-card example: <h1>Hello, world!</h1>."
        if max_tokens is None:
            max_tokens = readerlm.MAX_NEW_TOKENS

    message = readerlm.create_user_content(html, instruction=args.instruction, schema=None)
    out_dir = readerlm.OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    prompt_path = out_dir / "markdown_prompt.txt"
    prompt_path.write_text(message, encoding="utf-8")

    estimate = readerlm.rough_token_estimate(message)
    print(notes)
    print(f"User message: {len(message)} characters, roughly {estimate} tokens.")
    print(f"Set LM Studio context above {estimate + max_tokens} tokens (estimate plus max_tokens).")
    print(f"Wrote {prompt_path}")

    if args.dry_run:
        print("Dry run. LM Studio was not called.")
        return 0

    model = lmstudio_client.resolve_model(args.base_url, args.api_key, args.model, timeout=min(args.timeout, 30))
    print(f"Requesting Markdown from {args.base_url} model={model} max_tokens={max_tokens} temperature={args.temperature}")
    response = lmstudio_client.chat_complete(
        base_url=args.base_url,
        api_key=args.api_key,
        model=model,
        user_content=message,
        temperature=args.temperature,
        max_tokens=max_tokens,
        timeout=args.timeout,
        repeat_penalty=args.repeat_penalty,
    )
    text, finish = lmstudio_client.assistant_text(response)
    response_path = out_dir / "markdown_response.md"
    response_path.write_text(text, encoding="utf-8")
    usage = response.get("usage") or {}
    print(f"finish_reason={finish} usage={usage}")
    print(f"Wrote {response_path}")
    if not text.strip():
        print("The assistant message was empty.")
        return 2
    if finish == "length":
        print("The server stopped because max_tokens was reached. Raise --max-tokens if the Markdown is cut off.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except lmstudio_client.LMStudioError as exc:
        print(exc, file=sys.stderr)
        raise SystemExit(1)
