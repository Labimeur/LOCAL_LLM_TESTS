# Local LLM tests

Local experiments that run small language models on this machine and record what they return. Each model lives in its own folder, with samples, scripts, notes, and run output kept together.

## Projects

| Folder | Model | What it does |
| --- | --- | --- |
| [ReaderLM_v2](ReaderLM_v2/) | [jinaai/ReaderLM-v2](https://huggingface.co/jinaai/ReaderLM-v2) (1.5B, GGUF via LM Studio) | Turns raw HTML into Markdown or into JSON that matches a schema you supply |

ReaderLM-v2 is built for HTML parsing and extraction, not for general chat. The weights are [CC-BY-NC-4.0](https://creativecommons.org/licenses/by-nc/4.0/) (non-commercial). Paper: [arXiv:2503.01151](https://arxiv.org/abs/2503.01151).

## ReaderLM-v2

Start with [ReaderLM_v2/documentation/README.md](ReaderLM_v2/documentation/README.md). Read the notes in this order:

1. [Model overview](ReaderLM_v2/documentation/model-overview.md)
2. [Prompting and generation](ReaderLM_v2/documentation/prompting.md)
3. [LM Studio setup](ReaderLM_v2/documentation/lm-studio-setup.md)
4. [Running the tests](ReaderLM_v2/documentation/running-tests.md)

Python 3.10 or newer is enough. The scripts use the standard library only. LM Studio must be serving a ReaderLM-v2 GGUF at `http://127.0.0.1:1234/v1` before a live run.

From `ReaderLM_v2`:

```text
python scripts\test_json_sample.py --dry-run
python scripts\test_json_sample.py
python scripts\test_markdown.py
```

`--dry-run` cleans the sample, writes the prompt, and does not call the server. A live JSON run writes a new folder under `ReaderLM_v2/output/` with the prompt, the raw reply, parsed JSON when it can be extracted, and a performance report (timing, tokens per second, time to first token, and memory).

Each finished run also refreshes the local performance dashboard. Start it with:

```text
python ReaderLM_v2\html\performance-dashboard\serve.py
```

That serves `http://127.0.0.1:8765/index.html` and opens the page. To rebuild its data without running a test:

```text
python ReaderLM_v2\html\performance-dashboard\refresh_data.py
```

### Layout

```text
ReaderLM_v2/
  documentation/     setup, prompting, and how to run the tests
  scripts/           HTML cleaning, LM Studio client, JSON and Markdown tests
  samples/           input HTML (gistfile1.txt is a hockeydb.com player page)
  output/            one folder per run
  html/performance-dashboard/   local view of performance reports
```

| Script | Role |
| --- | --- |
| `scripts/readerlm.py` | HTML cleaning and the model-card prompt layout |
| `scripts/lmstudio_client.py` | Local chat-completions client |
| `scripts/perf_stats.py` | Timing, throughput, and memory for a run |
| `scripts/test_json_sample.py` | HTML-to-JSON on `samples/gistfile1.txt` |
| `scripts/test_markdown.py` | HTML-to-Markdown smoke test, or a file you pass in |
