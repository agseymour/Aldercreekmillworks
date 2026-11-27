window.ACM = window.ACM || {};

/**
 * ACM.Audio — every sound in the game is synthesized with the Web Audio API (no audio files).
 * Ambient layers: wind, river, rain, birdsong (day), crickets and an owl (night).
 * One-shot effects: footsteps by surface, axe chops, tree falls, planting, UI chimes.
 * Browsers only allow sound after a click, so init() is called from the Start button.
 */
ACM.Audio = (function () {
  let ctx = null, master = null, muted = false;
  let windG = null, windF = null, riverG = null, rainG = null;
  let whiteBuf = null;
  let nextBird = 0, nextCricket = 0, nextOwl = 0, lastStep = 0;
  let env = { hour: 12, season: "Spring", weather: "Sunny", waterDist: 99, inside: false };

  try { muted = localStorage.getItem("acm_muted") === "1"; } catch (e) {}

  function init() {
    if (ctx) { try { ctx.resume(); } catch (e) {} return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);

      const len = ctx.sampleRate * 2;
      whiteBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = whiteBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const brownBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const bd = brownBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * d[i]) / 1.02; bd[i] = last * 3.5; }

      const loop = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; };

      // wind: brown noise, band-passed, slowly breathing
      const wind = loop(brownBuf);
      windF = ctx.createBiquadFilter(); windF.type = "bandpass"; windF.frequency.value = 420; windF.Q.value = 0.6;
      windG = ctx.createGain(); windG.gain.value = 0.04;
      wind.connect(windF); windF.connect(windG); windG.connect(master);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.02;
      lfo.connect(lfoG); lfoG.connect(windG.gain); lfo.start();

      // river: white noise, low-passed
      const river = loop(whiteBuf);
      const rf = ctx.createBiquadFilter(); rf.type = "lowpass"; rf.frequency.value = 900;
      riverG = ctx.createGain(); riverG.gain.value = 0;
      river.connect(rf); rf.connect(riverG); riverG.connect(master);

      // rain: white noise, high-passed
      const rain = loop(whiteBuf);
      const rnf = ctx.createBiquadFilter(); rnf.type = "highpass"; rnf.frequency.value = 1800;
      rainG = ctx.createGain(); rainG.gain.value = 0;
      rain.connect(rnf); rnf.connect(rainG); rainG.connect(master);
    } catch (e) { ctx = null; }
  }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem("acm_muted", muted ? "1" : "0"); } catch (e) {}
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
  }
  const isMuted = () => muted;

  function pan() {
    if (!ctx.createStereoPanner) return null;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.random() * 1.6 - 0.8;
    return p;
  }

  function chirp(vol) {
    const t = ctx.currentTime;
    const n = 2 + Math.floor(Math.random() * 4);
    const base = 2100 + Math.random() * 2300;
    const p = pan();
    const out = ctx.createGain();
    out.gain.value = vol;
    if (p) { out.connect(p); p.connect(master); } else out.connect(master);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      const st = t + i * (0.09 + Math.random() * 0.05);
      o.frequency.setValueAtTime(base * (1 + Math.random() * 0.1), st);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), st + 0.06);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(1, st + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.09);
      o.connect(g); g.connect(out);
      o.start(st); o.stop(st + 0.1);
    }
  }

  function cricket() {
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.012;
    const p = pan();
    if (p) { out.connect(p); p.connect(master); } else out.connect(master);
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 4300 + Math.random() * 300;
      const st = t + i * 0.07;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(1, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.05);
      o.connect(g); g.connect(out);
      o.start(st); o.stop(st + 0.06);
    }
  }

  function owl() {
    const t = ctx.currentTime;
    [0, 0.45, 0.95].forEach((dt, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(i === 2 ? 330 : 400, t + dt);
      o.frequency.linearRampToValueAtTime(i === 2 ? 290 : 360, t + dt + 0.3);
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.linearRampToValueAtTime(0.03, t + dt + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.34);
      o.connect(g); g.connect(master);
      o.start(t + dt); o.stop(t + dt + 0.4);
    });
  }

  function noiseBurst(dur, freq, type, vol, q) {
    const s = ctx.createBufferSource(); s.buffer = whiteBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }

  function thump(freq, dur, vol, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const t = ctx.currentTime;
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.5), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function tone(freq, dur, vol, delay, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const t = ctx.currentTime + (delay || 0);
    o.type = type || "triangle";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function sfx(name) {
    if (!ctx || muted) return;
    switch (name) {
      case "chop": thump(160, 0.12, 0.35, "triangle"); noiseBurst(0.1, 1800, "bandpass", 0.25, 1.2); break;
      case "fell":
        noiseBurst(0.7, 700, "lowpass", 0.35);
        thump(90, 0.5, 0.45, "sine");
        for (let i = 0; i < 4; i++) setTimeout(() => ctx && noiseBurst(0.08, 2400, "bandpass", 0.12, 1), 60 + i * 70);
        break;
      case "plant": thump(120, 0.14, 0.25); noiseBurst(0.12, 500, "lowpass", 0.22); break;
      case "click": tone(700, 0.05, 0.05); break;
      case "good": tone(660, 0.12, 0.08); tone(880, 0.16, 0.08, 0.09); break;
      case "bad": tone(200, 0.2, 0.09, 0, "sawtooth"); break;
      case "coin": tone(1320, 0.08, 0.06, 0, "square"); tone(1760, 0.14, 0.06, 0.07, "square"); break;
      case "door": thump(110, 0.18, 0.25, "triangle"); noiseBurst(0.1, 900, "bandpass", 0.1); break;
      case "talk": tone(520, 0.06, 0.05); tone(620, 0.08, 0.05, 0.06); break;
      case "heart": tone(784, 0.1, 0.07); tone(988, 0.1, 0.07, 0.1); tone(1318, 0.22, 0.07, 0.2); break;
      case "sleep": tone(392, 0.4, 0.07, 0, "sine"); tone(330, 0.6, 0.07, 0.35, "sine"); tone(262, 0.9, 0.07, 0.8, "sine"); break;
      default: break;
    }
  }

  function step(surface) {
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    if (now - lastStep < 0.12) return;
    lastStep = now;
    if (surface === "path") noiseBurst(0.07, 1500, "bandpass", 0.05, 0.9);
    else if (surface === "floor") { thump(150, 0.07, 0.09, "triangle"); noiseBurst(0.05, 900, "bandpass", 0.03); }
    else if (surface === "bridge") { thump(190, 0.09, 0.11, "triangle"); }
    else if (surface === "sand") noiseBurst(0.09, 1100, "lowpass", 0.05);
    else if (surface === "cobble") noiseBurst(0.05, 2200, "bandpass", 0.05, 1.4);
    else noiseBurst(0.08, 600, "lowpass", 0.04);
  }

  function update(e) {
    if (!ctx) return;
    env = Object.assign(env, e);
    const t = ctx.currentTime;
    const hour = env.hour;
    const day = hour >= 5.5 && hour < 20.5;
    const night = !day;
    const rainy = env.weather === "Rain";
    const windy = env.weather === "Breezy" || env.weather === "Snow" || env.season === "Winter";
    const inMul = env.inside ? 0.45 : 1;

    windG.gain.setTargetAtTime((windy ? 0.085 : 0.04) * inMul, t, 0.8);
    windF.frequency.setTargetAtTime(windy ? 520 : 380, t, 1);
    riverG.gain.setTargetAtTime(Math.max(0, 1 - env.waterDist / 9) * 0.09 * inMul, t, 0.5);
    rainG.gain.setTargetAtTime((rainy ? 0.045 : 0) * inMul, t, 1.2);

    if (muted) return;
    if (day && !rainy && t >= nextBird) {
      chirp((env.season === "Winter" ? 0.03 : 0.05) * inMul);
      nextBird = t + (env.season === "Winter" ? 8 + Math.random() * 10 : 1.8 + Math.random() * 5.5);
    }
    if (night && !rainy && env.season !== "Winter" && t >= nextCricket) {
      cricket();
      nextCricket = t + 0.35 + Math.random() * 0.5;
    }
    if (night && t >= nextOwl) {
      owl();
      nextOwl = t + 18 + Math.random() * 22;
    }
  }

  return { init, update, sfx, step, setMuted, isMuted };
})();
