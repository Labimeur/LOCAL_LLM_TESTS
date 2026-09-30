(function () {
  var form = document.getElementById("search-form");
  var queryInput = document.getElementById("q");
  var searchButton = document.getElementById("search");
  var statusEl = document.getElementById("status");
  var errorEl = document.getElementById("error");
  var resultsEl = document.getElementById("results");
  var countEl = document.getElementById("count");
  var shownEl = document.getElementById("shown");
  var listEl = document.getElementById("result-list");
  var prevButton = document.getElementById("prev");
  var nextButton = document.getElementById("next");
  var pickEl = document.getElementById("pick");
  var pickName = document.getElementById("pick-name");
  var importButton = document.getElementById("import");
  var statsEl = document.getElementById("stats");
  var statsTitle = document.getElementById("stats-title");
  var folderEl = document.getElementById("folder");
  var warningEl = document.getElementById("warning");
  var statsBody = document.getElementById("stats-body");

  var selected = null;
  var busy = false;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function setStatus(text) {
    statusEl.textContent = text || "";
  }

  function showError(text) {
    errorEl.hidden = false;
    errorEl.textContent = text;
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function clearStats() {
    statsEl.hidden = true;
    statsBody.innerHTML = "";
    folderEl.textContent = "";
    warningEl.hidden = true;
    warningEl.textContent = "";
  }

  function clearSelection() {
    selected = null;
    pickEl.hidden = true;
    pickName.textContent = "";
    importButton.disabled = true;
  }

  function setBusy(next) {
    busy = next;
    searchButton.disabled = next;
    queryInput.disabled = next;
    prevButton.disabled = next;
    nextButton.disabled = next;
    importButton.disabled = next || !selected;
  }

  function metaLine(player) {
    var parts = [player.position, player.birth_year, player.birthplace, player.years, player.level, player.teams];
    return parts.filter(function (part) { return part; }).join(" · ");
  }

  function renderResults(data) {
    countEl.textContent = data.count_label || (data.players.length + " players found");
    if (data.count > data.shown) {
      shownEl.hidden = false;
      shownEl.textContent = "Showing " + data.shown + " of " + data.count + ".";
    } else {
      shownEl.hidden = true;
      shownEl.textContent = "";
    }
    prevButton.hidden = !data.prev;
    nextButton.hidden = !data.next;
    prevButton.dataset.page = data.prev || "";
    nextButton.dataset.page = data.next || "";
    listEl.innerHTML = data.players.map(function (player) {
      return (
        "<button type=\"button\" class=\"result\" role=\"option\" data-pid=\"" + escapeHtml(player.pid) + "\">" +
          "<div class=\"result-name\">" + escapeHtml(player.name || player.pid) + "</div>" +
          "<div class=\"result-meta\">" + escapeHtml(metaLine(player)) + "</div>" +
        "</button>"
      );
    }).join("");
    resultsEl.hidden = false;
    pickEl.hidden = false;
    pickName.textContent = "Select a player.";
    importButton.disabled = true;
    var buttons = listEl.querySelectorAll(".result");
    data.players.forEach(function (player, index) {
      var button = buttons[index];
      if (!button) return;
      button.addEventListener("click", function () {
        if (busy) return;
        selected = player;
        listEl.querySelectorAll(".result").forEach(function (item) {
          item.classList.toggle("selected", item === button);
          item.setAttribute("aria-selected", item === button ? "true" : "false");
        });
        pickName.textContent = player.name || player.pid;
        importButton.disabled = false;
        clearStats();
        clearError();
      });
    });
  }

  async function runSearch(url) {
    if (busy) return;
    clearError();
    clearStats();
    clearSelection();
    resultsEl.hidden = true;
    listEl.innerHTML = "";
    setStatus("Searching hockeydb…");
    setBusy(true);
    try {
      var response = await fetch(url);
      var data = await response.json();
      if (!response.ok || data.error) {
        showError(data.error || "Search failed.");
        setStatus("");
        return;
      }
      if (!data.players || !data.players.length) {
        showError("No players matched that name.");
        setStatus("");
        return;
      }
      renderResults(data);
      setStatus("");
    } catch (err) {
      showError("Search failed. The local server may have stopped.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = queryInput.value.trim();
    if (!name) {
      showError("Enter a player name.");
      return;
    }
    runSearch("/api/search?q=" + encodeURIComponent(name));
  });

  function turnPage(button) {
    if (!button.dataset.page) return;
    runSearch("/api/search?page=" + encodeURIComponent(button.dataset.page));
  }

  prevButton.addEventListener("click", function () { turnPage(prevButton); });
  nextButton.addEventListener("click", function () { turnPage(nextButton); });

  importButton.addEventListener("click", async function () {
    if (!selected || busy) return;
    clearError();
    clearStats();
    setStatus("ReaderLM is reading the page.");
    importButton.textContent = "Importing…";
    setBusy(true);
    try {
      var response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: selected.pid })
      });
      var data = await response.json();
      if (!response.ok || data.error || !Array.isArray(data.rows)) {
        showError(data.error || "Import failed.");
        setStatus("");
        return;
      }
      statsTitle.textContent = data.name || selected.name || "Season stats";
      folderEl.textContent = "Saved in output/" + data.folder;
      if (data.warning) {
        warningEl.hidden = false;
        warningEl.textContent = data.warning;
      }
      statsBody.innerHTML = data.rows.map(function (row) {
        return (
          "<tr>" +
            "<td>" + escapeHtml(row.season) + "</td>" +
            "<td>" + escapeHtml(row.team) + "</td>" +
            "<td>" + escapeHtml(row.gp) + "</td>" +
            "<td>" + escapeHtml(row.g) + "</td>" +
            "<td>" + escapeHtml(row.a) + "</td>" +
            "<td>" + escapeHtml(row.pts) + "</td>" +
          "</tr>"
        );
      }).join("");
      statsEl.hidden = false;
      setStatus(data.detail || "");
    } catch (err) {
      showError("Import failed. The local server may have stopped.");
      setStatus("");
    } finally {
      importButton.textContent = "Import stats";
      setBusy(false);
    }
  });
})();
