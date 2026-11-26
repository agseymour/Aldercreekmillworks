window.ACM = window.ACM || {};

ACM.CloudSync = (function () {
  // PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL BELOW:
  const APPS_SCRIPT_URL = "";

  const LOCAL_PREFIX = "acm_save_v1_";

  function saveLocal(state) {
    try {
      const key = `${LOCAL_PREFIX}${state.classCode}_${state.shopName}`.toLowerCase();
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      // Ignore storage quota issues on restricted guest profiles
    }
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
    if (!APPS_SCRIPT_URL) {
      return { ok: true, mode: "local" };
    }

    try {
      const payload = {
        action: "save",
        classCode: state.classCode,
        shopName: state.shopName,
        pin: state.pin,
        stars: Number(state.stars.toFixed(2)),
        cash: Math.round(state.cash),
        act: state.currentAct,
        legacyTitle: state.legacyTitle || "Apprentice",
        completedJobs: state.completedProjectIds.length,
        saveJson: JSON.stringify(state)
      };

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { ok: false, mode: "offline", error: err.message };
    }
  }

  async function loadFromCloud(classCode, shopName, pin) {
    const local = loadLocal(classCode, shopName);
    if (!APPS_SCRIPT_URL) {
      if (local && (!local.pin || local.pin === pin)) return local;
      return null;
    }

    try {
      const url = `${APPS_SCRIPT_URL}?action=load&classCode=${encodeURIComponent(classCode)}&shopName=${encodeURIComponent(shopName)}&pin=${encodeURIComponent(pin)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.ok && data.saveJson) {
        const parsed = JSON.parse(data.saveJson);
        saveLocal(parsed);
        return parsed;
      }
    } catch (err) {
      // Fallback to local cache if offline
    }
    if (local && (!local.pin || local.pin === pin)) return local;
    return null;
  }

  async function fetchLeaderboard(classCode) {
    if (!APPS_SCRIPT_URL) {
      // Gather any local profiles from this browser for preview/testing
      const rows = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_PREFIX)) {
          try {
            const s = JSON.parse(localStorage.getItem(k));
            if (!classCode || s.classCode === classCode) {
              rows.push({
                shopName: s.shopName,
                stars: Number(s.stars.toFixed(2)),
                cash: Math.round(s.cash),
                act: s.currentAct,
                legacyTitle: s.legacyTitle || "Apprentice"
              });
            }
          } catch (e) {}
        }
      }
      return rows.sort((a, b) => b.stars - a.stars || b.cash - a.cash);
    }

    try {
      const url = `${APPS_SCRIPT_URL}?action=leaderboard&classCode=${encodeURIComponent(classCode)}`;
      const res = await fetch(url);
      const data = await res.json();
      return data && data.rows ? data.rows : [];
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
