# Prompting and generation

This is the procedure on the [ReaderLM-v2 model card](https://huggingface.co/jinaai/ReaderLM-v2), adapted for LM Studio. `scripts/readerlm.py` implements the cleaning and the user-message layout described here.

## 1. Clean the HTML first

The card recommends stripping scripts, styles, meta tags, comments, and stylesheet links so the prompt is shorter and less noisy. SVG replacement and base64 image replacement are optional and off unless you ask for them.

The scripts use these patterns from the model card:

```python
SCRIPT_PATTERN = r"<[ ]*script.*?\/[ ]*script[ ]*>"
STYLE_PATTERN = r"<[ ]*style.*?\/[ ]*style[ ]*>"
META_PATTERN = r"<[ ]*meta.*?>"
COMMENT_PATTERN = r"<[ ]*!--.*?--[ ]*>"
LINK_PATTERN = r"<[ ]*link.*?>"
BASE64_IMG_PATTERN = r'<img[^>]+src="data:image/[^;]+;base64,[^"]+"[^>]*>'
SVG_PATTERN = r"(<svg[^>]*>)(.*?)(<\/svg>)"
```

Each substitution uses `re.IGNORECASE | re.MULTILINE | re.DOTALL` for the first five patterns. SVG replacement uses `re.DOTALL`.

`samples/gistfile1.txt` is a full hockeydb.com player page with large inline scripts. Cleaning is what makes that page fit a normal LM Studio context length.

## 2. Build the user message

Default Markdown instruction:

```text
Extract the main content from the given HTML and convert it to Markdown format.
```

Markdown layout:

```text
{instruction}
```html
{cleaned html}
```
```

Default JSON instruction on the model card (used for their Hacker News demo):

```text
Extract the specified information from a list of news threads and present it in a structured JSON format.
```

JSON layout:

```text
{instruction}
```html
{cleaned html}
```
The JSON schema is as follows:```json
{schema}
```
```

There is no newline between `follows:` and the json fence. That matches the model card.

### Chat template

In Transformers, the card wraps that text with `tokenizer.apply_chat_template(..., add_generation_prompt=True)`, which produces:

```text
<|im_start|>system
You are an AI assistant developed by Jina AI.<|im_end|>
<|im_start|>user
{user message}<|im_end|>
<|im_start|>assistant

```

LM Studio's chat endpoint applies the GGUF chat template itself. The scripts therefore send only:

```json
{"role": "user", "content": "{user message}"}
```

Do not also paste `<|im_start|>` tags into the message. Do not send a system message if you want the Jina system line above; the template adds it only when the first message is not already a system message.

### This sample's instruction

`samples/gistfile1.txt` is already one JSON prompt:

1. An instruction that asks for a list of seasons with `season`, `team`, `gp`, `g`, `a`, and `pts`.
2. An `html` fence containing the player page.
3. A `json` fence with an array schema for those fields.

The model card's helper replaces whatever instruction you passed with the news-thread sentence whenever a schema is present. That sentence is for the Hacker News demo. The JSON test keeps the seasons instruction from the sample file, and still uses the fence layout above.

The schema in the sample is missing the final `}` that closes the root object. `test_json_sample.py` appends closing braces until the text parses (one brace for this file) and pretty-prints it before sending. The repaired schema is:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "season": {"type": "string"},
      "team": {"type": "string"},
      "gp": {"type": "integer"},
      "g": {"type": "integer"},
      "a": {"type": "integer"},
      "pts": {"type": "integer"}
    },
    "required": ["season", "team", "gp", "g", "a", "pts"]
  }
}
```

The stats table has 15 season rows. Each row also has a second group of GP / G / A / Pts for playoffs. The schema has one set of counting stats, so the model has to choose what those four numbers mean. The script checks that the result is a JSON array of objects with those keys. It does not score the numbers against the page.

## 3. Generation settings from the model card

The Transformers examples call:

```python
model.generate(
    inputs,
    max_new_tokens=1024,
    temperature=0,
    do_sample=False,
    repetition_penalty=1.08,
)
```

LM Studio equivalents on `POST /v1/chat/completions`:

| Model card | LM Studio JSON field | Value in the scripts |
| --- | --- | --- |
| `temperature=0` and `do_sample=False` | `temperature` | `0` |
| `repetition_penalty=1.08` | `repeat_penalty` | `1.08` |
| `max_new_tokens=1024` | `max_tokens` | `1024` for the short Markdown example |

`repeat_penalty` is an LM Studio field, listed in their [chat completions](https://lmstudio.ai/docs/developer/openai-compat/chat-completions) parameters. `1.0` means no penalty. The card uses `1.08` to discourage repetition on long HTML conversions.

`1024` new tokens is enough for the one-line "Hello, world" Markdown example. It is tight for 15 season objects, and too small if you convert the whole player page to Markdown. The JSON script defaults to `2048` new tokens. The Markdown script uses `1024` for the built-in example and `4096` when you pass `--file`. Override either with `--max-tokens`.

Greedy decoding (`temperature` 0) is what you want for extraction. Raising temperature makes the JSON less stable.
