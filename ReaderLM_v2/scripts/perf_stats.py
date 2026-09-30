"""Performance report for a ReaderLM-v2 LM Studio run.

Numbers that LM Studio reports (tokens per second, time to first token) come
from POST /api/v1/chat. Wall-clock timestamps and memory are collected here.
"""

from __future__ import annotations

import ctypes
import json
import subprocess
import threading
from datetime import datetime
from pathlib import Path

import lmstudio_client


def _now() -> datetime:
    return datetime.now().astimezone()


def _iso(moment: datetime) -> str:
    return moment.isoformat(timespec="milliseconds")


def _mib(num_bytes: int | float | None) -> float | None:
    if num_bytes is None:
        return None
    return round(float(num_bytes) / (1024 * 1024), 1)


def _query_gpu() -> dict | None:
    try:
        completed = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.used,memory.total,utilization.gpu",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if completed.returncode != 0 or not completed.stdout.strip():
        return None
    gpus = []
    for line in completed.stdout.splitlines():
        parts = [part.strip() for part in line.split(",")]
        if len(parts) < 4:
            continue
        try:
            gpus.append(
                {
                    "name": parts[0],
                    "memory_used_mib": float(parts[1]),
                    "memory_total_mib": float(parts[2]),
                    "utilization_percent": float(parts[3]),
                }
            )
        except ValueError:
            continue
    if not gpus:
        return None
    return {"gpus": gpus}


def _query_system_ram() -> dict | None:
    if not hasattr(ctypes, "windll"):
        return None

    class MemoryStatusEx(ctypes.Structure):
        _fields_ = [
            ("dwLength", ctypes.c_ulong),
            ("dwMemoryLoad", ctypes.c_ulong),
            ("ullTotalPhys", ctypes.c_ulonglong),
            ("ullAvailPhys", ctypes.c_ulonglong),
            ("ullTotalPageFile", ctypes.c_ulonglong),
            ("ullAvailPageFile", ctypes.c_ulonglong),
            ("ullTotalVirtual", ctypes.c_ulonglong),
            ("ullAvailVirtual", ctypes.c_ulonglong),
            ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
        ]

    status = MemoryStatusEx()
    status.dwLength = ctypes.sizeof(MemoryStatusEx)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
        return None
    used = int(status.ullTotalPhys) - int(status.ullAvailPhys)
    return {
        "total_mib": _mib(status.ullTotalPhys),
        "available_mib": _mib(status.ullAvailPhys),
        "used_mib": _mib(used),
        "used_percent": int(status.dwMemoryLoad),
    }


