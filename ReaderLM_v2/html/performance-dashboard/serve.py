"""Serve the local ReaderLM pages at http://127.0.0.1:8765/.

The performance dashboard stays at /index.html. Player search is /players.html.
Search and import are proxied here because the browser cannot call hockeydb.

Uses the standard library only. Stop the server with Ctrl+C.

    python ReaderLM_v2\\html\\performance-dashboard\\serve.py
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
import urllib.parse
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
PLAYER_DIR = ROOT.parent / "player-import"
SCRIPTS = ROOT.parents[1] / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import hockeydb  # noqa: E402
import import_player  # noqa: E402

PLAYER_FILES = {
    "/players.html": (PLAYER_DIR / "index.html", "text/html; charset=utf-8"),
    "/player-import/import.css": (PLAYER_DIR / "import.css", "text/css; charset=utf-8"),
    "/player-import/import.js": (PLAYER_DIR / "import.js", "text/javascript; charset=utf-8"),
}


class DashboardHandler(SimpleHTTPRequestHandler):
    """Static dashboard files plus the player search API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/search":
            self._search(parsed.query)
            return
        if parsed.path in PLAYER_FILES:
            self._send_static(*PLAYER_FILES[parsed.path])
            return
        if parsed.path in ("", "/"):
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/import":
            self.send_error(404)
            return
        self._import()

    def _search(self, query: str) -> None:
        params = urllib.parse.parse_qs(query)
        page = (params.get("page") or [""])[0]
        name = (params.get("q") or [""])[0]
        try:
            if page:
                payload = hockeydb.search_page(page)
            else:
                payload = hockeydb.search_players(name)
        except hockeydb.HockeyDbError as exc:
            self._json(exc.status, {"error": str(exc)})
            return
        self._json(200, payload)

    def _import(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = -1
        if length < 0 or length > 8192:
            self._json(400, {"error": "Request body is too large."})
            return
        raw = self.rfile.read(length) if length else b""
        try:
            body = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._json(400, {"error": "Request body must be JSON."})
            return
        if not isinstance(body, dict):
            self._json(400, {"error": "Request body must be a JSON object."})
            return
        status, payload = import_player.import_stats(body.get("pid"))
        self._json(status, payload)

    def _send_static(self, path: Path, content_type: str) -> None:
        try:
            data = path.read_bytes()
        except OSError:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _json(self, status: int, payload: dict) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the ReaderLM performance dashboard and player import page.")
    parser.add_argument("--host", default=HOST, help=f"bind address (default {HOST})")
    parser.add_argument("--port", type=int, default=PORT, help=f"port (default {PORT})")
    parser.add_argument("--no-browser", action="store_true", help="do not open the page")
    args = parser.parse_args()

    try:
        server = ThreadingHTTPServer((args.host, args.port), DashboardHandler)
    except OSError as exc:
        raise SystemExit(f"Could not listen on {args.host}:{args.port}: {exc}") from exc

    url = f"http://{args.host}:{args.port}/index.html"
    print(f"Serving {ROOT}", flush=True)
    print(url, flush=True)
    print(f"Player import: http://{args.host}:{args.port}/players.html", flush=True)
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
