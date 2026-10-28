/* Punkteliste-Formular v2 \u2013 Markus Steiner
   Neu in v2: Notiz zu \u2713/\ud83d\udd52 \u00b7 \u201eInfo\u201c je Punkt (klappt Erkl\u00e4rung auf) \u00b7 \u201eAlle Empfehlungen \u00fcbernehmen\u201c \u00b7 \u201e+ Hinzuf\u00fcgen\u201c (Neuer Punkt / Anmerkung) \u00b7 Zeitstempel \u00b7 Zeit der Antwort im Info-Block
   Nutzung im Widget (Skript NACH window.D laden):
     <div id="pf"></div>
     <script>window.D={...};var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/gh/markus-steiner/claude-formular@v2/formular.js";document.body.appendChild(s);</script>
   D = {label, bilanz, zeit, info[], points[[nr,frage,empfehlung,detailsHTML,vorbelegung,frueher,infoText]], qa{}, go, lern, tok, copy, adds[[typ,text]]}
   HTML erlaubt nur in info[] und detailsHTML. Frage, Empfehlung, infoText, Schnellantworten und Zeit werden maskiert (reiner Text).
*/
(function () {
  "use strict";
  window.PF_VERSION = "2";
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
    "#pf .mi{flex:none;font-size:12px;padding:0;margin:0;border:0;background:none;color:var(--text-secondary);cursor:pointer;min-height:0;height:auto;white-space:nowrap}" +
    "#pf .line{display:flex;gap:10px;align-items:baseline;margin:2px 0 6px}" +
    "#pf .line .t2{flex:1;min-width:0;margin:0;line-height:1.5}" +
    "#pf .mi:hover{color:var(--text-accent);text-decoration:underline}" +
    "#pf .mi.on{color:var(--text-accent);background:none}" +
    "#pf .done{font-size:12px;margin-left:8px}" +
    "#pf .row.del .txt{text-decoration:line-through;color:var(--text-muted)}" +
    "#pf .row.del input,#pf .row.del .ok,#pf .row.del .sk,#pf .row.del .qa,#pf .row.del .mi{opacity:.35;pointer-events:none}" +
    "#pf .row.okr{background:var(--bg-success)}" +
    "#pf .row.skr{background:rgba(239,159,39,0.13)}" +
    "#pf .row.mir{background:var(--bg-accent)}" +
    "#pf .q{font-size:16px;font-weight:500;margin:0 0 2px;color:var(--text-primary);display:flex;align-items:center;gap:6px}" +
    "#pf .t2{font-size:14px;color:var(--text-secondary);margin:2px 0 6px}" +
    "#pf .st{font-size:16px}" +
    "#pf .info{font-size:14px;color:var(--text-secondary);margin:0 0 8px;line-height:1.55}" +
    "#pf .info b{color:var(--text-primary);font-weight:500}" +
    "#pf .ib2{background:var(--bg-accent);border-radius:12px;padding:10px 14px;margin:10px 0 4px;font-size:14px;line-height:1.55;color:var(--text-accent)}" +
    "#pf .ib2 ul{margin:4px 0 0;padding-left:18px}" +
    "#pf .nw{color:#7F77DD;font-size:13px}" +
    "#pf .qa{font-size:13px;margin:0 6px 8px 0}" +
    "#pf .ft label{font-size:14px;color:var(--text-secondary);display:flex;align-items:center;gap:8px}" +
    "#pf .add{display:grid;grid-template-columns:auto minmax(0,1fr) 36px;gap:8px;align-items:center;padding:10px 8px;border-bottom:0.5px dashed var(--border);background:rgba(127,119,221,0.07)}" +
    "#pf .seg{display:flex}" +
    "#pf .seg button{font-size:13px;padding:6px 10px;border-radius:0}" +
    "#pf .seg button:first-child{border-radius:var(--radius) 0 0 var(--radius)}" +
    "#pf .seg button:last-child{border-radius:0 var(--radius) var(--radius) 0;margin-left:-0.5px}" +
    "#pf .seg button.on{background:#EEEDFE;color:#3C3489;border-color:#7F77DD}" +
    "#pf .seg button.on.nt{background:var(--bg-accent);color:var(--text-accent);border-color:var(--border-accent)}" +
    "#pf .plus{font-size:14px;margin-top:10px}" +
    "#pf .more{background:var(--bg-accent);color:var(--text-accent);border-radius:8px;padding:8px 12px;margin:0 0 8px;font-size:14px;line-height:1.5}" +
    "#pf .more button{font-size:12px;margin-top:6px}" +
    "#pf .zeit{font-size:13px;font-weight:400;white-space:nowrap}" +
    "@media (max-width:520px){#pf .add{grid-template-columns:minmax(0,1fr) 36px}#pf .add .seg{grid-column:1/-1}}";
  var st = document.createElement("style");
  st.textContent = css;
  (document.head || root).appendChild(st);

  root.innerHTML =
    '<h2 class="sr-only">Punkteliste-Formular mit Fragen an Markus</h2>' +
    '<p class="pf-bil" style="font-size:13px;color:var(--text-secondary);margin:0.5rem 0 0"></p>' +
    '<div class="pf-info"></div>' +
    '<div class="pf-list" style="padding:0.25rem 0"></div>' +
    '<div class="pf-adds"></div>' +
    '<button type="button" class="plus pf-plus"><i class="ti ti-plus" aria-hidden="true"></i> Hinzuf\u00fcgen (neuer Punkt oder Anmerkung)</button>' +
    '<div class="ft" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:1rem">' +
    '<label><input type="checkbox" class="pf-lern" checked> Lernmodus</label>' +
    '<label><input type="checkbox" class="pf-tok" checked> Token-Info</label>' +
    '<label><input type="checkbox" class="pf-nolist"> N\u00e4chste Antwort ohne Liste</label>' +
    "</div>" +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;flex-wrap:wrap">' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="pf-all" style="font-size:13px"><i class="ti ti-checks" aria-hidden="true"></i> Alle Empfehlungen \u00fcbernehmen</button><button type="button" class="pf-later" style="font-size:13px">Rest auf sp\u00e4ter</button><button type="button" class="pf-strike" style="font-size:13px">Alle \u2713 streichen</button></div>' +
    '<div style="display:flex;gap:8px"><button type="button" class="pf-send">R\u00fcckmeldung senden \u2197</button><button type="button" class="pf-go" style="background:var(--fill-accent);color:var(--on-accent);border-color:var(--fill-accent)">Go \u2197</button></div>' +
    "</div>" +
    '<p class="pf-err" style="font-size:13px;color:var(--text-danger);margin:6px 0 0;min-height:18px"></p>';

  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function q(sel) { return root.querySelector(sel); }
  function rows() { return root.querySelectorAll(".row"); }
  var L = q(".pf-list"), A = q(".pf-adds"), err = q(".pf-err");
  var send = typeof window.sendPrompt === "function" ? window.sendPrompt : function (t) { console.log("sendPrompt:", t); };

  function ts() {
    var d = new Date(), z = function (x) { return ("0" + x).slice(-2); };
    return z(d.getDate()) + "." + z(d.getMonth() + 1) + "." + d.getFullYear() + " " + z(d.getHours()) + ":" + z(d.getMinutes());
  }

  q(".pf-bil").textContent = D.bilanz || "";
  q(".pf-lern").checked = D.lern !== false;
  q(".pf-tok").checked = D.tok !== false;
  var zeit = D.zeit ? '<span class="zeit">' + esc(D.zeit) + "</span>" : "";

  if (D.info && D.info.length) {
    var b = q(".pf-info");
    b.className = "pf-info ib2";
    b.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-weight:500">\u2139 Info</b>' + zeit + "</div><ul>" + D.info.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
  } else if (zeit) {
    var bl = q(".pf-bil");
    bl.style.display = "flex"; bl.style.justifyContent = "space-between"; bl.style.gap = "8px";
    bl.innerHTML = "<span></span>" + zeit;
    bl.firstChild.textContent = D.bilanz || "";
  }

  /* Zust\u00e4nde: "" offen \u00b7 ok passt \u00b7 sk sp\u00e4ter \u00b7 mi mehr Info \u00b7 ans Antwort */
  function setState(r, s, viaAll) {
    r.dataset.s = s;
    if (!viaAll) delete r.dataset.e;
    var si = r.querySelector(".st"), inp = r.querySelector("input");
    r.querySelector(".ok").classList.toggle("on", s === "ok");
    r.querySelector(".sk").classList.toggle("on", s === "sk");
    r.querySelector(".mi").classList.toggle("on", s === "mi");
    r.classList.toggle("okr", s === "ok");
    r.classList.toggle("skr", s === "sk");
    r.classList.toggle("mir", s === "mi");
    var dn = r.querySelector(".done"); if (dn) dn.hidden = s !== "mi";
    si.className = "st ti " + (s === "ok" ? "ti-circle-check" : s === "sk" ? "ti-clock" : s === "mi" ? "ti-info-circle" : s === "ans" ? "ti-message" : "");
    si.style.color = s === "ok" ? "var(--text-success)" : s === "sk" ? "#BA7517" : "var(--text-accent)";
    inp.placeholder = s === "ok" || s === "sk" || s === "mi" ? "Notiz dazu (optional)" : "Antwort";
    err.textContent = "";
  }

  var CP = D.copy
    ? '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap"><button type="button" class="cpb"><i class="ti ti-copy" aria-hidden="true"></i> Text kopieren</button><span class="cmsg" style="font-size:13px;color:var(--text-secondary)"></span><span style="font-size:13px;color:var(--text-muted)">' +
      D.copy.length.toLocaleString("de-AT") + " Zeichen</span></div>"
    : "";

  function isPrior(v) { return v === 1 || v === true || String(v).trim() === "1"; }

  D.points.forEach(function (p) {
    var n = p[0], t = esc(p[1]), a = esc(p[2]), d = p[3] || "", s0 = p[4] || "", prior = isPrior(p[5]), more = esc(p[6] || ""), ne = esc(n);
    var multi = String(n).indexOf(",") > -1;
    var r = document.createElement("div");
    r.className = "row";
    r.dataset.n = n;
    r.dataset.s = "";
    r.dataset.prior = prior ? "1" : "0";
    var lab = multi ? "" : ne + ". ";
    var tt = t.replace(" (neu)", ' <span class="nw">(neu)</span>');
    var qa = D.qa && D.qa[n]
      ? D.qa[n].map(function (x) { return '<button type="button" class="qa" data-v="' + esc(x[0]) + '">' + esc(x[1]) + "</button>"; }).join("")
      : "";
    var mi = '<button type="button" class="mi" title="Erkl\u00e4rung anzeigen"><i class="ti ti-info-circle" aria-hidden="true"></i> Info</button>';
    r.innerHTML =
      '<div class="btns">' +
      '<button type="button" class="ib ok" aria-label="Punkt ' + ne + ' passt" title="Passt"><i class="ti ti-check" style="font-size:18px" aria-hidden="true"></i></button>' +
      '<button type="button" class="ib sk" aria-label="Punkt ' + ne + ' sp\u00e4ter" title="Sp\u00e4ter"><i class="ti ti-clock" style="font-size:18px" aria-hidden="true"></i></button>' +
      '<button type="button" class="ib xb" aria-label="Punkt ' + ne + ' streichen" title="Streichen"><i class="ti ti-x" style="font-size:18px" aria-hidden="true"></i></button>' +
      "</div>" +
      '<div class="txt"><p class="q"><i class="st" aria-hidden="true"></i>' + lab + tt + "</p>" +
      '<div class="line">' + (multi && !more ? "" : mi) + '<p class="t2">' + a + "</p></div>" + d.replace("{{COPY}}", CP) +
      (more ? '<div class="more" hidden>' + more + '<div><button type="button" class="more-req">In n\u00e4chster Antwort ausf\u00fchrlicher</button><span class="done" hidden>\u2713 Vorgemerkt \u2013 geht mit \u201eR\u00fcckmeldung senden\u201c an Claude</span></div></div>' : "") +
      (qa ? "<div>" + qa + "</div>" : "") +
      '<input type="text" placeholder="Antwort" style="width:100%"></div>';
    L.appendChild(r);
    var x = r.querySelector(".xb"), i = r.querySelector("input"), mb = r.querySelector(".mi");
    if (!mb) { mb = document.createElement("span"); mb.className = "mi"; mb.style.display = "none"; r.appendChild(mb); }
    function back() { return i.value.trim() ? "ans" : ""; }
    x.onclick = function () { x.classList.toggle("on"); r.classList.toggle("del"); err.textContent = ""; };
    r.querySelector(".ok").onclick = function () { setState(r, r.dataset.s === "ok" ? back() : "ok"); };
    r.querySelector(".sk").onclick = function () { setState(r, r.dataset.s === "sk" ? back() : "sk"); };
    var box = r.querySelector(".more");
    if (box) {
      mb.onclick = function () { box.hidden = !box.hidden; mb.classList.toggle("on", !box.hidden || r.dataset.s === "mi"); };
      box.querySelector(".more-req").onclick = function () { setState(r, r.dataset.s === "mi" ? back() : "mi"); mb.classList.add("on"); box.querySelector(".done").hidden = r.dataset.s !== "mi"; };
    } else {
      mb.onclick = function () { setState(r, r.dataset.s === "mi" ? back() : "mi"); };
    }
    i.oninput = function () {
      var s = r.dataset.s;
      if (s === "ok" || s === "sk" || s === "mi") return;
      setState(r, i.value.trim() ? "ans" : "");
    };
    r.querySelectorAll(".qa").forEach(function (bt) { bt.onclick = function () { i.value = bt.dataset.v; setState(r, "ans"); }; });
    if (s0) setState(r, s0);
  });

  /* + Hinzuf\u00fcgen */
  var addCount = 0;
  function renum() {
    var k = 0, m = 0;
    A.querySelectorAll(".add").forEach(function (row) {
      var inp = row.querySelector("input");
      if (row.dataset.t === "pt") { k++; inp.placeholder = "Neuer Punkt " + k + ": Frage oder Thema"; }
      else { m++; inp.placeholder = "Anmerkung " + m + ": Hinweis, Info, Wunsch"; }
    });
  }
  function addRow(type, text) {
    addCount++;
    var row = document.createElement("div");
    row.className = "add";
    row.dataset.t = type === "nt" ? "nt" : "pt";
    row.innerHTML =
      '<div class="seg"><button type="button" class="s-pt">Neuer Punkt</button><button type="button" class="s-nt nt">Anmerkung</button></div>' +
      '<input type="text" style="width:100%" aria-label="Zusatz ' + addCount + '">' +
      '<button type="button" class="ib rm" aria-label="Zeile entfernen" title="Entfernen"><i class="ti ti-trash" style="font-size:17px" aria-hidden="true"></i></button>';
    A.appendChild(row);
    var bp = row.querySelector(".s-pt"), bn = row.querySelector(".s-nt"), inp = row.querySelector("input");
    function mark() { bp.classList.toggle("on", row.dataset.t === "pt"); bn.classList.toggle("on", row.dataset.t === "nt"); renum(); }
    bp.onclick = function () { row.dataset.t = "pt"; mark(); };
    bn.onclick = function () { row.dataset.t = "nt"; mark(); };
    row.querySelector(".rm").onclick = function () { row.remove(); renum(); };
    inp.oninput = function () { err.textContent = ""; };
    if (text) inp.value = text;
    mark();
    if (!text) inp.focus();
  }
  q(".pf-plus").onclick = function () { addRow("pt", ""); };
  (D.adds || []).forEach(function (a) { addRow(a[0], a[1]); });

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

  /* Alle Empfehlungen \u00fcbernehmen */
  var allBtn = q(".pf-all"), allList = [];
  allBtn.onclick = function () {
    if (allList.length) {
      allList.forEach(function (r) { setState(r, ""); });
      allList = []; allBtn.innerHTML = '<i class="ti ti-checks" aria-hidden="true"></i> Alle Empfehlungen \u00fcbernehmen'; return;
    }
    rows().forEach(function (r) {
      if (!r.classList.contains("del") && !r.dataset.s) { setState(r, "ok", true); r.dataset.e = "1"; allList.push(r); }
    });
    if (allList.length) allBtn.textContent = "R\u00fcckg\u00e4ngig";
  };

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
      var note = v ? " \u2013 Notiz: " + v : "";
      if (r.classList.contains("del")) out.push("x" + n);
      else if (s === "ans") out.push(n + ": " + v);
      else if (s === "ok") out.push(n + ": passt" + (r.dataset.e ? " (Empfehlung)" : "") + note);
      else if (s === "sk") out.push(n + ": sp\u00e4ter" + note);
      else if (s === "mi") out.push(n + ": mehr Info" + note);
      else miss.push(n);
    });
    A.querySelectorAll(".add").forEach(function (row) {
      var v = row.querySelector("input").value.trim();
      if (!v) return;
      out.push((row.dataset.t === "pt" ? "Neuer Punkt: " : "Anmerkung: ") + v);
    });
    out.push("Lernmodus: " + (q(".pf-lern").checked ? "an" : "aus"));
    out.push("Tokens: " + (q(".pf-tok").checked ? "an" : "aus"));
    out.push(q(".pf-nolist").checked ? "Liste: ohne" : "Liste: mit");
    return { out: out, miss: miss };
  }

  q(".pf-send").onclick = function () {
    var c = collect();
    if (c.miss.length) { err.textContent = "Noch offen: Punkt " + c.miss.join(", ") + ". W\u00e4hle Passt, Sp\u00e4ter, Mehr Info, Antwort oder Streichen."; return; }
    send("R\u00fcckmeldung " + D.label + " \u00b7 " + ts() + " \u2013 " + c.out.join(" | "));
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
    send("GO \u2013 " + D.label + " \u00b7 " + ts() + " \u2013 " + c.out.join(" | "));
  };
})();
