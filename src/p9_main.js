/* --------------------------------------------------------- dil ve bağlantı */
let LANG = 'tr';
function T_(k) { return (I18N[LANG] && I18N[LANG][k]) ?? I18N.tr[k] ?? k; }

/* üstteki sayılar doğrudan PDB/UniProt verisinden türetilir */
const AP = profile(AURELIN.seq, true);
function fillFacts() {
  const v = {
    fv1: String(AP.n),
    fv2: nf(AP.avg, 2) + ' <u>Da</u>',
    fv3: String(AURELIN.ss.length),
    fv4: String(AURELIN.helix.length),
    fv5: String(AURELIN.nModels),
    fv6: nfSigned(AP.charge, 2)
  };
  for (const k in v) document.getElementById(k).innerHTML = v[k];
}

function applyI18n() {
  document.documentElement.lang = LANG;
  LOC = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = T_(el.dataset.i18n);
  });
  fillFacts();
  document.querySelectorAll('.langs button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  buildSteps();
  showStep(curStep);
  renderReadout(MolView.selected);
  recalc();
  document.getElementById('memToggle').textContent =
    Membrane.running ? T_('pause') : T_('play');
}

/* ------------------------------------------------------------- görüntüleyici */
function segWire(id, fn) {
  const box = document.getElementById(id);
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    [...box.querySelectorAll('button')].forEach(x =>
      x.setAttribute('aria-pressed', String(x === b)));
    fn(b.dataset.v ?? b.dataset.p ?? b.dataset.w);
  });
}
segWire('repSeg', v => MolView.set('rep', v));
segWire('colSeg', v => MolView.set('col', v));
['tgSS:ss', 'tgIf:if', 'tgSpin:spin'].forEach(pair => {
  const [id, key] = pair.split(':');
  document.getElementById(id).addEventListener('change', e =>
    MolView.set(key, e.target.checked));
});
document.getElementById('btnReset').addEventListener('click', () => MolView.reset());
if (RM.matches) document.getElementById('tgSpin').checked = false;

function renderReadout(r) {
  const box = document.getElementById('readout');
  if (!r) { box.innerHTML = `<p class="empty">${T_('rdEmpty')}</p>`; return; }
  const s = AURELIN.seq[r - 1];
  const clsName = { cat: 'legCat', ani: 'legAni', hyd: 'legHyd', pol: 'legPol', cys: 'legCys' }[CLS(s)];
  const notes = [];
  const part = MolView.ssPartner(r);
  if (part) notes.push(`${T_('noteSS')} — Cys${r}–Cys${part}`);
  if (MolView.inHelix(r)) notes.push(T_('noteHelix'));
  if (MolView.ifacePos.includes(r)) notes.push(T_('notePos'));
  if (MolView.ifaceHyd.includes(r)) notes.push(T_('noteHyd'));
  box.innerHTML =
    `<dl style="margin:0">
      <div class="rrow"><dt>${T_('rdRes')}</dt><dd class="mono"><b>${s}</b> ${AA3L[s] || ''}</dd></div>
      <div class="rrow"><dt>${T_('rdPos')}</dt><dd class="mono">${r} / 40</dd></div>
      <div class="rrow"><dt>${T_('rdClass')}</dt><dd>${T_(clsName)}</dd></div>
      ${notes.length ? `<div class="rrow"><dt>${T_('rdNote')}</dt><dd>${notes.join('<br>')}</dd></div>` : ''}
    </dl>`;
}
const AA3L = { A:'Ala', R:'Arg', N:'Asn', D:'Asp', C:'Cys', E:'Glu', Q:'Gln',
  G:'Gly', H:'His', I:'Ile', L:'Leu', K:'Lys', M:'Met', F:'Phe', P:'Pro',
  S:'Ser', T:'Thr', W:'Trp', Y:'Tyr', V:'Val' };
MolView.onSelect = r => { markSeqStrip(r); renderReadout(r); };

/* ------------------------------------------------------------- hesaplayıcı */
const seqIn = document.getElementById('seqIn');
const bridge = document.getElementById('tgBridge');
function recalc() {
  const { seq, bad } = cleanSeq(seqIn.value);
  const warn = document.getElementById('seqWarn');
  warn.hidden = !bad; warn.textContent = bad ? T_('badSeq') + ' (' + bad + ')' : '';
  const p = profile(seq, bridge.checked);
  renderMetrics(p);
  Charts.update({ seq, bridged: bridge.checked });
}
seqIn.addEventListener('input', recalc);
bridge.addEventListener('change', recalc);
segWire('preSeg', p => { seqIn.value = PRESETS[p]; recalc(); });
segWire('winSeg', w => Charts.update({ win: w }));

/* ------------------------------------------------------------ yöntem akışı */
let curStep = 0;
function buildSteps() {
  const box = document.getElementById('steps');
  box.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const b = document.createElement('button');
    b.className = 'step'; b.type = 'button';
    b.setAttribute('aria-pressed', String(i - 1 === curStep));
    b.innerHTML = `<span class="stepno">${String(i).padStart(2, '0')}</span>
      <b>${T_('st' + i)}</b><span>${T_('st' + i + 's')}</span>`;
    b.addEventListener('click', () => showStep(i - 1));
    box.appendChild(b);
  }
}
function showStep(i) {
  curStep = i;
  document.querySelectorAll('#steps .step').forEach((b, k) =>
    b.setAttribute('aria-pressed', String(k === i)));
  document.getElementById('stepMeta').textContent =
    `${T_('stepOf')} ${String(i + 1).padStart(2, '0')} / 07 · ${T_('st' + (i + 1) + 's')}`;
  document.getElementById('stepTitle').textContent = T_('st' + (i + 1));
  document.getElementById('stepDesc').textContent = T_('st' + (i + 1) + 'd');
  Flow.go(i);
}

/* --------------------------------------------------------------- seçicilik */
document.getElementById('memToggle').addEventListener('click', e => {
  e.target.textContent = Membrane.toggle() ? T_('pause') : T_('play');
});

/* ------------------------------------------------------------------ açılış */
document.querySelectorAll('.langs button').forEach(b =>
  b.addEventListener('click', () => {
    LANG = b.dataset.lang;
    applyI18n();
    Charts.redraw();
    try { localStorage.setItem('aurelin.lang', LANG); } catch (e) {}
  }));

try {
  const saved = localStorage.getItem('aurelin.lang');
  if (saved && I18N[saved]) LANG = saved;
} catch (e) {}

seqIn.value = PRESETS.aurelin;
buildSeqStrip();
applyI18n();
MolView.resize();
MolView.select(15);          /* Phe15 — misel bağlanma arayüzünde */
Charts.redraw();
