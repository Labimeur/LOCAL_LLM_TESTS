"""Import one hockeydb player page through the ReaderLM JSON run."""

from __future__ import annotations

import lmstudio_client
import readerlm
import test_json_sample
import hockeydb


def seasons_instruction_and_schema() -> tuple[str, str]:
    """Instruction and repaired schema from the Nick Suzuki sample."""
    raw = readerlm.DEFAULT_SAMPLE.read_text(encoding="utf-8")
    parts = readerlm.parse_prompt_file(raw)
    schema = parts["schema"]
    if not schema:
        raise RuntimeError("samples/gistfile1.txt has no JSON schema.")
    repaired, _added = readerlm.repair_json_schema(schema)
    instruction = parts["instruction"] or readerlm.DEFAULT_JSON_INSTRUCTION
    return instruction, repaired


def normalize_pid(value) -> str:
    if isinstance(value, bool) or value is None:
        return ""
    if isinstance(value, int):
        return str(value)
    if isinstance(value, str):
        return value.strip()
    return ""


def import_stats(
    pid_value,
    *,
    base_url: str | None = None,
    api_key: str | None = None,
    model: str | None = None,
    timeout: float = 600,
) -> tuple[int, dict]:
    """Fetch the player page, extract seasons, and return an HTTP status plus JSON body.

    ``rows`` is present only when the reply matches the seasons schema.
    """
    pid = normalize_pid(pid_value)
    if not pid.isdigit() or not 1 <= len(pid) <= 12:
        return 400, {"error": "Player id must be a number."}

    try:
        html = hockeydb.fetch_player_html(pid)
    except hockeydb.HockeyDbError as exc:
        return exc.status, {"error": str(exc)}

    name = hockeydb.player_name(html) or pid
    try:
        instruction, schema = seasons_instruction_and_schema()
    except OSError as exc:
        return 500, {"error": f"Could not read the seasons schema: {exc}"}

    cleaned = readerlm.clean_html(html)
    message = readerlm.create_user_content(cleaned, instruction=instruction, schema=schema)
    stem = test_json_sample.path_token(f"{name}-{pid}").lower()
    print(f"Importing {name} ({pid})", flush=True)
    try:
        result = test_json_sample.execute_json_run(
            message,
            stem,
            base_url=base_url or lmstudio_client.base_url_from_env(),
            api_key=api_key if api_key is not None else lmstudio_client.api_key_from_env(),
            model=model if model is not None else lmstudio_client.model_from_env(),
            temperature=readerlm.TEMPERATURE,
            repeat_penalty=readerlm.REPEAT_PENALTY,
            max_tokens=2048,
            timeout=timeout,
        )
    except lmstudio_client.LMStudioError as exc:
        return 503, {"error": str(exc)}

    if not result["rows"]:
        return 422, {"error": result["error"] or "The model reply did not match the seasons table."}

    payload = {
        "pid": pid,
        "name": name,
        "folder": result["folder_name"],
        "rows": result["rows"],
        "detail": result["detail"],
        "finish_reason": result["finish_reason"],
    }
    if result.get("warning"):
        payload["warning"] = result["warning"]
    return 200, payload
