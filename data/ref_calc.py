# -*- coding: utf-8 -*-
"""Sayfadaki JS hesaplarının Python referans sürümü (çapraz doğrulama için)."""
import math

AVG = dict(A=71.0788, R=156.1875, N=114.1038, D=115.0886, C=103.1388,
           E=129.1155, Q=128.1307, G=57.0519, H=137.1411, I=113.1594,
           L=113.1594, K=128.1741, M=131.1926, F=147.1766, P=97.1167,
           S=87.0782, T=101.1051, W=186.2132, Y=163.1760, V=99.1326)
MONO = dict(A=71.03711, R=156.10111, N=114.04293, D=115.02694, C=103.00919,
            E=129.04259, Q=128.05858, G=57.02146, H=137.05891, I=113.08406,
            L=113.08406, K=128.09496, M=131.04049, F=147.06841, P=97.05276,
            S=87.03203, T=101.04768, W=186.07931, Y=163.06333, V=99.06841)
H2O_AVG, H2O_MONO, H_AVG, H_MONO = 18.01528, 18.010565, 1.00794, 1.007825

# Bjellqvist (ExPASy) — uç gruplar kalıntıya bağlı
BJ = dict(C=9.0, D=4.05, E=4.45, H=5.98, K=10.0, R=12.0, Y=10.0)
BJ_NT = dict(A=7.59, M=7.00, S=6.93, P=8.36, T=6.82, V=7.44, E=7.70)
BJ_CT = dict(D=4.55, E=4.75)
EMBOSS = dict(C=8.5, D=3.9, E=4.1, H=6.5, K=10.8, R=12.5, Y=10.1, NT=8.6, CT=3.6)

FP = dict(A=0.31, R=-1.01, N=-0.60, D=-0.77, C=1.54, Q=-0.22, E=-0.64, G=0.00,
          H=0.13, I=1.80, L=1.70, K=-0.99, M=1.23, F=1.79, P=0.72, S=-0.04,
          T=0.26, W=2.25, Y=0.96, V=1.22)
EIS = dict(A=0.62, R=-2.53, N=-0.78, D=-0.90, C=0.29, Q=-0.85, E=-0.74, G=0.48,
           H=-0.40, I=1.38, L=1.06, K=-1.50, M=0.64, F=1.19, P=0.12, S=-0.18,
           T=-0.05, W=0.81, Y=0.26, V=1.08)
KD = dict(A=1.8, R=-4.5, N=-3.5, D=-3.5, C=2.5, Q=-3.5, E=-3.5, G=-0.4, H=-3.2,
          I=4.5, L=3.8, K=-3.9, M=1.9, F=2.8, P=-1.6, S=-0.8, T=-0.7, W=-0.9,
          Y=-1.3, V=4.2)
BOMAN = dict(L=4.92, I=4.92, V=4.04, F=2.98, M=2.35, W=2.33, A=1.81, C=1.28,
             G=0.94, Y=-0.14, T=-2.57, S=-3.40, H=-4.66, Q=-5.54, K=-5.55,
             N=-6.64, E=-6.81, D=-8.72, R=-14.92, P=0.0)


def masses(seq, ss=0):
    avg = sum(AVG[a] for a in seq) + H2O_AVG - ss * 2 * H_AVG
    mono = sum(MONO[a] for a in seq) + H2O_MONO - ss * 2 * H_MONO
    return avg, mono


def charge(seq, pH, pk='BJ', free_cys=True):
    if pk == 'BJ':
        pkd = dict(BJ)
        nt, ct = BJ_NT.get(seq[0], 7.5), BJ_CT.get(seq[-1], 3.55)
    else:
        pkd = {k: v for k, v in EMBOSS.items() if len(k) == 1}
        nt, ct = EMBOSS['NT'], EMBOSS['CT']
    pos = 1 / (1 + 10 ** (pH - nt))
    neg = -1 / (1 + 10 ** (ct - pH))
    for a in seq:
        if a in 'KRH':
            pos += 1 / (1 + 10 ** (pH - pkd[a]))
        elif a in 'DEY' or (a == 'C' and free_cys):
            neg += -1 / (1 + 10 ** (pkd[a] - pH))
    return pos + neg


def pI(seq, **kw):
    lo, hi = 0.0, 14.0
    for _ in range(100):
        mid = (lo + hi) / 2
        if charge(seq, mid, **kw) > 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def moment(seq, scale, delta=100):
    s = c = 0.0
    for i, a in enumerate(seq):
        ang = math.radians(delta * i)
        s += scale[a] * math.sin(ang)
        c += scale[a] * math.cos(ang)
    n = len(seq)
    return sum(scale[a] for a in seq) / n, math.hypot(s, c) / n


def report(name, seq, ss=0):
    n = len(seq)
    avg, mono = masses(seq, ss)
    comp = {a: seq.count(a) for a in sorted(set(seq))}
    hyd = sum(seq.count(a) for a in 'ACFILMVW') / n * 100
    ali = (seq.count('A') + 2.9 * seq.count('V')
           + 3.9 * (seq.count('I') + seq.count('L'))) / n * 100
    gravy = sum(KD[a] for a in seq) / n
    boman = -sum(BOMAN[a] for a in seq) / n
    eps = seq.count('W') * 5500 + seq.count('Y') * 1490 + ss * 125
    print(f'=== {name} ({n} aa, {ss} S–S)')
    print(f'  kompozisyon: {comp}')
    print(f'  kütle ort. {avg:.2f} Da | mono {mono:.4f} Da | [M+H]+ ort. {avg + H_AVG:.2f}')
    print(f'  kütle (tüm Cys indirgenmiş) ort. {masses(seq, 0)[0]:.2f}')
    for pk in ('BJ', 'EMBOSS'):
        for fc in (True, False):
            if fc is False and ss == 0:
                continue
            print(f'  {pk:<6} serbest Cys={fc!s:<5}: yük(pH 7,4)={charge(seq, 7.4, pk, fc):+.2f}  '
                  f'yük(pH 7,0)={charge(seq, 7.0, pk, fc):+.2f}  pI={pI(seq, pk=pk, free_cys=fc):.2f}')
    print(f'  hidrofobik oran (ACFILMVW) %{hyd:.1f} | alifatik indeks {ali:.2f} | '
          f'GRAVY {gravy:.3f} | Boman {boman:.2f} kcal/mol | ε280 {eps}')
    H, muH = moment(seq, FP)
    He, muHe = moment(seq, EIS)
    print(f'  Fauchère–Pliska: <H>={H:.3f} <µH>={muH:.3f} | Eisenberg: <H>={He:.3f} <µH>={muHe:.3f}')


AUR = 'AACSDRAHGHICESFKSFCKDSGRNGVKLRANCKKTCGLC'
report('Aurelin', AUR, ss=3)
for lab, (a, b) in (('Aurelin heliks 1 (9–15)', (9, 15)),
                    ('Aurelin heliks 2 (23–33)', (23, 33))):
    sub = AUR[a - 1:b]
    H, mu = moment(sub, FP)
    print(f'--- {lab}: {sub}  FP <H>={H:.3f} <µH>={mu:.3f}')
report('Magainin 2', 'GIGKFLHSAKKFGKAFVGEIMNS')
report('Melittin', 'GIGAVLKVLTTGLPALISWIKRKRQQ')
report('LL-37', 'LLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTES')
