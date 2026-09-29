/* --------------------------------------- helisel tekerlek ve yük eğrisi */
const Charts = (() => {
  const wcv = document.getElementById('wheel');
  const ccv = document.getElementById('curve');
  let cur = { seq: PRESETS.aurelin, win: 'all', bridged: true };

  const windowed = () => {
    if (cur.win === 'h1') return { s: cur.seq.slice(8, 15), off: 9 };
    if (cur.win === 'h2') return { s: cur.seq.slice(22, 33), off: 23 };
    return { s: cur.seq, off: 1 };
  };

  function wheel() {
    const { ctx, w, h } = fitCanvas(wcv, 330);
    ctx.clearRect(0, 0, w, h);
    const { s, off } = windowed();
    if (!s.length) return;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.33;
    const ang = i => (100 * i - 90) * Math.PI / 180;
    const px = i => cx + R * Math.cos(ang(i)), py = i => cy + R * Math.sin(ang(i));

    ctx.strokeStyle = THEME.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();

    ctx.strokeStyle = rgba(THEME.muted, 0.45); ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < s.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, px(i), py(i));
    ctx.stroke();

    const m = moment(s, FP);
    if (m.muH > 0.01) {
      const a = m.ang - Math.PI / 2, L = R * 0.82 * Math.min(1, m.muH / 0.7);
      const ex = cx + L * Math.cos(a), ey = cy + L * Math.sin(a);
      ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = THEME.accent; ctx.beginPath();
      ctx.moveTo(ex + 7 * Math.cos(a), ey + 7 * Math.sin(a));
      ctx.lineTo(ex + 6 * Math.cos(a + 2.5), ey + 6 * Math.sin(a + 2.5));
      ctx.lineTo(ex + 6 * Math.cos(a - 2.5), ey + 6 * Math.sin(a - 2.5));
      ctx.closePath(); ctx.fill();
    }

    for (let i = 0; i < s.length; i++) {
      const x = px(i), y = py(i), rr = Math.max(8.5, 13 - s.length * 0.06);
      ctx.fillStyle = THEME[CLS(s[i])];
      ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${Math.round(rr * 0.95)}px ui-monospace, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s[i], x, y + 0.5);
      if (s.length <= 24) {
        ctx.fillStyle = THEME.faint; ctx.font = '400 9px ui-monospace, monospace';
        ctx.fillText(String(off + i), cx + (R + 15) * Math.cos(ang(i)),
                     cy + (R + 15) * Math.sin(ang(i)));
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = THEME.fg; ctx.font = '500 13px ui-monospace, monospace';
    ctx.fillText('µH ' + nf(m.muH, 3), cx, cy - 8);
    ctx.fillStyle = THEME.faint; ctx.font = '400 10px ui-monospace, monospace';
    ctx.fillText('〈H〉 ' + nf(m.H, 3), cx, cy + 8);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  function curve() {
    const { ctx, w, h } = fitCanvas(ccv, 330);
    ctx.clearRect(0, 0, w, h);
    const seq = cur.seq;
    if (!seq.length) return;
    const free = !cur.bridged;
    const L = 42, R = 12, T = 16, B = 30;
    const pw = w - L - R, ph = h - T - B;
    let lo = 0, hi = 0;
    const pts = [];
    for (let i = 0; i <= 140; i++) {
      const pH = i / 10, q = netCharge(seq, pH, free);
      pts.push([pH, q]); lo = Math.min(lo, q); hi = Math.max(hi, q);
    }
    lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
    const X = pH => L + pw * pH / 14, Y = q => T + ph * (hi - q) / (hi - lo);

    ctx.strokeStyle = THEME.line; ctx.lineWidth = 1;
    ctx.fillStyle = THEME.faint; ctx.font = '400 10px ui-monospace, monospace';
    for (let q = lo; q <= hi; q += Math.max(1, Math.round((hi - lo) / 6))) {
      ctx.globalAlpha = q === 0 ? 1 : 0.5;
      ctx.beginPath(); ctx.moveTo(L, Y(q)); ctx.lineTo(L + pw, Y(q)); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.textAlign = 'right'; ctx.fillText(String(q), L - 6, Y(q) + 3.5);
    }
    ctx.textAlign = 'center';
    for (let pH = 0; pH <= 14; pH += 2) ctx.fillText(String(pH), X(pH), h - 10);

    const pI = isoelectric(seq, free);
    ctx.setLineDash([3, 3]); ctx.strokeStyle = rgba(THEME.muted, 0.7);
    ctx.beginPath(); ctx.moveTo(X(7.4), T); ctx.lineTo(X(7.4), T + ph); ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2.2;
    ctx.beginPath();
    pts.forEach(([pH, q], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, X(pH), Y(q)));
    ctx.stroke();

    const q74 = netCharge(seq, 7.4, free);
    ctx.fillStyle = THEME.accent;
    ctx.beginPath(); ctx.arc(X(7.4), Y(q74), 4, 0, 6.2832); ctx.fill();
    ctx.fillStyle = THEME.ok;
    ctx.beginPath(); ctx.arc(X(pI), Y(0), 4, 0, 6.2832); ctx.fill();

    ctx.font = '500 10.5px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = THEME.accent;
    ctx.fillText('pH 7,4 → ' + nfSigned(q74, 2), X(7.4) + 7, Y(q74) - 7);
    ctx.fillStyle = THEME.ok;
    ctx.fillText('pI ' + nf(pI, 2), X(pI) + 7, Y(0) + 14);
    ctx.fillStyle = THEME.faint; ctx.font = '400 10px ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.fillText(T_('axPH'), L + pw / 2, h - 10);
    ctx.save(); ctx.translate(11, T + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(T_('axCharge'), 0, 0); ctx.restore();
    ctx.textAlign = 'start';
  }

  function redraw() { wheel(); curve(); }
  onTheme(redraw);
  window.addEventListener('resize', redraw);
  return {
    update(o) { Object.assign(cur, o); redraw(); },
    redraw
  };
})();

/* ------------------------------------------------ dizi şeridi ve ölçümler */
function buildSeqStrip() {
  const box = document.getElementById('seqStrip');
  box.innerHTML = '';
  const seq = AURELIN.seq;
  for (let r = 1; r <= seq.length; r++) {
    const b = document.createElement('button');
    b.className = 'aa'; b.type = 'button';
    b.style.background = `var(--${CLS(seq[r - 1])})`;
    b.setAttribute('aria-pressed', 'false');
    b.dataset.r = r;
    b.innerHTML = seq[r - 1] + (r % 5 === 0 ? `<i>${r}</i>` : '');
    b.addEventListener('click', () => MolView.select(r));
    box.appendChild(b);
  }
}

function markSeqStrip(r) {
  document.querySelectorAll('#seqStrip .aa').forEach(b =>
    b.setAttribute('aria-pressed', String(+b.dataset.r === r)));
}

function renderMetrics(p) {
  const box = document.getElementById('metrics');
  if (!p) { box.innerHTML = ''; return; }
  const rows = [
    ['mLen', String(p.n), T_('uAA')],
    ['mAvg', nf(p.avg, 2), T_('uDa')],
    ['mMono', nf(p.mono, 2), T_('uDa')],
    ['mChg', nfSigned(p.charge, 2), ''],
    ['mPI', nf(p.pI, 2), ''],
    ['mHyd', '%' + nf(p.hyd, 1), ''],
    ['mAli', nf(p.ali, 2), ''],
    ['mGrv', nfSigned(p.gravy, 3), ''],
    ['mBom', nf(p.boman, 2), T_('uKcal')],
    ['mExt', String(p.ext), T_('uM1')]
  ];
  box.innerHTML = rows.map(([k, v, u]) =>
    `<div class="met"><span>${T_(k)}</span><b>${v}${u ? `<u>${u}</u>` : ''}</b></div>`
  ).join('');
}
