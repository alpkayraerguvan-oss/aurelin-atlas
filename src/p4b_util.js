/* ------------------------------------------------------- ortak yardımcılar */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)');

function fitCanvas(cv, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || cv.parentElement.clientWidth || 600;
  const h = cssH || cv.clientHeight || 300;
  const nw = Math.round(w * dpr), nh = Math.round(h * dpr);
  if (cv.width !== nw || cv.height !== nh) {
    cv.width = nw; cv.height = nh; cv.style.height = h + 'px';
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

const cssVar = n => getComputedStyle(document.documentElement)
  .getPropertyValue(n).trim();

let THEME = {};
function readTheme() {
  const g = n => cssVar(n) || '#888';
  THEME = {
    cat: g('--cat'), ani: g('--ani'), hyd: g('--hyd'), pol: g('--pol'),
    cys: g('--cys'), accent: g('--accent'), fg: g('--fg'), muted: g('--muted'),
    faint: g('--faint'), line: g('--line'), surface: g('--surface'),
    bg: g('--bg'), ok: g('--ok'),
    stage: g('--stage'), stage2: g('--stage-2'), stageFg: g('--stage-fg'),
    stageMuted: g('--stage-muted'), stageLine: g('--stage-line')
  };
  return THEME;
}
readTheme();

const themeHooks = [];
const onTheme = fn => { themeHooks.push(fn); };
function fireTheme() { readTheme(); themeHooks.forEach(f => { try { f(); } catch (e) {} }); }
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', fireTheme);

/* renk yardımcıları (derinlik sisi ve saydamlık için) */
function hex2rgb(h) {
  h = (h || '').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h || '888888', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}
function rgba(h, a) { const c = hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

/* sayı biçimi — yerele göre ayırıcı; yarım değerler ExPASy gibi
   sıfırdan uzağa yuvarlanır (GRAVY −0,4575 → −0,458).                        */
let LOC = 'tr';
const LOCALES = { tr: 'tr-TR', en: 'en-US', el: 'el-GR' };
function rnd(v, d) {
  const f = Math.pow(10, d), x = v * f, a = Math.abs(x);
  return Math.sign(x) * Math.round(a + a * Number.EPSILON * 8) / f;
}
const nf = (v, d = 2) => rnd(v, d).toLocaleString(LOCALES[LOC] || 'tr-TR',
  { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/^-/, '−');
const nfSigned = (v, d = 2) =>
  (rnd(v, d) > 0 ? '+' : rnd(v, d) < 0 ? '−' : '') + nf(Math.abs(v), d);
