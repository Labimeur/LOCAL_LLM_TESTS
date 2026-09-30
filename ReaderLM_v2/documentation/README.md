# ReaderLM-v2 local test

Documentation for trying [jinaai/ReaderLM-v2](https://huggingface.co/jinaai/ReaderLM-v2) on this machine through LM Studio. The Python scripts in `../scripts` follow these notes.

ReaderLM-v2 is a 1.5B model that turns raw HTML into Markdown or into JSON that matches a schema you supply. It is built for HTML parsing and extraction, not for general chat.

## Read this in order

1. [Model overview](model-overview.md) — what the model is, from the Hugging Face model card.
2. [Prompting and generation](prompting.md) — HTML cleaning, the Markdown prompt, the JSON prompt, and the generation settings the scripts use.
3. [LM Studio setup](lm-studio-setup.md) — which file to download, how to load it, and how to start the local server.
4. [Running the tests](running-tests.md) — how to process `samples/gistfile1.txt` and the small Markdown example.

## Scripts

| Script | What it tests |
| --- | --- |
| `scripts/test_json_sample.py` | HTML-to-JSON on `samples/gistfile1.txt` (Nick Suzuki stats page) |
| `scripts/test_markdown.py` | HTML-to-Markdown, using the model card's short example or an HTML file you pass in |

Shared code lives in `scripts/readerlm.py` (cleaning and prompts) and `scripts/lmstudio_client.py` (the local HTTP API).

## Sources

- Model card: https://huggingface.co/jinaai/ReaderLM-v2
- Paper: https://arxiv.org/abs/2503.01151
- LM Studio server: https://lmstudio.ai/docs/developer/core/server
- LM Studio chat completions: https://lmstudio.ai/docs/developer/openai-compat/chat-completions
