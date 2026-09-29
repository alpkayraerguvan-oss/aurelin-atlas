# Aurelin Atlas

*Aurelia aurita* (ay denizanası) kaynaklı antimikrobiyal peptit **aurelinin**
çözelti NMR yapısını, fizikokimyasal profilini ve membran seçiciliğini
anlatan etkileşimli, üç dilli (TR / EN / EL) tek sayfalık bir site.

TÜBİTAK 2204-A Lise Öğrencileri Araştırma Projeleri Yarışması kapsamında
yürütülen *"Aurelia aurita mukus ve nematokistlerinden elde edilen
antimikrobiyal peptitlerin izolasyonu ve LC-MS/MS ile karakterizasyonu"*
projesinin tanıtım sayfasıdır.

## Sayfada ne var

| Bölüm | İçerik |
|---|---|
| **Yapı** | PDB **2LG4**'ün gerçek atom koordinatlarıyla çizilen, döndürülebilir 3B görüntüleyici. Tüp / çubuk / 20 modelli NMR topluluğu gösterimleri; özellik, ikincil yapı ve N→C renklendirmesi; üç disülfit köprüsü ve UniProt'ta işaretli dokuz misel-bağlanma kalıntısı. |
| **Profil** | Tarayıcıda çalışan peptit hesaplayıcı: kütle, net yük, teorik pI, hidrofobik oran, alifatik indeks, GRAVY, Boman indeksi, ε₂₈₀. Helisel tekerlek (hidrofobik moment vektörüyle) ve yüke karşı pH eğrisi. |
| **Seçicilik** | Katyonik peptidin anyonik bakteri zarıyla etkileşip zwitteriyonik memeli zarıyla etkileşmemesini anlatan şematik animasyon. |
| **Yöntem** | İzolasyon zincirinin yedi adımı (ekstraksiyon → jel filtrasyon → RP-HPLC → SDS-PAGE → MIC/MBC → LC-MS/MS → in-siliko), her biri kendi animasyonuyla. |

## Veri kaynakları ve doğruluk

Sayfadaki üç boyutlu yapı ve kalıntı açıklamaları **uydurma değildir**;
kamuya açık veri tabanlarından alınmıştır:

