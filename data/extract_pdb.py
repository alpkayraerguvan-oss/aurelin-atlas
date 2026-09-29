# -*- coding: utf-8 -*-
"""PDB 2LG4 (aurelin çözelti NMR yapısı) -> kompakt JSON."""
import json

AA3 = {'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C', 'GLN': 'Q',
       'GLU': 'E', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LEU': 'L', 'LYS': 'K',
       'MET': 'M', 'PHE': 'F', 'PRO': 'P', 'SER': 'S', 'THR': 'T', 'TRP': 'W',
       'TYR': 'Y', 'VAL': 'V'}

models = []          # her model: {resi: {atom: (x,y,z)}}
cur = None
for line in open('2LG4.pdb', encoding='utf-8'):
    if line.startswith('MODEL'):
        cur = {}
    elif line.startswith('ENDMDL'):
        models.append(cur)
        cur = None
    elif line.startswith('ATOM') and cur is not None:
        name = line[12:16].strip()
        elem = (line[76:78].strip() or name[0]).upper()
        if elem == 'H':
            continue                      # hidrojenleri at
        resn, resi = line[17:20].strip(), int(line[22:26])
        x, y, z = float(line[30:38]), float(line[38:46]), float(line[46:54])
        cur.setdefault(resi, {'resn': resn, 'atoms': {}})
        cur[resi]['atoms'][name] = (x, y, z)

print('model sayısı:', len(models), '| kalıntı:', len(models[0]))
seq = ''.join(AA3[models[0][i]['resn']] for i in sorted(models[0]))
print('dizi:', seq, len(seq))
assert seq == 'AACSDRAHGHICESFKSFCKDSGRNGVKLRANCKKTCGLC'

# --- model 1: tüm ağır atomlar, merkeze taşınmış
m1 = models[0]
order = sorted(m1)
atoms = []
for resi in order:
    r = m1[resi]
    for name, (x, y, z) in r['atoms'].items():
        atoms.append([name, resi, AA3[r['resn']], x, y, z])

cx = sum(a[3] for a in atoms) / len(atoms)
cy = sum(a[4] for a in atoms) / len(atoms)
cz = sum(a[5] for a in atoms) / len(atoms)
rad = max(((a[3] - cx) ** 2 + (a[4] - cy) ** 2 + (a[5] - cz) ** 2) ** .5
          for a in atoms)
print(f'merkez=({cx:.2f},{cy:.2f},{cz:.2f}) yarıçap={rad:.2f} Å  atom={len(atoms)}')

data = {
    'pdb': '2LG4', 'seq': seq, 'nModels': len(models),
    'radius': round(rad, 2),
    'names': [a[0] for a in atoms],
    'resi': [a[1] for a in atoms],
    'elem': [a[0][0] if a[0][0] in 'NCOS' else 'C' for a in atoms],
    'xyz': [round(v, 2) for a in atoms
            for v in (a[3] - cx, a[4] - cy, a[5] - cz)],
    # 20 modelin CA izi (topluluk görünümü)
    'ens': [[round(v, 1) for resi in order
             for v in (m[resi]['atoms']['CA'][0] - cx,
                       m[resi]['atoms']['CA'][1] - cy,
                       m[resi]['atoms']['CA'][2] - cz)] for m in models],
    'ss': [[3, 40], [12, 33], [19, 37]],          # dislfit köprüleri
    'helix': [[9, 15], [23, 33]],                  # PDB HELIX kayıtları
    # UniProt Q0MWV8 SITE açıklamaları (olgun peptit numaralandırması)
    'iface_pos': [6, 8, 10, 24, 28],               # misel yüzeyine uzanan (+)
    'iface_hyd': [11, 15, 27, 29],                 # bağlanma arayüzü (hidrofobik)
}
json.dump(data, open('aurelin.json', 'w'), separators=(',', ':'))
print('aurelin.json yazıldı:',
      len(open('aurelin.json', 'rb').read()) / 1024, 'KB')

# doğrulama: dislfit S–S mesafeleri
for a, b in data['ss']:
    p, q = m1[a]['atoms']['SG'], m1[b]['atoms']['SG']
    d = sum((p[i] - q[i]) ** 2 for i in range(3)) ** .5
    print(f'  S–S  Cys{a}–Cys{b}: {d:.2f} Å')
