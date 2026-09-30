"""Fetch and parse public hockeydb.com player search and profile pages.

The local page cannot call hockeydb directly, so the dashboard server uses
these helpers. Requests are built here: a name query or a numeric player id.
"""

from __future__ import annotations

import re
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

SEARCH_URL = "https://www.hockeydb.com/ihdb/stats/find_player.php"
PLAYER_URL = "https://www.hockeydb.com/ihdb/stats/pdisplay.php"
ALLOWED_HOSTS = {"www.hockeydb.com", "hockeydb.com"}
USER_AGENT = "LocalLLMTests/1.0 (personal hockey stats lookup)"
MAX_BYTES = 2_000_000

_PID_HREF = re.compile(r"pdisplay\.php\?pid=(\d+)", re.IGNORECASE)
_COUNT = re.compile(r"(\d+)\s+players found", re.IGNORECASE)
_TITLE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
_TITLE_SUFFIX = re.compile(r"\s+Hockey Stats\b.*", re.IGNORECASE)
_QUERY_KEY = re.compile(r"^[A-Za-z0-9_.]+$")
_WHITESPACE = re.compile(r"\s+")


class HockeyDbError(RuntimeError):
    """A search or player page could not be fetched or was rejected."""

    def __init__(self, message: str, *, status: int = 502, http_status: int | None = None):
        super().__init__(message)
        self.status = status
        self.http_status = http_status


def fetch_html(url: str, timeout: float = 30) -> str:
    """GET one hockeydb URL and return the HTML text."""
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            final = response.geturl()
            host = urllib.parse.urlparse(final).hostname or ""
            if host not in ALLOWED_HOSTS:
                raise HockeyDbError("hockeydb.com redirected somewhere else.")
            chunks: list[bytes] = []
            total = 0
            while True:
                chunk = response.read(65536)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_BYTES:
                    raise HockeyDbError("hockeydb.com sent a page that is too large.")
                chunks.append(chunk)
    except HockeyDbError:
        raise
    except urllib.error.HTTPError as exc:
        raise HockeyDbError(
            f"hockeydb.com returned HTTP {exc.code}.",
            http_status=exc.code,
        ) from exc
    except urllib.error.URLError as exc:
        raise HockeyDbError(f"Could not reach hockeydb.com. Detail: {exc.reason}") from exc
    return b"".join(chunks).decode("utf-8", errors="replace")


def search_players(query: str, timeout: float = 30) -> dict:
    """Search by player name. Matches the public find_player.php form."""
    name = query.strip()
    if not name:
        raise HockeyDbError("Enter a player name.", status=400)
    if len(name) > 80:
        raise HockeyDbError("That name is too long.", status=400)
    params = urllib.parse.urlencode(
        {"full_name": name, "imageField.x": "86", "imageField.y": "9"}
    )
    html = _fetch_search_html(f"{SEARCH_URL}?{params}", timeout)
    if html is None:
        return _empty_search(name)
    parsed = parse_search_html(html)
    parsed["query"] = name
    return parsed


def search_page(page_query: str, timeout: float = 30) -> dict:
    """Open a next or previous results link from a search page."""
    params = validated_search_query(page_query)
    pairs = urllib.parse.parse_qs(params)
    names = pairs.get("full_name") or []
    query = names[0] if names else ""
    html = _fetch_search_html(f"{SEARCH_URL}?{params}", timeout)
    if html is None:
        return _empty_search(query)
    parsed = parse_search_html(html)
    parsed["query"] = query
    return parsed


def fetch_player_html(pid: str, timeout: float = 30) -> str:
    """Download one player profile. ``pid`` must already be digits."""
    if not pid.isdigit():
        raise HockeyDbError("Player id must be a number.", status=400)
    try:
        return fetch_html(f"{PLAYER_URL}?pid={pid}", timeout=timeout)
    except HockeyDbError as exc:
        if exc.http_status == 404:
            raise HockeyDbError("No hockeydb page for that player.", status=404) from exc
        raise


def _fetch_search_html(url: str, timeout: float) -> str | None:
    """Return search HTML. A 404 from hockeydb means the name matched nobody."""
    try:
        return fetch_html(url, timeout=timeout)
    except HockeyDbError as exc:
        if exc.http_status == 404:
            return None
        raise


def _empty_search(query: str) -> dict:
    return {
        "query": query,
        "count": 0,
        "shown": 0,
        "count_label": "0 players found",
        "players": [],
        "prev": None,
        "next": None,
    }


def player_name(html: str) -> str | None:
    """Name from the profile title, before the site suffix."""
    match = _TITLE.search(html)
    if not match:
        return None
    name = _TITLE_SUFFIX.sub("", match.group(1))
    name = _WHITESPACE.sub(" ", name).strip()
    return name or None


