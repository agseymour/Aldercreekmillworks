window.ACM = window.ACM || {};

/**
 * A simple fraction calculator for drafting and measuring maths.
 * Type whole numbers, fractions (3/4) and mixed numbers (11 1/2). Answers are shown as reduced
 * fractions (mixed numbers) with the decimal underneath, and can be rounded to the nearest 1/16".
 * A floating button appears whenever a maths-related window is open (see sync()).
 */
ACM.Calculator = (function () {
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
  const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
  const div = (a, b) => frac(a.n * b.d, a.d * b.n);
  const TITLE = /Drafting|Blueprint|Certification|Exam|Measure|Square|Layout|Tape/i;

  function parseEntry(s) {
    s = String(s || "").trim();
    if (!s) return null;
    let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (m) { if (+m[3] === 0) return null; return frac(+m[1] * +m[3] + +m[2], +m[3]); }
    m = s.match(/^(\d+)\/(\d+)$/);
    if (m) { if (+m[2] === 0) return null; return frac(+m[1], +m[2]); }
    m = s.match(/^(\d+)(?:\.(\d+))?$/);
    if (m) { const dec = m[2] || ""; return frac(+(m[1] + dec), Math.pow(10, dec.length)); }
    return null;
  }
  function show(f) {
    if (!f) return "0";
    const neg = f.n < 0, n = Math.abs(f.n), whole = Math.floor(n / f.d), rem = n % f.d;
    const body = rem === 0 ? String(whole) : whole ? `${whole} ${rem}/${f.d}` : `${rem}/${f.d}`;
    return (neg ? "−" : "") + body;
  }
  const dec = (f) => { const v = f.n / f.d; return Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000); };
  const nearest16 = (f) => frac(Math.round((f.n / f.d) * 16), 16);

  let el = null, btn = null, st = null;
  function reset() { st = { acc: null, op: null, entry: "", expr: "", result: null, err: "" }; }

  function press(k) {
    if (st.err && k !== "C") st.err = "";
    if (/^[0-9]$/.test(k)) {
      if (st.result) { reset(); }
      if (st.entry.length < 14) st.entry += k;
    } else if (k === "/") {
      if (st.result) reset();
      if (/^\d+( \d+)?$/.test(st.entry)) st.entry += "/";
    } else if (k === "␣") {
      if (/^\d+$/.test(st.entry)) st.entry += " ";
    } else if (k === ".") {
      if (/^\d+$/.test(st.entry)) st.entry += ".";
    } else if (k === "⌫") {
      st.entry = st.entry.slice(0, -1);
    } else if (k === "C") {
      reset();
    } else if (["+", "−", "×", "÷"].includes(k)) {
      const cur = parseEntry(st.entry.replace(/[ /.]$/, ""));
      if (st.result) { st.acc = st.result; st.result = null; st.expr = show(st.acc); }
      else if (cur) { st.acc = st.acc && st.op ? apply(st.acc, st.op, cur) : cur; if (st.err) return render(); st.expr += (st.expr ? " " : "") + st.entry.trim(); }
      else if (!st.acc) return render();
      st.op = k; st.entry = ""; st.expr += " " + k;
    } else if (k === "=") {
      const cur = parseEntry(st.entry.replace(/[ /.]$/, ""));
      if (st.acc && st.op && cur) { const r = apply(st.acc, st.op, cur); if (!st.err) { st.expr += " " + st.entry.trim(); st.result = r; st.acc = null; st.op = null; st.entry = ""; } }
      else if (!st.acc && cur) { st.result = cur; st.expr = st.entry.trim(); st.entry = ""; }
    } else if (k === "≈") {
      if (st.result) st.result = nearest16(st.result);
    }
    render();
  }
  function apply(a, op, b) {
    if (op === "+") return add(a, b);
    if (op === "−") return sub(a, b);
    if (op === "×") return mul(a, b);
    if (b.n === 0) { st.err = "Can't divide by zero"; return a; }
    return div(a, b);
  }

  function render() {
    if (!el) return;
    const main = st.err ? st.err : st.result ? show(st.result) : st.entry || (st.acc ? show(st.acc) : "0");
    el.querySelector(".calc-expr").textContent = st.expr || " ";
    el.querySelector(".calc-main").textContent = main;
    el.querySelector(".calc-dec").textContent = st.result ? `= ${dec(st.result)} in decimal` : " ";
  }

  function build() {
    el = document.createElement("div");
    el.id = "calc-panel";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Fraction calculator");
    const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", "␣", "/", "+", "C", "⌫", ".", "=", "≈"];
    el.innerHTML = `<div class="calc-head"><strong>Calculator</strong><button class="calc-x" aria-label="Close calculator">×</button></div>
      <div class="calc-screen"><div class="calc-expr"></div><div class="calc-main"></div><div class="calc-dec"></div></div>
      <div class="calc-keys">${keys.map((k) => `<button data-k="${k}" class="${/[÷×−+=]/.test(k) ? "op" : k === "≈" ? "wide" : ""}">${k}</button>`).join("")}</div>
      <p class="calc-help">Use ␣ for mixed numbers: <em>11 ␣ 1 / 2</em> makes 11 1/2. ≈ rounds the answer to the nearest 1/16".</p>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest(".calc-x")) { el.classList.remove("open"); return; }
      const b = e.target.closest("[data-k]");
      if (b) press(b.dataset.k);
    });
    btn = document.createElement("button");
    btn.id = "calc-toggle";
    btn.textContent = "🧮 Calculator";
    btn.onclick = () => { el.classList.toggle("open"); if (el.classList.contains("open")) render(); };
    document.body.appendChild(btn);
    reset(); render();
  }

  function ensure() { if (!el) build(); }
  /** called whenever a window opens: shows the calculator button for maths-related windows */
  function sync(title, html) {
    ensure();
    const want = TITLE.test(title || "") || /data-calc/.test(html || "");
    btn.classList.toggle("show", want);
    if (!want) el.classList.remove("open");
  }
  function hide() { if (!el) return; btn.classList.remove("show"); el.classList.remove("open"); }

  // keyboard: when the panel is open and the focus isn't in a text field, digits go to the calculator
  document.addEventListener("keydown", (e) => {
    if (!el || !el.classList.contains("open")) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    const map = { "*": "×", "x": "×", "-": "−", "Enter": "=", "Backspace": "⌫", "Escape": null, " ": "␣", "Delete": "C" };
    const k = e.key in map ? map[e.key] : e.key;
    if (k && /^([0-9]|[+\-−×÷=/.⌫C␣])$/.test(k)) { e.preventDefault(); press(k === "-" ? "−" : k === "*" ? "×" : k); }
  });

  return { sync, hide, press, _state: () => st, _show: show, _parse: parseEntry };
})();
