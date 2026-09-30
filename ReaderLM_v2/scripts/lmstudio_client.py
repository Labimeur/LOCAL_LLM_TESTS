"""Minimal client for LM Studio's OpenAI-compatible local server.

See documentation/lm-studio-setup.md. The default base URL is
http://127.0.0.1:1234/v1 and the default API key is the non-secret
placeholder ``lm-studio``.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

DEFAULT_BASE_URL = "http://127.0.0.1:1234/v1"
DEFAULT_API_KEY = "lm-studio"


class LMStudioError(RuntimeError):
    """The local server could not be reached or rejected the request."""


def base_url_from_env() -> str:
    return os.environ.get("LMSTUDIO_BASE_URL", DEFAULT_BASE_URL)


def model_from_env() -> str | None:
    return os.environ.get("LMSTUDIO_MODEL") or None


def api_key_from_env() -> str:
    return os.environ.get("LMSTUDIO_API_KEY", DEFAULT_API_KEY)


def _request(url: str, api_key: str, timeout: float, payload: dict | None = None) -> dict:
    data = None
    headers = {"Authorization": f"Bearer {api_key}"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method="POST" if data else "GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise LMStudioError(f"HTTP {exc.code} from {url}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise LMStudioError(
            f"Could not reach {url}. Start LM Studio's local server "
            f"(Developer tab, or `lms server start`) and load a ReaderLM-v2 GGUF. "
            f"Detail: {exc.reason}"
        ) from exc
    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise LMStudioError(f"Response from {url} was not JSON: {body[:500]}") from exc


def server_root(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/v1"):
        return trimmed[: -len("/v1")]
    return trimmed


def list_model_ids(base_url: str, api_key: str, timeout: float = 15) -> list[str]:
    payload = _request(base_url.rstrip("/") + "/models", api_key, timeout)
    return [item["id"] for item in payload.get("data", []) if item.get("id")]


def list_llm_models(base_url: str, api_key: str, timeout: float = 15) -> list[dict]:
    """Chat models from LM Studio's native list, ignoring embedding models.

    Falls back to ``/v1/models`` and drops ids that look like embedding models
    when the native list is unavailable.
    """
    native_url = server_root(base_url) + "/api/v0/models"
    try:
        payload = _request(native_url, api_key, timeout)
    except LMStudioError:
        fallback = []
        for model_id in list_model_ids(base_url, api_key, timeout):
            if "embed" in model_id.lower():
                continue
            fallback.append({"id": model_id, "state": "unknown"})
        return fallback

    models = []
    for item in payload.get("data", []):
        model_type = str(item.get("type") or "").lower()
        if model_type in {"embeddings", "embedding"}:
            continue
        if "embed" in str(item.get("id") or "").lower() and "reader" not in str(item.get("id") or "").lower():
            continue
        if item.get("id"):
            models.append(item)
    return models


def resolve_model(base_url: str, api_key: str, requested: str | None, timeout: float = 15) -> str:
    """Use ``requested`` or choose a chat model whose id mentions ReaderLM."""
    models = list_llm_models(base_url, api_key, timeout)
    ids = [item["id"] for item in models]
    if requested:
        if ids and requested not in ids:
            print(f"Requested model {requested!r} is not among the chat models ({', '.join(ids)}). Sending it anyway.")
        return requested
    if not ids:
        raise LMStudioError(
            "No ReaderLM-v2 chat model is installed in LM Studio. "
            "Embedding models are ignored. Download ReaderLM-v2.Q6_K.gguf from "
            "https://huggingface.co/mradermacher/ReaderLM-v2-GGUF, then "
            "lms import the file and lms load it with --identifier readerlm-v2. "
            "See documentation/lm-studio-setup.md. The in-app catalog search is not required."
        )
    readers = [item for item in models if "reader" in item["id"].lower()]
    pool = readers or models
    if not readers:
        print(
            "No chat model id contains 'reader'. "
            f"Using {pool[0]['id']}. Pass --model to override."
        )
    loaded = [item for item in pool if item.get("state") == "loaded"]
    chosen = (loaded or pool)[0]
    if chosen.get("state") not in {None, "loaded", "unknown"}:
        print(f"Using {chosen['id']} (state={chosen.get('state')}). LM Studio can load it on the first request.")
    else:
        print(f"Using model {chosen['id']}")
    return chosen["id"]


def chat_complete(
    base_url: str,
    api_key: str,
    model: str,
    user_content: str,
    temperature: float,
    max_tokens: int,
    timeout: float,
    repeat_penalty: float | None = 1.08,
) -> dict:
    """POST /v1/chat/completions and return the parsed response object.

    If the server rejects ``repeat_penalty``, the same request is sent once
    without that field.
    """
    url = base_url.rstrip("/") + "/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": user_content}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    if repeat_penalty is not None:
        payload["repeat_penalty"] = repeat_penalty
    try:
        return _request(url, api_key, timeout, payload)
    except LMStudioError as exc:
        mentions_repeat = "repeat" in str(exc).lower()
        if repeat_penalty is None or not mentions_repeat:
            raise
        print("Server rejected repeat_penalty. Retrying without that field.")
        payload.pop("repeat_penalty", None)
        return _request(url, api_key, timeout, payload)


def chat_v1(
    base_url: str,
    api_key: str,
    model: str,
    user_content: str,
    temperature: float,
    max_tokens: int,
    timeout: float,
    repeat_penalty: float | None = 1.08,
) -> tuple[str, dict]:
    """POST /api/v1/chat and return (assistant text, stats).

    This native endpoint reports tokens per second and time to first token.
    The OpenAI-compatible endpoint on this server returns an empty stats object.
    ``store`` is false so the run is not kept as a saved chat.
    """
    url = server_root(base_url) + "/api/v1/chat"
    payload: dict = {
        "model": model,
        "input": user_content,
        "temperature": temperature,
        "max_output_tokens": max_tokens,
        "store": False,
    }
    if repeat_penalty is not None:
        payload["repeat_penalty"] = repeat_penalty
    try:
        response = _request(url, api_key, timeout, payload)
    except LMStudioError as exc:
        mentions_repeat = "repeat" in str(exc).lower()
        if repeat_penalty is None or not mentions_repeat:
            raise
        print("Server rejected repeat_penalty. Retrying without that field.")
        payload.pop("repeat_penalty", None)
        response = _request(url, api_key, timeout, payload)

    parts: list[str] = []
    for item in response.get("output") or []:
        if item.get("type") == "message" and isinstance(item.get("content"), str):
            parts.append(item["content"])
    text = "".join(parts)
    if not text:
        raise LMStudioError(f"Native chat response had no message text: {json.dumps(response)[:500]}")
    stats = response.get("stats") if isinstance(response.get("stats"), dict) else {}
    return text, stats


def assistant_text(response: dict) -> tuple[str, str | None]:
    """Return (message text, finish_reason) from a chat completion payload."""
    choices = response.get("choices") or []
    if not choices:
        raise LMStudioError(f"Response has no choices: {json.dumps(response)[:500]}")
    choice = choices[0]
    message = choice.get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and part.get("text"):
                parts.append(part["text"])
        content = "".join(parts)
    if not isinstance(content, str):
        raise LMStudioError(f"Assistant content was empty or unexpected: {choice!r}")
    return content, choice.get("finish_reason")
