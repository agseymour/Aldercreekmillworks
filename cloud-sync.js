window.ACM = window.ACM || {};

ACM.CloudSync = (function () {
  // PASTE YOUR SUPABASE PROJECT URL & ANON PUBLIC KEY BELOW:
  const RAW_SUPABASE_URL = "https://zifhqglitwbqfsomdndv.supabase.co"; // e.g., "https://abcdefghijklm.supabase.co"
  const RAW_SUPABASE_ANON_KEY = "zifhqglitwbqfsomdndv"; // e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  const SUPABASE_URL = RAW_SUPABASE_URL.trim().replace(/\/+$/, "");
  const SUPABASE_ANON_KEY = RAW_SUPABASE_ANON_KEY.trim();
  const LOCAL_PREFIX = "acm_save_v1_";

  function isConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
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
      localStorage.setItem(key, JSON.stringify(state));
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
      if (checkRes.ok) {
        const existingRows = await checkRes.json();
        if (existingRows.length > 0 && existingRows[0].pin && existingRows[0].pin !== pin) {
          return { ok: false, error: "That Workshop Name is already taken with a different 4-digit PIN." };
        }
      }

      const row = {
        class_code: classCode,
        shop_name: shopName,
        pin: pin,
        stars: Number(state.stars.toFixed(2)),
        cash: Math.round(state.cash),
        act: Number(state.currentAct) || 1,
        legacy_title: state.legacyTitle || "Apprentice Woodworker",
        save_json: JSON.stringify(state),
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

    if (!isConfigured()) {
      if (local && (!local.pin || local.pin === cleanPin)) return { state: local };
      return { state: null };
    }

    try {
      const url = `${SUPABASE_URL}/rest/v1/acm_saves?class_code=eq.${encodeURIComponent(cleanCode)}&shop_name=eq.${encodeURIComponent(cleanName)}&select=pin,save_json`;
      const res = await fetchWithTimeout(url, { headers: headers() });
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0) {
          if (rows[0].pin && rows[0].pin !== cleanPin) {
            return { error: "Incorrect 4-digit PIN for that existing Workshop Name." };
          }
          const parsed = JSON.parse(rows[0].save_json);
          saveLocal(parsed);
          return { state: parsed };
        }
      }
    } catch (err) {
      // Fall back to local cache if network times out
    }

    if (local && (!local.pin || local.pin === cleanPin)) return { state: local };
    return { state: null };
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

  return {
    saveToCloud,
    loadFromCloud,
    fetchLeaderboard
  };
})();
