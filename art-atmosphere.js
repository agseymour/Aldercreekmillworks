window.ACM = window.ACM || {};

/**
 * ACM.Atmos — outdoor light and colour that follow the clock, weather and season.
 * Each "look" is a set of cheap canvas blend-mode passes (no per-pixel JS work per frame):
 *   cast shadows from the sun or moon, light-side edge light on trees and buildings,
 *   creek depth, tint and reflections, cloud shadows, fog, light shafts, motes, and a
 *   colour grade (ambient multiply, hue-shifted shadows via "lighten", warm highlights via "darken").
 * The looks blend smoothly between keyframes through the day.
 */
ACM.Atmos = (function () {
  const M = ACM.Map, T = M.T, W = M.W, H = M.H, TYPE = M.TYPE;

  /* ------------------------------------------------------------------ looks
     amb/lift/cap/tint/haze/vig are [r,g,b,alpha]. Missing fields count as "off". */
  const LOOK = {
    dawnMist: { amb: [232, 238, 255, 0.32], lift: [72, 78, 116, 0.2], cap: [255, 240, 226, 0.22], desat: 0.1, pop: 0.22,
      shadow: [92, 92, 152, 0.26], rim: [255, 232, 212, 0.32], water: [150, 166, 212, 0.38], deep: 0.25, refl: 0.38,
      haze: [222, 226, 246, 0.16], fog: 0.12, shafts: [255, 240, 222, 0.22], vig: [70, 80, 112, 0.22], glow: 0.1 },
    midday: { lift: [22, 34, 84, 0.2], cap: [255, 250, 226, 0.12], pop: 0.34,
      shadow: [40, 60, 132, 0.4], rim: [255, 246, 204, 0.32], water: [40, 112, 232, 0.22], deep: 0.34, refl: 0.3,
      vig: [20, 30, 72, 0.22] },
    golden: { amb: [255, 224, 168, 0.3], lift: [28, 60, 76, 0.18], cap: [255, 236, 170, 0.24], tint: [255, 190, 110, 0.12], pop: 0.4,
      shadow: [42, 80, 104, 0.48], rim: [255, 214, 128, 0.5], water: [64, 142, 172, 0.3], deep: 0.32, refl: 0.35,
      shafts: [255, 214, 140, 0.26], motes: [255, 242, 192, 40], vig: [72, 40, 10, 0.32], glow: 0.15 },
    alpenglow: { amb: [255, 190, 204, 0.36], lift: [62, 30, 112, 0.24], cap: [255, 213, 144, 0.3], tint: [204, 90, 140, 0.14], pop: 0.4,
      shadow: [74, 42, 138, 0.52], rim: [255, 194, 122, 0.55], water: [204, 112, 172, 0.4], deep: 0.4, refl: 0.42,
      haze: [255, 110, 160, 0.2], vig: [60, 20, 90, 0.42], glow: 0.35 },
    storybook: { amb: [240, 202, 222, 0.34], lift: [40, 30, 92, 0.24], cap: [255, 224, 176, 0.24], tint: [160, 110, 150, 0.1], pop: 0.38,
      shadow: [58, 42, 122, 0.45], rim: [255, 208, 160, 0.45], water: [150, 112, 204, 0.4], deep: 0.45, refl: 0.4,
      haze: [240, 140, 170, 0.14], vig: [40, 20, 80, 0.42], glow: 0.55 },
    twilight: { amb: [168, 148, 228, 0.36], lift: [26, 18, 64, 0.28], cap: [240, 162, 202, 0.18], pop: 0.3,
      shadow: [26, 16, 64, 0.28], rim: [240, 144, 192, 0.3], water: [112, 82, 192, 0.48], deep: 0.5, refl: 0.5,
      haze: [240, 110, 170, 0.16], vig: [10, 5, 40, 0.46], glow: 0.9, motes: [255, 224, 128, 14] },
    night: { amb: [150, 172, 236, 0.28], lift: [10, 16, 42, 0.34], cap: [194, 216, 255, 0.14], desat: 0.18,
      shadow: [5, 8, 26, 0.36], rim: [184, 208, 255, 0.34], water: [52, 82, 162, 0.48], deep: 0.5, refl: 0.45,
      vig: [0, 0, 20, 0.5], glow: 1, motes: [216, 255, 112, 30] },
    storm: { amb: [192, 202, 218, 0.5], lift: [20, 28, 46, 0.34], cap: [230, 236, 242, 0.2], desat: 0.25, pop: 0.32,
      shadow: [20, 28, 48, 0.18], rim: [255, 240, 192, 0.18], water: [72, 86, 106, 0.45], deep: 0.45, refl: 0.3,
      clouds: [16, 24, 40, 0.42], fog: 0.14, shafts: [255, 240, 200, 0.1], vig: [5, 10, 20, 0.48], glow: 0.3 },
    stormDusk: { amb: [150, 140, 182, 0.5], lift: [22, 20, 50, 0.36], cap: [210, 200, 230, 0.2], desat: 0.22, pop: 0.25,
      shadow: [20, 18, 44, 0.16], rim: [220, 190, 230, 0.16], water: [70, 70, 120, 0.48], deep: 0.48, refl: 0.32,
      clouds: [14, 16, 34, 0.38], fog: 0.18, vig: [8, 6, 24, 0.5], glow: 0.7 },
    ember: { amb: [255, 192, 142, 0.4], lift: [44, 16, 48, 0.24], cap: [255, 224, 160, 0.3], tint: [204, 100, 60, 0.14], pop: 0.4,
      shadow: [74, 26, 74, 0.5], rim: [255, 168, 96, 0.55], water: [222, 132, 92, 0.34], deep: 0.4, refl: 0.38,
      haze: [255, 140, 80, 0.16], motes: [255, 176, 96, 36], vig: [50, 10, 30, 0.42], glow: 0.35 },
    snowDay: { amb: [226, 236, 255, 0.38], lift: [62, 72, 112, 0.3], cap: [250, 250, 255, 0.1], desat: 0.14, pop: 0.22,
      shadow: [80, 100, 160, 0.3], rim: [255, 255, 255, 0.24], water: [162, 192, 232, 0.4], deep: 0.3, refl: 0.35,
      haze: [230, 236, 250, 0.18], fog: 0.14, vig: [60, 70, 100, 0.28], glow: 0.15 }
  };

  /* keyframes: [minute of day, look] */
  function schedule(weather, season) {
    if (weather === "Rain") return [[360, "stormDusk"], [450, "storm"], [1080, "storm"], [1150, "stormDusk"], [1260, "night"], [1440, "night"]];
    if (weather === "Snow") return [[360, "dawnMist"], [480, "snowDay"], [1050, "snowDay"], [1120, "storybook"], [1200, "twilight"], [1290, "night"], [1440, "night"]];
    const eve = season === "Autumn" || (weather === "Breezy" && season !== "Spring") ? "ember" : "alpenglow";
    return [[360, "dawnMist"], [470, "midday"], [1000, "midday"], [1060, "golden"], [1120, eve], [1172, "storybook"], [1228, "twilight"], [1300, "night"], [1440, "night"]];
  }

  const NUMS = ["desat", "pop", "deep", "refl", "fog", "glow"];
  const ARRS = ["amb", "lift", "cap", "tint", "shadow", "rim", "water", "haze", "shafts", "vig", "clouds"];
  const ZERO4 = [0, 0, 0, 0];

  function mix(A, B, t) {
    const o = {};
    NUMS.forEach((k) => { o[k] = (A[k] || 0) + ((B[k] || 0) - (A[k] || 0)) * t; });
    ARRS.forEach((k) => {
      const a = A[k] || (B[k] ? [B[k][0], B[k][1], B[k][2], 0] : ZERO4), b = B[k] || (A[k] ? [A[k][0], A[k][1], A[k][2], 0] : ZERO4);
      o[k] = [0, 1, 2, 3].map((i) => a[i] + (b[i] - a[i]) * t);
    });
    const ma = A.motes, mb = B.motes;
    o.motes = t < 0.5 ? (ma ? [ma[0], ma[1], ma[2], ma[3] * (1 - t * 2)] : null) : (mb ? [mb[0], mb[1], mb[2], mb[3] * (t * 2 - 1)] : null);
    return o;
  }

  let cache = { key: "", P: null };
  function at(state) {
    const min = state.timeMin == null ? 600 : state.timeMin, weather = state.weather || "Sunny", season = state.season || "Spring";
    const key = Math.round(min) + "|" + weather + "|" + season;
    if (cache.key === key) return cache.P;
    const S = schedule(weather, season), m = Math.max(S[0][0], Math.min(1440, min));
    let i = 0; while (i < S.length - 2 && m > S[i + 1][0]) i++;
    const t = Math.max(0, Math.min(1, (m - S[i][0]) / Math.max(1, S[i + 1][0] - S[i][0])));
    // ease so each look holds a little before handing over
    const P = mix(LOOK[S[i][1]], LOOK[S[i + 1][1]], t * t * (3 - 2 * t));
    if (weather === "Breezy") P.clouds = [24, 34, 70, Math.max(P.clouds[3], 0.22)];
    if (season === "Winter" || weather === "Snow" || season === "Autumn") { if (P.motes && P.motes[1] > 240) P.motes = null; }   // no fireflies in the cold
    // sun (or moon) direction: shadows fall west in the morning, east in the evening, short at noon
    const night = m >= 1250;
    const s = Math.max(0, Math.min(1, (m - 360) / 880)), u = (s - 0.5) * 2;
    P.sdx = night ? -0.55 : u * 1.25;
    P.sdy = night ? 0.28 : 0.2 + 0.28 * (1 - Math.abs(u));
    P.lx = P.sdx > 0.05 ? -1 : 1;   // edge light on the side facing the light
    cache = { key, P };
    return P;
  }

  /* ------------------------------------------------------------------ helpers */
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return c; };
  const rgba = (c, a) => "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + (a == null ? c[3] : a).toFixed(3) + ")";
  const isWater = (tx, ty) => tx >= 0 && ty >= 0 && tx < W && ty < H && M.tiles[ty * W + tx] === TYPE.WATER;

  const silCache = new WeakMap();
  function silhouette(cv) {
    let s = silCache.get(cv);
    if (s) return s;
    s = mk(cv.width, cv.height);
    const x = s.getContext("2d");
    x.drawImage(cv, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#000"; x.fillRect(0, 0, cv.width, cv.height);
    silCache.set(cv, s);
    return s;
  }

  /* white mask of the outer edge pixels facing the light (2px, fading), cached per sprite + side */
  const rimCache = new WeakMap();
  function rimMask(cv, lx) {
    let per = rimCache.get(cv);
    if (!per) { per = {}; rimCache.set(cv, per); }
    if (per[lx]) return per[lx];
    const w = cv.width, h = cv.height, out = mk(w, h);
    try {
      const d = cv.getContext("2d").getImageData(0, 0, w, h).data, a = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 150 ? 1 : 0;
      const ox = out.getContext("2d"), img = ox.createImageData(w, h), q = img.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!a[i]) continue;
        let k = 0;
        for (let s = 1; s <= 2; s++) {
          const xx = x + lx * s, yy = y - s;
          if (xx < 0 || yy < 0 || xx >= w || !a[yy * w + xx]) { k = s === 1 ? 255 : 120; break; }
        }
        if (k) { const j = i * 4; q[j] = q[j + 1] = q[j + 2] = 255; q[j + 3] = k; }
      }
      ox.putImageData(img, 0, 0);
    } catch (e) { /* unreadable canvas: no rim */ }
    per[lx] = out;
    return out;
  }
  // tinting a white mask: draw it into a scratch canvas, then colour it with source-in
  let scratch = null;
  function tinted(mask, col) {
    if (!scratch || scratch.width < mask.width || scratch.height < mask.height) scratch = mk(Math.max(mask.width, scratch ? scratch.width : 0), Math.max(mask.height, scratch ? scratch.height : 0));
    const x = scratch.getContext("2d");
    x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, mask.width, mask.height);
    x.drawImage(mask, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, mask.width, mask.height);
    return scratch;
  }

  /* ------------------------------------------------------------------ world-space passes */

  /* items: [{cv, x, y, w, h, base}] in world px. Merged into one layer so overlapping shadows don't stack. */
  let shadowCv = null;
  function castShadows(ctx, items, cam, vw, vh, P) {
    const c = P.shadow; if (!c || c[3] < 0.02) return;
    const w = Math.ceil(vw), h = Math.ceil(vh);
    if (!shadowCv || shadowCv.width !== w || shadowCv.height !== h) shadowCv = mk(w, h);
    const o = shadowCv.getContext("2d");
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "source-over"; o.clearRect(0, 0, w, h);
    items.forEach((it) => {
      o.setTransform(1, 0, -P.sdx, -P.sdy, -cam.x, it.base - cam.y);   // u = world x, v = y - base
      o.drawImage(silhouette(it.cv), it.x, it.y - it.base, it.w || it.cv.width, it.h || it.cv.height);
    });
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.globalCompositeOperation = "source-in"; o.fillStyle = rgba(c, 1); o.fillRect(0, 0, w, h);
    ctx.save(); ctx.globalAlpha = c[3]; ctx.globalCompositeOperation = "multiply"; ctx.drawImage(shadowCv, cam.x, cam.y); ctx.restore();
  }

  function clipWater(ctx, cam, vw, vh) {
    const x0 = Math.max(0, Math.floor(cam.x / T)), x1 = Math.min(W - 1, Math.floor((cam.x + vw) / T));
    const y0 = Math.max(0, Math.floor(cam.y / T)), y1 = Math.min(H - 1, Math.floor((cam.y + vh) / T));
    let any = false;
    ctx.beginPath();
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isWater(tx, ty)) { ctx.rect(tx * T, ty * T, T, T); any = true; }
    if (any) ctx.clip();
    return any;
  }

  /* depth map at 8px cells: darker toward mid-stream, in stepped bands */
  let depthCv = null;
  function depth() {
    if (depthCv) return depthCv;
    const S = 4, cw = W * S, ch = H * S, dist = new Float32Array(cw * ch).fill(1e9), q = [];
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (!isWater((x / S) | 0, (y / S) | 0)) { dist[y * cw + x] = 0; q.push(y * cw + x); }
    for (let qi = 0; qi < q.length; qi++) {
      const i = q[qi], x = i % cw, y = (i / cw) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= cw || yy >= ch) return;
        const j = yy * cw + xx; if (dist[j] > dist[i] + 1) { dist[j] = dist[i] + 1; q.push(j); }
      });
    }
    depthCv = mk(cw, ch);
    const x = depthCv.getContext("2d"), img = x.createImageData(cw, ch);
    for (let i = 0; i < cw * ch; i++) {
      if (!dist[i]) continue;
      const band = Math.min(4, Math.floor((dist[i] - 1) / 2)) / 4;
      img.data[i * 4 + 3] = Math.round(band * 255);
    }
    x.putImageData(img, 0, 0);
    return depthCv;
  }

  function water(ctx, cam, vw, vh, P, tick) {
    if (!P.water || (P.water[3] < 0.02 && P.deep < 0.02)) return;
    ctx.save();
    if (!clipWater(ctx, cam, vw, vh)) { ctx.restore(); return; }
    ctx.globalCompositeOperation = "color"; ctx.fillStyle = rgba(P.water); ctx.fillRect(cam.x, cam.y, vw, vh);
    ctx.globalCompositeOperation = "source-over";
    if (P.deep > 0.02) {
      const d = depth();
      ctx.globalAlpha = P.deep;
      const sx = Math.max(0, Math.floor(cam.x / 8)), sy = Math.max(0, Math.floor(cam.y / 8));
      const sw = Math.min(d.width - sx, Math.ceil(vw / 8) + 2), sh = Math.min(d.height - sy, Math.ceil(vh / 8) + 2);
      if (sw > 0 && sh > 0) ctx.drawImage(d, sx, sy, sw, sh, sx * 8, sy * 8, sw * 8, sh * 8);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function reflections(ctx, items, cam, vw, vh, P) {
    if (P.refl < 0.02) return;
    const near = items.filter((it) => {
      const tx = Math.floor((it.x + (it.w || it.cv.width) / 2) / T), ty = Math.floor(it.base / T);
      for (let dy = 0; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (isWater(tx + dx, ty + dy)) return true;
      return false;
    });
    if (!near.length) return;
    ctx.save();
    if (!clipWater(ctx, cam, vw, vh)) { ctx.restore(); return; }
    ctx.globalAlpha = P.refl;
    near.forEach((it) => {
      ctx.save(); ctx.translate(0, it.base * 2 + 2); ctx.scale(1, -1);
      ctx.drawImage(it.cv, it.x, it.y, it.w || it.cv.width, it.h || it.cv.height);
      ctx.restore();
    });
    // the reflection takes on the water colour
    if (P.water) { ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = "color"; ctx.fillStyle = rgba(P.water, 1); ctx.fillRect(cam.x, cam.y, vw, vh); }
    ctx.restore();
  }

  function rim(ctx, cv, x, y, P, w, h) {
    const c = P.rim; if (!c || c[3] < 0.02) return;
    const m = rimMask(cv, P.lx);
    ctx.save(); ctx.globalAlpha = c[3];
    ctx.drawImage(tinted(m, rgba(c, 1)), 0, 0, m.width, m.height, x, y, w || m.width, h || m.height);
    ctx.restore();
  }

  /* tileable chunky noise, used for cloud shadows and fog banks */
  let noiseCv = null;
  function noise() {
    if (noiseCv) return noiseCv;
    const N = 24, g = new Float32Array(N * N);
    let s = 9137;
    const r = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
    for (let i = 0; i < N * N; i++) g[i] = r();
    const val = (x, y) => g[(((y % N) + N) % N) * N + (((x % N) + N) % N)];
    const smooth = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = val(xi, yi) + (val(xi + 1, yi) - val(xi, yi)) * sx, b = val(xi, yi + 1) + (val(xi + 1, yi + 1) - val(xi, yi + 1)) * sx;
      return a + (b - a) * sy;
    };
    const P = 96;   // 96 cells of 4px = 384px tile
    noiseCv = mk(P, P);
    const x = noiseCv.getContext("2d"), img = x.createImageData(P, P);
    for (let yy = 0; yy < P; yy++) for (let xx = 0; xx < P; xx++) {
      const u = (xx / P) * N, v = (yy / P) * N;
      let n = smooth(u / 4, v / 4) * 0.6 + smooth(u / 2, v / 2) * 0.3 + smooth(u, v) * 0.1;
      n = Math.max(0, Math.min(1, (n - 0.45) * 3.2));
      img.data[(yy * P + xx) * 4 + 3] = Math.round(Math.round(n * 4) / 4 * 255);   // 4 stepped levels: pixel-art edges
    }
    x.putImageData(img, 0, 0);
    return noiseCv;
  }
  const patCache = {};
  function pattern(ctx, col) {
    const k = col;
    if (patCache[k]) return patCache[k];
    const n = noise(), big = mk(n.width * 4, n.height * 4), x = big.getContext("2d");
    x.drawImage(n, 0, 0, big.width, big.height); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, big.width, big.height);
    return (patCache[k] = ctx.createPattern(big, "repeat"));
  }

  function sky(ctx, cam, vw, vh, P, tick) {
    // cloud shadows drift with the wind and fall on everything, roofs included
    if (P.clouds && P.clouds[3] > 0.02) {
      const col = rgba(P.clouds, 1), off = (tick * 0.35) % 384;
      ctx.save(); ctx.globalAlpha = P.clouds[3]; ctx.globalCompositeOperation = "multiply";
      ctx.translate(Math.floor(off), Math.floor(off * 0.4)); ctx.fillStyle = pattern(ctx, col);
      ctx.fillRect(cam.x - off - 4, cam.y - off * 0.4 - 4, vw + 8, vh + 8);
      ctx.restore();
    }
    if (P.fog > 0.02) {
      const off = (tick * 0.12) % 384;
      ctx.save(); ctx.globalAlpha = P.fog; ctx.globalCompositeOperation = "screen";
      ctx.translate(-Math.floor(off), Math.floor(off * 0.2)); ctx.fillStyle = pattern(ctx, "rgb(214,220,236)");
      ctx.fillRect(cam.x + off - 4, cam.y - off * 0.2 - 4, vw + 8, vh + 8);
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ screen-space grade */
  const fill = (ctx, op, c, w, h) => { if (!c || c[3] < 0.01) return; ctx.globalCompositeOperation = op; ctx.fillStyle = rgba(c); ctx.fillRect(0, 0, w, h); };

  let popOk = true, popCost = 0, popFrames = 0;
  function grade(ctx, w, h, P, tick) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // contrast/saturation "pop" (the frame blended onto itself). On slow devices this copy is the
    // expensive part, so it switches itself off if it keeps taking too long.
    if (P.pop > 0.01 && popOk) {
      const t0 = performance.now();
      ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = P.pop; ctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, w, h); ctx.globalAlpha = 1;
      popCost = popCost * 0.95 + (performance.now() - t0) * 0.05;
      if (++popFrames > 60 && popCost > 6) popOk = false;
    }
    if (P.desat > 0.01) { ctx.globalCompositeOperation = "saturation"; ctx.fillStyle = "rgba(128,128,128," + P.desat.toFixed(3) + ")"; ctx.fillRect(0, 0, w, h); }
    fill(ctx, "multiply", P.amb, w, h);
    fill(ctx, "lighten", P.lift, w, h);     // darks drift toward the shadow hue
    fill(ctx, "darken", P.cap, w, h);       // lights drift toward the highlight hue
    fill(ctx, "soft-light", P.tint, w, h);
    if (P.haze && P.haze[3] > 0.01) {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba(P.haze)); g.addColorStop(0.62, rgba(P.haze, 0));
      ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    if (P.shafts && P.shafts[3] > 0.01) {
      ctx.globalCompositeOperation = "screen";
      const slant = P.sdx > 0 ? -0.55 : 0.55, drift = Math.sin(tick * 0.004) * 18;
      ctx.translate(drift + (slant > 0 ? -h * 0.3 : w * 0.15), 0); ctx.transform(1, 0, slant, 1, 0, 0);
      [[40, 34], [130, 16], [210, 52], [360, 22], [430, 38], [600, 18], [700, 30]].forEach(([x, bw], i) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, rgba(P.shafts, P.shafts[3] * (0.7 + 0.3 * Math.sin(tick * 0.01 + i)))); g.addColorStop(1, rgba(P.shafts, 0));
        ctx.fillStyle = g; ctx.fillRect(x, 0, bw, h);
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (P.vig && P.vig[3] > 0.01) {
      const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.38, w / 2, h / 2, w * 0.66);
      g.addColorStop(0, rgba(P.vig, 0)); g.addColorStop(1, rgba(P.vig));
      ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  /* floating motes: pollen, embers, fireflies. Anchored to the world so they don't slide with the camera. */
  function motes(ctx, w, h, cam, P, tick) {
    const m = P.motes; if (!m || m[3] < 1) return;
    const n = Math.round(m[3]), wrap = (v, k) => ((v % k) + k) % k;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const sx = (i * 7919) % 997 / 997, sy = (i * 104729) % 991 / 991, ph = i * 1.7;
      const x = Math.round(wrap(sx * w * 1.3 - cam.x + Math.sin(tick * 0.012 + ph) * 14 + tick * 0.08, w));
      const y = Math.round(wrap(sy * h * 1.3 - cam.y + Math.cos(tick * 0.01 + ph) * 10 - tick * 0.05, h));
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(tick * 0.03 + ph * 3));
      ctx.fillStyle = rgba(m, a); ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = rgba(m, a * 0.3); ctx.fillRect(x - 2, y, 6, 2); ctx.fillRect(x, y - 2, 2, 6);
    }
    ctx.restore();
  }

  /* warm window panes + light pools before full dark (drawLighting takes over once night falls) */
  function glow(ctx, panes, cam, P) {
    const g = P.glow; if (g < 0.03) return;
    ctx.save();
    panes.forEach((p) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(255,206,120," + Math.min(0.85, g * 0.9).toFixed(2) + ")"; ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
      ctx.fillStyle = "rgba(255,244,205," + Math.min(0.8, g * 0.8).toFixed(2) + ")"; ctx.fillRect(p.x + 3, p.y + 3, Math.max(2, p.w - 6), 2);
      ctx.globalCompositeOperation = "lighter";
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2, r = 14 + 16 * g;
      const gr = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      gr.addColorStop(0, "rgba(255,180,90," + (0.22 * g).toFixed(3) + ")"); gr.addColorStop(1, "rgba(255,180,90,0)");
      ctx.fillStyle = gr; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    });
    ctx.restore();
  }

  return { at, castShadows, water, reflections, rim, sky, grade, motes, glow, LOOK, schedule };
})();