def _query_lmstudio_processes() -> dict | None:
    command = (
        "Get-Process -Name 'LM Studio' -ErrorAction SilentlyContinue "
        "| Select-Object Id,WorkingSet64 | ConvertTo-Json -Compress"
    )
    try:
        completed = subprocess.run(
            ["powershell", "-NoProfile", "-Command", command],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    raw = completed.stdout.strip()
    if completed.returncode != 0 or not raw:
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    rows = parsed if isinstance(parsed, list) else [parsed]
    processes = []
    for row in rows:
        if not isinstance(row, dict) or "WorkingSet64" not in row:
            continue
        processes.append(
            {
                "pid": row.get("Id"),
                "working_set_mib": _mib(row.get("WorkingSet64")),
            }
        )
    if not processes:
        return None
    working_sets = [item["working_set_mib"] for item in processes if item["working_set_mib"] is not None]
    return {
        "process_count": len(processes),
        "working_set_sum_mib": round(sum(working_sets), 1),
        "largest_working_set_mib": round(max(working_sets), 1) if working_sets else None,
        "processes": processes,
    }


def _query_loaded_model(base_url: str, api_key: str, model: str) -> dict:
    try:
        models = lmstudio_client.list_llm_models(base_url, api_key, timeout=10)
    except lmstudio_client.LMStudioError:
        return {"id": model}
    for item in models:
        if item.get("id") == model:
            return {
                "id": item.get("id"),
                "publisher": item.get("publisher"),
                "architecture": item.get("arch"),
                "quantization": item.get("quantization"),
                "state": item.get("state"),
                "loaded_context_length": item.get("loaded_context_length"),
                "max_context_length": item.get("max_context_length"),
            }
    return {"id": model}


def _memory_snapshot() -> dict:
    return {
        "captured_at": _iso(_now()),
        "gpu": _query_gpu(),
        "system_ram": _query_system_ram(),
        "lm_studio_processes": _query_lmstudio_processes(),
    }


def _sample_gpu(stop: threading.Event, samples: list[dict]) -> None:
    while not stop.is_set():
        reading = _query_gpu()
        if reading is not None:
            reading["captured_at"] = _iso(_now())
            samples.append(reading)
        stop.wait(0.5)


def _round(value: float | None, digits: int = 3) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


def _insights(report: dict) -> list[str]:
    tokens = report["tokens"]
    speed = report["speed"]
    model = report["model"]
    lines = []
    input_tokens = tokens.get("input_tokens")
    output_tokens = tokens.get("output_tokens")
    context = model.get("loaded_context_length")
    if input_tokens and context:
        lines.append(
            f"The prompt used {input_tokens} of {context} loaded context tokens ({input_tokens / context:.0%})."
        )
    ttft = speed.get("time_to_first_token_seconds")
    if ttft and input_tokens:
        implied = input_tokens / ttft
        if implied > 50000:
            lines.append(
                f"Time to first token was {ttft:.3f}s. For {input_tokens} input tokens that is "
                f"about {implied:.0f} tokens/second, which is only plausible if LM Studio reused a cached prompt. "
                "Treat it as a cache hit, not a cold prompt-processing rate."
            )
        else:
            lines.append(
                f"Time to first token was {ttft:.3f}s, about {implied:.0f} input tokens/second of prompt processing."
            )
    tps = speed.get("tokens_per_second")
    if tps is not None and output_tokens:
        lines.append(
            f"Generation speed was {tps:.1f} tokens/second across {output_tokens} output tokens."
        )
    wall = speed.get("wall_clock_seconds")
    if wall is not None and output_tokens:
        lines.append(
            f"Wall clock for the whole request was {wall:.3f}s "
            f"({output_tokens / wall:.1f} output tokens per wall-clock second, including prompt processing)."
        )
    gpu_after = (report.get("memory") or {}).get("after", {}).get("gpu") or {}
    gpus = gpu_after.get("gpus") or []
    if gpus:
        gpu = gpus[0]
        used = gpu.get("memory_used_mib")
        total = gpu.get("memory_total_mib")
        if used is not None and total:
            lines.append(
                f"GPU memory after the run was {used:.0f} of {total:.0f} MiB on {gpu.get('name')}."
            )
    peak = (report.get("memory") or {}).get("gpu_peak_used_mib")
    if peak is not None and gpus and gpus[0].get("memory_total_mib"):
        lines.append(f"Peak GPU memory sampled during the request was {peak:.0f} MiB.")
    load_s = speed.get("model_load_time_seconds")
    if load_s:
        lines.append(f"This request loaded the model, which took {load_s:.3f}s.")
    else:
        lines.append("The model was already loaded, so this run has no model-load time.")
    return lines


def _text_report(report: dict) -> str:
    tokens = report["tokens"]
    speed = report["speed"]
    model = report["model"]
    timing = report["timing"]
    lines = [
        "ReaderLM-v2 run performance",
        "",
        f"Started:  {timing['started_at']}",
        f"Finished: {timing['finished_at']}",
        f"Wall clock: {speed.get('wall_clock_seconds')} s",
        "",
        "Model",
        f"  id: {model.get('id')}",
        f"  publisher: {model.get('publisher')}",
        f"  architecture: {model.get('architecture')}",
        f"  quantization: {model.get('quantization')}",
        f"  state: {model.get('state')}",
        f"  loaded context: {model.get('loaded_context_length')}",
        f"  max context: {model.get('max_context_length')}",
        "",
        "Request",
        f"  temperature: {report['request'].get('temperature')}",
        f"  repeat_penalty: {report['request'].get('repeat_penalty')}",
        f"  max_tokens: {report['request'].get('max_tokens')}",
        f"  prompt characters: {report['request'].get('prompt_characters')}",
        "",
        "Tokens",
        f"  input: {tokens.get('input_tokens')}",
        f"  output: {tokens.get('output_tokens')}",
        f"  reasoning output: {tokens.get('reasoning_output_tokens')}",
        f"  total: {tokens.get('total_tokens')}",
        f"  finish: {report['result'].get('finish_reason')}",
        f"  json parsed: {report['result'].get('json_parsed')}",
        f"  schema ok: {report['result'].get('schema_ok')}",
        f"  schema detail: {report['result'].get('schema_detail')}",
        "",
        "Speed",
        f"  tokens per second: {speed.get('tokens_per_second')}",
        f"  time to first token (s): {speed.get('time_to_first_token_seconds')}",
        f"  model load time (s): {speed.get('model_load_time_seconds') if speed.get('model_load_time_seconds') is not None else 'not reported (model already loaded)'}",
        f"  output tokens per wall-clock second: {speed.get('output_tokens_per_wall_second')}",
        "",
        "Memory",
    ]
    memory = report.get("memory") or {}
    for label in ("before", "after"):
        snap = memory.get(label) or {}
        lines.append(f"  {label} at {snap.get('captured_at')}")
        ram = snap.get("system_ram") or {}
        if ram:
            lines.append(
                f"    system RAM used: {ram.get('used_mib')} / {ram.get('total_mib')} MiB ({ram.get('used_percent')}%)"
            )
        procs = snap.get("lm_studio_processes") or {}
        if procs:
            lines.append(
                f"    LM Studio working set: {procs.get('working_set_sum_mib')} MiB across {procs.get('process_count')} processes"
            )
            lines.append(f"    largest LM Studio process: {procs.get('largest_working_set_mib')} MiB")
        gpu = snap.get("gpu") or {}
        for device in gpu.get("gpus") or []:
            lines.append(
                f"    GPU {device.get('name')}: {device.get('memory_used_mib')} / {device.get('memory_total_mib')} MiB, utilization {device.get('utilization_percent')}%"
            )
    if memory.get("gpu_peak_used_mib") is not None:
        lines.append(f"  peak GPU memory sampled during the request: {memory.get('gpu_peak_used_mib')} MiB")
    lines.append("")
    lines.append("Notes")
    for note in report.get("insights") or []:
        lines.append(f"  {note}")
    lines.append("")
    return "\n".join(lines)


def measure_chat(
    base_url: str,
    api_key: str,
    model: str,
    user_content: str,
    temperature: float,
    max_tokens: int,
    timeout: float,
    repeat_penalty: float | None,
    prompt_characters: int,
) -> tuple[str, dict]:
    """Call the model and return assistant text plus a performance report."""
    model_info = _query_loaded_model(base_url, api_key, model)
    before = _memory_snapshot()
    samples: list[dict] = []
    stop = threading.Event()
    sampler = threading.Thread(target=_sample_gpu, args=(stop, samples), daemon=True)
    sampler.start()
    started = _now()
    try:
        text, stats = lmstudio_client.chat_v1(
            base_url=base_url,
            api_key=api_key,
            model=model,
            user_content=user_content,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout,
            repeat_penalty=repeat_penalty,
        )
    finally:
        finished = _now()
        stop.set()
        sampler.join(timeout=3)
    after = _memory_snapshot()

    input_tokens = stats.get("input_tokens")
    output_tokens = stats.get("total_output_tokens")
    reasoning_tokens = stats.get("reasoning_output_tokens")
    total_tokens = None
    if isinstance(input_tokens, (int, float)) and isinstance(output_tokens, (int, float)):
        total_tokens = int(input_tokens) + int(output_tokens)
    wall = (finished - started).total_seconds()
    if isinstance(output_tokens, (int, float)) and output_tokens >= max_tokens:
        finish_reason = "length"
    else:
        finish_reason = "stop"

    used_values = []
    for sample in samples:
        for device in sample.get("gpus") or []:
            used = device.get("memory_used_mib")
            if isinstance(used, (int, float)):
                used_values.append(float(used))

    report = {
        "timing": {
            "started_at": _iso(started),
            "finished_at": _iso(finished),
        },
        "model": model_info,
        "request": {
            "endpoint": "/api/v1/chat",
            "temperature": temperature,
            "repeat_penalty": repeat_penalty,
            "max_tokens": max_tokens,
            "prompt_characters": prompt_characters,
        },
        "tokens": {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "reasoning_output_tokens": reasoning_tokens,
            "total_tokens": total_tokens,
        },
        "speed": {
            "tokens_per_second": _round(stats.get("tokens_per_second"), 2),
            "time_to_first_token_seconds": _round(stats.get("time_to_first_token_seconds"), 3),
            "model_load_time_seconds": _round(stats.get("model_load_time_seconds"), 3),
            "wall_clock_seconds": _round(wall, 3),
            "output_tokens_per_wall_second": _round(output_tokens / wall, 2) if output_tokens and wall else None,
        },
        "memory": {
            "before": before,
            "after": after,
            "gpu_samples": len(samples),
            "gpu_peak_used_mib": round(max(used_values), 1) if used_values else None,
        },
        "result": {
            "finish_reason": finish_reason,
        },
        "lmstudio_stats": stats,
    }
    report["insights"] = _insights(report)
    return text, report


def write_performance(json_path: Path, report: dict) -> Path:
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    text_path = json_path.with_suffix(".txt")
    text_path.write_text(_text_report(report), encoding="utf-8")
    return text_path
