# LM Studio setup

ReaderLM-v2 on the Hugging Face model card is a BF16 Transformers checkpoint. LM Studio runs GGUF files (llama.cpp). Use a GGUF conversion of `jinaai/ReaderLM-v2`, then serve it with LM Studio's local API.

Official weights: https://huggingface.co/jinaai/ReaderLM-v2

GGUF conversions other people have published:

- https://huggingface.co/mradermacher/ReaderLM-v2-GGUF (static quants; imatrix quants are in the sibling `ReaderLM-v2-i1-GGUF` repo)
- https://huggingface.co/matrixportalx/ReaderLM-v2-GGUF

These are quantizations of the same model. A smaller quant uses less memory and can drop more of the JSON structure. For this extraction test, prefer a higher quant.

Sizes reported for the mradermacher static quants:

| Quant | Size | Note from that repo |
| --- | --- | --- |
| Q4_K_M | 1.2 GB | fast, their general recommendation |
| Q5_K_M | 1.4 GB | |
| Q6_K | 1.6 GB | very good quality |
| Q8_0 | 2.0 GB | best quality among the quants |
| f16 | 3.7 GB | full 16-bit |

Q6_K or Q8_0 is the better starting point for the JSON sample. Q4_K_M is the fallback when memory is tight.

## Download and load

LM Studio's in-app model search and `lms get` both call LM Studio's model catalog. On this machine that catalog request fails (`Error fetching staff picks` in the app, `Error: fetch failed` from `lms get`). Download the GGUF from Hugging Face, then import and load it with the CLI. `lms get name@q6_k` is not an alternative: that syntax is for LM Studio catalog names, and a Hugging Face repo id is rejected.

The file used here is `ReaderLM-v2.Q6_K.gguf` (about 1.36 GB) from [mradermacher/ReaderLM-v2-GGUF](https://huggingface.co/mradermacher/ReaderLM-v2-GGUF).

```text
curl.exe -L --fail --retry 3 -C - --output "$env:TEMP\readerlm\ReaderLM-v2.Q6_K.gguf" "https://huggingface.co/mradermacher/ReaderLM-v2-GGUF/resolve/main/ReaderLM-v2.Q6_K.gguf"
cmd /c "echo Y| lms import %TEMP%\readerlm\ReaderLM-v2.Q6_K.gguf --yes --user-repo mradermacher/ReaderLM-v2-GGUF"
lms load mradermacher/ReaderLM-v2-GGUF --context-length 8192 --identifier readerlm-v2 --yes
lms server start
```

The `echo Y` is required the first time. `--yes` hides the move warning and still leaves the "Do you wish to continue?" prompt. `lms import` then moves the file into `C:\Users\Recovery\.lmstudio\models`. `--context-length 8192` covers the JSON sample (about 4,700 prompt tokens plus 2048 new tokens). The API identifier is `readerlm-v2`. `lms server status` should report port 1234 before the Python scripts run.

If the model search in the app starts working later, Ctrl+Shift+M and the same Hugging Face URL is the other way to download Q6_K or Q8_0.

The full model card lists a 512K context. A GGUF loaded in LM Studio only has the context length you set, and the KV cache has to fit in RAM or VRAM. A dry run of the JSON sample produces a user message of about 19,000 characters, roughly 4,700 tokens. With the script's default of 2048 new tokens, a context length of 8192 covers that run. Use 16384 if you convert the same page to Markdown (`--max-tokens 4096`) or if LM Studio reports that the prompt does not fit.

Architecture in the GGUF header is `qwen2`. Leave the chat template on. The template is what inserts the Jina system line and the `<|im_start|>assistant` turn.

## Start the server

In the app: Developer tab, then turn the server on. The default base URL is:

```text
http://127.0.0.1:1234/v1
```

From a terminal, after LM Studio has been opened at least once:

```text
lms server start
```

`lms get some-model@q6_k` only works for a name in LM Studio's own catalog, such as `llama-3.1-8b@q4_k_m`. `mradermacher/ReaderLM-v2-GGUF` is a Hugging Face repo id, so that form is rejected. `--gguf` is a search filter and cannot be combined with `@q6_k`.

Download from the quantizations list instead. On Windows, use [mradermacher/ReaderLM-v2-GGUF](https://huggingface.co/mradermacher/ReaderLM-v2-GGUF) (static quants of the original model). Skip `mlx-community/jinaai_ReaderLM-v2` (Apple MLX) and remix repos such as `Soulfate24/ReaderLM-v2-ASHQ1-Remix-GGUF` when you want the original weights.

1. In LM Studio, press Ctrl+Shift+M.
2. Paste `https://huggingface.co/mradermacher/ReaderLM-v2-GGUF`.
3. Choose the file `ReaderLM-v2.Q6_K.gguf`.

Docs: https://lmstudio.ai/docs/developer/core/server

A stock local server accepts any API key. The scripts send `Authorization: Bearer lm-studio`. If you turned on authentication, pass the real key with `--api-key` or `LMSTUDIO_API_KEY`.

Check that a model is loaded:

```text
curl http://127.0.0.1:1234/v1/models
```

The `id` in that response is the value the scripts send as `model`. If you omit `--model`, the scripts ask LM Studio's model list for a chat model whose id contains `reader`. Embedding models are skipped. If no ReaderLM chat model is installed, the script stops and prints the download command.

## Request the scripts send

`POST /v1/chat/completions`

```json
{
  "model": "the-id-from-lm-studio",
  "messages": [
    {"role": "user", "content": "the user message from prompting.md"}
  ],
  "temperature": 0,
  "max_tokens": 2048,
  "repeat_penalty": 1.08,
  "stream": false
}
```

Parameter list for this endpoint: https://lmstudio.ai/docs/developer/openai-compat/chat-completions

The Python scripts use the standard library (`urllib`) so you do not need the `openai` package. The body matches what an OpenAI-compatible client would send to this base URL.
