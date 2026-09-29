# -*- coding: utf-8 -*-
"""Parçaları tek, bağımsız bir HTML dosyasında birleştirir."""
import json
import pathlib

SRC = pathlib.Path('src')
OUT = pathlib.Path('.')

head = (SRC / 'p1_head.html').read_text(encoding='utf-8')
body = (SRC / 'p2_body.html').read_text(encoding='utf-8')
mol = json.loads(pathlib.Path('data/aurelin.json').read_text(encoding='utf-8'))
js = '\n'.join((SRC / f).read_text(encoding='utf-8') for f in [
    'p4_i18n.js', 'p4b_util.js', 'p5_calc.js', 'p6_viewer.js',
    'p7_charts.js', 'p8_anim.js', 'p9_main.js'])

DESC = ('Aurelia aurita kaynaklı antimikrobiyal peptit aurelinin çözelti NMR '
        'yapısı (PDB 2LG4), fizikokimyasal profili ve membran seçiciliği — '
        'etkileşimli, üç dilli bir TÜBİTAK 2204-A proje sayfası.')

ICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' "
        "viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' "
        "fill='%230A6C70'/%3E%3Cpath d='M8 23c3-2 3-5 0-7s-3-5 0-7' "
        "stroke='%237EDED6' stroke-width='2.4' fill='none' "
        "stroke-linecap='round'/%3E%3Cpath d='M17 23c3-2 3-5 0-7s-3-5 0-7' "
        "stroke='%23EBC93F' stroke-width='2.4' fill='none' "
        "stroke-linecap='round'/%3E%3Ccircle cx='24.5' cy='9.5' r='2.2' "
        "fill='%235AA9EC'/%3E%3C/svg%3E")

RESET = """
html{-webkit-text-size-adjust:100%}
:root{padding-top:env(safe-area-inset-top,0px);
  padding-bottom:env(safe-area-inset-bottom,0px)}
img{max-width:100%;height:auto}
[hidden]{display:none!important}
::selection{background:var(--accent);color:var(--on-accent)}
html{scroll-behavior:smooth}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
"""

doc = f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{DESC}">
<meta name="color-scheme" content="light dark">
<meta name="author" content="TÜBİTAK 2204-A">
<meta property="og:type" content="website">
<meta property="og:title" content="Aurelin Atlas">
<meta property="og:description" content="{DESC}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="{ICON}">
{head}
<style>{RESET}</style>
</head>
<body>
{body}
<script>
/* Aurelin Atlas — veriler: RCSB PDB 2LG4 (Shenkarev ve ark., 2012),
   UniProt Q0MWV8. Hesap ölçekleri kaynakçada listelenmiştir. */
const AURELIN = {json.dumps(mol, separators=(',', ':'), ensure_ascii=False)};
{js}
</script>
</body>
</html>
"""

p = OUT / 'index.html'
p.write_text(doc, encoding='utf-8')
print(f'{p} yazıldı — {len(doc.encode("utf-8")) / 1024:.1f} KB')
