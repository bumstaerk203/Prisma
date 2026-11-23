(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DEF = { vib: 50, bri: 50, con: 50, gam: 100 };
  const S = {
    c: { ...DEF }, preset: "Default", accent: "#8b5cf6", game: null,
    ch: { on: true, style: "cross", color: "#22ff88", size: 10, thick: 2, gap: 4, outline: true },
    ov: { on: true, pos: "tl", items: { fps: true, cpu: true, gpu: true, temp: true } },
  };
  const PRESETS = {
    Default: { ...DEF },
    Competitive: { vib: 82, bri: 56, con: 58, gam: 115 },
    Cinematic: { vib: 62, bri: 46, con: 66, gam: 90 },
    Night: { vib: 48, bri: 64, con: 48, gam: 135 },
    Vivid: { vib: 100, bri: 52, con: 60, gam: 100 },
  };
  const GAMES = [
    { name: "Neon Drift", genre: "Racing", preset: "Vivid" },
    { name: "Frontline Ops", genre: "Shooter", preset: "Competitive" },
    { name: "Skyreach", genre: "Adventure", preset: "Cinematic" },
    { name: "Hollow Depths", genre: "Horror", preset: "Night" },
  ];
  const scene = $("#scene"), preview = $("#preview");

  const toast = (t) => { const el = $("#appToast"); el.textContent = t; el.classList.add("show"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2200); };

  // ---------- tabs ----------
  $$(".app-nav button").forEach((b) => b.onclick = () => {
    $$(".app-nav button").forEach((x) => x.classList.toggle("on", x === b));
    $$(".pnl").forEach((p) => p.hidden = p.dataset.panel !== b.dataset.tab);
  });

  // ---------- colour ----------
  function applyColour(compare = false) {
    const c = compare ? DEF : S.c, exp = String(100 / c.gam);
    ["gR", "gG", "gB"].forEach((id) => document.getElementById(id).setAttribute("exponent", exp));
    scene.style.filter = `url(#gammaF) saturate(${c.vib / 50}) brightness(${0.5 + c.bri / 100}) contrast(${0.5 + c.con / 100})`;
  }
  function syncColour() {
    $$("[data-k]").forEach((i) => { i.value = S.c[i.dataset.k]; });
    $$("[data-o]").forEach((o) => { const k = o.dataset.o, v = S.c[k]; o.textContent = k === "gam" ? (v / 100).toFixed(2) : v + "%"; });
    applyColour(); renderPresets();
  }
  $$("[data-k]").forEach((i) => i.oninput = () => { S.c[i.dataset.k] = +i.value; S.preset = null; syncColour(); });
  $("#resetColour").onclick = () => setPreset("Default");
  const cmp = $("#compare");
  const hold = (on) => { applyColour(on); cmp.classList.toggle("on", on); $("#cmpTag").hidden = !on; };
  cmp.onpointerdown = () => hold(true); ["pointerup", "pointerleave"].forEach((e) => cmp.addEventListener(e, () => hold(false)));

  // ---------- presets ----------
  function setPreset(name, quiet) { S.c = { ...PRESETS[name] }; S.preset = name; syncColour(); if (!quiet) toast(`Preset: ${name}`); }
  function renderPresets() {
    $("#presetList").innerHTML = Object.entries(PRESETS).map(([n, p], i) => `
      <button class="preset ${S.preset === n ? "on" : ""}" data-p="${n}">
        <span class="sw-c" style="filter:saturate(${p.vib / 50}) brightness(${0.5 + p.bri / 100})"></span>
        <span><b>${n}</b><small>Vibrance ${p.vib}% · Gamma ${(p.gam / 100).toFixed(2)}</small></span>
        ${i < 4 ? `<kbd>Alt+${i + 1}</kbd>` : ""}</button>`).join("");
    $$("[data-p]").forEach((b) => b.onclick = () => setPreset(b.dataset.p));
  }
  $("#savePreset").onclick = () => {
    let n = 1; while (PRESETS["My preset " + n]) n++;
    PRESETS["My preset " + n] = { ...S.c }; S.preset = "My preset " + n; renderPresets(); toast(`Saved “My preset ${n}”`);
  };

  // ---------- profiles ----------
  function renderGames() {
    $("#gameList").innerHTML = GAMES.map((g, i) => `
      <div class="game ${S.game === i ? "on" : ""}"><span class="gi" style="--h:${i * 70 + 260}"></span>
      <span><b>${g.name}</b><small>${g.genre} · Profile: ${g.preset}</small></span>
      <button class="btn btn-sm ${S.game === i ? "btn-ghost" : ""}" data-g="${i}">${S.game === i ? "Quit" : "Launch"}</button></div>`).join("");
    $$("[data-g]").forEach((b) => b.onclick = () => {
      const i = +b.dataset.g;
      if (S.game === i) { S.game = null; setPreset("Default", true); toast("Game closed: desktop colours restored"); }
      else { S.game = i; setPreset(GAMES[i].preset, true); toast(`${GAMES[i].name} detected: ${GAMES[i].preset} applied`); }
      $("#gameLabel").textContent = S.game === null ? "Desktop" : "● " + GAMES[S.game].name; renderGames();
    });
  }

  // ---------- crosshair ----------
  function drawCrosshair() {
    const c = S.ch, x = $("#xhair"); x.style.display = c.on ? "" : "none";
    const st = `fill="${c.color}" stroke="#000" stroke-width="${c.outline ? 1 : 0}" paint-order="stroke"`;
    const t = c.thick, g = c.gap, s = c.size, h = t / 2;
    const bar = (X, Y, W, H) => `<rect x="${X}" y="${Y}" width="${W}" height="${H}" ${st}/>`;
    let o = "";
    if (c.style === "cross" || c.style === "t") {
      o += bar(g, -h, s, t) + bar(-g - s, -h, s, t) + bar(-h, g, t, s);
      if (c.style === "cross") o += bar(-h, -g - s, t, s);
    }
    if (c.style === "circle") o += `<circle r="${s + g}" fill="none" stroke="${c.color}" stroke-width="${t}"${c.outline ? ' style="filter:drop-shadow(0 0 1px #000)"' : ""}/>`;
    if (c.style === "dot" || c.style === "circle") o += `<circle r="${Math.max(t, 1.5)}" ${st}/>`;
    x.innerHTML = o;
  }
  $("#chOn").onchange = (e) => { S.ch.on = e.target.checked; drawCrosshair(); };
  $$("[data-style]").forEach((b) => b.onclick = () => { S.ch.style = b.dataset.style; $$("[data-style]").forEach((x) => x.classList.toggle("on", x === b)); drawCrosshair(); });
  $$("[data-color]").forEach((b) => { b.style.background = b.dataset.color; b.onclick = () => { S.ch.color = b.dataset.color; $$("[data-color]").forEach((x) => x.classList.toggle("on", x === b)); drawCrosshair(); }; });
  $$("[data-ch]").forEach((i) => i.oninput = () => { S.ch[i.dataset.ch] = +i.value; drawCrosshair(); });
  $("#chOutline").onchange = (e) => { S.ch.outline = e.target.checked; drawCrosshair(); };

  // ---------- overlay ----------
  const ov = $("#ov"), rnd = (a, b) => a + Math.random() * (b - a);
  const live = { fps: 144, cpu: 42, gpu: 71, ct: 61, gt: 66 };
  function drawOverlay() {
    ov.hidden = !S.ov.on; ov.className = "ov " + S.ov.pos;
    const i = S.ov.items, r = [];
    if (i.fps) r.push(`<span>FPS</span><b>${Math.round(live.fps)}</b>`);
    if (i.cpu) r.push(`<span>CPU</span><b>${Math.round(live.cpu)}%${i.temp ? ` · ${Math.round(live.ct)}°C` : ""}</b>`);
    if (i.gpu) r.push(`<span>GPU</span><b>${Math.round(live.gpu)}%${i.temp ? ` · ${Math.round(live.gt)}°C` : ""}</b>`);
    ov.innerHTML = r.map((x) => `<div>${x}</div>`).join("") || "<div><span>Overlay</span><b>–</b></div>";
  }
  setInterval(() => {
    const busy = S.game !== null;
    live.fps += (rnd(busy ? 130 : 160, busy ? 165 : 240) - live.fps) * 0.3;
    live.cpu += (rnd(busy ? 45 : 5, busy ? 70 : 15) - live.cpu) * 0.3;
    live.gpu += (rnd(busy ? 85 : 3, busy ? 99 : 12) - live.gpu) * 0.3;
    live.ct += (rnd(busy ? 62 : 40, busy ? 72 : 46) - live.ct) * 0.15;
    live.gt += (rnd(busy ? 66 : 38, busy ? 76 : 44) - live.gt) * 0.15;
    drawOverlay();
  }, 800);
  $("#ovOn").onchange = (e) => { S.ov.on = e.target.checked; drawOverlay(); };
  $$("[data-pos]").forEach((b) => b.onclick = () => { S.ov.pos = b.dataset.pos; $$("[data-pos]").forEach((x) => x.classList.toggle("on", x === b)); drawOverlay(); });
  $$("[data-item]").forEach((c) => c.onchange = () => { S.ov.items[c.dataset.item] = c.checked; drawOverlay(); });

  // ---------- optimizer ----------
  $("#optRun").onclick = async () => {
    const items = $$("#optList input:checked"), bar = $("#optBar b"), out = $("#optOut"), btn = $("#optRun");
    if (!items.length) return toast("Pick at least one tweak");
    btn.disabled = true; out.textContent = ""; $("#optBar").hidden = false;
    for (let k = 0; k < items.length; k++) {
      out.textContent = "Applying: " + items[k].parentElement.textContent.trim() + "…";
      bar.style.width = ((k + 1) / items.length) * 100 + "%";
      await new Promise((r) => setTimeout(r, 650));
    }
    out.innerHTML = `<span style="color:var(--ok)">✓ ${items.length} tweak${items.length > 1 ? "s" : ""} applied.</span> <small class="muted">(Demo: nothing was changed on your PC.)</small>`;
    btn.disabled = false;
  };

  // ---------- themes ----------
  $$("[data-accent]").forEach((b) => { b.style.background = b.dataset.accent; b.onclick = () => {
    $("#app").style.setProperty("--a", b.dataset.accent); $$("[data-accent]").forEach((x) => x.classList.toggle("on", x === b)); toast("Theme changed");
  }; });

  // ---------- hotkeys ----------
  addEventListener("keydown", (e) => {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    const names = Object.keys(PRESETS), n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[e.code];
    if (n !== undefined) { e.preventDefault(); setPreset(names[n]); }
    else if (e.code === "KeyC") { e.preventDefault(); S.ch.on = !S.ch.on; $("#chOn").checked = S.ch.on; drawCrosshair(); toast(`Crosshair ${S.ch.on ? "on" : "off"}`); }
    else if (e.code === "KeyO") { e.preventDefault(); S.ov.on = !S.ov.on; $("#ovOn").checked = S.ov.on; drawOverlay(); toast(`Overlay ${S.ov.on ? "on" : "off"}`); }
  });

  syncColour(); renderGames(); drawCrosshair(); drawOverlay();
})();
