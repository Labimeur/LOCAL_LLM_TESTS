# Model overview

Source: [jinaai/ReaderLM-v2](https://huggingface.co/jinaai/ReaderLM-v2). License: [CC-BY-NC-4.0](https://creativecommons.org/licenses/by-nc/4.0/) (non-commercial). Paper: [arXiv:2503.01151](https://arxiv.org/abs/2503.01151).

`ReaderLM-v2` converts raw HTML into Markdown or JSON. It supports 29 languages. The model card names English, Chinese, Japanese, Korean, French, Spanish, Portuguese, German, Italian, Russian, Vietnamese, Thai, and Arabic, plus additional languages that bring the total to 29.

## What changed from the previous ReaderLM

- Markdown generation covers code fences, nested lists, tables, and LaTeX.
- JSON generation can follow a schema directly, without a Markdown step in between.
- Combined input and output context is up to 512K tokens on the full model.
- Training uses a contrastive loss to reduce degeneration on long outputs.

## Architecture

| Item | Value |
| --- | --- |
| Type | Autoregressive, decoder-only transformer |
| Base | Qwen2.5-1.5B-Instruct |
| Parameters | 1.54B |
| Context | Up to 512K tokens, input and output combined |
| Hidden size | 1536 |
| Layers | 28 |
| Query heads | 12 |
| KV heads | 2 |
| Head size | 128 |
| Intermediate size | 8960 |
| Weights on Hugging Face | BF16 safetensors |

The chat template is Qwen2-style. If the first message is not a system message, the template inserts:

`You are an AI assistant developed by Jina AI.`

Special tokens used by that template are `<|im_start|>` and `<|im_end|>`. The end-of-sequence token is `<|im_end|>`.

LM Studio applies this template when you call the chat completions API. The test scripts send a single user message and leave the template to the server. See [Prompting and generation](prompting.md).

## Scores published on the model card

HTML to Markdown:

- ROUGE-L: 0.84
- Levenshtein distance: 0.22
- Jaro-Winkler similarity: 0.82

The card says these Markdown scores beat Qwen2.5-32B-Instruct and Gemini 2.0 Flash (experimental) on the authors' HTML-to-Markdown set.

HTML to JSON:

- F1: 0.81
- Precision: 0.82
- Recall: 0.81
- Pass rate: 0.98

Qualitative review (higher is better, out of 50):

- Content integrity: 39
- Structural accuracy: 35
- Format compliance: 36

## Training, in short

1. An `html-markdown-1m` set of about 1 million HTML documents.
2. Synthetic Markdown and JSON drafted, refined, and filtered with Qwen2.5-32B-Instruct.
3. Long-context pretraining, supervised fine-tuning, direct preference optimization, then self-play reinforcement tuning.

## How this project runs it

The Hugging Face repo ships BF16 weights for Transformers. LM Studio loads GGUF (and MLX on Apple silicon). These tests use a GGUF conversion of the same model through LM Studio's OpenAI-compatible server at `http://127.0.0.1:1234/v1`.

Setup steps are in [LM Studio setup](lm-studio-setup.md).

Jina also hosts the model behind the Reader API (`x-engine: readerlm-v2` on `https://r.jina.ai/`). That path is online and is not what the local scripts call.
