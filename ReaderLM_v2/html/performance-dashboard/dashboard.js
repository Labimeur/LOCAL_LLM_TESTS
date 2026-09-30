(function () {
  "use strict";

  var COLORS = {
    phosphor: "#c6f135",
    copper: "#e7a15a",
    ice: "#79c0ff",
    rose: "#ff8d7a",
    text: "#f3efe4",
    muted: "#a39e93",
    dim: "#6f6b63",
    grid: "rgba(232, 224, 206, 0.12)",
  };

  var payload = window.READERLM_RUNS || { runs: [], errors: [], generated_at: "" };
  var rawRuns = Array.isArray(payload.runs) ? payload.runs : [];
  var view = 0;
  var charts = [];
  var tip = document.getElementById("tip");

  function num(value) {
    return typeof value === "number" && isFinite(value) ? value : null;
  }

  function get(obj, path, fallback) {
    var cur = obj;
    for (var i = 0; i < path.length; i += 1) {
      if (cur == null) return fallback;
      cur = cur[path[i]];
    }
    return cur == null ? fallback : cur;
  }

  function fmt(value, digits) {
    if (value == null || !isFinite(value)) return "—";
    return Number(value).toLocaleString(undefined, {
      maximumFractionDigits: digits == null ? 2 : digits,
      minimumFractionDigits: digits == null ? 0 : digits,
    });
  }

  function fmtInt(value) {
    if (value == null || !isFinite(value)) return "—";
    return Math.round(value).toLocaleString();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseStamp(iso) {
    if (!iso) return null;
    var date = new Date(iso);
    return isNaN(date.getTime()) ? null : date;
  }

  function clock(iso) {
    var date = parseStamp(iso);
    if (!date) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function shortDate(iso) {
    var date = parseStamp(iso);
    if (!date) return "—";
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function labelFromFolder(folder) {
    var match = String(folder || "").match(/_(\d{6}-\d+)_([^_]+)_/);
    if (match) return match[2] + " · " + match[1].slice(0, 6);
    var parts = String(folder || "").split("_");
    return parts.length > 2 ? parts[2] : folder || "run";
  }

  function gpuAt(report, when) {
    return get(report, ["memory", when, "gpu", "gpus", 0], {}) || {};
  }

  function median(values) {
    var list = values.filter(function (item) { return item != null && isFinite(item); }).sort(function (a, b) { return a - b; });
    if (!list.length) return null;
    var mid = Math.floor(list.length / 2);
    return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
  }

  function minOf(values) {
    var list = values.filter(function (item) { return item != null && isFinite(item); });
    return list.length ? Math.min.apply(null, list) : null;
  }

  function maxOf(values) {
    var list = values.filter(function (item) { return item != null && isFinite(item); });
    return list.length ? Math.max.apply(null, list) : null;
  }

  function decodeSeconds(report) {
    var out = num(get(report, ["tokens", "output_tokens"]));
    var tps = num(get(report, ["speed", "tokens_per_second"]));
    if (out == null || tps == null || tps <= 0) return null;
    return out / tps;
  }

  var runs = rawRuns.map(function (item, index) {
    var report = item.report || {};
    return {
      index: index,
      id: item.id,
      folder: item.folder,
      file: item.file,
      relative_path: item.relative_path,
      report: report,
      started: get(report, ["timing", "started_at"], ""),
      tps: num(get(report, ["speed", "tokens_per_second"])),
      wall: num(get(report, ["speed", "wall_clock_seconds"])),
      ttft: num(get(report, ["speed", "time_to_first_token_seconds"])),
      otw: num(get(report, ["speed", "output_tokens_per_wall_second"])),
      input: num(get(report, ["tokens", "input_tokens"])),
      output: num(get(report, ["tokens", "output_tokens"])),
      reasoning: num(get(report, ["tokens", "reasoning_output_tokens"])) || 0,
      schemaOk: get(report, ["result", "schema_ok"], null),
      jsonParsed: get(report, ["result", "json_parsed"], null),
      objects: get(report, ["result", "json_object_count"], null),
      finish: get(report, ["result", "finish_reason"], "—"),
    };
  });

  var chronological = runs.slice().sort(function (a, b) {
    return String(a.started).localeCompare(String(b.started));
  });

  var views = [{ kind: "overview" }].concat(runs.map(function (run) {
    return { kind: "run", run: run };
  }));

  function setTip(html, x, y) {
    if (!tip) return;
    if (!html) {
      tip.hidden = true;
      return;
    }
    tip.hidden = false;
    tip.innerHTML = html;
    var left = x + 14;
    var top = y + 14;
    var box = tip.getBoundingClientRect();
    if (left + box.width > window.innerWidth - 12) left = x - box.width - 12;
    if (top + box.height > window.innerHeight - 12) top = y - box.height - 12;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.max(8, top) + "px";
  }

  function sizeCanvas(canvas, cssHeight) {
    var ratio = window.devicePixelRatio || 1;
    var width = canvas.clientWidth || canvas.parentElement.clientWidth || 640;
    var height = cssHeight || parseInt(getComputedStyle(canvas).height, 10) || 280;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx: ctx, w: width, h: height };
  }

  function niceRange(values, padRatio) {
    var lo = minOf(values);
    var hi = maxOf(values);
    if (lo == null || hi == null) return { min: 0, max: 1 };
    if (lo === hi) {
      var bump = Math.max(Math.abs(lo) * 0.04, 1);
      return { min: lo - bump, max: hi + bump };
    }
    var pad = (hi - lo) * (padRatio == null ? 0.18 : padRatio);
    return { min: lo - pad, max: hi + pad };
  }

  function drawLineChart(canvas, series, options) {
    var sized = sizeCanvas(canvas, options.height || 280);
    var ctx = sized.ctx;
    var w = sized.w;
    var h = sized.h;
    var pad = { l: 52, r: 16, t: 18, b: 36 };
    var plotW = w - pad.l - pad.r;
    var plotH = h - pad.t - pad.b;
    var values = series.map(function (item) { return item.y; });
    var range = options.range || niceRange(values);
    var min = range.min;
    var max = range.max;
    var span = max - min || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    var ticks = 4;
    ctx.font = "12px Consolas, monospace";
    ctx.fillStyle = COLORS.dim;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (var i = 0; i <= ticks; i += 1) {
      var yVal = min + (span * i) / ticks;
      var y = pad.t + plotH - (plotH * i) / ticks;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      ctx.fillText(fmt(yVal, options.digits == null ? 1 : options.digits), pad.l - 8, y);
    }

    var points = series.map(function (item, index) {
      var x = pad.l + (series.length === 1 ? plotW / 2 : (plotW * index) / (series.length - 1));
      var y = pad.t + plotH - ((item.y - min) / span) * plotH;
      return { x: x, y: y, item: item };
    });

    ctx.beginPath();
    points.forEach(function (pt, index) {
      if (index === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = options.color || COLORS.phosphor;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    var gradient = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    gradient.addColorStop(0, (options.fill || "rgba(198, 241, 53, 0.22)"));
    gradient.addColorStop(1, "rgba(198, 241, 53, 0)");
    ctx.lineTo(points[points.length - 1].x, h - pad.b);
    ctx.lineTo(points[0].x, h - pad.b);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    points.forEach(function (pt) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = options.color || COLORS.phosphor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#10200a";
      ctx.fill();
    });

    ctx.fillStyle = COLORS.dim;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    points.forEach(function (pt) {
      ctx.fillText(pt.item.label, pt.x, h - pad.b + 10);
    });

    canvas.onmousemove = function (event) {
      var rect = canvas.getBoundingClientRect();
      var mx = event.clientX - rect.left;
      var my = event.clientY - rect.top;
      var hit = null;
      var best = 18;
      points.forEach(function (pt) {
        var d = Math.hypot(pt.x - mx, pt.y - my);
        if (d < best) {
          best = d;
          hit = pt;
        }
      });
      if (!hit) {
        setTip("", 0, 0);
        return;
      }
      setTip(
        "<strong>" + escapeHtml(hit.item.title || hit.item.label) + "</strong><br>" +
          escapeHtml(options.unitLabel || "value") + ": " + fmt(hit.item.y, options.digits == null ? 2 : options.digits),
        event.clientX,
        event.clientY
      );
    };
    canvas.onmouseleave = function () { setTip("", 0, 0); };
  }

  function drawDonut(canvas, slices) {
    var sized = sizeCanvas(canvas, 240);
    var ctx = sized.ctx;
    var w = sized.w;
    var h = sized.h;
    var cx = w / 2;
    var cy = h / 2;
    var radius = Math.min(w, h) * 0.36;
    var total = slices.reduce(function (sum, slice) { return sum + (slice.value || 0); }, 0) || 1;
    var start = -Math.PI / 2;
    ctx.clearRect(0, 0, w, h);
    slices.forEach(function (slice) {
      var sweep = ((slice.value || 0) / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + sweep);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      start += sweep;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = "#141920";
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = "600 22px Bahnschrift, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fmtInt(total), cx, cy - 8);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.fillText("tokens", cx, cy + 14);
  }

  function afterPaint(fn) {
    requestAnimationFrame(function () { requestAnimationFrame(fn); });
  }

  function metricCard(opts) {
    var klass = "metric" + (opts.primary ? " metric-primary" : "") + (opts.small ? " metric-sm" : "");
    var tag = opts.go == null ? "div" : "button";
    var extra = opts.go == null ? "" : " data-go=\"" + opts.go + "\"";
    return (
      "<" + tag + " class=\"" + klass + "\"" + extra + ">" +
        "<div class=\"kicker\">" + escapeHtml(opts.kicker) + "</div>" +
        "<div class=\"metric-value\">" + escapeHtml(opts.value) + "</div>" +
        (opts.unit ? "<div class=\"metric-unit\">" + escapeHtml(opts.unit) + "</div>" : "") +
        (opts.note ? "<div class=\"metric-note\">" + escapeHtml(opts.note) + "</div>" : "") +
      "</" + tag + ">"
    );
  }

  function chip(text, kind) {
    return "<span class=\"chip" + (kind ? " " + kind : "") + "\">" + escapeHtml(text) + "</span>";
  }

  function resultKind(ok) {
    if (ok === true) return "good";
    if (ok === false) return "bad";
    return "";
  }

  function renderOverview() {
    var tps = runs.map(function (run) { return run.tps; });
    var walls = runs.map(function (run) { return run.wall; });
    var ttfts = runs.map(function (run) { return run.ttft; });
    var schemaPass = runs.filter(function (run) { return run.schemaOk === true; }).length;
    var bestTps = maxOf(tps);
    var bestRun = chronological.find(function (run) { return run.tps === bestTps; }) || runs[0];
    var fastestWall = minOf(walls);
    var model = get(runs[0], ["report", "model"], {}) || {};
    var gpu = gpuAt(runs[0] && runs[0].report, "after");

    var tableRows = chronological.map(function (run) {
      return (
        "<tr data-go=\"" + (run.index + 1) + "\">" +
          "<td>" + escapeHtml(clock(run.started)) + "</td>" +
          "<td>" + escapeHtml(labelFromFolder(run.folder)) + "</td>" +
          "<td class=\"num\">" + fmt(run.tps, 2) + "</td>" +
          "<td class=\"num\">" + fmt(run.wall, 3) + "</td>" +
          "<td class=\"num\">" + fmt(run.ttft, 3) + "</td>" +
          "<td class=\"num\">" + fmt(run.otw, 2) + "</td>" +
          "<td class=\"num\">" + fmtInt(get(gpuAt(run.report, "after"), ["utilization_percent"])) + "%</td>" +
          "<td>" + (run.schemaOk === true ? "ok" : run.schemaOk === false ? "fail" : "—") + "</td>" +
        "</tr>"
      );
    }).join("");

    document.getElementById("kicker").textContent = "All local runs";
    document.getElementById("title").textContent = "ReaderLM throughput";
    document.getElementById("subtitle").textContent =
      runs.length + " JSON extractions · " + (model.id || "readerlm-v2") + " " + (model.quantization || "") +
      " · " + (gpu.name || "GPU");

    document.getElementById("stage").innerHTML =
      "<div class=\"layout\">" +
        "<div class=\"metrics\">" +
          metricCard({ primary: true, kicker: "Best tokens / s", value: fmt(bestTps, 2), unit: "tokens per second", note: bestRun ? clock(bestRun.started) : "" }) +
          metricCard({ kicker: "Median tokens / s", value: fmt(median(tps), 2), unit: "across " + runs.length + " runs" }) +
          metricCard({ kicker: "Fastest wall", value: fmt(fastestWall, 3), unit: "seconds" }) +
          metricCard({ kicker: "Median TTFT", value: fmt(median(ttfts), 3), unit: "seconds · cache-hit range" }) +
        "</div>" +
        "<div class=\"metrics metrics-4\">" +
          metricCard({ small: true, kicker: "Runs", value: String(runs.length), unit: "performance reports" }) +
          metricCard({ small: true, kicker: "Schema pass", value: schemaPass + "/" + runs.length, unit: "JSON objects matched" }) +
          metricCard({ small: true, kicker: "Tokens in / out", value: fmtInt(runs[0] && runs[0].input) + " / " + fmtInt(runs[0] && runs[0].output), unit: "same prompt each run" }) +
          metricCard({ small: true, kicker: "Spread", value: fmt(maxOf(tps) - minOf(tps), 2), unit: "tokens / s peak to floor" }) +
        "</div>" +
        "<div class=\"grid-2\">" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>Generation speed</h2><div class=\"card-note\">Y-axis is zoomed to the run range so the 207–220 tok/s spread stays visible.</div></div><div class=\"card-stat\">" + fmt(bestTps, 1) + "<span> peak</span></div></div>" +
            "<canvas id=\"chart-tps\" class=\"chart\"></canvas>" +
          "</section>" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>Wall clock</h2><div class=\"card-note\">Whole request, including prompt processing.</div></div><div class=\"card-stat\">" + fmt(fastestWall, 3) + "<span> s fastest</span></div></div>" +
            "<canvas id=\"chart-wall\" class=\"chart\"></canvas>" +
          "</section>" +
        "</div>" +
        "<div class=\"grid-2\">" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>Time to first token</h2><div class=\"card-note\">These values only make sense as a cached-prompt hit.</div></div><div class=\"card-stat\">" + fmt(median(ttfts), 3) + "<span> s median</span></div></div>" +
            "<canvas id=\"chart-ttft\" class=\"chart\"></canvas>" +
          "</section>" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>GPU after each run</h2><div class=\"card-note\">" + escapeHtml(gpu.name || "GPU") + "</div></div></div>" +
            "<canvas id=\"chart-gpu\" class=\"chart\"></canvas>" +
          "</section>" +
        "</div>" +
        "<section class=\"card\">" +
          "<div class=\"card-head\"><h2>Every run</h2><div class=\"card-note\">Click a row to open that test.</div></div>" +
          "<div class=\"table-wrap\"><table><thead><tr>" +
            "<th>Started</th><th>Sample</th><th class=\"num\">Tok/s</th><th class=\"num\">Wall s</th><th class=\"num\">TTFT s</th><th class=\"num\">Out / wall</th><th class=\"num\">GPU %</th><th>Schema</th>" +
          "</tr></thead><tbody>" + tableRows + "</tbody></table></div>" +
        "</section>" +
        "<p class=\"sources\">Generated " + escapeHtml(payload.generated_at || "locally") +
          (payload.errors && payload.errors.length ? " · " + payload.errors.length + " file error(s)" : "") +
          ". Reload after a new test, or run <code>python ReaderLM_v2\\html\\performance-dashboard\\refresh_data.py</code>.</p>" +
      "</div>";

    afterPaint(function () {
      var tpsSeries = chronological.map(function (run) {
        return { y: run.tps, label: clock(run.started).slice(0, 8), title: shortDate(run.started) };
      });
      var wallSeries = chronological.map(function (run) {
        return { y: run.wall, label: clock(run.started).slice(0, 8), title: shortDate(run.started) };
      });
      var ttftSeries = chronological.map(function (run) {
        return { y: run.ttft * 1000, label: clock(run.started).slice(0, 8), title: shortDate(run.started) };
      });
      var gpuSeries = chronological.map(function (run) {
        return { y: num(gpuAt(run.report, "after").memory_used_mib), label: clock(run.started).slice(0, 8), title: shortDate(run.started) };
      });
      drawLineChart(document.getElementById("chart-tps"), tpsSeries, {
        color: COLORS.phosphor,
        fill: "rgba(198, 241, 53, 0.18)",
        unitLabel: "tokens / s",
        digits: 2,
      });
      drawLineChart(document.getElementById("chart-wall"), wallSeries, {
        color: COLORS.ice,
        fill: "rgba(121, 192, 255, 0.16)",
        unitLabel: "wall seconds",
        digits: 3,
      });
      drawLineChart(document.getElementById("chart-ttft"), ttftSeries, {
        color: COLORS.copper,
        fill: "rgba(231, 161, 90, 0.16)",
        unitLabel: "TTFT ms",
        digits: 1,
      });
      drawLineChart(document.getElementById("chart-gpu"), gpuSeries, {
        color: COLORS.ice,
        fill: "rgba(121, 192, 255, 0.14)",
        unitLabel: "GPU MiB after",
        digits: 0,
      });
    });
  }

  function renderRun(run) {
    var report = run.report;
    var speed = report.speed || {};
    var tokens = report.tokens || {};
    var model = report.model || {};
    var request = report.request || {};
    var result = report.result || {};
    var memory = report.memory || {};
    var beforeGpu = gpuAt(report, "before");
    var afterGpu = gpuAt(report, "after");
    var beforeRam = get(memory, ["before", "system_ram"], {}) || {};
    var afterRam = get(memory, ["after", "system_ram"], {}) || {};
    var beforeProc = get(memory, ["before", "lm_studio_processes"], {}) || {};
    var afterProc = get(memory, ["after", "lm_studio_processes"], {}) || {};
    var decode = decodeSeconds(report);
    var ttft = num(speed.time_to_first_token_seconds) || 0;
    var wall = num(speed.wall_clock_seconds) || 0;
    var other = Math.max(0, wall - ttft - (decode || 0));
    var context = num(model.loaded_context_length);
    var contextPct = context && run.input ? (run.input / context) * 100 : 0;
    var gpuTotal = num(afterGpu.memory_total_mib) || num(beforeGpu.memory_total_mib) || 1;
    var insights = report.insights || [];

    var beforeByPid = {};
    (beforeProc.processes || []).forEach(function (proc) { beforeByPid[proc.pid] = proc.working_set_mib; });
    var afterList = (afterProc.processes || []).slice().sort(function (a, b) {
      return (b.working_set_mib || 0) - (a.working_set_mib || 0);
    });
    var procMax = 1;
    afterList.forEach(function (proc) {
      procMax = Math.max(procMax, proc.working_set_mib || 0, beforeByPid[proc.pid] || 0);
    });

    var procHtml = afterList.map(function (proc) {
      var beforeVal = beforeByPid[proc.pid] || 0;
      var afterVal = proc.working_set_mib || 0;
      return (
        "<div class=\"proc\">" +
          "<div class=\"proc-pid\">" + escapeHtml(String(proc.pid)) + "</div>" +
          "<div>" +
            "<div class=\"proc-row\"><div class=\"proc-track\"><div class=\"proc-fill before\" data-w=\"" + ((beforeVal / procMax) * 100) + "\"></div></div><div class=\"proc-val\">" + fmt(beforeVal, 1) + "</div></div>" +
            "<div class=\"proc-row\"><div class=\"proc-track\"><div class=\"proc-fill after\" data-w=\"" + ((afterVal / procMax) * 100) + "\"></div></div><div class=\"proc-val\">" + fmt(afterVal, 1) + "</div></div>" +
          "</div>" +
          "<div class=\"proc-delta\">" + (afterVal - beforeVal >= 0 ? "+" : "") + fmt(afterVal - beforeVal, 1) + "</div>" +
        "</div>"
      );
    }).join("");

    document.getElementById("kicker").textContent = "Individual test · " + (run.index + 1) + " of " + runs.length;
    document.getElementById("title").textContent = fmt(run.tps, 2) + " tok/s";
    document.getElementById("subtitle").textContent =
      shortDate(run.started) + " · " + labelFromFolder(run.folder) + " · " + (model.quantization || "") + " · " + (afterGpu.name || "");

    document.getElementById("stage").innerHTML =
      "<div class=\"layout\">" +
        "<div class=\"chips\">" +
          chip(result.schema_ok === true ? "schema ok" : "schema " + String(result.schema_ok), resultKind(result.schema_ok)) +
          chip(result.json_parsed === true ? "json parsed" : "json " + String(result.json_parsed), resultKind(result.json_parsed)) +
          chip(result.finish_reason || "finish") +
          chip((result.json_object_count || "—") + " objects") +
          chip((model.architecture || "model") + " " + (model.quantization || "")) +
        "</div>" +
        "<div class=\"metrics\">" +
          metricCard({ primary: true, kicker: "Tokens / second", value: fmt(run.tps, 2), unit: "LM Studio generation speed", note: fmt(run.output, 0) + " output tokens" }) +
          metricCard({ kicker: "Wall clock", value: fmt(run.wall, 3), unit: "seconds" }) +
          metricCard({ kicker: "Time to first token", value: fmt(run.ttft, 3), unit: "seconds", note: "treat as cache hit" }) +
          metricCard({ kicker: "Out / wall second", value: fmt(run.otw, 2), unit: "includes prompt processing" }) +
        "</div>" +
        "<div class=\"grid-2\">" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>Token mix</h2><div class=\"card-note\">Input vs generated output</div></div><div class=\"card-stat\">" + fmtInt(tokens.total_tokens) + "<span> total</span></div></div>" +
            "<div class=\"donut-wrap\">" +
              "<canvas id=\"chart-donut\" class=\"donut\"></canvas>" +
              "<ul class=\"legend\">" +
                "<li><span><span class=\"swatch\" style=\"background:" + COLORS.ice + "\"></span>Input</span><b>" + fmtInt(run.input) + "</b></li>" +
                "<li><span><span class=\"swatch\" style=\"background:" + COLORS.phosphor + "\"></span>Output</span><b>" + fmtInt(run.output) + "</b></li>" +
                "<li><span><span class=\"swatch\" style=\"background:" + COLORS.copper + "\"></span>Reasoning</span><b>" + fmtInt(run.reasoning) + "</b></li>" +
              "</ul>" +
            "</div>" +
          "</section>" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>Request time</h2><div class=\"card-note\">TTFT, decode, and leftover wall time</div></div><div class=\"card-stat\">" + fmt(wall, 3) + "<span> s</span></div></div>" +
            "<div class=\"stack-bar\">" +
              "<div class=\"stack-seg ttft\" data-w=\"" + (wall ? (ttft / wall) * 100 : 0) + "\"></div>" +
              "<div class=\"stack-seg decode\" data-w=\"" + (wall && decode ? (decode / wall) * 100 : 0) + "\"></div>" +
              "<div class=\"stack-seg other\" data-w=\"" + (wall ? (other / wall) * 100 : 0) + "\"></div>" +
            "</div>" +
            "<div class=\"stack-legend\">" +
              "<span>TTFT <strong>" + fmt(ttft, 3) + "s</strong></span>" +
              "<span>Decode <strong>" + fmt(decode, 3) + "s</strong></span>" +
              "<span>Other <strong>" + fmt(other, 3) + "s</strong></span>" +
            "</div>" +
            "<div class=\"context-track\"><div class=\"context-fill\" data-w=\"" + contextPct + "\"></div></div>" +
            "<div class=\"context-scale\"><span>0</span><span>" + fmtInt(run.input) + " / " + fmtInt(context) + " context</span><span>" + fmtInt(context) + "</span></div>" +
          "</section>" +
        "</div>" +
        "<div class=\"grid-memory\">" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>GPU memory</h2><div class=\"card-note\">" + escapeHtml(afterGpu.name || "GPU") + "</div></div>" +
              "<div class=\"card-stat\">" + fmt(afterGpu.memory_used_mib, 0) + "<span> / " + fmtInt(gpuTotal) + " MiB</span></div>" +
            "</div>" +
            "<div class=\"util-figure\">" +
              "<div><div class=\"util-num\">" + fmt(afterGpu.utilization_percent, 0) + "<span>%</span></div><div class=\"card-note\">utilization after</div></div>" +
              "<div><div class=\"util-num dim\">" + fmt(beforeGpu.utilization_percent, 0) + "<span>%</span></div><div class=\"card-note\">before</div></div>" +
            "</div>" +
            "<div class=\"util-track\">" +
              "<div class=\"util-fill\" data-w=\"" + (afterGpu.utilization_percent || 0) + "\"></div>" +
              "<div class=\"util-marker\" style=\"left:" + (beforeGpu.utilization_percent || 0) + "%\"></div>" +
            "</div>" +
            "<div class=\"meter\">" +
              "<div class=\"meter-top\"><span>VRAM used</span><span>" + fmt(memory.gpu_peak_used_mib, 0) + " peak · " + fmtInt(memory.gpu_samples) + " samples</span></div>" +
              "<div class=\"meter-row\"><span class=\"meter-tag\">Before</span><div class=\"meter-track\"><div class=\"meter-fill before\" data-w=\"" + ((beforeGpu.memory_used_mib || 0) / gpuTotal * 100) + "\"></div></div><span class=\"meter-val\">" + fmt(beforeGpu.memory_used_mib, 0) + "</span></div>" +
              "<div class=\"meter-row\"><span class=\"meter-tag\">After</span><div class=\"meter-track\"><div class=\"meter-fill after\" data-w=\"" + ((afterGpu.memory_used_mib || 0) / gpuTotal * 100) + "\"></div></div><span class=\"meter-val\">" + fmt(afterGpu.memory_used_mib, 0) + "</span></div>" +
            "</div>" +
          "</section>" +
          "<section class=\"card\">" +
            "<div class=\"card-head\"><div><h2>System RAM</h2><div class=\"card-note\">Host used percent</div></div>" +
              "<div class=\"card-stat\">" + fmt(afterRam.used_percent, 0) + "<span>%</span></div>" +
            "</div>" +
            "<div class=\"meter\">" +
              "<div class=\"meter-row\"><span class=\"meter-tag\">Before</span><div class=\"meter-track\"><div class=\"meter-fill before\" data-w=\"" + (beforeRam.used_percent || 0) + "\"></div></div><span class=\"meter-val\">" + fmt(beforeRam.used_mib, 0) + "</span></div>" +
              "<div class=\"meter-row\"><span class=\"meter-tag\">After</span><div class=\"meter-track\"><div class=\"meter-fill after\" data-w=\"" + (afterRam.used_percent || 0) + "\"></div></div><span class=\"meter-val\">" + fmt(afterRam.used_mib, 0) + "</span></div>" +
            "</div>" +
            "<div class=\"card-note\" style=\"margin-top:14px\">LM Studio working set " + fmt(afterProc.working_set_sum_mib, 1) + " MiB across " + fmtInt(afterProc.process_count) + " processes. Largest process " + fmt(afterProc.largest_working_set_mib, 1) + " MiB.</div>" +
          "</section>" +
        "</div>" +
        "<section class=\"card\">" +
          "<div class=\"card-head\"><h2>LM Studio processes</h2><div class=\"legend-inline\"><span>copper before</span><span>phosphor after</span></div></div>" +
          procHtml +
        "</section>" +
        "<div class=\"grid-2\">" +
          "<section class=\"card\">" +
            "<h2>Notes</h2>" +
            "<ul class=\"insights\">" + insights.map(function (note) { return "<li>" + escapeHtml(note) + "</li>"; }).join("") + "</ul>" +
          "</section>" +
          "<section class=\"card\">" +
            "<h2>Model and request</h2>" +
            "<div class=\"kv\">" +
              "<dl>" +
                "<dt>Model</dt><dd>" + escapeHtml(model.id || "—") + "</dd>" +
                "<dt>Publisher</dt><dd>" + escapeHtml(model.publisher || "—") + "</dd>" +
                "<dt>Architecture</dt><dd>" + escapeHtml(model.architecture || "—") + "</dd>" +
                "<dt>Quantization</dt><dd>" + escapeHtml(model.quantization || "—") + "</dd>" +
                "<dt>State</dt><dd>" + escapeHtml(model.state || "—") + "</dd>" +
                "<dt>Loaded context</dt><dd>" + fmtInt(model.loaded_context_length) + "</dd>" +
              "</dl>" +
              "<dl>" +
                "<dt>Endpoint</dt><dd>" + escapeHtml(request.endpoint || "—") + "</dd>" +
                "<dt>Temperature</dt><dd>" + escapeHtml(String(request.temperature)) + "</dd>" +
                "<dt>Repeat penalty</dt><dd>" + escapeHtml(String(request.repeat_penalty)) + "</dd>" +
                "<dt>Max tokens</dt><dd>" + fmtInt(request.max_tokens) + "</dd>" +
                "<dt>Prompt chars</dt><dd>" + fmtInt(request.prompt_characters) + "</dd>" +
                "<dt>Started</dt><dd>" + escapeHtml(shortDate(run.started)) + "</dd>" +
              "</dl>" +
            "</div>" +
            "<p class=\"sources\" style=\"margin-top:16px\">Source <span>" + escapeHtml(run.relative_path || run.file || "") + "</span></p>" +
          "</section>" +
        "</div>" +
      "</div>";

    afterPaint(function () {
      drawDonut(document.getElementById("chart-donut"), [
        { value: run.input || 0, color: COLORS.ice },
        { value: run.output || 0, color: COLORS.phosphor },
        { value: run.reasoning || 0, color: COLORS.copper },
      ]);
      document.querySelectorAll("[data-w]").forEach(function (el) {
        el.style.width = Math.max(0, Math.min(100, Number(el.getAttribute("data-w")) || 0)) + "%";
      });
    });
  }

  function renderEmpty() {
    document.getElementById("kicker").textContent = "No reports yet";
    document.getElementById("title").textContent = "ReaderLM performance";
    document.getElementById("subtitle").textContent = "Run a live test, then reload this page.";
    document.getElementById("stage").innerHTML =
      "<div class=\"empty\">No <code>*_performance.json</code> files were found. " +
      "Finish a JSON test or run <code>python ReaderLM_v2\\html\\performance-dashboard\\refresh_data.py</code>.</div>";
  }

  function renderRail() {
    var list = document.getElementById("rail-list");
    var items = ["<div class=\"rail-label\">Views</div>"];
    items.push(
      "<button class=\"rail-item" + (view === 0 ? " active" : "") + "\" data-go=\"0\" role=\"tab\" aria-selected=\"" + (view === 0) + "\">" +
        "<div class=\"rail-time\">Overview</div>" +
        "<div class=\"rail-title\">All " + runs.length + " runs</div>" +
        "<div class=\"rail-meta\">" + fmt(maxOf(runs.map(function (run) { return run.tps; })), 1) + " tok/s peak</div>" +
      "</button>"
    );
    runs.forEach(function (run, index) {
      var go = index + 1;
      items.push(
        "<button class=\"rail-item" + (view === go ? " active" : "") + "\" data-go=\"" + go + "\" role=\"tab\" aria-selected=\"" + (view === go) + "\">" +
          "<div class=\"rail-time\">" + escapeHtml(clock(run.started)) + "</div>" +
          "<div class=\"rail-title\">" + escapeHtml(labelFromFolder(run.folder)) + "</div>" +
          "<div class=\"rail-meta\">" + fmt(run.tps, 2) + " tok/s · " + fmt(run.wall, 3) + "s</div>" +
        "</button>"
      );
    });
    list.innerHTML = items.join("");
    document.getElementById("rail-foot").innerHTML =
      "<div>" + runs.length + " reports" + (payload.generated_at ? "<br>built " + escapeHtml(payload.generated_at) : "") + "</div>" +
      "<button type=\"button\" data-go=\"0\">Back to overview</button>";
  }

  function render() {
    charts = [];
    setTip("", 0, 0);
    document.getElementById("pager-count").textContent = (view + 1) + " / " + Math.max(views.length, 1);
    document.getElementById("prev").disabled = view <= 0;
    document.getElementById("next").disabled = view >= views.length - 1;
    renderRail();
    if (!runs.length) {
      renderEmpty();
      return;
    }
    if (view === 0) renderOverview();
    else renderRun(views[view].run);
  }

  function go(next) {
    var max = Math.max(views.length - 1, 0);
    view = Math.max(0, Math.min(max, next));
    render();
  }

  document.getElementById("prev").addEventListener("click", function () { go(view - 1); });
  document.getElementById("next").addEventListener("click", function () { go(view + 1); });
  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-go]");
    if (!target) return;
    go(Number(target.getAttribute("data-go")));
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") go(view - 1);
    if (event.key === "ArrowRight") go(view + 1);
  });
  window.addEventListener("resize", function () { render(); });

  render();
})();
