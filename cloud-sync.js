window.ACM = window.ACM || {};

ACM.CloudSync = (function () {
  // PASTE YOUR SUPABASE PROJECT URL & ANON PUBLIC KEY BELOW:
  const RAW_SUPABASE_URL = "https://zifhqglitwbqfsomdndv.supabase.co"; // e.g., "https://abcdefghijklm.supabase.co"
  const RAW_SUPABASE_ANON_KEY = "sb_publishable_ZnYAXhon3E0dDpH3BM7wQQ_W1BVBHbb"; // e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  const SUPABASE_URL = RAW_SUPABASE_URL.trim().replace(/\/+$/, "");
  const SUPABASE_ANON_KEY = RAW_SUPABASE_ANON_KEY.trim();
  const LOCAL_PREFIX = "acm_save_v1_";

  // Real Supabase keys are either a legacy JWT ("eyJ...") or a publishable key ("sb_publishable_...").
  // Anything else (e.g. the project ref pasted by mistake) can only ever produce HTTP 401, so treat it as "not set up".
  const KEY_LOOKS_VALID = /^(eyJ|sb_publishable_)/.test(SUPABASE_ANON_KEY);
  if (SUPABASE_ANON_KEY && !KEY_LOOKS_VALID) {
    console.warn(
      "[CloudSync] RAW_SUPABASE_ANON_KEY doesn't look like a Supabase key (expected 'eyJ...' or 'sb_publishable_...'). " +
        "Cloud sync is disabled; saves stay on this device. Copy the key from Supabase > Project Settings > API."
    );
  }

  // Workshops this browser has confirmed against the server (loaded them, or created them).
  // Used so a blank/offline game can never silently overwrite an existing cloud save.
  const confirmedRemote = new Set();

  // ---- PIN hashing (tiny sync SHA-256, so it also works from file:// where crypto.subtle is missing) ----
  function sha256(str) {
    const K = [], H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (let i = 2, n = 0; n < 64; i++) { let p = true; for (let j = 2; j * j <= i; j++) if (i % j === 0) { p = false; break; } if (p) K[n++] = (Math.pow(i, 1 / 3) * 4294967296) | 0; }
    const b = unescape(encodeURIComponent(str)); const l = b.length * 8; const w = [];
    for (let i = 0; i < b.length; i++) w[i >> 2] = (w[i >> 2] || 0) | (b.charCodeAt(i) << (24 - (i % 4) * 8));
    w[l >> 5] = (w[l >> 5] || 0) | (0x80 << (24 - (l % 32))); w[(((l + 64) >> 9) << 4) + 15] = l;
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < w.length; i += 16) {
      const a = w.slice(i, i + 16).map((x) => x | 0), t = H.slice(); const m = [];
      for (let j = 0; j < 64; j++) {
        if (j < 16) m[j] = a[j] | 0; else { const s0 = rr(m[j - 15], 7) ^ rr(m[j - 15], 18) ^ (m[j - 15] >>> 3), s1 = rr(m[j - 2], 17) ^ rr(m[j - 2], 19) ^ (m[j - 2] >>> 10); m[j] = (m[j - 16] + s0 + m[j - 7] + s1) | 0; }
        const S1 = rr(t[4], 6) ^ rr(t[4], 11) ^ rr(t[4], 25), ch = (t[4] & t[5]) ^ (~t[4] & t[6]), t1 = (t[7] + S1 + ch + K[j] + m[j]) | 0;
        const S0 = rr(t[0], 2) ^ rr(t[0], 13) ^ rr(t[0], 22), mj = (t[0] & t[1]) ^ (t[0] & t[2]) ^ (t[1] & t[2]), t2 = (S0 + mj) | 0;
        t.pop(); t.unshift((t1 + t2) | 0); t[4] = (t[4] + t1) | 0;
      }
      for (let j = 0; j < 8; j++) H[j] = (H[j] + t[j]) | 0;
    }
    return H.map((x) => ("00000000" + (x >>> 0).toString(16)).slice(-8)).join("");
  }
  const HASH_TAG = "h1:";
  function hashPin(pin, classCode, shopName) {
    return HASH_TAG + sha256(`acm|${String(classCode).toUpperCase().trim()}|${String(shopName).trim().toLowerCase()}|${String(pin).trim()}`);
  }
  // true when `stored` (hashed, or an old plaintext PIN) matches the PIN the student typed
  function pinMatches(stored, pin, classCode, shopName) {
    if (!stored) return true;
    return stored.startsWith(HASH_TAG) ? stored === hashPin(pin, classCode, shopName) : stored === String(pin).trim();
  }
  // copy of the save that is safe to store: PIN replaced by its hash
  function sanitized(state) {
    const c = Object.assign({}, state);
    c.pin = state.pin ? hashPin(state.pin, state.classCode, state.shopName) : "";
    return c;
  }

  function isConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && KEY_LOOKS_VALID);
  }

