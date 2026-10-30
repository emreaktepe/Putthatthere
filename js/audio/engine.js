// ---------- Ses motoru (P4): Web Audio ile sentez, harici dosya yok ----------
// Olay adları: cast:<büyü id>, hit, kill:<düşman tipi>, hurt, shield_block, shield_break, pickup:<crystal|heart|light>,
// ability:<id>, level_clear, game_over, phase:<n>, boss_shield_break, boss_shield_up, telegraph, slam, explode,
// enemy_shot, totem_down, meteor_hit, nova, toast, click. Müzik: mus.set("menu"|"play"|"boss", tema), mus.intensity(0-1).
import { MUSIC, MUSIC_P3 } from "../core/data.js";
import { $ } from "../core/util.js";

export const SOUND_KEY = "buyucu_ses";
export const AUDIO = (() => {
  // Müzik tablosu artık data/game.config.json -> themes.<id>.music (core/data.js MUSIC / MUSIC_P3). root: MIDI kök; scale: yarım ton dizisi; chords: gam derecesi (üçlü: d, d+2, d+4); bpm; cut: pad filtresi (Hz)
  // Karşılama/menü müziği: ÜSTTE keyifli (Dorian, müzik kutusu arpejli), ALTTA gergin (yarım ton çatışması, triton uğultusu, kalp atışı, yükselen gürültü).
  const MENU_MUSIC = { root: 50, scale: [0, 2, 3, 5, 7, 9, 10], bpm: 72, chords: [0, 6, 3, 4], chordBars: 2, cut: 900, wind: 0.45, padAtt: 2.2, padVol: 0.08, detune: 9, pad4: true, bellP: 0 };
  const ARP_MENU = [0, 2, 4, 7, 4, 2, 5, 4]; // akor kökünden gam derece kaymaları (sekizlik nota dizisi)
  const MOTIF0 = [0, 2, 7, 9, 7, 2];
  const MOTIF3 = [0, 2, 4, 7, 9, 7, 4, 2];

  const touch = matchMedia("(pointer: coarse)").matches;
  let ctx = null, master = null, musicGain = null, dry = null, revIn = null, noiseBuf = null, padFilter = null, windGain = null;
  const buses = {};
  let live = 0, timer = 0, hidden = document.hidden, failed = false, on = true;
  try { on = localStorage.getItem(SOUND_KEY) !== "0"; } catch (e) { /* özel mod */ }
  const st = { mode: "menu", theme: 0, target: 0, smooth: 0, step: 0, nextT: 0, phase: 1, burstUntil: 0, arpIdx: 5, lastArp: -1, motif: 0, crystal: 0, busT: 0 };
  const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const cfgOf = () => (st.mode === "menu" ? MENU_MUSIC : (st.mode === "boss" && st.phase === 3 && MUSIC_P3[st.theme]) || MUSIC[st.theme] || MUSIC[0]);
  const degNote = (c, d) => { const n = c.scale.length; return c.root + c.scale[((d % n) + n) % n] + 12 * Math.floor(d / n); };

  function init() {
    if (ctx || failed) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { failed = true; return; }
    master = ctx.createGain();
    master.gain.value = on ? 0.25 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    dry = ctx.createGain(); dry.connect(master);
    // yankı: gürültüden üstel sönümlü impulse (mobilde daha kısa)
    const conv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * (touch ? 1.2 : 1.8));
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    conv.buffer = ir;
    revIn = ctx.createGain();
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    revIn.connect(conv); conv.connect(wet); wet.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    musicGain = ctx.createGain(); musicGain.connect(dry);
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime); musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5); // ilk dokunuştan sonra yumuşak giriş
    const mkBus = (name, vol, rev, music = true) => {
      const g = ctx.createGain(); g.gain.value = vol; g.connect(music ? musicGain : dry);
      const r = ctx.createGain(); r.gain.value = rev; g.connect(r); r.connect(revIn);
      buses[name] = g;
    };
    mkBus("pad", 0.55, 0.5); mkBus("arp", 0.4, 0.9); mkBus("bell", 0.5, 0.9); mkBus("drone", 0.6, 0.2);
    mkBus("wind", 0.6, 0.3); mkBus("drum", 0.6, 0.1); mkBus("bass", 0.6, 0.1); mkBus("sfx", 0.9, 0.35, false);
    // kalıcı düğümler: pad filtresi + LFO, rüzgâr
    padFilter = ctx.createBiquadFilter(); padFilter.type = "lowpass"; padFilter.frequency.value = 800; padFilter.Q.value = 0.7; padFilter.connect(buses.pad);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lg = ctx.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(padFilter.frequency); lfo.start();
    const ws = ctx.createBufferSource(); ws.buffer = noiseBuf; ws.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = "bandpass"; wf.frequency.value = 500; wf.Q.value = 0.8;
    windGain = ctx.createGain(); windGain.gain.value = 0;
    ws.connect(wf); wf.connect(windGain); windGain.connect(buses.wind);
    const wl = ctx.createOscillator(); wl.frequency.value = 0.07;
    const wlg = ctx.createGain(); wlg.gain.value = 250; wl.connect(wlg); wlg.connect(wf.frequency);
    ws.start(); wl.start();
    // iOS kilidini açmak için sessiz tampon
    const sb = ctx.createBufferSource(); sb.buffer = ctx.createBuffer(1, 1, 22050); sb.connect(ctx.destination); sb.start(0);
    ctx.onstatechange = () => { if (ctx.state === "running" && on && !hidden) startTimer(); else stopTimer(); };
    updateBuses();
    if (ctx.state === "running") startTimer();
  }

  // ---- çekirdek yardımcılar ----
  function voice(type, f0, f1, t, dur, peak, dest, o = {}) {
    if (live >= (o.cap || 28)) return null;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    if (o.det) osc.detune.value = o.det;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + (o.a || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(dest);
    live++;
    osc.onended = () => { live--; g.disconnect(); };
    osc.start(t); osc.stop(t + dur + 0.05);
    return osc;
  }
  function noise(t, dur, peak, dest, o = {}) {
    if (live >= 30) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.type || "lowpass"; f.Q.value = o.q || 0.7;
    f.frequency.setValueAtTime(o.f0 || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    live++;
    src.onended = () => { live--; g.disconnect(); };
    src.start(t, Math.random() * 0.8, dur + 0.05);
  }
  function bell(f, t, vel = 1, dec = 2.5, dest = buses.bell) {
    voice("sine", f, f, t, dec, 0.16 * vel, dest);
    voice("sine", f * 2.76, f * 2.76, t, dec * 0.6, 0.08 * vel, dest);
    voice("sine", f * 5.4, f * 5.4, t, dec * 0.35, 0.04 * vel, dest);
  }
  function padChord(cfg, notes, t, dur) {
    const att = cfg.padAtt || 1.5, rel = 1.6, peak = cfg.padVol || 0.09, det = cfg.detune || 7;
    for (const n of notes) for (const dt of [-det, det]) {
      if (live >= 26) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = mtof(n); o.detune.value = dt;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + att);
      g.gain.setValueAtTime(peak, t + Math.max(dur - 0.1, att));
      g.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
      o.connect(g); g.connect(padFilter);
      live++;
      o.onended = () => { live--; g.disconnect(); };
      o.start(t); o.stop(t + dur + rel + 0.05);
    }
  }
  function kick(t, low) {
    voice("sine", low ? 90 : 120, low ? 38 : 50, t, low ? 0.35 : 0.22, 0.5, buses.drum);
  }
  function hat(t, v) { noise(t, 0.03, 0.09 * v, buses.drum, { type: "highpass", f0: 7000 }); }

  function arpNote(cfg) {
    const n = cfg.scale.length, hi = n * 2 - 1;
    st.arpIdx = Math.min(st.arpIdx, hi);
    if (cfg.arpRepeat) { if (Math.random() < 0.08) st.arpIdx = Math.floor(Math.random() * n); }
    else {
      let i = st.arpIdx + pick([-2, -1, 1, 2]);
      if (i < 0) i = 1;
      if (i > hi) i = hi - 1;
      if (i === st.lastArp) i = Math.min(i + 1, hi);
      st.arpIdx = i;
    }
    st.lastArp = st.arpIdx;
    return degNote(cfg, st.arpIdx) + 12 + (cfg.arpOct || 0);
  }

  // menü: keyifli üst katman + gergin alt katman
  function menuLayers(t, s, bar, sd, cfg) {
    const cb = cfg.chordBars || 2, c = cfg.chords[Math.floor(bar / cb) % cfg.chords.length];
    // keyifli: müzik kutusu arpejisi (sekizlik nota) + her ölçü başında çan
    if (s % 2 === 0) {
      const i = s / 2;
      if (!(i === 7 && Math.random() < 0.35)) { // zaman zaman nefes payı
        const f = mtof(degNote(cfg, c + ARP_MENU[i]) + 12);
        voice("triangle", f, f, t, 0.5, i % 4 === 0 ? 0.1 : 0.07, buses.arp, { cap: 22 });
      }
    }
    if (s === 0) bell(mtof(degNote(cfg, c + 7) + 12), t, 0.7, 3.2);
    // gergin: yarım ton çatışması + triton uğultusu (4 ölçüde bir, yavaş şişer)
    if (s === 0 && bar % 4 === 2) {
      const dur = sd * 32;
      voice("sine", mtof(cfg.root + 1), mtof(cfg.root + 1), t, dur, 0.035, buses.drone, { a: 2.4 });
      voice("sine", mtof(cfg.root + 6 + 12), mtof(cfg.root + 6 + 12), t, dur, 0.02, buses.drone, { a: 2.8 });
    }
    // gergin: kalp atışı (lub-dub); 24 ölçülük döngüde yavaş yükselir
    if (bar >= 2 && (s === 0 || s === 3)) {
      const p = 0.35 + 0.65 * ((bar % 24) / 24);
      voice("sine", s === 0 ? 64 : 58, 34, t, 0.3, (s === 0 ? 0.17 : 0.09) * p, buses.drum, { cap: 24 });
    }
    // gergin: 8 ölçüde bir yükselen gürültü, ardından derin vuruş
    if (s === 0 && bar % 8 === 7) noise(t, sd * 16, 0.045, buses.wind, { type: "bandpass", f0: 500, f1: 2800, q: 3 });
    if (s === 0 && bar % 8 === 0 && bar > 0) voice("sine", 55, 32, t, 1.4, 0.18, buses.bass, { cap: 24 });
  }

  // 16'lık adım başına zamanlama
  function stepFn(t) {
    const cfg = cfgOf(), boss = st.mode === "boss", menu = st.mode === "menu";
    const sd = 60 / cfg.bpm / 4, s = st.step % 16, bar = Math.floor(st.step / 16);
    const inten = menu ? 0 : boss ? 1 : st.smooth;
    const p3 = boss && st.phase === 3 && t > st.burstUntil; // Pırıl teması: ritim susar
    const cb = cfg.chordBars || 2;
    if (s === 0 && bar % cb === 0) {
      const c = cfg.chords[(bar / cb) % cfg.chords.length];
      const notes = [degNote(cfg, c), degNote(cfg, c + 2), degNote(cfg, c + 4)];
      if (cfg.pad4) notes.push(notes[0] + 12);
      padChord(cfg, notes, t, cb * sd * 16);
    }
    if (s === 0 && bar % 4 === 0) { // bas/drone: kök + bir oktav altı (+ beşli)
      const dur = sd * 64, r = cfg.root - 12;
      voice("sine", mtof(r), mtof(r), t, dur, 0.1, buses.drone, { a: 1 });
      voice("sine", mtof(r - 12), mtof(r - 12), t, dur, 0.1, buses.drone, { a: 1 });
      if (cfg.fifth) voice("sine", mtof(r + 7), mtof(r + 7), t, dur, 0.05, buses.drone, { a: 1 });
    }
    if (menu) { menuLayers(t, s, bar, sd, cfg); return; }
    // çan / Pırıl motifi
    if (p3) {
      if (s === 0 || s === 8) bell(mtof(cfg.root + 12 + MOTIF3[st.motif++ % MOTIF3.length]), t, 0.9, 2.5);
    } else if (s === 0 && (!menu || bar % 2 === 0) && Math.random() < cfg.bellP * (menu ? 0.5 : 1)) {
      let n;
      if (cfg.motif) n = cfg.root + 12 + MOTIF0[st.motif++ % MOTIF0.length];
      else n = degNote(cfg, pick([0, 2, 4])) + (cfg.bellOct || 24);
      bell(mtof(n), t, 0.8);
    }
    // arp
    if (!p3 && !menu && cfg.arpP > 0) {
      const fast = boss ? st.phase >= 2 : inten > 0.5;
      if (s % (fast ? 1 : 2) === 0 && Math.random() < cfg.arpP * (fast ? 0.8 : 1)) {
        const f = mtof(arpNote(cfg));
        voice(cfg.arpWave || "triangle", f, f, t, cfg.arpDec || 0.25, cfg.arpVol || 0.12, buses.arp, { cap: 22 });
      }
    }
    // ritim + bas yürüyüşü
    if (!menu && !p3 && (boss || inten > (cfg.drumThr || 0.5))) {
      const strong = boss || inten > 0.8;
      if ((cfg.kick || [0, 8]).includes(s) || (strong && !cfg.kick && (s === 4 || s === 12))) kick(t, cfg.tomLow);
      if (!cfg.noHat) {
        const fastHat = (boss && st.phase >= 2) || inten > 0.8;
        if (fastHat ? true : s % 4 === 2) hat(t, fastHat && s % 2 ? 0.5 : 1);
      }
      if (strong && s % 4 === 0) {
        const q = (bar * 4 + s / 4) % 4;
        const deg = boss ? [0, 5, 0, 4][q] : [0, 0, 4, 0][q];
        const f = mtof(degNote(cfg, deg) - 12);
        voice("sine", f, f, t, sd * 3, 0.22, buses.bass, { cap: 24 });
        voice("triangle", f, f, t, sd * 3, 0.1, buses.bass, { cap: 24 });
      }
    }
    if (cfg.burst && !menu && inten > 0.2 && s % 4 === 2 && Math.random() < 0.25) noise(t, 0.08, 0.08, buses.drum, { type: "bandpass", f0: 3000, q: 1 });
  }

  function updateBuses() {
    if (!ctx) return;
    const cfg = cfgOf(), now = ctx.currentTime, menu = st.mode === "menu";
    windGain.gain.setTargetAtTime((cfg.wind ?? 0.3) * (menu ? 0.6 : 1) * 0.3, now, 0.8);
    padFilter.frequency.setTargetAtTime(cfg.cut * (menu ? 0.7 : 1 + st.smooth * 0.8), now, 0.6);
  }
  function fade() {
    const now = ctx.currentTime, g = musicGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.15, now + 0.35);
    g.linearRampToValueAtTime(1, now + 1.9);
  }
  function setMode(mode, theme = 0) {
    st.crystal = 0;
    if (mode === st.mode && (mode === "menu" || theme === st.theme)) return;
    st.mode = mode; st.theme = mode === "menu" ? 0 : theme;
    st.phase = 1; st.burstUntil = 0; st.step = 0; st.arpIdx = 5; st.motif = 0;
    if (ctx) { st.nextT = ctx.currentTime + 0.3; fade(); updateBuses(); }
  }

  function tick() {
    if (!ctx || hidden || !on || ctx.state !== "running") { if (ctx) st.nextT = ctx.currentTime + 0.1; return; }
    const now = ctx.currentTime;
    st.smooth += (st.target - st.smooth) * 0.08;
    if (now - st.busT > 0.25) { st.busT = now; updateBuses(); }
    if (st.nextT < now - 0.3) st.nextT = now + 0.05;
    let guard = 0;
    while (st.nextT < now + 0.15 && guard++ < 8) { stepFn(st.nextT); st.step++; st.nextT += 60 / cfgOf().bpm / 4; }
  }
  function startTimer() { if (timer || !ctx) return; st.nextT = ctx.currentTime + 0.1; timer = setInterval(tick, 25); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = 0; } }

  // ---- ses efektleri ----
  const THROTTLE = { hit: 0.04, enemy_shot: 0.08, telegraph: 0.2, toast: 0.15, pickup: 0.03, kill: 0.03, cast: 0.03 };
  const lastAt = {};
  function sfx(name) {
    if (name.startsWith("phase:")) st.phase = +name.slice(6);
    else if (name === "boss_shield_break") { if (ctx) st.burstUntil = ctx.currentTime + 4; }
    else if (name === "boss_shield_up") st.burstUntil = 0;
    if (!ctx || !on || hidden || ctx.state !== "running") return;
    const T = ctx.currentTime, i = name.indexOf(":"), k = i < 0 ? name : name.slice(0, i), arg = i < 0 ? "" : name.slice(i + 1);
    const gap = THROTTLE[k];
    if (gap) { if (T - (lastAt[k] || -9) < gap) return; lastAt[k] = T; }
    const b = buses.sfx;
    switch (k) {
      case "cast":
        if (arg === "fire") { noise(T, 0.25, 0.18, b, { type: "bandpass", f0: 900, f1: 300, q: 2 }); voice("sawtooth", 220, 110, T, 0.25, 0.07, b); }
        else if (arg === "frost") { voice("sine", 1800, 2400, T, 0.2, 0.1, b); voice("sine", 5400, 5400, T + 0.02, 0.18, 0.025, b); }
        else if (arg === "arcane") { [523, 659, 784].forEach((f, j) => bell(f, T + j * 0.04, 0.5, 0.7, b)); }
        else if (arg === "lightning") { noise(T, 0.3, 0.22, b, { type: "highpass", f0: 2500, q: 0.5 }); voice("sine", 60, 40, T, 0.2, 0.25, b); noise(T + 0.05, 0.08, 0.12, b, { type: "highpass", f0: 4000 }); }
        else if (arg === "poison") { noise(T, 0.6, 0.1, b, { f0: 500, f1: 200 }); voice("sine", 200, 150, T, 0.3, 0.08, b); voice("sine", 150, 210, T + 0.3, 0.3, 0.06, b); }
        else if (arg === "meteor") { voice("sine", 600, 80, T, 0.8, 0.12, b); }
        break;
      case "nova": voice("sine", 200, 800, T, 0.5, 0.12, b); bell(880, T + 0.25, 0.6, 1.2, b); break;
      case "click": voice("square", 900, 700, T, 0.02, 0.04, b); break;
      case "hit": noise(T, 0.03, 0.12, b, { type: "highpass", f0: 1500 }); voice("sine", 400, 150, T, 0.06, 0.1, b); break;
      case "kill":
        if (arg === "ghost") voice("sine", 600, 200, T, 0.35, 0.1, b);
        else if (arg === "bat") voice("triangle", 3000, 4500, T, 0.08, 0.08, b);
        else if (arg === "golem" || arg === "knight") { noise(T, 0.35, 0.3, b, { f0: 800, f1: 200 }); voice("sine", 90, 40, T, 0.3, 0.3, b); }
        else if (arg === "archer") { noise(T, 0.1, 0.12, b, { type: "bandpass", f0: 3000, q: 2 }); voice("square", 300, 180, T, 0.12, 0.05, b); }
        else if (arg === "wolf") voice("sine", 500, 150, T, 0.3, 0.1, b);
        else if (arg === "priest") { voice("sine", 300, 100, T, 0.5, 0.1, b); bell(660, T, 0.4, 1, b); }
        else if (arg === "boss") { voice("sawtooth", 200, 30, T, 1.2, 0.15, b); noise(T, 0.9, 0.3, b, { f0: 1200, f1: 100 }); }
        break;
      case "hurt": voice("sawtooth", 200, 60, T, 0.25, 0.2, b); noise(T, 0.25, 0.15, b, { f0: 600 }); break;
      case "shield_block": voice("triangle", 1200, 900, T, 0.12, 0.1, b); break;
      case "shield_break": noise(T, 0.3, 0.15, b, { type: "highpass", f0: 3000 }); bell(1400, T, 0.6, 1, b); break;
      case "pickup":
        if (arg === "crystal") {
          const cfg = cfgOf(), n = st.crystal++ % 8;
          bell(mtof(degNote(cfg, n) + 24), T, 0.7, 0.9, b);
        } else if (arg === "heart") { voice("sine", 523, 523, T, 0.15, 0.12, b); voice("sine", 784, 784, T + 0.09, 0.22, 0.12, b); }
        else { for (let j = 0; j < 4; j++) voice("sine", 1500 + Math.random() * 1800, 0, T + j * 0.04, 0.2, 0.05, b); }
        break;
      case "ability":
        if (arg === "shield") { voice("sine", 400, 1200, T, 0.4, 0.1, b); voice("triangle", 800, 1600, T, 0.4, 0.04, b); }
        else if (arg === "blink") { noise(T, 0.25, 0.15, b, { type: "bandpass", f0: 1000, f1: 4000, q: 1 }); voice("sine", 500, 1500, T, 0.15, 0.08, b); }
        else if (arg === "timeslow") { voice("sine", 800, 100, T, 0.9, 0.15, b); noise(T, 0.9, 0.1, b, { f0: 2000, f1: 200 }); }
        break;
      case "level_clear":
        [62, 66, 69, 74].forEach((n, j) => bell(mtof(n + 12), T + j * 0.18, 0.8, 1.8, b));
        [50, 54, 57].forEach((n) => voice("sine", mtof(n), mtof(n), T, 2.2, 0.07, b, { a: 0.6 }));
        break;
      case "game_over": {
        [69, 65, 62, 57].forEach((n, j) => voice("triangle", mtof(n), mtof(n), T + j * 0.2, 0.5, 0.1, b));
        if (live < 28) {
          const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          o.type = "sawtooth"; o.frequency.value = 110;
          f.type = "lowpass"; f.frequency.setValueAtTime(1200, T); f.frequency.exponentialRampToValueAtTime(120, T + 1.2);
          g.gain.setValueAtTime(0.12, T); g.gain.exponentialRampToValueAtTime(0.0001, T + 1.3);
          o.connect(f); f.connect(g); g.connect(b);
          live++; o.onended = () => { live--; g.disconnect(); };
          o.start(T); o.stop(T + 1.35);
        }
        break;
      }
      case "phase": voice("sine", 150, 40, T, 0.6, 0.35, b); voice("sawtooth", 100, 400, T, 0.8, 0.06, b); noise(T, 0.6, 0.15, b, { f0: 2000, f1: 200 }); break;
      case "boss_shield_break": bell(2400, T, 0.8, 1.5, b); bell(1800, T + 0.05, 0.6, 1.5, b); voice("sine", 60, 40, T, 0.4, 0.35, b); break;
      case "boss_shield_up": voice("sine", 300, 150, T, 0.5, 0.15, b); break;
      case "telegraph": voice("sine", 500, 700, T, 0.15, 0.07, b); voice("sine", 500, 700, T + 0.12, 0.15, 0.07, b); break;
      case "slam": voice("sine", 90, 30, T, 0.5, 0.5, b); noise(T, 0.4, 0.25, b, { f0: 600, f1: 100 }); break;
      case "explode": noise(T, 0.4, 0.3, b, { f0: 1500, f1: 200 }); voice("sine", 100, 40, T, 0.3, 0.3, b); break;
      case "meteor_hit": noise(T, 0.6, 0.35, b, { f0: 400, f1: 100 }); voice("sine", 80, 35, T, 0.5, 0.4, b); break;
      case "enemy_shot": voice("square", 700, 400, T, 0.12, 0.05, b); break;
      case "totem_down": voice("sine", 70, 35, T, 0.6, 0.4, b); noise(T, 0.35, 0.15, b, { type: "highpass", f0: 2500 }); bell(1568, T + 0.2, 0.6, 1.5, b); break;
      case "toast": bell(880, T, 0.25, 0.8, b); break;
      default: break;
    }
  }

  // ---- yaşam döngüsü ----
  function unlock() {
    if (!on || failed) return;
    init();
    if (ctx && ctx.state !== "running" && !hidden) ctx.resume().catch(() => {});
  }
  for (const ev of ["pointerdown", "pointerup", "touchend", "click", "keydown"]) addEventListener(ev, unlock, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    hidden = document.hidden;
    if (!ctx) return;
    if (hidden) { stopTimer(); ctx.suspend().catch(() => {}); }
    else if (on) ctx.resume().catch(() => {});
  });

  const btn = $("mute");
  function renderBtn() {
    btn.textContent = on ? "🔊" : "🔇";
    btn.setAttribute("aria-pressed", on ? "false" : "true");
    btn.setAttribute("aria-label", on ? "Sesi kapat" : "Sesi aç");
    btn.title = on ? "Sesi kapat" : "Sesi aç";
  }
  function setOn(v) {
    on = v;
    try { localStorage.setItem(SOUND_KEY, v ? "1" : "0"); } catch (e) { /* özel mod */ }
    if (v) {
      unlock();
      if (ctx) { master.gain.setTargetAtTime(0.25, ctx.currentTime, 0.05); ctx.resume().catch(() => {}); }
    } else if (ctx) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      setTimeout(() => { if (!on && ctx) ctx.suspend().catch(() => {}); }, 300);
    }
    renderBtn();
  }
  btn.addEventListener("click", () => { setOn(!on); btn.blur(); });
  renderBtn();

  return { sfx, mus: { set: setMode, intensity: (v) => { st.target = v; } }, debug: () => ({ state: ctx && ctx.state, live, step: st.step, mode: st.mode, theme: st.theme, timer: !!timer, on, gain: master && master.gain.value }) };
})();
export const sfx = AUDIO.sfx;
export const mus = AUDIO.mus;
