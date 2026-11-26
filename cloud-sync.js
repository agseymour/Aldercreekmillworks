window.ACM = window.ACM || {};

ACM.CloudSync = (function () {
  // PASTE YOUR SUPABASE PROJECT URL & ANON PUBLIC KEY BELOW:
  const SUPABASE_URL = "https://zifhqglitwbqfsomdndv.supabase.co"; // e.g., "https://abcdefghijklm.supabase.co"
  const SUPABASE_ANON_KEY = "zifhqglitwbqfsomdndv"; // e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  const LOCAL_PREFIX = "acm_save_v1_";

  function isConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  function headers(extra = {}) {
    return Object.assign(
      {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      extra
    );
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
      // 1. Check if this Shop Name already exists with a different PIN
      const checkUrl = `${SUPABASE_URL}/rest/v1/acm_saves?class_code=eq.${encodeURIComponent(classCode)}&shop_name=eq.${encodeURIComponent(shopName)}&select=pin`;
      const checkRes = await fetch(checkUrl, { headers: headers() });
      if (checkRes.ok) {
        const existingRows = await checkRes.json();
        if (existingRows.length > 0 && existingRows[0].pin && existingRows[0].pin !== pin) {
          if (ACM.Game && ACM.Game.toast) {
            ACM.Game.toast("That Workshop Name is already taken with a different PIN!", "bad");
          }
          return { ok: false, error: "PIN mismatch" };
        }
      }

      // 2. Upsert student save & leaderboard stats
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
      const res = await fetch(upsertUrl, {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates" }),
        body: JSON.stringify(row)
      });

      return { ok: res.ok, mode: "cloud" };
    } catch (err) {
      return { ok: false, mode: "offline", error: err.message };
    }
  }

  async function loadFromCloud(classCode, shopName, pin) {
    const cleanCode = String(classCode || "").toUpperCase().trim();
    const cleanName = String(shopName || "").trim();
    const cleanPin = String(pin || "").trim();
    const local = loadLocal(cleanCode, cleanName);

    if (!isConfigured()) {
      if (local && (!local.pin || local.pin === cleanPin)) return local;
      return null;
    }

    try {
      const url = `${SUPABASE_URL}/rest/v1/acm_saves?class_code=eq.${encodeURIComponent(cleanCode)}&shop_name=eq.${encodeURIComponent(cleanName)}&select=pin,save_json`;
      const res = await fetch(url, { headers: headers() });
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0) {
          if (rows[0].pin && rows[0].pin !== cleanPin) {
            if (ACM.Game && ACM.Game.toast) {
              ACM.Game.toast("Incorrect 4-digit PIN for that Workshop Name.", "bad");
            }
            return null;
          }
          const parsed = JSON.parse(rows[0].save_json);
          saveLocal(parsed);
          return parsed;
        }
      }
    } catch (err) {
      // Fallback to local cache if offline
    }

    if (local && (!local.pin || local.pin === cleanPin)) return local;
    return null;
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
      const res = await fetch(url, { headers: headers() });
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
