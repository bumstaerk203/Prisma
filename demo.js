(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $("#app"), DEF = { vib: 50, bri: 50, con: 50, gam: 100 };
  const S = {
    c: { ...DEF }, filter: true, screen: false, split: 50, auto: true, playing: null,
    ch: { on: true, style: "cross", color: "#22ff88", size: 8, thick: 2, gap: 4, ox: 0, oy: 0, outline: true },
    ov: { on: true, pos: "tl", ts: 12, op: 75, items: { cpu: 1, gpu: 1, ram: 1, gt: 1, fps: 0, vram: 0 } },
  };
  const LOOKS = { Competitive: { vib: 80, bri: 56, con: 58, gam: 115 }, Vivid: { vib: 100, bri: 52, con: 60, gam: 100 }, Night: { vib: 48, bri: 64, con: 48, gam: 140 } };
  const XH = { None: null, Classic: { style: "cross", size: 8, thick: 2, gap: 4 }, "Tiny dot": { style: "dot", thick: 2 }, "Red dot": { style: "dot", thick: 3, color: "#ff2d55" },
    Ring: { style: "circle", size: 8, thick: 2, gap: 2 }, "Thin cross": { style: "cross", size: 10, thick: 1, gap: 3 }, "Big cross": { style: "cross", size: 22, thick: 3, gap: 6 },
    "Pro gap": { style: "cross", size: 6, thick: 2, gap: 8 }, "Cross + dot": { style: "cross", size: 7, thick: 2, gap: 5, dot: true }, Sniper: { style: "cross", size: 40, thick: 1, gap: 0 },
    "Soft ring": { style: "circle", size: 14, thick: 1, gap: 4, color: "#ffffff" } };
  const SAVED_XH = {};
  const GAMES = [{ exe: "NeonDrift.exe", look: "Vivid", xh: "Classic" }, { exe: "FrontlineOps.exe", look: "Competitive", xh: "Pro gap" }];
  const BINDS = { filter: "Ctrl+Alt+F", screen: null, xhair: "Ctrl+Alt+C", show: null };

  let tt; const toast = (t) => { const el = $("#appToast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2400); };
  const opt = (sel, items, val) => { sel.innerHTML = items.map((n) => `<option ${n === val ? "selected" : ""}>${n}</option>`).join(""); };

  // ---------- start screen ----------
  const splash = $("#splash");
  $("#startBtn").onclick = () => { splash.classList.add("gone"); toast("Welcome to Prisma"); };
  $("#replay").onclick = () => splash.classList.remove("gone");

  // ---------- tabs ----------
  $$(".app-nav button").forEach((b) => b.onclick = () => {
    $$(".app-nav button").forEach((x) => x.classList.toggle("on", x === b));
    $$(".pnl").forEach((p) => p.hidden = p.dataset.panel !== b.dataset.tab);
  });

  // ---------- colour ----------
  const filterCss = (c) => `url(#gammaF) saturate(${c.vib / 50}) brightness(${0.5 + c.bri / 100}) contrast(${0.5 + c.con / 100})`;
  function apply() {
    const c = S.filter ? S.c : DEF, f = filterCss(c);
    ["gR", "gG", "gB"].forEach((id) => document.getElementById(id).setAttribute("exponent", String(100 / c.gam)));
    $("#after").style.filter = $("#shotA").style.filter = f;
    const chrome = S.screen && S.filter ? f : "";
    [".app-nav", ".panels", ".app-bar"].forEach((s) => ($(s).style.filter = chrome));
    const clip = S.screen ? "none" : `inset(0 0 0 ${S.split}%)`;
    $("#after").style.clipPath = $("#shotA").style.clipPath = clip;
    $("#split").hidden = S.screen; $("#split").style.left = S.split + "%";
    $("#filterBtn").textContent = S.filter ? "Filter on" : "Filter off"; $("#filterBtn").classList.toggle("btn-ghost", !S.filter);
    $("#screenBtn").textContent = `Whole screen: ${S.screen ? "on" : "off"}`; $("#screenBtn").classList.toggle("btn-ghost", !S.screen);
    $("#screenNote").textContent = !S.screen ? "Whole screen is OFF. The sliders only change the picture above."
      : S.filter ? "Whole screen is ON. Your changes apply to every monitor and to your games." : "Whole screen is ON, but the filter is off, so your screen shows normal colours.";
  }
  function syncColour() {
    $$("[data-k]").forEach((i) => (i.value = S.c[i.dataset.k]));
    ["vib", "bri", "con", "gam"].forEach((k) => ($(`[data-o="${k}"]`).textContent = k === "gam" ? (S.c[k] / 100).toFixed(2) : S.c[k] + "%"));
    apply(); renderLooks();
  }
  $$("[data-k]").forEach((i) => (i.oninput = () => { S.c[i.dataset.k] = +i.value; S.look = null; syncColour(); }));
  $("#filterBtn").onclick = () => { S.filter = !S.filter; apply(); };
  $("#screenBtn").onclick = () => { S.screen = !S.screen; apply(); };
  $("#resetColour").onclick = () => { S.c = { ...DEF }; S.look = null; syncColour(); toast("Display reset"); };
  // draggable before/after line
  const pv = $("#preview"); let drag = false;
  const moveSplit = (e) => { const r = pv.getBoundingClientRect(); S.split = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)); apply(); };
  $("#split").addEventListener("pointerdown", (e) => { drag = true; $("#split").setPointerCapture(e.pointerId); });
  $("#split").addEventListener("pointermove", (e) => drag && moveSplit(e));
  $("#split").addEventListener("pointerup", () => (drag = false));
  // own screenshot
  $("#shotIn").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    ["#shotB", "#shotA"].forEach((s) => { $(s).src = url; $(s).hidden = false; });
    $("#shotDel").hidden = false; toast("Screenshot loaded");
  };
  $("#shotDel").onclick = () => { ["#shotB", "#shotA"].forEach((s) => { $(s).hidden = true; $(s).removeAttribute("src"); }); $("#shotDel").hidden = true; $("#shotIn").value = ""; };

  // ---------- presets (looks) ----------
  function renderLooks() {
    const el = $("#lookList"), names = Object.keys(LOOKS);
    el.innerHTML = names.length ? names.map((n) => { const l = LOOKS[n];
      return `<button class="preset ${S.look === n ? "on" : ""}" data-look="${n}"><span class="sw-c" style="filter:saturate(${l.vib / 50}) brightness(${0.5 + l.bri / 100})"></span>
      <span><b>${n}</b><small>Saturation ${l.vib}% · Gamma ${(l.gam / 100).toFixed(2)}</small></span></button>`; }).join("")
      : '<small class="muted">No saved looks yet</small>';
    $$("[data-look]").forEach((b) => {
      b.onclick = () => useLook(b.dataset.look);
      b.oncontextmenu = (e) => { e.preventDefault(); delete LOOKS[b.dataset.look]; if (S.look === b.dataset.look) S.look = null; renderLooks(); renderGameForm(); toast("Look deleted"); };
    });
  }
  function useLook(n, quiet) { if (!LOOKS[n]) return; S.c = { ...LOOKS[n] }; S.look = n; syncColour(); if (!quiet) toast(`Look “${n}” is on`); }
  $("#saveLook").onclick = () => { let i = 1; while (LOOKS["Look " + i]) i++; LOOKS["Look " + i] = { ...S.c }; S.look = "Look " + i; renderLooks(); renderGameForm(); toast(`Saved “Look ${i}”`); };

  // ---------- optimizer ----------
  const tws = $$("[data-tw]"), om = $("#optMsg");
  const optCount = () => { const n = tws.filter((t) => t.checked).length; om.textContent = n === tws.length ? "All tweaks are on." : n ? `${n} of ${tws.length} tweaks are on.` : ""; };
  tws.forEach((t) => (t.onchange = optCount));
  $("#optAll").onclick = async () => { for (const t of tws) { if (!t.checked) { t.checked = true; await new Promise((r) => setTimeout(r, 60)); } } optCount(); toast("All tweaks are on (demo: nothing changed on your PC)"); };
  $("#optUndo").onclick = () => { tws.forEach((t) => (t.checked = false)); om.textContent = "Everything is back to how it was."; };
  const TOOLS = { clean: ["Cleaning, one moment...", "Removed 214 files (380 MB). Files in use were skipped."], bin: ["", "Done! Your Recycle Bin is empty."], dns: ["", "Done! The DNS cache was cleared."] };
  $$("[data-tool]").forEach((b) => (b.onclick = () => { const [a, z] = TOOLS[b.dataset.tool]; if (a) om.textContent = a; setTimeout(() => { om.textContent = z + " (demo)"; }, a ? 900 : 200); }));

  // ---------- crosshair ----------
  function drawXh() {
    const c = S.ch, x = $("#xhair");
    x.style.display = c.on && c.style !== "none" ? "" : "none";
    x.style.transform = `translate(calc(-50% + ${c.ox}px), calc(-50% + ${c.oy}px))`;
    const st = `fill="${c.color}" stroke="#000" stroke-width="${c.outline ? 1 : 0}" paint-order="stroke"`;
    const t = c.thick, g = c.gap, s = c.size, h = t / 2, bar = (X, Y, W, H) => `<rect x="${X}" y="${Y}" width="${W}" height="${H}" ${st}/>`;
    let o = "";
    if (c.style === "cross") o += bar(g, -h, s, t) + bar(-g - s, -h, s, t) + bar(-h, g, t, s) + bar(-h, -g - s, t, s);
    if (c.style === "circle") o += (c.outline ? `<circle r="${s + g}" fill="none" stroke="#000" stroke-width="${t + 2}"/>` : "") + `<circle r="${s + g}" fill="none" stroke="${c.color}" stroke-width="${t}"/>`;
    if (c.style === "dot" || c.dot || c.style === "circle") o += `<circle r="${Math.max(t, 1.2)}" ${st}/>`;
    x.innerHTML = o;
    $("#chBtn").textContent = `Crosshair: ${c.on ? "on" : "off"}`; $("#chBtn").classList.toggle("btn-ghost", !c.on);
    $$("[data-ch]").forEach((i) => { i.value = c[i.dataset.ch]; $(`[data-o="${i.dataset.ch}"]`).textContent = c[i.dataset.ch] + " px"; });
    $$("[data-style]").forEach((b) => b.classList.toggle("on", b.dataset.style === c.style));
    $$("[data-color]").forEach((b) => b.classList.toggle("on", b.dataset.color === c.color));
    $("#chOutline").checked = c.outline;
  }
  const BASE = { ...S.ch };
  function useXh(n, quiet) {
    const p = XH[n] || SAVED_XH[n];
    if (n === "None") S.ch.on = false; else if (p) S.ch = { ...BASE, ...p, dot: !!p.dot, on: true };
    S.xh = n; drawXh(); renderXh(); if (!quiet) toast(`Crosshair: ${n}`);
  }
  function renderXh() {
    $("#chPresets").innerHTML = Object.keys(XH).map((n) => `<button class="chip ${S.xh === n ? "on" : ""}" data-xh="${n}">${n}</button>`).join("");
    const sv = Object.keys(SAVED_XH);
    $("#chSaved").innerHTML = sv.length ? sv.map((n) => `<button class="chip ${S.xh === n ? "on" : ""}" data-xh="${n}">${n}</button>`).join("") : '<small class="muted">None yet</small>';
    $$("[data-xh]").forEach((b) => {
      b.onclick = () => useXh(b.dataset.xh);
      b.oncontextmenu = (e) => { if (SAVED_XH[b.dataset.xh]) { e.preventDefault(); delete SAVED_XH[b.dataset.xh]; renderXh(); renderGameForm(); } };
    });
  }
  const edited = () => { S.xh = null; S.ch.dot = false; drawXh(); renderXh(); };
  $("#chBtn").onclick = () => { S.ch.on = !S.ch.on; drawXh(); };
  $$("[data-style]").forEach((b) => (b.onclick = () => { S.ch.style = b.dataset.style; edited(); }));
  $$("[data-color]").forEach((b) => { b.style.background = b.dataset.color; b.onclick = () => { S.ch.color = b.dataset.color; edited(); }; });
  $$("[data-ch]").forEach((i) => (i.oninput = () => { S.ch[i.dataset.ch] = +i.value; edited(); }));
  $("#chOutline").onchange = (e) => { S.ch.outline = e.target.checked; edited(); };
  $("#chReset").onclick = () => { S.ch = { ...BASE }; edited(); };
  $("#chSave").onclick = () => { let i = 1; while (SAVED_XH["Crosshair " + i]) i++; const { on, ...rest } = S.ch; SAVED_XH["Crosshair " + i] = rest; S.xh = "Crosshair " + i; renderXh(); renderGameForm(); toast(`Saved “Crosshair ${i}”`); };

  // ---------- overlay ----------
  const ov = $("#ov"), rnd = (a, b) => a + Math.random() * (b - a);
  const L = { cpu: 8, gpu: 5, ram: 6.1, gt: 41, fps: 0, vram: 1.2 };
  function drawOv() {
    const o = S.ov, i = o.items, busy = !!S.playing, r = [];
    ov.hidden = !o.on; ov.className = "ov " + o.pos; ov.style.fontSize = o.ts + "px"; ov.style.background = `rgba(0,0,0,${o.op / 100})`;
    if (i.fps) r.push(["FPS", busy ? Math.round(L.fps) : "n/a"]);
    if (i.cpu) r.push(["CPU", Math.round(L.cpu) + "%"]);
    if (i.gpu) r.push(["GPU", Math.round(L.gpu) + "%"]);
    if (i.gt) r.push(["GPU temp", Math.round(L.gt) + "°C"]);
    if (i.ram) r.push(["RAM", L.ram.toFixed(1) + " GB"]);
    if (i.vram) r.push(["VRAM", L.vram.toFixed(1) + " GB"]);
    ov.innerHTML = r.length ? r.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join("") : "<div><span>Nothing selected</span></div>";
    $("#ovBtn").textContent = `Overlay: ${o.on ? "on" : "off"}`; $("#ovBtn").classList.toggle("btn-ghost", !o.on);
    $$("[data-ovk]").forEach((x) => { x.value = o[x.dataset.ovk]; $(`[data-o="${x.dataset.ovk}"]`).textContent = x.dataset.ovk === "ts" ? o.ts + " pt" : o.op + "%"; });
  }
  setInterval(() => {
    const b = !!S.playing, ease = (k, lo, hi, f = 0.3) => (L[k] += (rnd(lo, hi) - L[k]) * f);
    ease("fps", 138, 168); ease("cpu", b ? 42 : 4, b ? 68 : 14); ease("gpu", b ? 86 : 2, b ? 99 : 10);
    ease("gt", b ? 66 : 39, b ? 74 : 45, 0.12); ease("ram", b ? 11.2 : 6, b ? 12.1 : 6.4, 0.2); ease("vram", b ? 6.1 : 1.1, b ? 6.9 : 1.4, 0.2);
    drawOv();
  }, 800);
  $("#ovBtn").onclick = () => { S.ov.on = !S.ov.on; drawOv(); };
  $$("[data-pos]").forEach((b) => (b.onclick = () => { S.ov.pos = b.dataset.pos; $$("[data-pos]").forEach((x) => x.classList.toggle("on", x === b)); drawOv(); }));
  $$("[data-item]").forEach((c) => (c.onchange = () => { S.ov.items[c.dataset.item] = c.checked ? 1 : 0; drawOv(); }));
  $$("[data-ovk]").forEach((x) => (x.oninput = () => { S.ov[x.dataset.ovk] = +x.value; drawOv(); }));

  // ---------- games ----------
  function renderGameForm() {
    opt($("#gLook"), Object.keys(LOOKS), $("#gLook").value);
    opt($("#gXh"), ["None", ...Object.keys(XH).slice(1), ...Object.keys(SAVED_XH)], $("#gXh").value || "None");
  }
  function renderGames() {
    $("#gameList").innerHTML = GAMES.length ? GAMES.map((g, i) => `<div class="game ${S.playing === i ? "on" : ""}"><span class="gi" style="--h:${(i * 83 + 250) % 360}"></span>
      <span><b>${g.exe}</b><small>${LOOKS[g.look] ? g.look : g.look + " (look not found)"} + ${g.xh}</small></span>
      <button class="btn btn-sm ${S.playing === i ? "btn-ghost" : ""}" data-play="${i}">${S.playing === i ? "Close" : "Play"}</button><button class="lnk" data-rm="${i}" title="Remove" aria-label="Remove">✕</button></div>`).join("")
      : '<small class="muted">No games yet. Add one above.</small>';
    $$("[data-play]").forEach((b) => (b.onclick = () => play(+b.dataset.play)));
    $$("[data-rm]").forEach((b) => (b.onclick = () => { const i = +b.dataset.rm; if (S.playing === i) play(i); GAMES.splice(i, 1); renderGames(); }));
  }
  function play(i) {
    const g = GAMES[i], st = $("#gStatus");
    if (S.playing === i) { S.playing = null; S.c = { ...DEF }; S.look = null; syncColour(); st.textContent = "Waiting for one of your games to start..."; $("#gameLabel").textContent = ""; toast("Game closed: your colours are back"); }
    else {
      S.playing = i; const name = g.exe.replace(/\.exe$/i, "");
      if (S.auto) { useLook(g.look, true); useXh(g.xh, true); }
      st.textContent = `Playing ${name}. Your look "${g.look}" is on.`; $("#gameLabel").textContent = "● " + name; toast(`Starting ${name}...`);
    }
    renderGames();
  }
  $("#gAdd").onclick = () => {
    let n = $("#gName").value.trim(); if (!n) return toast("Type the game's program name first.");
    if (!/\.exe$/i.test(n)) n += ".exe";
    if (!$("#gLook").value) return toast("No looks yet. Save one on the Presets tab first.");
    GAMES.push({ exe: n, look: $("#gLook").value, xh: $("#gXh").value }); $("#gName").value = ""; renderGames(); toast(`Added ${n}`);
  };
  $("#autoBtn").onclick = () => { S.auto = !S.auto; $("#autoBtn").textContent = `Auto-apply: ${S.auto ? "on" : "off"}`; $("#autoBtn").classList.toggle("btn-ghost", !S.auto); };

  // ---------- binds ----------
  const ACT = { filter: () => { S.filter = !S.filter; apply(); toast(`Filter ${S.filter ? "on" : "off"}`); },
    screen: () => { S.screen = !S.screen; apply(); toast(`Whole screen ${S.screen ? "on" : "off"}`); },
    xhair: () => { S.ch.on = !S.ch.on; drawXh(); toast(`Crosshair ${S.ch.on ? "on" : "off"}`); },
    show: () => { app.classList.toggle("hid"); } };
  let listening = null;
  const combo = (e) => { const k = e.key.length === 1 ? e.key.toUpperCase() : e.key; if (["Control", "Alt", "Shift", "Meta"].includes(k)) return null;
    return (e.ctrlKey ? "Ctrl+" : "") + (e.altKey ? "Alt+" : "") + (e.shiftKey ? "Shift+" : "") + (e.code.startsWith("Key") ? e.code.slice(3) : e.code.startsWith("Digit") ? e.code.slice(5) : k); };
  const renderBinds = () => $$("[data-bind]").forEach((b) => (b.textContent = listening === b.dataset.bind ? "Press keys..." : BINDS[b.dataset.bind] || "Not set"));
  $$("[data-bind]").forEach((b) => (b.onclick = () => { listening = b.dataset.bind; renderBinds(); b.classList.add("on"); }));
  $$("[data-clear]").forEach((b) => (b.onclick = () => { BINDS[b.dataset.clear] = null; renderBinds(); }));
  addEventListener("keydown", (e) => {
    if (listening) {
      e.preventDefault();
      if (e.key === "Escape") { listening = null; $$("[data-bind]").forEach((b) => b.classList.remove("on")); return renderBinds(); }
      if (!(e.ctrlKey || e.altKey || e.shiftKey)) return toast("Use Ctrl, Alt or Shift together with a key.");
      const c = combo(e); if (!c) return;
      BINDS[listening] = c; listening = null; $$("[data-bind]").forEach((b) => b.classList.remove("on")); renderBinds(); return;
    }
    if (!(e.ctrlKey || e.altKey || e.shiftKey) || ["INPUT", "SELECT"].includes(document.activeElement?.tagName)) return;
    const c = combo(e); const hit = Object.keys(BINDS).find((k) => BINDS[k] === c);
    if (hit) { e.preventDefault(); ACT[hit](); }
  });

  // ---------- themes ----------
  const setVar = (k, v) => app.style.setProperty(k, v);
  $$("[data-theme]").forEach((b) => (b.onclick = () => { setVar("--a", b.dataset.theme); setVar("--abg", ""); setVar("--apn", "");
    $$("[data-theme]").forEach((x) => x.classList.toggle("on", x === b)); $("#cAccent").value = b.dataset.theme; toast(`Theme: ${b.textContent.trim()}`); }));
  const custom = () => { setVar("--a", $("#cAccent").value); setVar("--abg", $("#cBg").value); setVar("--apn", $("#cPanel").value); $$("[data-theme]").forEach((x) => x.classList.remove("on")); };
  ["#cAccent", "#cBg", "#cPanel"].forEach((s) => ($(s).oninput = custom));
  const rr = $('[data-th="round"]'); rr.value = 12;
  const setRound = () => { setVar("--rr", rr.value + "px"); $('[data-o="round"]').textContent = rr.value + " px"; }; rr.oninput = setRound; setRound();

  // ---------- settings ----------
  $("#set2").onchange = (e) => app.classList.toggle("instant", e.target.checked);
  $("#set7").onchange = (e) => app.classList.toggle("nostreak", !e.target.checked);
  $("#set5").onchange = (e) => { if (!e.target.checked) splash.classList.add("gone"); };
  $("#upd").onclick = () => { toast("Checking..."); setTimeout(() => toast("You have the newest version."), 900); };

  syncColour(); drawXh(); renderXh(); drawOv(); renderGameForm(); renderGames(); renderBinds();
})();
