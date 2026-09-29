/* ------------------------------------------- 2LG4 üç boyutlu görüntüleyici
   Kendi yazdığım küçük bir oluşturucu: perspektif izdüşüm, ressam algoritması
   (derinliğe göre sıralama) ve derinlik sisi. Koordinatlar gerçek PDB verisi. */
const MolView = (() => {
  const cv = document.getElementById('mol');
  const M = AURELIN;
  const N = M.seq.length;

  /* ---- veri hazırlığı ---------------------------------------------------- */
  const at = i => [M.xyz[i * 3], M.xyz[i * 3 + 1], M.xyz[i * 3 + 2]];
  const caIdx = new Array(N + 1).fill(-1);
  const sgIdx = {};
  const byRes = {};
  for (let i = 0; i < M.resi.length; i++) {
    const r = M.resi[i];
    (byRes[r] || (byRes[r] = [])).push(i);
    if (M.names[i] === 'CA') caIdx[r] = i;
    if (M.names[i] === 'SG') sgIdx[r] = i;
  }
  const inHelix = r => M.helix.some(h => r >= h[0] && r <= h[1]);
  const ifaceAll = new Set([...M.iface_pos, ...M.iface_hyd]);

  /* kovalent bağlar: ağır atomlar arası < 1,95 Å (S–S hariç, ayrı çizilir) */
  const bonds = [];
  for (let i = 0; i < M.resi.length; i++) {
    for (let j = i + 1; j < M.resi.length; j++) {
      if (Math.abs(M.resi[i] - M.resi[j]) > 1) continue;
      const a = at(i), b = at(j);
      const d2 = (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
      if (d2 < 1.95 * 1.95) bonds.push([i, j]);
    }
  }

  /* CA omurgası üzerinden Catmull–Rom eğrisi (tüp gösterimi) */
  const CAp = [];
  for (let r = 1; r <= N; r++) CAp.push(at(caIdx[r]));
  const SUB = 12, spline = [];
  const crm = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return [0, 1, 2].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t +
      (2*p0[k] - 5*p1[k] + 4*p2[k] - p3[k]) * t2 +
      (-p0[k] + 3*p1[k] - 3*p2[k] + p3[k]) * t3));
  };
  for (let i = 0; i < N - 1; i++) {
    const p0 = CAp[Math.max(0, i - 1)], p1 = CAp[i],
          p2 = CAp[i + 1], p3 = CAp[Math.min(N - 1, i + 2)];
    for (let s = 0; s < SUB; s++)
      spline.push({ p: crm(p0, p1, p2, p3, s / SUB), r: i + 1 + s / SUB });
  }
  spline.push({ p: CAp[N - 1], r: N });

  /* ---- durum ------------------------------------------------------------ */
  let rot = [1,0,0, 0,1,0, 0,0,1];
  let zoom = 1, spin = !RM.matches, rep = 'tube', col = 'prop';
  let showSS = true, showIf = true, sel = null, hoverR = null;
  let W = 0, H = 0, ctx = null, scale = 1;

  const mul = (A, B) => {
    const C = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
      C[i*3+j] = A[i*3]*B[j] + A[i*3+1]*B[3+j] + A[i*3+2]*B[6+j];
    return C;
  };
  const rotY = a => [Math.cos(a),0,Math.sin(a), 0,1,0, -Math.sin(a),0,Math.cos(a)];
  const rotX = a => [1,0,0, 0,Math.cos(a),-Math.sin(a), 0,Math.sin(a),Math.cos(a)];
  const apply = v => [
    rot[0]*v[0] + rot[1]*v[1] + rot[2]*v[2],
    rot[3]*v[0] + rot[4]*v[1] + rot[5]*v[2],
    rot[6]*v[0] + rot[7]*v[1] + rot[8]*v[2]];

  const FOC = 620;
  function proj(v) {
    const p = apply(v);
    const z = p[2] * scale;
    const k = FOC / Math.max(80, FOC - z);
    return { x: W/2 + p[0]*scale*k, y: H/2 - p[1]*scale*k, z, k };
  }

  /* ---- renklendirme ----------------------------------------------------- */
  function resColor(r) {
    const s = M.seq[r - 1];
    if (col === 'prop') return THEME[CLS(s)];
    if (col === 'ss') return inHelix(r) ? THEME.accent : THEME.pol;
    const t = (r - 1) / (N - 1);            // N→C gökkuşağı (mavi→kırmızı)
    return `hsl(${(1 - t) * 255}, 62%, 56%)`;
  }
  const fog = (c, z) => {
    const t = Math.min(0.72, Math.max(0, (18 - z / scale) / 44));
    return mix(c, THEME.stage, t);
  };

  /* ---- çizim ------------------------------------------------------------ */
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W/2, H*0.42, 10, W/2, H*0.42, Math.max(W,H)*0.72);
    g.addColorStop(0, THEME.stage2); g.addColorStop(1, THEME.stage);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const prim = [];

    if (rep === 'ens') {
      M.ens.forEach((m, mi) => {
        for (let r = 0; r < N - 1; r++) {
          const a = proj([m[r*3], m[r*3+1], m[r*3+2]]);
          const b = proj([m[(r+1)*3], m[(r+1)*3+1], m[(r+1)*3+2]]);
          prim.push({ z: (a.z + b.z) / 2, t: 'l', a, b,
            w: (mi === 0 ? 3.4 : 1.1) * a.k,
            c: mi === 0 ? resColor(r + 1) : THEME.stageMuted,
            al: mi === 0 ? 1 : 0.3 });
        }
      });
    } else if (rep === 'tube') {
      for (let i = 0; i < spline.length - 1; i++) {
        const a = proj(spline[i].p), b = proj(spline[i + 1].p);
        const r = Math.round(spline[i].r);
        prim.push({ z: (a.z + b.z) / 2, t: 'l', a, b,
          w: (inHelix(r) ? 7.2 : 3.8) * a.k, c: resColor(r), al: 1 });
      }
    } else {                                   /* çubuk gösterimi */
      for (const [i, j] of bonds) {
        const a = proj(at(i)), b = proj(at(j));
        const r = M.resi[i];
        prim.push({ z: (a.z + b.z) / 2, t: 'l', a, b, w: 2.9 * a.k,
          c: resColor(r), al: 1 });
      }
      for (let i = 0; i < M.resi.length; i++) {
        const p = proj(at(i));
        prim.push({ z: p.z, t: 'd', p, rr: 1.9 * p.k, c: resColor(M.resi[i]) });
      }
    }

    /* disülfit köprüleri */
    if (showSS && rep !== 'ens') {
      for (const [x, y] of M.ss) {
        const a = proj(at(sgIdx[x])), b = proj(at(sgIdx[y]));
        prim.push({ z: (a.z + b.z) / 2 + 0.3, t: 'l', a, b, w: 5.6 * a.k,
          c: THEME.cys, al: 1, dash: true });
        prim.push({ z: a.z, t: 'd', p: a, rr: 3.1 * a.k, c: THEME.cys });
        prim.push({ z: b.z, t: 'd', p: b, rr: 3.1 * b.k, c: THEME.cys });
      }
    }

    /* misel bağlanma arayüzü (UniProt) */
    if (showIf && rep !== 'ens') {
      for (const r of ifaceAll) {
        const p = proj(at(caIdx[r]));
        prim.push({ z: p.z + 0.5, t: 'ring', p, rr: 7 * p.k,
          c: M.iface_pos.includes(r) ? THEME.cat : THEME.hyd,
          lab: M.seq[r - 1] + r });
      }
    }

    if (sel) {
      const p = proj(at(caIdx[sel]));
      prim.push({ z: 1e6, t: 'sel', p, rr: 11 * p.k, c: THEME.stageFg,
        lab: M.seq[sel - 1] + sel });
    }

    prim.sort((u, v) => u.z - v.z);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const o of prim) {
      if (o.t === 'l') {
        ctx.globalAlpha = o.al ?? 1;
        ctx.strokeStyle = fog(o.c, o.z); ctx.lineWidth = Math.max(0.6, o.w);
        ctx.beginPath(); ctx.moveTo(o.a.x, o.a.y); ctx.lineTo(o.b.x, o.b.y); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (o.t === 'd') {
        ctx.fillStyle = fog(o.c, o.z);
        ctx.beginPath(); ctx.arc(o.p.x, o.p.y, Math.max(0.5, o.rr), 0, 6.2832); ctx.fill();
      } else if (o.t === 'ring') {
        ctx.strokeStyle = fog(o.c, o.z); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(o.p.x, o.p.y, o.rr, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = fog(o.c, o.z);
        ctx.font = '500 10px ui-monospace, monospace';
        ctx.fillText(o.lab, o.p.x + o.rr + 3, o.p.y + 3.5);
      } else if (o.t === 'sel') {
        ctx.strokeStyle = o.c; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(o.p.x, o.p.y, o.rr, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = o.c; ctx.font = '600 12px ui-monospace, monospace';
        ctx.fillText(o.lab, o.p.x + o.rr + 5, o.p.y + 4);
      }
    }
  }

  /* ---- etkileşim -------------------------------------------------------- */
  function resize() {
    const r = fitCanvas(cv, cv.parentElement.clientWidth < 520 ? 340 : 460);
    ctx = r.ctx; W = r.w; H = r.h;
    scale = Math.min(W, H) * 0.44 / M.radius * zoom;
    draw();
  }
  function hit(mx, my) {
    let best = null, bd = 16 * 16;
    for (let r = 1; r <= N; r++) {
      const p = proj(at(caIdx[r]));
      const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }
  let drag = null, moved = 0;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    drag = { x: e.offsetX, y: e.offsetY }; moved = 0;
  });
  cv.addEventListener('pointermove', e => {
    if (drag) {
      const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      rot = mul(mul(rotY(dx * 0.008), rotX(dy * 0.008)), rot);
      drag = { x: e.offsetX, y: e.offsetY };
      draw();
    } else {
      const h = hit(e.offsetX, e.offsetY);
      if (h !== hoverR) { hoverR = h; cv.style.cursor = h ? 'pointer' : 'grab'; }
    }
  });
  cv.addEventListener('pointerup', e => {
    if (drag && moved < 5) {
      const h = hit(e.offsetX, e.offsetY);
      if (h) API.select(h);
    }
    drag = null;
  });
  cv.addEventListener('pointercancel', () => { drag = null; });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    zoom = Math.min(3, Math.max(0.5, zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    scale = Math.min(W, H) * 0.44 / M.radius * zoom;
    draw();
  }, { passive: false });

  let last = 0;
  function loop(t) {
    if (spin && !drag && ctx) {
      if (t - last > 16) { rot = mul(rotY(0.0042), rot); draw(); last = t; }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.addEventListener('resize', resize);
  onTheme(() => draw());

  const API = {
    resize, draw,
    set(k, v) {
      if (k === 'rep') rep = v; else if (k === 'col') col = v;
      else if (k === 'ss') showSS = v; else if (k === 'if') showIf = v;
      else if (k === 'spin') spin = v;
      draw();
    },
    reset() {
      rot = [1,0,0, 0,1,0, 0,0,1]; zoom = 1;
      scale = Math.min(W, H) * 0.44 / M.radius; draw();
    },
    select(r) { sel = r; draw(); if (API.onSelect) API.onSelect(r); },
    get selected() { return sel; },
    inHelix, ifacePos: M.iface_pos, ifaceHyd: M.iface_hyd,
    ssPartner(r) { for (const [a, b] of M.ss) { if (a === r) return b; if (b === r) return a; } return null; }
  };
  return API;
})();
