window.ACM = window.ACM || {};

/**
 * Remembers recent workshops on this browser so students don't retype the class code and name every time.
 * Several students can share one lab computer, so it keeps a short list (most recent first), not just one.
 *
 * Stored per entry: class code, workshop name, appearance (for the preview), and, ONLY if the student ticked
 * "Keep me signed in", the PIN's salted hash. The PIN itself is never stored.
 */
ACM.LoginMemory = (function () {
  const KEY = "acm_recent_logins_v1";
  const MAX = 6;
  const same = (a, code, name) => a.code === String(code).toUpperCase().trim() && a.name.toLowerCase() === String(name).trim().toLowerCase();

  function list() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v.filter((e) => e && typeof e.code === "string" && typeof e.name === "string").slice(0, MAX) : [];
    } catch (e) {
      return [];
    }
  }
  function write(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX))); } catch (e) {}
  }

  // after a successful start: move this workshop to the top; keep the hash only if asked to
  function remember(code, name, opts) {
    opts = opts || {};
    const entry = { code: String(code).toUpperCase().trim(), name: String(name).trim(), t: Date.now() };
    if (opts.appearance) entry.appearance = opts.appearance;
    if (opts.pinHash) entry.pinHash = opts.pinHash;
    write([entry].concat(list().filter((e) => !same(e, code, name))));
  }
  function forgetPin(code, name) {
    write(list().map((e) => { if (same(e, code, name)) { const c = Object.assign({}, e); delete c.pinHash; return c; } return e; }));
  }
  function remove(code, name) {
    write(list().filter((e) => !same(e, code, name)));
  }
  function find(code, name) {
    return list().find((e) => same(e, code, name)) || null;
  }

  return { list, remember, forgetPin, remove, find };
})();
