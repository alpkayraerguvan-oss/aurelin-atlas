/* ------------------------------------------- peptit kimyası (ProtParam uyumlu)
   Ölçekler: ortalama/monoizotopik kalıntı kütleleri, Bjellqvist pKa seti,
   Fauchère–Pliska hidrofobiklik, Kyte–Doolittle, Boman. Bu modülün çıktıları
   aurelin için ExPASy ProtParam ile karşılaştırılarak doğrulanmıştır.          */
const AAs = 'ACDEFGHIKLMNPQRSTVWY';
const M_AVG = {A:71.0788,R:156.1875,N:114.1038,D:115.0886,C:103.1388,E:129.1155,
  Q:128.1307,G:57.0519,H:137.1411,I:113.1594,L:113.1594,K:128.1741,M:131.1926,
  F:147.1766,P:97.1167,S:87.0782,T:101.1051,W:186.2132,Y:163.1760,V:99.1326};
const M_MONO = {A:71.03711,R:156.10111,N:114.04293,D:115.02694,C:103.00919,
  E:129.04259,Q:128.05858,G:57.02146,H:137.05891,I:113.08406,L:113.08406,
  K:128.09496,M:131.04049,F:147.06841,P:97.05276,S:87.03203,T:101.04768,
  W:186.07931,Y:163.06333,V:99.06841};
const H2O_A = 18.01528, H2O_M = 18.010565, H_A = 1.00794, H_M = 1.007825;

const PK = {C:9.0, D:4.05, E:4.45, H:5.98, K:10.0, R:12.0, Y:10.0};
const PK_NT = {A:7.59, M:7.00, S:6.93, P:8.36, T:6.82, V:7.44, E:7.70};
const PK_CT = {D:4.55, E:4.75};

const FP = {A:0.31,R:-1.01,N:-0.60,D:-0.77,C:1.54,Q:-0.22,E:-0.64,G:0.00,H:0.13,
  I:1.80,L:1.70,K:-0.99,M:1.23,F:1.79,P:0.72,S:-0.04,T:0.26,W:2.25,Y:0.96,V:1.22};
const KD = {A:1.8,R:-4.5,N:-3.5,D:-3.5,C:2.5,Q:-3.5,E:-3.5,G:-0.4,H:-3.2,I:4.5,
  L:3.8,K:-3.9,M:1.9,F:2.8,P:-1.6,S:-0.8,T:-0.7,W:-0.9,Y:-1.3,V:4.2};
const BOMAN = {L:4.92,I:4.92,V:4.04,F:2.98,M:2.35,W:2.33,A:1.81,C:1.28,G:0.94,
  Y:-0.14,T:-2.57,S:-3.40,H:-4.66,Q:-5.54,K:-5.55,N:-6.64,E:-6.81,D:-8.72,
  R:-14.92,P:0.0};

const HYDRO_SET = 'ACFILMVW';          // hidrofobik oran tanımı
const CLS = s => 'KRH'.includes(s) ? 'cat' : 'DE'.includes(s) ? 'ani'
  : s === 'C' ? 'cys' : HYDRO_SET.includes(s) ? 'hyd' : 'pol';

function cleanSeq(raw) {
  const up = (raw || '').toUpperCase();
  let seq = '', bad = 0;
  for (const ch of up) {
    if (AAs.includes(ch)) seq += ch;
    else if (/[A-Z]/.test(ch)) bad++;
  }
  return { seq, bad };
}

function netCharge(seq, pH, freeCys) {
  if (!seq.length) return 0;
  const nt = PK_NT[seq[0]] ?? 7.5, ct = PK_CT[seq[seq.length - 1]] ?? 3.55;
  let q = 1 / (1 + Math.pow(10, pH - nt)) - 1 / (1 + Math.pow(10, ct - pH));
  for (const a of seq) {
    if (a === 'K' || a === 'R' || a === 'H') q += 1 / (1 + Math.pow(10, pH - PK[a]));
    else if (a === 'D' || a === 'E' || a === 'Y') q -= 1 / (1 + Math.pow(10, PK[a] - pH));
    else if (a === 'C' && freeCys) q -= 1 / (1 + Math.pow(10, PK.C - pH));
  }
  return q;
}

function isoelectric(seq, freeCys) {
  let lo = 0, hi = 14;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (netCharge(seq, mid, freeCys) > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/* delta = ardışık kalıntılar arası açı (α-heliks için 100°) */
function moment(seq, scale, delta = 100) {
  if (!seq.length) return { H: 0, muH: 0, ang: 0 };
  let s = 0, c = 0, sum = 0;
  for (let i = 0; i < seq.length; i++) {
    const v = scale[seq[i]], a = (delta * i) * Math.PI / 180;
    s += v * Math.sin(a); c += v * Math.cos(a); sum += v;
  }
  return { H: sum / seq.length, muH: Math.hypot(s, c) / seq.length,
           ang: Math.atan2(s, c) };
}

function profile(seq, bridged) {
  const n = seq.length;
  if (!n) return null;
  const nCys = (seq.match(/C/g) || []).length;
  const ss = bridged ? Math.floor(nCys / 2) : 0;
  const freeCys = !bridged;
  let avg = H2O_A - ss * 2 * H_A, mono = H2O_M - ss * 2 * H_M;
  let hyd = 0, gravy = 0, boman = 0, nA = 0, nV = 0, nIL = 0, nW = 0, nY = 0;
  for (const a of seq) {
    avg += M_AVG[a]; mono += M_MONO[a];
    if (HYDRO_SET.includes(a)) hyd++;
    gravy += KD[a]; boman += BOMAN[a];
    if (a === 'A') nA++; else if (a === 'V') nV++;
    else if (a === 'I' || a === 'L') nIL++;
    else if (a === 'W') nW++; else if (a === 'Y') nY++;
  }
  return {
    n, seq, ss,
    avg, mono,
    charge: netCharge(seq, 7.4, freeCys),
    pI: isoelectric(seq, freeCys),
    hyd: hyd / n * 100,
    ali: (nA + 2.9 * nV + 3.9 * nIL) / n * 100,
    gravy: gravy / n,
    boman: -boman / n,
    ext: nW * 5500 + nY * 1490 + ss * 125,
    fp: moment(seq, FP)
  };
}

const PRESETS = {
  aurelin:  'AACSDRAHGHICESFKSFCKDSGRNGVKLRANCKKTCGLC',
  magainin: 'GIGKFLHSAKKFGKAFVGEIMNS',
  melittin: 'GIGAVLKVLTTGLPALISWIKRKRQQ',
  ll37:     'LLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTES'
};
