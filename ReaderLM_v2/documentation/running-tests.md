# Running the tests

Run these from `ReaderLM_v2`. Python 3.10 or newer is enough. No extra packages.

The scripts read paths from their own location, so the sample file resolves even if the shell starts somewhere else.

## 1. Dry-run the sample

This parses `samples/gistfile1.txt`, cleans the HTML, repairs the schema, and writes the user message. It does not call LM Studio.

```text
python scripts\test_json_sample.py --dry-run
```

Read the character count and the rough token estimate (characters divided by 4). Set the loaded model's context length in LM Studio higher than that estimate plus `--max-tokens`.

The prompt is written under `output`, in a new folder for that run. The folder name starts with the local time (`YYYY-MM-DD_HHMMSS-mmm`) and then names the task, the sample, and the options (`cleaned`, `raw-html`, `as-is`, `news-instruction`, `dry-run`). A dry run looks like `output/2026-09-29_220145-123_json_gistfile1_cleaned_dry-run/`. Inside it, the prompt file repeats the timestamp and the sample name: `2026-09-29_220145-123_gistfile1_prompt.txt`.

What the script does with the sample, in order:

1. Split the file into the seasons instruction, the HTML fence, and the JSON schema fence.
2. Clean the HTML with the model-card cleaner (scripts, styles, meta, comments, link tags).
3. Close the schema's missing braces so it is valid JSON.
4. Rebuild the user message in the model-card JSON layout. The seasons instruction is kept.
5. On a real run, POST that message to LM Studio.

`--as-is` skips steps 2 through 4 and sends the file text unchanged. That keeps the original broken schema and the page scripts. Use it only as a comparison.

`--news-instruction` replaces the seasons instruction with the model card's Hacker News sentence. Leave this off for the sample.

`--no-clean` keeps the raw HTML inside the rebuilt prompt.

## 2. JSON extraction

Start the LM Studio server and load ReaderLM-v2 first. See [LM Studio setup](lm-studio-setup.md).

```text
python scripts\test_json_sample.py
```

Useful overrides:

```text
python scripts\test_json_sample.py --model your-lm-studio-model-id --max-tokens 4096
python scripts\test_json_sample.py --base-url http://127.0.0.1:1234/v1
```

Environment variables, if you do not want flags: `LMSTUDIO_BASE_URL`, `LMSTUDIO_MODEL`, `LMSTUDIO_API_KEY`.

Outputs go in a new folder under `output` for each run, so a later run does not replace the previous one. After the model id is known, that id is added to the folder name. Example: `output/2026-09-29_220145-123_json_gistfile1_readerlm-v2_cleaned/`.

| File | Contents |
| --- | --- |
| `{timestamp}_{sample}_prompt.txt` | User message sent to the model |
| `{timestamp}_{sample}_response.txt` | Raw assistant text |
| `{timestamp}_{sample}.json` | Parsed JSON, when the assistant text contains an array or object |
| `{timestamp}_{sample}_performance.json` | Timestamps, token counts, tokens/second, time to first token, and memory |
| `{timestamp}_{sample}_performance.txt` | The same figures in a short readable report |

Speed figures come from LM Studio's `POST /api/v1/chat` stats: generation tokens per second and time to first token. The script also records its own start and finish timestamps. Memory covers system RAM, LM Studio process working set, and NVIDIA GPU memory when `nvidia-smi` is available, including the peak GPU memory sampled during the request.

The process exits 0 when the parsed value is a list of objects that each contain `season`, `team`, `gp`, `g`, `a`, and `pts`. It exits 2 when the server answered but the shape does not match. It exits 1 when LM Studio cannot be reached or returns an HTTP error.

Default generation for this script: temperature `0`, repeat penalty `1.08`, max tokens `2048`. The model card's own examples use 1024 new tokens; 2048 leaves room for 15 season objects plus a JSON fence.

## 3. Markdown smoke test

The model card's HTML-to-Markdown example is a one-line page. This is the fast check that the server, the template, and the cleaner are wired up:

```text
python scripts\test_markdown.py
```

Expected kind of answer: a Markdown heading for "Hello, world!". The raw reply is `output/markdown_response.md`.

To convert the player page instead:

```text
python scripts\test_markdown.py --file samples\gistfile1.txt
```

That command takes the HTML out of the sample, cleans it, and uses the Markdown instruction from the model card. The seasons instruction and the schema are not sent. Max tokens defaults to 4096 for `--file`.

## 4. Search a player and import stats

Start the local page server. LM Studio must already be serving ReaderLM-v2, the same way it does for a JSON test.

```text
python html\performance-dashboard\serve.py
```

Open `http://127.0.0.1:8765/players.html`, or use Import player on the performance page. Search a name such as `Suzuki`, select Nick Suzuki, and choose Import stats. The page asks hockeydb for that player's profile, then runs the same seasons extraction as `test_json_sample.py`. When it finishes, the season table is on the page and a new folder is under `output/`. Reload the performance dashboard to see that run.

If the name matches nobody, the page says so and does not show a table. If LM Studio is not running, Import stats shows that error and does not show a table.

## When a run fails

The server is not running. Start it from LM Studio's Developer tab, or run `lms server start`.

ReaderLM-v2 is not installed. `lms ls` only lists other models, often an embedding model already on the machine. Download a GGUF with the command in [LM Studio setup](lm-studio-setup.md), load it, and run the script again. The client ignores embedding models and exits instead of sending the HTML prompt to one.

The prompt is longer than the context length you set at load time. Use the dry-run estimate, reload the model with a larger context, and run again.

The HTTP body mentions `repeat_penalty`. The client retries that request once without the field. Temperature `0` and the prompt stay the same.

The assistant text is cut off. `finish_reason` will be `length`. Raise `--max-tokens` and make sure the context length covers the prompt plus the new tokens.

The JSON parses but the numbers look like playoff stats, or a season is missing. The schema does not say which of the two stat groups on each row to read. That is a property of this sample, not a failure of the client.
