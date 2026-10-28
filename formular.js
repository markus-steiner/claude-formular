/* Punkteliste-Formular v1 \u2013 Markus Steiner
   Nutzung im Widget:
     <div id="pf"></div>
     <script>window.D={...};</script>
     <script src="https://cdn.jsdelivr.net/gh/markus-steiner/claude-formular@v1/formular.js"></script>
   D = {label, bilanz, info[], points[[nr,frage,empfehlung,detailsHTML,vorbelegung,frueher]], qa{}, go, lern, tok, copy}
*/
(function () {
  "use strict";
  window.PF_VERSION = "1";
  var D = window.D;
  var root = document.getElementById("pf");
  if (!root) { root = document.createElement("div"); root.id = "pf"; document.body.appendChild(root); }
  if (!D || !D.points) { root.textContent = "Formular: keine Daten (window.D fehlt)."; return; }

  var css =
    "#pf .row{display:grid;grid-template-columns:36px minmax(0,1fr);gap:12px;align-items:start;padding:12px 8px;border-bottom:0.5px solid var(--border)}" +
    "#pf .btns{display:flex;flex-direction:column;gap:4px}" +
    "#pf .ib{width:36px;height:32px;padding:0;display:flex;align-items:center;justify-content:center}" +
    "#pf .xb.on{background:var(--bg-danger);color:var(--text-danger);border-color:var(--border-danger)}" +
    "#pf .ok.on{background:var(--bg-success);color:var(--text-success);border-color:var(--border-success)}" +
    "#pf .sk.on{background:rgba(239,159,39,0.22);color:#BA7517;border-color:#EF9F27}" +
    "#pf .row.del .txt{text-decoration:line-through;color:var(--text-muted)}" +
    "#pf .row.del input,#pf .row.del .ok,#pf .row.del .sk,#pf .row.del .qa{opacity:.35;pointer-events:none}" +
    "#pf .row.okr{background:var(--bg-success)}" +
    "#pf .row.skr{background:rgba(239,159,39,0.13)}" +
    "#pf .q{font-size:16px;font-weight:500;margin:0 0 2px;color:var(--text-primary);display:flex;align-items:center;gap:6px}" +
    "#pf .t2{font-size:14px;color:var(--text-secondary);margin:2px 0 6px}" +
    "#pf .st{font-size:16px}" +
    "#pf .info{font-size:14px;color:var(--text-secondary);margin:0 0 8px;line-height:1.55}" +
    "#pf .info b{color:var(--text-primary);font-weight:500}" +
    "#pf .ib2{background:var(--bg-accent);border-radius:12px;padding:10px 14px;margin:10px 0 4px;font-size:14px;line-height:1.55;color:var(--text-accent)}" +
    "#pf .ib2 ul{margin:4px 0 0;padding-left:18px}" +
    "#pf .nw{color:#7F77DD;font-size:13px}" +
    "#pf .qa{font-size:13px;margin:0 6px 8px 0}" +
    "#pf .ft label{font-size:14px;color:var(--text-secondary);display:flex;align-items:center;gap:8px}";
  var st = document.createElement("style");
  st.textContent = css;
  (document.head || root).appendChild(st);

  root.innerHTML =
    '<h2 class="sr-only">Punkteliste-Formular mit Fragen an Markus</h2>' +
    '<p class="pf-bil" style="font-size:13px;color:var(--text-secondary);margin:0.5rem 0 0"></p>' +
    '<div class="pf-info"></div>' +
    '<div class="pf-list" style="padding:0.25rem 0"></div>' +
    '<div class="ft" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:1rem">' +
    '<label><input type="checkbox" class="pf-lern" checked> Lernmodus</label>' +
    '<label><input type="checkbox" class="pf-tok" checked> Token-Info</label>' +
    '<label><input type="checkbox" class="pf-nolist"> N\u00e4chste Antwort ohne Liste</label>' +
    "</div>" +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;flex-wrap:wrap">' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="pf-later" style="font-size:13px">Rest auf sp\u00e4ter</button><button type="button" class="pf-strike" style="font-size:13px">Alle \u2713 streichen</button></div>' +
    '<div style="display:flex;gap:8px"><button type="button" class="pf-send">R\u00fcckmeldung senden \u2197</button><button type="button" class="pf-go" style="background:var(--fill-accent);color:var(--on-accent);border-color:var(--fill-accent)">Go \u2197</button></div>' +
    "</div>" +
    '<p class="pf-err" style="font-size:13px;color:var(--text-danger);margin:6px 0 0;min-height:18px"></p>';

  function q(sel) { return root.querySelector(sel); }
  function rows() { return root.querySelectorAll(".row"); }
  var L = q(".pf-list"), err = q(".pf-err");
  var send = typeof window.sendPrompt === "function" ? window.sendPrompt : function (t) { console.log("sendPrompt:", t); };

  q(".pf-bil").textContent = D.bilanz || "";
  q(".pf-lern").checked = D.lern !== false;
  q(".pf-tok").checked = D.tok !== false;

  if (D.info && D.info.length) {
    var b = q(".pf-info");
    b.className = "pf-info ib2";
    b.innerHTML = '<b style="font-weight:500">\u2139 Info</b><ul>' + D.info.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
  }

  function setState(r, s) {
    r.dataset.s = s;
    var ok = r.querySelector(".ok"), sk = r.querySelector(".sk"), si = r.querySelector(".st");
    ok.classList.toggle("on", s === "ok");
    sk.classList.toggle("on", s === "sk");
    r.classList.toggle("okr", s === "ok");
    r.classList.toggle("skr", s === "sk");
    si.className = "st ti " + (s === "ok" ? "ti-circle-check" : s === "sk" ? "ti-clock" : s === "ans" ? "ti-message" : "");
    si.style.color = s === "ok" ? "var(--text-success)" : s === "sk" ? "#BA7517" : "var(--text-accent)";
    if (s === "ok" || s === "sk") r.querySelector("input").value = "";
    err.textContent = "";
  }

  var CP = D.copy
    ? '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap"><button type="button" class="cpb"><i class="ti ti-copy" aria-hidden="true"></i> Text kopieren</button><span class="cmsg" style="font-size:13px;color:var(--text-secondary)"></span><span style="font-size:13px;color:var(--text-muted)">' +
      D.copy.length.toLocaleString("de-AT") + " Zeichen</span></div>"
    : "";

  function isPrior(v) { return v === 1 || v === true || String(v).trim() === "1"; }

  D.points.forEach(function (p) {
    var n = p[0], t = p[1] || "", a = p[2] || "", d = p[3] || "", s0 = p[4] || "", prior = isPrior(p[5]);
    var r = document.createElement("div");
    r.className = "row";
    r.dataset.n = n;
    r.dataset.s = "";
    r.dataset.prior = prior ? "1" : "0";
    var lab = String(n).indexOf(",") > -1 ? "" : n + ". ";
    var tt = t.replace(" (neu)", ' <span class="nw">(neu)</span>');
    var qa = D.qa && D.qa[n]
      ? "<div>" + D.qa[n].map(function (x) { return '<button type="button" class="qa" data-v="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>"
      : "";
    r.innerHTML =
      '<div class="btns">' +
      '<button type="button" class="ib ok" aria-label="Punkt ' + n + ' passt" title="Passt"><i class="ti ti-check" style="font-size:18px" aria-hidden="true"></i></button>' +
      '<button type="button" class="ib sk" aria-label="Punkt ' + n + ' sp\u00e4ter" title="Sp\u00e4ter"><i class="ti ti-clock" style="font-size:18px" aria-hidden="true"></i></button>' +
      '<button type="button" class="ib xb" aria-label="Punkt ' + n + ' streichen" title="Streichen"><i class="ti ti-x" style="font-size:18px" aria-hidden="true"></i></button>' +
      "</div>" +
      '<div class="txt"><p class="q"><i class="st" aria-hidden="true"></i>' + lab + tt + "</p>" +
      '<p class="t2">' + a + "</p>" + d.replace("{{COPY}}", CP) + qa +
      '<input type="text" placeholder="Antwort" style="width:100%"></div>';
    L.appendChild(r);
    var x = r.querySelector(".xb"), i = r.querySelector("input");
    x.onclick = function () { x.classList.toggle("on"); r.classList.toggle("del"); err.textContent = ""; };
    r.querySelector(".ok").onclick = function () { setState(r, r.dataset.s === "ok" ? "" : "ok"); };
    r.querySelector(".sk").onclick = function () { setState(r, r.dataset.s === "sk" ? "" : "sk"); };
    i.oninput = function () { setState(r, i.value.trim() ? "ans" : ""); };
    r.querySelectorAll(".qa").forEach(function (bt) { bt.onclick = function () { i.value = bt.dataset.v; setState(r, "ans"); }; });
    if (s0) setState(r, s0);
  });

  root.querySelectorAll(".cpb").forEach(function (bt) {
    bt.onclick = function () {
      var m = bt.parentNode.querySelector(".cmsg");
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = D.copy; ta.style.position = "absolute"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select();
        var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
        ta.remove();
        m.textContent = ok ? "Kopiert." : "Kopieren blockiert \u2013 bitte Bescheid sagen.";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(D.copy).then(function () { m.textContent = "Kopiert."; }, fallback);
      } else fallback();
    };
  });

  var sb = q(".pf-strike");
  if (!D.points.some(function (p) { return isPrior(p[5]) && p[4] === "ok"; })) sb.style.display = "none";
  var bulk = [];
  sb.onclick = function () {
    if (bulk.length) {
      bulk.forEach(function (r) { r.classList.remove("del"); r.querySelector(".xb").classList.remove("on"); });
      bulk = []; sb.textContent = "Alle \u2713 streichen"; return;
    }
    rows().forEach(function (r) {
      if (r.dataset.prior === "1" && r.dataset.s === "ok" && !r.classList.contains("del")) {
        r.classList.add("del"); r.querySelector(".xb").classList.add("on"); bulk.push(r);
      }
    });
    if (bulk.length) sb.textContent = "R\u00fcckg\u00e4ngig";
  };

  var lat = [], lb = q(".pf-later");
  lb.onclick = function () {
    if (lat.length) { lat.forEach(function (r) { setState(r, ""); }); lat = []; lb.textContent = "Rest auf sp\u00e4ter"; return; }
    rows().forEach(function (r) { if (!r.classList.contains("del") && !r.dataset.s) { setState(r, "sk"); lat.push(r); } });
    if (lat.length) lb.textContent = "R\u00fcckg\u00e4ngig";
  };

  function collect() {
    var out = [], miss = [];
    rows().forEach(function (r) {
      var n = r.dataset.n, v = r.querySelector("input").value.trim(), s = r.dataset.s;
      if (r.classList.contains("del")) out.push("x" + n);
      else if (s === "ans") out.push(n + ": " + v);
      else if (s === "ok") out.push(n + ": passt");
      else if (s === "sk") out.push(n + ": sp\u00e4ter");
      else miss.push(n);
    });
    out.push("Lernmodus: " + (q(".pf-lern").checked ? "an" : "aus"));
    out.push("Tokens: " + (q(".pf-tok").checked ? "an" : "aus"));
    out.push(q(".pf-nolist").checked ? "Liste: ohne" : "Liste: mit");
    return { out: out, miss: miss };
  }

  q(".pf-send").onclick = function () {
    var c = collect();
    if (c.miss.length) { err.textContent = "Noch offen: Punkt " + c.miss.join(", ") + ". W\u00e4hle Passt, Sp\u00e4ter, Antwort oder Streichen."; return; }
    send("R\u00fcckmeldung " + D.label + " \u2013 " + c.out.join(" | "));
  };

  var gb = q(".pf-go");
  if (!D.go) gb.style.display = "none";
  gb.onclick = function () {
    var bad = D.go.map(String).filter(function (n) {
      var r = null;
      rows().forEach(function (x) { if (x.dataset.n === n) r = x; });
      return !r || r.dataset.s !== "ok" || r.classList.contains("del");
    });
    if (bad.length) { err.textContent = "Go geht erst, wenn " + D.go.join(", ") + " auf Passt stehen."; return; }
    var c = collect();
    if (c.miss.length) { err.textContent = "Noch offen: Punkt " + c.miss.join(", ") + "."; return; }
    send("GO \u2013 " + D.label + " \u2013 " + c.out.join(" | "));
  };
})();