def validated_search_query(raw: str) -> str:
    """Keep a find_player.php query string and drop anything else."""
    text = raw.strip()
    if not text or len(text) > 500 or "\\" in text:
        raise HockeyDbError("That results page is not a hockeydb search.", status=400)
    if "://" in text or text.startswith("/"):
        parsed = urllib.parse.urlparse(text)
        if parsed.netloc and parsed.netloc not in ALLOWED_HOSTS:
            raise HockeyDbError("That results page is not a hockeydb search.", status=400)
        if parsed.path and not parsed.path.endswith("find_player.php"):
            raise HockeyDbError("That results page is not a hockeydb search.", status=400)
        query = parsed.query
    else:
        query = text.lstrip("?")
    pairs = urllib.parse.parse_qsl(query, keep_blank_values=True)
    if not pairs:
        raise HockeyDbError("That results page is not a hockeydb search.", status=400)
    safe: list[tuple[str, str]] = []
    for key, value in pairs:
        if not _QUERY_KEY.match(key) or len(value) > 200:
            raise HockeyDbError("That results page is not a hockeydb search.", status=400)
        safe.append((key, value))
    return urllib.parse.urlencode(safe)


def parse_search_html(html: str) -> dict:
    """Read the results table into player rows and any next/previous links."""
    parser = _SearchParser()
    parser.feed(html)
    parser.close()
    count_match = _COUNT.search(html)
    count = int(count_match.group(1)) if count_match else len(parser.players)
    prev_query, next_query = _page_queries(parser.anchors)
    return {
        "query": "",
        "count": count,
        "shown": len(parser.players),
        "count_label": f"{count} players found",
        "players": parser.players,
        "prev": prev_query,
        "next": next_query,
    }


def _page_queries(anchors: list[tuple[str, str, str]]) -> tuple[str | None, str | None]:
    prev_query = None
    next_query = None
    for href, text, rel in anchors:
        if "find_player.php" not in href:
            continue
        label = f"{rel} {text}".lower()
        try:
            query = validated_search_query(href)
        except HockeyDbError:
            continue
        if re.search(r"\b(prev|previous|back)\b", label):
            prev_query = query
        elif re.search(r"\bnext\b", label):
            next_query = query
    return prev_query, next_query


class _SearchParser(HTMLParser):
    """Collect result rows that link to pdisplay.php?pid=."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.players: list[dict] = []
        self.anchors: list[tuple[str, str, str]] = []
        self._in_row = False
        self._in_cell = False
        self._cell_parts: list[str] = []
        self._cells: list[str] = []
        self._row_pid: str | None = None
        self._in_anchor = False
        self._anchor_href = ""
        self._anchor_rel = ""
        self._anchor_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key: value or "" for key, value in attrs}
        if tag == "tr" and "data-status" in attr:
            self._in_row = True
            self._cells = []
            self._row_pid = None
            self._in_cell = False
            return
        if self._in_row and tag == "td":
            self._in_cell = True
            self._cell_parts = []
            return
        if self._in_row and tag == "input" and attr.get("name") == "pid[]":
            value = attr.get("value", "")
            if value.isdigit():
                self._row_pid = value
            return
        if tag == "a":
            href = attr.get("href", "")
            if self._in_row:
                match = _PID_HREF.search(href)
                if match:
                    self._row_pid = match.group(1)
            self._in_anchor = True
            self._anchor_href = href
            self._anchor_rel = attr.get("rel", "")
            self._anchor_text = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self._in_cell:
            text = _WHITESPACE.sub(" ", "".join(self._cell_parts)).strip()
            self._cells.append(text)
            self._in_cell = False
            return
        if tag == "a" and self._in_anchor:
            if not self._in_row and self._anchor_href:
                self.anchors.append((self._anchor_href, "".join(self._anchor_text).strip(), self._anchor_rel))
            self._in_anchor = False
            return
        if tag == "tr" and self._in_row:
            self._finish_row()
            self._in_row = False

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._cell_parts.append(data)
        if self._in_anchor and not self._in_row:
            self._anchor_text.append(data)

    def _finish_row(self) -> None:
        if not self._row_pid:
            return

        def cell(index: int) -> str:
            if index >= len(self._cells):
                return ""
            return self._cells[index]

        self.players.append(
            {
                "pid": self._row_pid,
                "name": cell(1),
                "position": cell(2),
                "birth_year": cell(3),
                "birthplace": cell(4),
                "years": cell(5),
                "level": cell(6),
                "teams": cell(7),
            }
        )
