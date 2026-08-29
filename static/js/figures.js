/* =================================================================
   LeVJEPA project page — interactive figures.

   Two panels, both drawn as SVG in the page's palette:
     · dropFig  — token dropping at a controllable ratio
     · attnFig  — bidirectional vs. block-causal attention masks
   ================================================================= */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var C = {
    ink:      "#222",
    dim:      "#9aa3ab",
    rule:     "#e7edf2",
    grid:     "#eef0f2",
    kept:     "#226999",
    keptSoft: "#9dc0d9",
    dropped:  "#eef1f4",
    droppedS: "#e2e7ec",
    baseline: "#9db1c5",
    warm:     "#c8794a",
    accentBg: "#f3f8fb"
  };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(str, attrs, parent) {
    var t = el("text", attrs, parent);
    t.textContent = str;
    return t;
  }

  /* ---------------------------------------------------------------
     The ratios we actually evaluated, and their measured ImageNet-1K
     top-1. The slider indexes this list, so every position it can
     reach corresponds to a real measurement.
     --------------------------------------------------------------- */
  var STOPS = [
    { rho: 0,  acc: 33.85 },
    { rho: 30, acc: 39.63 },
    { rho: 60, acc: 44.82 },
    { rho: 90, acc: 47.43 },
    { rho: 95, acc: 47.57 }
  ];

  /* =============================================================
     FIGURE 1 — token dropping across the frames of a clip
     ============================================================= */
  (function tokenDropping() {
    var svg   = document.getElementById("dropFig");
    var range = document.getElementById("dropRange");
    var ticks = document.getElementById("dropTicks");
    var accEl = document.getElementById("dropAcc");
    var tokEl = document.getElementById("dropTokens");
    if (!svg || !range) return;

    // Four frames of a clip, each tokenized per frame at patch 16 on a
    // 224px view: 14 x 14 tokens per frame, 784 across the clip.
    var FRAMES = 4, SIDE = 14, PER = SIDE * SIDE, N = FRAMES * PER;
    var PAD = 6, FGAP = 20, TOP = 20;
    var frameW = (640 - 2 * PAD - (FRAMES - 1) * FGAP) / FRAMES;
    var GAP = 1.1;
    var CELL = (frameW - (SIDE - 1) * GAP) / SIDE;

    function originX(f) { return PAD + f * (frameW + FGAP); }

    var cells = [];
    for (var f = 0; f < FRAMES; f++) {
      // Frame label
      text("t" + (f + 1), {
        x: originX(f), y: 13, "font-size": 9.5, "font-weight": 500,
        fill: C.dim, class: "t-mono"
      }, svg);

      for (var i = 0; i < PER; i++) {
        var r = Math.floor(i / SIDE), c = i % SIDE;
        cells.push(el("rect", {
          x: (originX(f) + c * (CELL + GAP)).toFixed(2),
          y: (TOP + r * (CELL + GAP)).toFixed(2),
          width: CELL.toFixed(2), height: CELL.toFixed(2), rx: 1.4,
          fill: C.kept
        }, svg));
      }
    }

    // Tokens are dropped uniformly at random across the whole clip, not
    // per frame — so the priority is a single shuffle over all 784. A
    // fixed order keeps the pattern stable while the slider moves.
    var order = [];
    for (var p = 0; p < N; p++) order.push(p);
    for (var j = order.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = order[j]; order[j] = order[k]; order[k] = tmp;
    }

    // Slider stops, rendered as clickable labels under the track.
    var tickEls = [];
    if (ticks) {
      STOPS.forEach(function (st, idx) {
        var sp = document.createElement("span");
        sp.textContent = st.rho === 0 ? "0" : "." + String(st.rho).padStart(2, "0");
        sp.setAttribute("role", "button");
        sp.setAttribute("tabindex", "0");
        sp.addEventListener("click", function () {
          range.value = idx; apply(idx);
        });
        ticks.appendChild(sp);
        tickEls.push(sp);
      });
    }

    function apply(idx) {
      var st = STOPS[idx];
      var drop = Math.round(N * st.rho / 100);

      for (var n = 0; n < N; n++) {
        var isDropped = n < drop;
        var cell = cells[order[n]];
        cell.setAttribute("fill", isDropped ? C.dropped : C.kept);
        cell.setAttribute("stroke", isDropped ? C.droppedS : "none");
        cell.setAttribute("stroke-width", isDropped ? 0.6 : 0);
      }

      accEl.textContent = st.acc.toFixed(1) + "%";
      tokEl.textContent = (N - drop) + " of " + N + " tokens · ρ = " +
                          (st.rho / 100).toFixed(2);

      tickEls.forEach(function (t, i) { t.classList.toggle("on", i === idx); });
      range.style.setProperty("--p", (idx / (STOPS.length - 1) * 100) + "%");
    }

    range.addEventListener("input", function () { apply(+range.value); });
    apply(+range.value);
  })();

  /* =============================================================
     FIGURE 2 — attention topology
     ============================================================= */
  (function attentionTopology() {
    var svg = document.getElementById("attnFig");
    var bBidi = document.getElementById("attnBidi");
    var bCausal = document.getElementById("attnCausal");
    var title = document.getElementById("attnTitle");
    var stage = document.getElementById("attnStage");
    if (!svg || !bBidi || !bCausal) return;

    var FRAMES = 4, PATCHES = 4, T = FRAMES * PATCHES;
    var CELL = 16, GAP = 1.5, BLOCK = 6;   // BLOCK: extra gap between frames
    var MX = 300, MY = 62;                  // matrix origin

    function frameOf(i) { return Math.floor(i / PATCHES); }
    function at(i) { return MX + i * (CELL + GAP) + frameOf(i) * BLOCK; }
    function atY(i) { return MY + i * (CELL + GAP) + frameOf(i) * BLOCK; }

    text("Attention mask", { x: MX, y: 30, "font-size": 12.5, "font-weight": 600, fill: C.ink, class: "t-box" }, svg);
    text("rows = query token, columns = key token", {
      x: MX, y: 46, "font-size": 10.5, "letter-spacing": ".08em", fill: C.dim, class: "t-mono"
    }, svg);

    // Frame labels: columns across the top, rows down the left.
    for (var f = 0; f < FRAMES; f++) {
      var cx = at(f * PATCHES) + (PATCHES * (CELL + GAP) - GAP) / 2;
      text("t" + (f + 1), {
        x: cx, y: MY - 8, "text-anchor": "middle", "font-size": 10.5,
        "font-weight": 500, fill: C.dim, class: "t-mono"
      }, svg);
      var cy = atY(f * PATCHES) + (PATCHES * (CELL + GAP) - GAP) / 2;
      text("t" + (f + 1), {
        x: MX - 12, y: cy + 3.5, "text-anchor": "end", "font-size": 10.5,
        "font-weight": 500, fill: C.dim, class: "t-mono"
      }, svg);
    }

    var grid = [];
    for (var q = 0; q < T; q++) {
      grid[q] = [];
      for (var kk = 0; kk < T; kk++) {
        grid[q][kk] = el("rect", {
          x: at(kk), y: atY(q), width: CELL, height: CELL, rx: 2, fill: C.dropped
        }, svg);
      }
    }

    /* --- legend --- */
    var LX = 40, LY = 96;
    var legend = [
      { c: C.kept,      t: "within frame (bidirectional)" },
      { c: C.keptSoft,  t: "across frames" },
      { c: C.dropped,   t: "masked" }
    ];
    text("Legend", { x: LX, y: LY - 22, "font-size": 10.5, "letter-spacing": ".16em", fill: C.dim, class: "t-mono" }, svg);
    legend.forEach(function (item, n) {
      el("rect", { x: LX, y: LY + n * 24 - 9, width: 12, height: 12, rx: 2, fill: item.c,
        stroke: item.c === C.dropped ? C.droppedS : "none", "stroke-width": 1 }, svg);
      text(item.t, { x: LX + 20, y: LY + n * 24 + 1, "font-size": 11, fill: "#555", class: "t-box",
        "font-weight": 400 }, svg);
    });

    /* --- the streaming consequence, stated beside the mask --- */
    var SY = LY + 96;
    var noteCausal = el("g", {}, svg);
    text("Block-causal", { x: LX, y: SY, "font-size": 11.5, "font-weight": 600, fill: C.kept, class: "t-box" }, noteCausal);
    ["Frame t is encoded from", "frames 1..t only. New frames", "extend the representation at", "constant incremental cost."]
      .forEach(function (line, n) {
        text(line, { x: LX, y: SY + 18 + n * 15, "font-size": 11, fill: "#555", class: "t-cap" }, noteCausal);
      });

    var noteBidi = el("g", { opacity: 0 }, svg);
    text("Bidirectional", { x: LX, y: SY, "font-size": 11.5, "font-weight": 600, fill: C.warm, class: "t-box" }, noteBidi);
    ["Every frame depends on the", "whole clip. Adding a frame", "requires re-encoding all", "previous frames."]
      .forEach(function (line, n) {
        text(line, { x: LX, y: SY + 18 + n * 15, "font-size": 11, fill: "#555", class: "t-cap" }, noteBidi);
      });

    var causal = true;

    function render() {
      for (var q = 0; q < T; q++) {
        for (var kk = 0; kk < T; kk++) {
          var allowed = causal ? frameOf(kk) <= frameOf(q) : true;
          var same = frameOf(kk) === frameOf(q);
          var cell = grid[q][kk];
          if (!allowed) {
            cell.setAttribute("fill", C.dropped);
            cell.setAttribute("stroke", C.droppedS);
            cell.setAttribute("stroke-width", 1);
          } else {
            cell.setAttribute("fill", same ? C.kept : C.keptSoft);
            cell.setAttribute("stroke-width", 0);
          }
        }
      }
      bCausal.classList.toggle("is-active", causal);
      bBidi.classList.toggle("is-active", !causal);
      noteCausal.setAttribute("opacity", causal ? 1 : 0);
      noteBidi.setAttribute("opacity", causal ? 0 : 1);
      // Both labels are optional: the caption they duplicated was folded into
      // the prose, so guard rather than assume they are in the markup.
      if (title) {
        title.innerHTML = causal
          ? "Block-causal &middot; 51.2% IN1K"
          : "Bidirectional &middot; 50.7% IN1K";
      }
      if (stage) {
        stage.textContent = causal
          ? "current and past frames"
          : "every frame in the clip";
      }
    }

    bBidi.addEventListener("click", function () { causal = false; render(); });
    bCausal.addEventListener("click", function () { causal = true; render(); });
    render();

  })();


  /* =============================================================
     Gutter layout.
     Each .margin is anchored to the top of the body element that
     follows it, and pushed down only when it would collide with the
     item above. Because the items are out of flow, the body column and
     the full-width figures are unaffected by how tall they are.
     ============================================================= */
  var GUTTER_GAP = 20;
  var article = document.querySelector(".article");

  function layoutMargins() {
    if (!article) return;
    var items = Array.prototype.slice.call(article.children).filter(function (el) {
      return el.classList && el.classList.contains("margin");
    });
    if (!items.length) return;

    // Below the breakpoint the gutter collapses and the items run inline.
    if (!window.matchMedia("(min-width: 1081px)").matches) {
      article.classList.remove("margins-positioned");
      items.forEach(function (m) { m.style.top = ""; });
      return;
    }

    // Take them out of flow first, then measure: the body column reflows
    // once they are gone, and the anchors are what we want to line up with.
    article.classList.add("margins-positioned");
    var base = article.getBoundingClientRect().top + window.pageYOffset;

    // Full-width blocks span the gutter as well as the body column, and a
    // positioned margin item is out of flow, so `clear` cannot separate them.
    // Treat them as vertical obstacles the gutter has to step around.
    var blocks = Array.prototype.slice.call(article.children)
      .filter(function (el) { return el.classList && el.classList.contains("full"); })
      .map(function (el) {
        var r = el.getBoundingClientRect();
        return { top: r.top + window.pageYOffset - base, bottom: r.bottom + window.pageYOffset - base };
      })
      .sort(function (a, b) { return a.top - b.top; });

    function clearsObstacles(top, height) {
      // Blocks are sorted and disjoint, so one forward pass settles it.
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (top < b.bottom && top + height > b.top) top = b.bottom + GUTTER_GAP;
      }
      return top;
    }

    var prevBottom = -Infinity;
    var lastBottom = 0;

    items.forEach(function (m) {
      var anchor = m.nextElementSibling;
      while (anchor && anchor.classList && anchor.classList.contains("margin")) {
        anchor = anchor.nextElementSibling;
      }
      if (!anchor) anchor = m.previousElementSibling;

      var desired = anchor
        ? anchor.getBoundingClientRect().top + window.pageYOffset - base
        : 0;
      var h = m.offsetHeight;
      var top = Math.max(desired, prevBottom + GUTTER_GAP);
      top = clearsObstacles(top, h);
      // Stepping around a block can push it back into the item above.
      if (top < prevBottom + GUTTER_GAP) {
        top = clearsObstacles(prevBottom + GUTTER_GAP, h);
      }
      m.style.top = top + "px";
      prevBottom = top + h;
      lastBottom = prevBottom;
    });

    // Out-of-flow items no longer hold the article open; make sure the last
    // one cannot run past the footer.
    var natural = article.scrollHeight - (parseFloat(article.style.paddingBottom) || 0);
    article.style.paddingBottom = lastBottom > natural
      ? (lastBottom - natural + 40) + "px"
      : "";
  }

  var relayoutPending = false;
  function relayout() {
    if (relayoutPending) return;
    relayoutPending = true;
    requestAnimationFrame(function () { relayoutPending = false; layoutMargins(); });
  }

  layoutMargins();
  window.addEventListener("resize", relayout);
  window.addEventListener("load", relayout);
  // Math typesetting and late media both change element heights.
  if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
    window.MathJax.startup.promise.then(relayout).catch(function () {});
  }
  Array.prototype.forEach.call(document.querySelectorAll(".margin video"), function (v) {
    v.addEventListener("loadedmetadata", relayout);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  /* =============================================================
     Image comparison sliders.
     The range input is the single source of truth: it gives pointer,
     touch and keyboard control at once, and we mirror its value onto
     --pos, which clips the revealed layer and places the divider.
     ============================================================= */
  Array.prototype.forEach.call(document.querySelectorAll("[data-cmp]"), function (stage) {
    var range = stage.querySelector(".cmp-range");
    if (!range) return;
    function sync() { stage.style.setProperty("--pos", range.value + "%"); }
    range.addEventListener("input", sync);
    sync();
  });

  /* =============================================================
     Looping showcase video.
     preload="metadata" keeps the 8 MB clip off the critical path, so
     start playback when it actually scrolls into view rather than
     relying on autoplay having fired at load.
     ============================================================= */
  Array.prototype.forEach.call(document.querySelectorAll("video[autoplay]"), function (v) {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () { /* autoplay refused; the poster frame stands in */ });
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    io.observe(v);
  });

  /* =============================================================
     Pending-figure placeholders.
     The dark-mode chart exports land in static/images/ later; until a
     file exists, name it rather than showing a broken image.
     ============================================================= */
  Array.prototype.forEach.call(document.querySelectorAll("img[data-fig]"), function (img) {
    function pending() {
      var box = document.createElement("div");
      box.className = "fig-pending";
      var name = img.getAttribute("src").split("/").pop();
      box.innerHTML = '<div class="t">Figure pending</div>' +
                      '<div class="f">static/images/' + name + "</div>";
      if (img.parentNode) img.parentNode.replaceChild(box, img);
    }
    img.addEventListener("error", pending);
    // This script runs at end-of-body, so an image that 404'd during parse has
    // already fired its error event and will never fire another. A complete
    // image with zero intrinsic width is exactly that case.
    if (img.complete && img.naturalWidth === 0) pending();
  });

})();
