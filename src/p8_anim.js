/* ------------------------------------------------ membran seçiciliği (şematik) */
const Membrane = (() => {
  const defs = [
    { cv: document.getElementById('memA'), anionic: true },
    { cv: document.getElementById('memB'), anionic: false }
  ];
  let running = !RM.matches, t0 = performance.now(), acc = 0;

  function peptides(anionic) {
    const out = [];
    for (let i = 0; i < 5; i++) out.push({
      x: -0.2 - i * 0.26, y: 0.12 + (i % 3) * 0.12, v: 0.055 + (i % 4) * 0.011,
      phase: i * 1.7, stuck: 0
    });
    return out;
  }
  const state = defs.map(d => peptides(d.anionic));

  function bilayer(ctx, w, h, anionic, t, peps) {
    const my = h * 0.62, hr = 6.4, sp = 15;
    const pore = anionic ? Math.max(0, Math.min(1, (t - 5.2) / 2.2)) : 0;
    const poreX = w * 0.54, poreW = 30 * pore;

    for (let x = sp / 2; x < w; x += sp) {
      const d = Math.abs(x - poreX);
      const push = pore > 0 && d < poreW + 22 ? (1 - d / (poreW + 22)) * poreW * 0.5 : 0;
      const sx = x + (x < poreX ? -push : push);
      const wob = Math.sin(t * 1.6 + x * 0.06) * 1.1;
      for (const s of [-1, 1]) {
        const hy = my + s * (hr + 13) + wob * s;
        ctx.strokeStyle = rgba(THEME.stageMuted, 0.5); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx, hy); ctx.lineTo(sx - 2, hy - s * 12);
        ctx.moveTo(sx, hy); ctx.lineTo(sx + 2, hy - s * 12); ctx.stroke();
        ctx.fillStyle = anionic ? rgba(THEME.ani, 0.85) : rgba(THEME.pol, 0.85);
        ctx.beginPath(); ctx.arc(sx, hy, hr, 0, 6.2832); ctx.fill();
        if (s === -1) {
          ctx.fillStyle = THEME.stage;
          ctx.font = '700 8px ui-monospace, monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(anionic ? '−' : '±', sx, hy + 0.5);
          ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
        }
      }
    }

    if (pore > 0.25) {                       /* hücre içeriğinin sızması */
      for (let i = 0; i < 9; i++) {
        const p = ((t * 0.35 + i * 0.31) % 1);
        ctx.fillStyle = rgba(THEME.cat, (1 - p) * 0.75);
        ctx.beginPath();
        ctx.arc(poreX + Math.sin(i * 2.3) * 9, my - p * (h * 0.4), 2.4, 0, 6.2832);
        ctx.fill();
      }
    }

    const surf = my - 20;
    for (const p of peps) {
      p.x += p.v * 0.016 * 60 / 60;
      if (anionic) {
        const gx = p.x * w;
        if (gx > w * 0.3 && p.stuck < 1) p.stuck = Math.min(1, p.stuck + 0.006);
        if (p.x > 1.25) { p.x = -0.25; p.stuck = 0; }
      } else if (p.x > 1.25) p.x = -0.25;
      const x = p.x * w;
      const yFree = h * p.y + Math.sin(t * 2 + p.phase) * 6;
      const y = anionic ? yFree + (surf + 6 - yFree) * p.stuck
                        : yFree + Math.sin(t * 1.2 + p.phase) * 10;
      if (x < -20 || x > w + 20) continue;
      ctx.save(); ctx.translate(x, y);
      ctx.rotate(Math.sin(t + p.phase) * 0.25);
      const g = ctx.createLinearGradient(-11, 0, 11, 0);
      g.addColorStop(0, THEME.cat); g.addColorStop(1, THEME.accent);
      ctx.fillStyle = g;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-11, -6, 22, 12, 6);
      else ctx.arc(0, 0, 8, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 9px ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+++', 0, 0.5);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      ctx.restore();
      if (anionic && p.stuck > 0.15 && p.stuck < 0.98) {
        ctx.strokeStyle = rgba(THEME.cat, 0.35 * (1 - p.stuck)); ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, surf + 16); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function frame(now) {
    if (running) acc += Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    defs.forEach((d, i) => {
      const r = fitCanvas(d.cv, 300);
      const { ctx, w, h } = r;
      ctx.fillStyle = THEME.stage; ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, THEME.stage2); g.addColorStop(1, THEME.stage);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      bilayer(ctx, w, h, d.anionic, acc % 9, state[i]);
      ctx.fillStyle = THEME.stageMuted;
      ctx.font = '400 10px ui-monospace, monospace';
      ctx.fillText(d.anionic ? '− − −  POPG / LPS' : '± ± ±  POPC', 12, h - 12);
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { toggle() { running = !running; return running; }, get running() { return running; } };
})();

/* --------------------------------------------------- yöntem akışı sahneleri */
const Flow = (() => {
  const cv = document.getElementById('flow');
  let step = 0, t = 0, last = performance.now();
  const lab = (ctx, x, y, s, c) => {
    ctx.fillStyle = c || THEME.stageMuted;
    ctx.font = '400 10px ui-monospace, monospace'; ctx.fillText(s, x, y);
  };

  const S = [
    /* 1 — ekstraksiyon */
    (ctx, w, h) => {
      const cx = w * 0.3, cy = h * 0.33, R = Math.min(w, h) * 0.2;
      ctx.strokeStyle = rgba(THEME.accent, .85); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.quadraticCurveTo(cx, cy + R * .5, cx + R, cy); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = cx - R * .7 + i * R * .35;
        ctx.strokeStyle = rgba(THEME.accent, .5);
        ctx.beginPath(); ctx.moveTo(a, cy + R * .3);
        ctx.quadraticCurveTo(a + Math.sin(t * 2 + i) * 9, cy + R, a + Math.sin(t * 2 + i) * 5, cy + R * 1.6);
        ctx.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const p = (t * .32 + i * .143) % 1;
        ctx.fillStyle = rgba(THEME.cat, .8 * (1 - p * .5));
        ctx.beginPath();
        ctx.arc(cx + Math.sin(i * 2) * R * .6, cy + R * 1.6 + p * h * .38, 3.1, 0, 6.2832);
        ctx.fill();
      }
      const tx = w * .72, ty = h * .3, tw = 34, th = h * .46;
      ctx.strokeStyle = THEME.stageLine; ctx.lineWidth = 2;
      ctx.strokeRect(tx, ty, tw, th);
      ctx.fillStyle = rgba(THEME.cat, .32);
      const fill = Math.min(th - 8, (t % 6) / 6 * (th - 8));
      ctx.fillRect(tx + 2, ty + th - 2 - fill, tw - 4, fill);
      lab(ctx, tx - 4, ty - 10, 'Tris-HCl +4 °C');
      lab(ctx, w * .06, h - 16, 'mukus → santrifüj → 0,45 µm → −80 °C');
    },
    /* 2 — jel filtrasyon */
    (ctx, w, h) => {
      const cx = w * .5, top = h * .12, bot = h * .82, cw = 92;
      ctx.strokeStyle = THEME.stageLine; ctx.lineWidth = 2;
      ctx.strokeRect(cx - cw / 2, top, cw, bot - top);
      for (let i = 0; i < 46; i++) {
        const bx = cx - cw / 2 + 9 + (i * 37 % (cw - 18));
        const by = top + 12 + (i * 53 % (bot - top - 24));
        ctx.fillStyle = rgba(THEME.stageMuted, .22);
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, 6.2832); ctx.fill();
      }
      const run = (t % 7) / 7;
      for (let i = 0; i < 5; i++) {            /* büyük = hızlı */
        const p = Math.min(1, run * 1.5 - i * .02);
        if (p < 0) continue;
        ctx.fillStyle = THEME.ani;
        ctx.beginPath();
        ctx.arc(cx - 22 + i * 11, top + 10 + p * (bot - top - 16), 5.6, 0, 6.2832); ctx.fill();
      }
      for (let i = 0; i < 6; i++) {            /* küçük = yavaş */
        const p = Math.min(1, run * .72 - i * .015);
        if (p < 0) continue;
        ctx.fillStyle = THEME.cat;
        ctx.beginPath();
        ctx.arc(cx - 26 + i * 10, top + 10 + p * (bot - top - 16), 3, 0, 6.2832); ctx.fill();
      }
      lab(ctx, cx + cw / 2 + 12, top + 24, 'büyük → erken');
      lab(ctx, cx + cw / 2 + 12, top + 42, 'küçük → geç');
      lab(ctx, cx - cw / 2, bot + 20, 'Sephadex G-50  ·  1,5–30 kDa');
    },
    /* 3 — RP-HPLC */
    (ctx, w, h) => {
      const L = 40, R = 16, T = 20, B = 36, pw = w - L - R, ph = h - T - B;
      ctx.strokeStyle = THEME.stageLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, T + ph); ctx.lineTo(L + pw, T + ph); ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = rgba(THEME.hyd, .55);
      ctx.beginPath(); ctx.moveTo(L, T + ph * .92); ctx.lineTo(L + pw, T + ph * .2); ctx.stroke();
      ctx.setLineDash([]);
      const peaks = [[.18, .28], [.34, .46], [.52, 1], [.68, .34], [.83, .22]];
      const prog = Math.min(1, (t % 8) / 6);
      ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= pw; i++) {
        const x = i / pw; if (x > prog) break;
        let y = 0;
        for (const [c, a] of peaks) y += a * Math.exp(-((x - c) ** 2) / (2 * .013 ** 2));
        (i ? ctx.lineTo : ctx.moveTo).call(ctx, L + i, T + ph - y * ph * .82);
      }
      ctx.stroke();
      if (prog > .58) {
        const x = L + pw * .52;
        ctx.strokeStyle = rgba(THEME.cat, .8); ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, T + ph * .1); ctx.lineTo(x, T + ph); ctx.stroke();
        ctx.setLineDash([]);
        lab(ctx, x + 6, T + ph * .14, 'aktif pik', THEME.cat);
      }
      lab(ctx, L, h - 14, 'C18  ·  %5→65 asetonitril  ·  220 nm');
      ctx.save(); ctx.translate(14, T + ph / 2); ctx.rotate(-Math.PI / 2);
      lab(ctx, -18, 0, 'A₂₂₀'); ctx.restore();
    },
    /* 4 — Tricine SDS-PAGE */
    (ctx, w, h) => {
      const gx = w * .28, gw = w * .44, top = h * .12, bot = h * .86;
      ctx.fillStyle = rgba(THEME.stageMuted, .08); ctx.fillRect(gx, top, gw, bot - top);
      ctx.strokeStyle = THEME.stageLine; ctx.strokeRect(gx, top, gw, bot - top);
      const run = Math.min(1, (t % 8) / 5.5);
      const mk = [[40, .16], [25, .3], [15, .45], [10, .58], [4.6, .76], [1.7, .9]];
      for (const [kd, pos] of mk) {
        const y = top + pos * (bot - top) * run + 8;
        ctx.fillStyle = rgba(THEME.stageMuted, .55);
        ctx.fillRect(gx + 8, y, gw * .22, 3.4);
        lab(ctx, gx - 34, y + 4, kd + '');
      }
      const y = top + .78 * (bot - top) * run + 8;
      ctx.fillStyle = THEME.cys; ctx.fillRect(gx + gw * .42, y - 1, gw * .24, 5.4);
      ctx.fillStyle = rgba(THEME.cys, .25); ctx.fillRect(gx + gw * .42, y - 4, gw * .24, 11);
      lab(ctx, gx + gw + 10, y + 4, '≈ 4,3 kDa', THEME.cys);
      lab(ctx, gx - 34, top - 8, 'kDa');
      lab(ctx, gx, bot + 20, '%16 Tricine SDS-PAGE  ·  gümüş boyama  ·  tek bant = saf');
    },
    /* 5 — MIC / MBC */
    (ctx, w, h) => {
      const n = 11, pad = 26, cw = Math.min(40, (w - pad * 2) / n);
      const x0 = (w - cw * n) / 2, y = h * .38, r = cw * .38;
      const micIdx = 5, reveal = (t % 8) / 3.2;
      for (let i = 0; i < n; i++) {
        const cx = x0 + cw * i + cw / 2;
        const shown = reveal > i / n * 1.4;
        const grow = i > micIdx;
        ctx.fillStyle = shown ? (grow ? rgba(THEME.ani, .8) : rgba(THEME.cat, .75))
                              : rgba(THEME.stageMuted, .18);
        ctx.beginPath(); ctx.arc(cx, y, r, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = THEME.stageLine; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.save(); ctx.translate(cx, y + r + 10); ctx.rotate(-Math.PI / 3.4);
        lab(ctx, 0, 0, String(512 / Math.pow(2, i)).replace('.', ','));
        ctx.restore();
      }
      const mx = x0 + cw * micIdx + cw / 2;
      if (reveal > .9) {
        ctx.strokeStyle = THEME.stageFg; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(mx + cw / 2, y - r - 16); ctx.lineTo(mx + cw / 2, y + r + 4); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = THEME.stageFg; ctx.font = '500 11px ui-monospace, monospace';
        ctx.fillText('MIC = 16 µg/mL', mx - 24, y - r - 22);
      }
      lab(ctx, x0, h - 14, 'mavi: üreme yok (rezazurin)   ·   pembe: üreme var');
      lab(ctx, x0, y - r - 40, 'iki katlı seri seyreltme  ·  µg/mL');
    },
    /* 6 — LC-MS/MS */
    (ctx, w, h) => {
      const L = 36, R = 14, T = 18, B = 34, pw = w - L - R, ph = (h - T - B) * .52;
      ctx.strokeStyle = THEME.stageLine;
      ctx.beginPath(); ctx.moveTo(L, T + ph); ctx.lineTo(L + pw, T + ph); ctx.stroke();
      const zs = [[7, 614.85, .45], [6, 717.16, .72], [5, 860.39, 1], [4, 1075.24, .8], [3, 1433.31, .4]];
      const ph2 = (t % 9);
      zs.forEach(([z, mz, a], i) => {
        if (ph2 < i * .35) return;
        const x = L + (mz - 500) / 1100 * pw;
        ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, T + ph); ctx.lineTo(x, T + ph - a * ph * .84); ctx.stroke();
        lab(ctx, x - 12, T + ph - a * ph * .84 - 6, z + '+', THEME.accent);
      });
      lab(ctx, L, T + ph + 16, 'm/z  ·  çoklu yüklü iyon serisi (ESI)');
      if (ph2 > 2.6) {
        const y2 = T + ph + 52;
        ctx.strokeStyle = rgba(THEME.stageMuted, .6);
        ctx.beginPath(); ctx.moveTo(L, y2 + 42); ctx.lineTo(L + pw, y2 + 42); ctx.stroke();
        const x = L + pw * .52;
        ctx.strokeStyle = THEME.cys; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(x, y2 + 42); ctx.lineTo(x, y2 + 4); ctx.stroke();
        ctx.fillStyle = THEME.cys; ctx.font = '500 11px ui-monospace, monospace';
        ctx.fillText('4296,92 Da', x + 8, y2 + 14);
        lab(ctx, L, y2 + 58, 'dekonvolüsyon → intakt kütle');
      }
      if (ph2 > 5) {
        const sx = L, sy = h - 14;
        ctx.font = '500 11px ui-monospace, monospace';
        const frag = 'AACSDR';
        for (let i = 0; i < frag.length; i++) {
          ctx.fillStyle = i < (ph2 - 5) * 3 ? THEME.stageFg : rgba(THEME.stageMuted, .3);
          ctx.fillText(frag[i], sx + 150 + i * 13, sy);
        }
        lab(ctx, sx, sy, 'b / y iyonları → dizi');
      }
    },
    /* 7 — in-siliko */
    (ctx, w, h) => {
      const cx = w * .26, cy = h * .46, R = Math.min(w, h) * .21;
      ctx.strokeStyle = rgba(THEME.accent, .9); ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= 70; i++) {
        const a = i / 70 * Math.PI * 4 + t * .5;
        const x = cx + Math.cos(a) * R * .62, y = cy - R + (i / 70) * R * 2;
        (i ? ctx.lineTo : ctx.moveTo).call(ctx, x, y);
      }
      ctx.stroke();
      lab(ctx, cx - R, cy + R + 24, 'AlphaFold / SWISS-MODEL');
      lab(ctx, cx - R, cy + R + 40, '2LG4 ile RMSD karşılaştırması');

      const bx = w * .56, bw = w * .34, by = h * .3;
      const bars = [['POPG / LPS', -7.0, -9.5, THEME.cat], ['POPC / kol.', -4.0, -6.5, THEME.pol]];
      bars.forEach(([name, a, b, c], i) => {
        const y = by + i * 62;
        const sc = v => bx + (Math.abs(v) / 11) * bw;
        const grow = Math.min(1, Math.max(0, (t % 7) - .4 - i * .5));
        ctx.fillStyle = rgba(c, .32);
        ctx.fillRect(bx, y, (sc(a) - bx) * grow, 18);
        ctx.fillStyle = c;
        ctx.fillRect(bx + (sc(a) - bx) * grow - 3, y, 3, 18);
        ctx.strokeStyle = c; ctx.lineWidth = 1.4;
        ctx.strokeRect(bx, y, (sc(b) - bx) * grow, 18);
        lab(ctx, bx, y - 6, name, THEME.stageFg);
        lab(ctx, bx, y + 32, nf(a, 1) + ' … ' + nf(b, 1) + ' kcal/mol', c);
      });
      ctx.fillStyle = rgba(THEME.hyd, .9);
      ctx.font = '500 10px ui-monospace, monospace';
      ctx.fillText('ÖNGÖRÜ — hesaplanmış veri değil', bx, h - 14);
    }
  ];

  function frame(now) {
    t += Math.min(.05, (now - last) / 1000); last = now;
    const { ctx, w, h } = fitCanvas(cv, w0() < 560 ? 280 : 330);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, THEME.stage2); g.addColorStop(1, THEME.stage);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    S[step](ctx, w, h);
    requestAnimationFrame(frame);
  }
  const w0 = () => cv.parentElement.clientWidth || 600;
  requestAnimationFrame(frame);
  return { go(i) { step = i; t = 0; } };
})();