- **RCSB PDB [2LG4](https://www.rcsb.org/structure/2LG4)** — aurelinin 20
  modelli çözelti NMR yapısı (Shenkarev ve ark., 2012).
- **UniProt [Q0MWV8](https://www.uniprot.org/uniprotkb/Q0MWV8/entry)** —
  disülfit köprüleri, α-heliks sınırları ve misel bağlanma arayüzü kalıntıları.

Hesap motoru yayımlanmış ölçekleri kullanır (Bjellqvist pKa, Fauchère–Pliska,
Kyte–Doolittle, Ikai, Boman) ve çıktıları **ExPASy ProtParam** ile
karşılaştırılarak doğrulanmıştır. Aurelin için, sisteinler indirgenmiş
kabul edildiğinde:

| Büyüklük | Bu sayfa | ExPASy ProtParam |
|---|---|---|
| Molekül ağırlığı | 4302,97 Da | 4302,97 Da |
| Teorik pI | 9,13 | 9,13 |
| Alifatik indeks | 46,50 | 46,50 |
| GRAVY | −0,458 | −0,458 |
| ε₂₈₀ (sistinli) | 375 M⁻¹cm⁻¹ | 375 M⁻¹cm⁻¹ |

`data/ref_calc.py`, aynı hesapların bağımsız bir Python sürümüdür; JavaScript
motoruyla birebir aynı sonucu verir.

**Şeffaflık notu:** Membran seçiciliği bölümündeki animasyon şematiktir —
bir simülasyonun çıktısı değil, deneysel gözlemin anlatımıdır. Yöntem
akışındaki in-siliko kenetlenme enerjileri de proje belgelerindeki
**öngörü aralıklarıdır**, ölçülmüş veri değildir; sayfada bu şekilde
etiketlenmiştir. Proje henüz uygulama aşamasında olduğundan sayfada projenin
kendi deneysel verisi yer almaz.

## Yapı

Site tek, bağımsız bir `index.html` dosyasıdır (~116 KB). Derleme adımı
yalnızca kaynakları birleştirir; paket yöneticisi ya da bağımlılık yoktur.

```
index.html          derlenmiş sayfa (yayımlanan dosya)
build.py            src/ + data/aurelin.json -> index.html
src/
  p1_head.html      başlık, yazı tipleri, CSS (tasarım kodları)
  p2_body.html      sayfa iskeleti
  p4_i18n.js        TR / EN / EL metinleri (dil başına 121 anahtar)
  p4b_util.js       tuval, tema ve sayı biçimi yardımcıları
  p5_calc.js        peptit kimyası (ProtParam uyumlu)
  p6_viewer.js      3B molekül görüntüleyici (bağımlılıksız)
  p7_charts.js      helisel tekerlek ve yük eğrisi
  p8_anim.js        membran ve yöntem animasyonları
  p9_main.js        dil, olaylar, açılış
data/
  2LG4.pdb          RCSB'den indirilen ham yapı
  extract_pdb.py    PDB -> aurelin.json (koordinat çıkarımı)
  aurelin.json      sayfaya gömülen kompakt veri
  ref_calc.py       hesapların Python referansı
```

Yeniden derlemek için:

```bash
python build.py
```

Harici bir kütüphane kullanılmaz; 3B görüntüleyici, grafikler ve animasyonlar
Canvas 2B üzerine sıfırdan yazılmıştır. Tek dış kaynak Google Fonts'tur
(Literata, IBM Plex Sans, IBM Plex Mono).

## Kaynaklar

1. Shenkarev, Z. O., Panteleev, P. V., Balandin, S. V., Gizatullina, A. K.,
   Altukhov, D. A., Finkina, E. I., Kokryakov, V. N., Arseniev, A. S., &
   Ovchinnikova, T. V. (2012). Recombinant expression and solution structure of
   antimicrobial peptide aurelin from jellyfish *Aurelia aurita*.
   *Biochemical and Biophysical Research Communications, 429*(1–2), 63–69.
   <https://doi.org/10.1016/j.bbrc.2012.10.092>
2. Ovchinnikova, T. V., Balandin, S. V., Aleshina, G. M., Tagaev, A. A.,
   Leonova, Y. F., Krasnodembsky, E. D., Men'shenin, A. V., & Kokryakov, V. N.
   (2006). Aurelin, a novel antimicrobial peptide from jellyfish
   *Aurelia aurita* with structural features of defensins and channel-blocking
   toxins. *Biochemical and Biophysical Research Communications, 348*(2),
   514–523. <https://doi.org/10.1016/j.bbrc.2006.07.078>
3. Gasteiger, E. ve ark. (2005). Protein identification and analysis tools on
   the ExPASy server. *The Proteomics Protocols Handbook*, 571–607.
4. Fauchère, J.-L., & Pliška, V. (1983). *European Journal of Medicinal
   Chemistry, 18*, 369–375. · Eisenberg, D. ve ark. (1982). *Nature, 299*,
   371–374.
5. Bjellqvist, B. ve ark. (1993). *Electrophoresis, 14*(1), 1023–1031.
6. Kyte, J., & Doolittle, R. F. (1982). *Journal of Molecular Biology, 157*(1),
   105–132. · Ikai, A. (1980). *Journal of Biochemistry, 88*(6), 1895–1898. ·
   Boman, H. G. (2003). *Journal of Internal Medicine, 254*(3), 197–215.

Yapı koordinatları RCSB PDB'den, açıklamalar UniProt'tan alınmıştır; her ikisi
de serbestçe kullanılabilir. Bu deponun kendi kodu proje ekibine aittir.
