"""HTML cleaning and ReaderLM-v2 user messages.

Implements the procedure in documentation/prompting.md, which follows the
jinaai/ReaderLM-v2 model card. LM Studio applies the chat template, so these
helpers return the user-message text rather than a fully wrapped prompt.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

SCRIPT_PATTERN = r"<[ ]*script.*?\/[ ]*script[ ]*>"
STYLE_PATTERN = r"<[ ]*style.*?\/[ ]*style[ ]*>"
META_PATTERN = r"<[ ]*meta.*?>"
COMMENT_PATTERN = r"<[ ]*!--.*?--[ ]*>"
LINK_PATTERN = r"<[ ]*link.*?>"
BASE64_IMG_PATTERN = r'<img[^>]+src="data:image/[^;]+;base64,[^"]+"[^>]*>'
SVG_PATTERN = r"(<svg[^>]*>)(.*?)(<\/svg>)"

DEFAULT_MARKDOWN_INSTRUCTION = (
    "Extract the main content from the given HTML and convert it to Markdown format."
)
DEFAULT_JSON_INSTRUCTION = (
    "Extract the specified information from a list of news threads "
    "and present it in a structured JSON format."
)

# Model-card generate() settings. max_new_tokens is the published example value;
# the JSON sample script raises it because the page has many table rows.
TEMPERATURE = 0.0
REPEAT_PENALTY = 1.08
MAX_NEW_TOKENS = 1024

JSON_REQUIRED_FIELDS = ("season", "team", "gp", "g", "a", "pts")

_HTML_FENCE = re.compile(r"```html\s*\n(.*?)```", re.IGNORECASE | re.DOTALL)
_JSON_FENCE = re.compile(r"```json\s*\n(.*?)`{3,}", re.IGNORECASE | re.DOTALL)
_RESPONSE_FENCE = re.compile(
    r"```(?:json)?\s*\n(.*?)```", re.IGNORECASE | re.DOTALL
)

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SAMPLE = ROOT / "samples" / "gistfile1.txt"
OUTPUT_DIR = ROOT / "output"


def replace_svg(html: str, new_content: str = "this is a placeholder") -> str:
    return re.sub(
        SVG_PATTERN,
        lambda match: f"{match.group(1)}{new_content}{match.group(3)}",
        html,
        flags=re.DOTALL,
    )


def replace_base64_images(html: str, new_image_src: str = "#") -> str:
    return re.sub(BASE64_IMG_PATTERN, f'<img src="{new_image_src}"/>', html)


def clean_html(html: str, clean_svg: bool = False, clean_base64: bool = False) -> str:
    """Drop scripts, styles, meta tags, comments, and stylesheet links."""
    flags = re.IGNORECASE | re.MULTILINE | re.DOTALL
    html = re.sub(SCRIPT_PATTERN, "", html, flags=flags)
    html = re.sub(STYLE_PATTERN, "", html, flags=flags)
    html = re.sub(META_PATTERN, "", html, flags=flags)
    html = re.sub(COMMENT_PATTERN, "", html, flags=flags)
    html = re.sub(LINK_PATTERN, "", html, flags=flags)
    if clean_svg:
        html = replace_svg(html)
    if clean_base64:
        html = replace_base64_images(html)
    return html


def create_user_content(
    text: str,
    instruction: str | None = None,
    schema: str | None = None,
) -> str:
    """User-role content in the model-card fence layout.

    When ``schema`` is set and ``instruction`` is omitted, the news-thread
    sentence from the model card is used. Pass the sample's own instruction
    to keep the seasons task.
    """
    if schema:
        if not instruction:
            instruction = DEFAULT_JSON_INSTRUCTION
        return (
            f"{instruction}\n"
            f"```html\n{text}\n```\n"
            f"The JSON schema is as follows:```json\n{schema}\n```"
        )
    if not instruction:
        instruction = DEFAULT_MARKDOWN_INSTRUCTION
    return f"{instruction}\n```html\n{text}\n```"


def rough_token_estimate(text: str) -> int:
    """Character-count divided by 4. A planning figure, not a tokenizer count."""
    return max(1, len(text) // 4)


def parse_prompt_file(raw: str) -> dict[str, str | None]:
    """Split a model-card style file into instruction, HTML, and schema.

    A file with no html fence is treated as raw HTML and has no instruction
    or schema.
    """
    html_match = _HTML_FENCE.search(raw)
    if html_match is None:
        return {"instruction": None, "html": raw.strip(), "schema": None}

    instruction = raw[: html_match.start()].strip() or None
    html = html_match.group(1).strip("\n")
    schema_match = _JSON_FENCE.search(raw, html_match.end())
    schema = schema_match.group(1).strip() if schema_match else None
    return {"instruction": instruction, "html": html, "schema": schema}


def repair_json_schema(schema: str) -> tuple[str, int]:
    """Return pretty JSON and how many closing braces were added.

    ``samples/gistfile1.txt`` omits the braces that close ``items`` and the
    root object. Extra closing braces are appended until ``json.loads``
    succeeds, up to a small limit. A schema that already parses is unchanged
    except for pretty-printing.
    """
    text = schema.strip()
    try:
        return json.dumps(json.loads(text), indent=2), 0
    except json.JSONDecodeError:
        pass

    candidate = text
    for added in range(1, 9):
        candidate += "\n}"
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        return json.dumps(parsed, indent=2), added
    return text, 0


def extract_json_value(text: str):
    """Parse a JSON value from a raw assistant message."""
    fenced = _RESPONSE_FENCE.search(text)
    candidate = fenced.group(1).strip() if fenced else text.strip()
    if not fenced:
        start = next((i for i, ch in enumerate(candidate) if ch in "[{"), None)
        if start is None:
            raise ValueError("assistant text has no JSON value")
        candidate = candidate[start:]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        start = next((i for i, ch in enumerate(candidate) if ch in "[{"), None)
        if start is None:
            raise
        decoder = json.JSONDecoder()
        value, _end = decoder.raw_decode(candidate[start:])
        return value


def json_rows_match_schema(value) -> tuple[bool, str]:
    """Check the seasons array shape described by the sample schema."""
    if not isinstance(value, list):
        return False, f"expected a JSON array, got {type(value).__name__}"
    if not value:
        return False, "array is empty"
    missing_rows = []
    for index, row in enumerate(value):
        if not isinstance(row, dict):
            return False, f"item {index} is {type(row).__name__}, expected an object"
        missing = [key for key in JSON_REQUIRED_FIELDS if key not in row]
        if missing:
            missing_rows.append(f"item {index} missing {', '.join(missing)}")
    if missing_rows:
        preview = "; ".join(missing_rows[:5])
        return False, preview
    return True, f"{len(value)} objects with the required fields"