function headers(extra = {}) {
    const base = {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    };
    // Only include Authorization Bearer if using a legacy JWT key ("eyJ...")
    if (SUPABASE_ANON_KEY.startsWith("eyJ")) {
      base.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    }
    return Object.assign(base, extra);
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  function saveLocal(state) {
    try {
      const key = `${LOCAL_PREFIX}${state.classCode}_${state.shopName}`.toLowerCase();
      localStorage.setItem(key, JSON.stringify(sanitized(state)));
    } catch (e) {}
  }

  function loadLocal(classCode, shopName) {
    try {
      const key = `${LOCAL_PREFIX}${classCode}_${shopName}`.toLowerCase();
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async function saveToCloud(state) {
    saveLocal(state);
    if (!isConfigured()) {
      return { ok: true, mode: "local" };
    }

    const classCode = String(state.classCode || "PRODTECH11").toUpperCase().trim();
    const shopName = String(state.shopName || "Alder Creek Shop").trim();
    const pin = String(state.pin || "0000").trim();

    try {
      const checkUrl = `${SUPABASE_URL}/rest/v1/acm_saves?class_code=eq.${encodeURIComponent(classCode)}&shop_name=eq.${encodeURIComponent(shopName)}&select=pin`;
      const checkRes = await fetchWithTimeout(checkUrl, { headers: headers() });
      if (!checkRes.ok) {
        // Can't verify what's on the server, so don't risk overwriting it. The local copy is already saved.
        return { ok: true, mode: "local", warning: `Couldn't verify cloud save (HTTP ${checkRes.status})` };
      }
      const existingRows = await checkRes.json();
      if (existingRows.length > 0) {
        if (!pinMatches(existingRows[0].pin, pin, classCode, shopName)) {
          return { ok: false, error: "That Workshop Name is already taken with a different 4-digit PIN." };
        }
        if (!confirmedRemote.has(`${classCode}|${shopName}`)) {
          return {
            ok: false,
            mode: "local",
            error: "A cloud save already exists for this workshop. Reload the page and sign in again to resume it instead of overwriting it."
          };
        }
      }

      const row = {
        class_code: classCode,
        shop_name: shopName,
        pin: hashPin(pin, classCode, shopName),
        stars: Number(state.stars.toFixed(2)),
        cash: Math.round(state.cash),
        act: Number(state.currentAct) || 1,
        legacy_title: state.legacyTitle || "Apprentice Woodworker",
        save_json: JSON.stringify(sanitized(state)),
        updated_at: new Date().toISOString()
      };

      const upsertUrl = `${SUPABASE_URL}/rest/v1/acm_saves?on_conflict=class_code,shop_name`;
      const res = await fetchWithTimeout(upsertUrl, {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates" }),
        body: JSON.stringify(row)
      });

      if (!res.ok) {
        return { ok: false, mode: "local", error: `Cloud sync returned HTTP ${res.status}` };
      }
      confirmedRemote.add(`${classCode}|${shopName}`);
      return { ok: true, mode: "cloud" };
    } catch (err) {
      return { ok: true, mode: "local", warning: err.message };
    }
  }

  async function loadFromCloud(classCode, shopName, pin) {
    const cleanCode = String(classCode || "").toUpperCase().trim();
    const cleanName = String(shopName || "").trim();
    const cleanPin = String(pin || "").trim();
    const local = loadLocal(cleanCode, cleanName);
    const wrongPin = { error: "Incorrect 4-digit PIN for that existing Workshop Name." };
    let reachable = !isConfigured(); // local-only mode has nothing to be "unreachable"

    if (isConfigured()) {
      try {
        const url = `${SUPABASE_URL}/rest/v1/acm_saves?class_code=eq.${encodeURIComponent(cleanCode)}&shop_name=eq.${encodeURIComponent(cleanName)}&select=pin,save_json`;
        const res = await fetchWithTimeout(url, { headers: headers() });
        if (res.ok) {
          reachable = true;
          const rows = await res.json();
          if (rows.length > 0) {
            if (!pinMatches(rows[0].pin, cleanPin, cleanCode, cleanName)) return wrongPin;
            const parsed = JSON.parse(rows[0].save_json);
            parsed.pin = cleanPin;
            saveLocal(parsed);
            confirmedRemote.add(`${cleanCode}|${cleanName}`);
            return { state: parsed };
          }
        }
      } catch (err) {
        // Fall back to local cache if network times out
      }
    }

    if (local) {
      // A save exists on this device: only hand it over with the right PIN.
      // (Previously a wrong PIN returned "no save", which started a blank game that overwrote the real local save.)
      if (pinMatches(local.pin, cleanPin, cleanCode, cleanName)) { local.pin = cleanPin; return { state: local }; }
      return wrongPin;
    }
    return { state: null, unreachable: !reachable };
  }

  async function fetchLeaderboard(classCode) {
    const cleanCode = String(classCode || "").toUpperCase().trim();

    if (!isConfigured()) {
      const rows = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_PREFIX)) {
          try {
            const s = JSON.parse(localStorage.getItem(k));
            if (!cleanCode || s.classCode === cleanCode) {
              rows.push({
                shopName: s.shopName,
                stars: Number(s.stars.toFixed(2)),
                cash: Math.round(s.cash),
                act: s.currentAct,
                legacyTitle: s.legacyTitle || "Woodworker"
              });
            }
          } catch (e) {}
        }
      }
      return rows.sort((a, b) => b.stars - a.stars || b.cash - a.cash);
    }

    try {
      const filter = cleanCode ? `class_code=eq.${encodeURIComponent(cleanCode)}&` : "";
      const url = `${SUPABASE_URL}/rest/v1/acm_saves?${filter}select=shop_name,stars,cash,act,legacy_title&order=stars.desc,cash.desc`;
      const res = await fetchWithTimeout(url, { headers: headers() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((r) => ({
        shopName: r.shop_name,
        stars: Number(r.stars) || 1.0,
        cash: Number(r.cash) || 0,
        act: Number(r.act) || 1,
        legacyTitle: r.legacy_title || "Woodworker"
      }));
    } catch (err) {
      return [];
    }
  }


  // ---- Teacher access: class records. Teacher PIN is stored hashed in table acm_classes (class_code, teacher_hash). ----
  const teacherHash = (code, pin) => HASH_TAG + sha256(`acm-teacher|${String(code).toUpperCase().trim()}|${String(pin).trim()}`);

  function localSaves(classCode) {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LOCAL_PREFIX)) {
        try { const st = JSON.parse(localStorage.getItem(k)); if (!classCode || String(st.classCode).toUpperCase() === classCode) out.push(st); } catch (e) {}
      }
    }
    return out;
  }

  // returns {ok, mode, created?, error?}. First use of a class code claims it with the PIN given.
  async function teacherLogin(classCode, pin) {
    const code = String(classCode || "").toUpperCase().trim();
    if (!code || String(pin || "").trim().length < 4) return { ok: false, error: "Enter the class code and a teacher PIN (4+ characters)." };
    const h = teacherHash(code, pin);
    if (!isConfigured()) {
      const key = "acm_teacher_" + code;
      let have = null; try { have = localStorage.getItem(key); } catch (e) {}
      if (have) return have === h ? { ok: true, mode: "local" } : { ok: false, error: "Wrong teacher PIN for this class." };
      try { localStorage.setItem(key, h); } catch (e) {}
      return { ok: true, mode: "local", created: true };
    }
    try {
      const url = `${SUPABASE_URL}/rest/v1/acm_classes?class_code=eq.${encodeURIComponent(code)}&select=teacher_hash`;
      const res = await fetchWithTimeout(url, { headers: headers() });
      if (!res.ok) return { ok: false, error: `Couldn't reach the class table (HTTP ${res.status}).` };
      const rows = await res.json();
      if (rows.length) return rows[0].teacher_hash === h ? { ok: true, mode: "cloud" } : { ok: false, error: "Wrong teacher PIN for this class." };
      const ins = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/acm_classes`, { method: "POST", headers: headers({ Prefer: "return=minimal" }), body: JSON.stringify({ class_code: code, teacher_hash: h }) });
      return ins.ok ? { ok: true, mode: "cloud", created: true } : { ok: false, error: `Couldn't create the class (HTTP ${ins.status}).` };
    } catch (err) {
      return { ok: false, error: "Network problem: " + err.message };
    }
  }

  // full student saves (PIN never selected) for a class
  async function fetchClassSaves(classCode) {
    const code = String(classCode || "").toUpperCase().trim();
    const local = localSaves(code);
    if (!isConfigured()) return { saves: local, mode: "local" };
    try {
      const url = `${SUPABASE_URL}/rest/v1/acm_saves?class_code=eq.${encodeURIComponent(code)}&select=shop_name,updated_at,save_json&order=shop_name.asc`;
      const res = await fetchWithTimeout(url, { headers: headers() }, 12000);
      if (!res.ok) return { saves: local, mode: "local", warning: `Cloud returned HTTP ${res.status}` };
      const data = await res.json();
      const saves = data.map((r) => { try { const s = JSON.parse(r.save_json); s._updated = r.updated_at; delete s.pin; return s; } catch (e) { return null; } }).filter(Boolean);
      return { saves, mode: "cloud" };
    } catch (err) {
      return { saves: local, mode: "local", warning: err.message };
    }
  }

  return {
    teacherLogin,
    fetchClassSaves,
    saveToCloud,
    loadFromCloud,
    fetchLeaderboard
  };
})();
