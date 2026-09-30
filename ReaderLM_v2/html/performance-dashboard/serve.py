"""Serve the performance dashboard at http://127.0.0.1:8765/index.html.

Uses the standard library only. Stop the server with Ctrl+C.

    python ReaderLM_v2\\html\\performance-dashboard\\serve.py
"""

from __future__ import annotations

import argparse
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the ReaderLM performance dashboard.")
    parser.add_argument("--host", default=HOST, help=f"bind address (default {HOST})")
    parser.add_argument("--port", type=int, default=PORT, help=f"port (default {PORT})")
    parser.add_argument("--no-browser", action="store_true", help="do not open the page")
    args = parser.parse_args()

    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    try:
        server = ThreadingHTTPServer((args.host, args.port), handler)
    except OSError as exc:
        raise SystemExit(f"Could not listen on {args.host}:{args.port}: {exc}") from exc

    url = f"http://{args.host}:{args.port}/index.html"
    print(f"Serving {ROOT}", flush=True)
    print(url, flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    if not args.no_browser:
        threading.Timer(0.4, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
