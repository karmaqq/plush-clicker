# Plush Clicker — Oyun İstatistikleri ve Denge Dokümantasyonu

Bu doküman, **uygulanmış denge değerlerini** gösterir. `js/buildings.js`, `js/resources.js`, `js/industry.js` kod dosyalarıyla senkron tutulur; bir değer değiştiğinde kod da bu dokümana göre güncellenmelidir.

Kaynak değerleri `js/buildings.js`, `js/resources.js`, `js/packs.js`, `js/industry.js`, `js/game-state.js` temel alınarak hazırlanmıştır.

---

## 1. Genel Bakış

| Özellik | Değer |
|---|---|
| Oyun başlangıcı | 40 Güç (kayıt yoksa) |
| Tick hızı | 5 tick/saniye (`TICK_MS = 200 ms`) |
| Kayıt | localStorage, anahtar `plush-clicker:state-v8` |
| Kayıt aralığı | değişiklik sonrası 500 ms gecikmeli |
| Para birimi | Altın (🪙) |
| Gösterim formatı | tr-TR, 2 ondalık (`formatNumber`) |
| Roset seviyesi (badge) | ≥200 → 5, ≥100 → 4, ≥50 → 3, ≥25 → 2, ≥10 → 1, aksi 0 |

**Çekirdek döngü:**
- Üretici binalar ham kaynak üretir → kapasiteye kadar birikir.
- Sanayi tesisleri işçilerle üretir → girdi harcar, çıktı verir.
- Nüfus kaynak tüketir (mutluluk hedefini belirler) ve göç ile büyür.
- İşlenmiş/craft ürünler Altın'a satılır; Altın da nüfusu mutlu eder.

### 1.1 Değişiklik Özeti (yeni denge)

| Konu | Eski | Yeni |
|---|---|---|
| Güç Ocağı üretimi | 0.04 | **0.60** |
| Üretici üretimleri | 0.00003 – 0.04 | **0.01 – 0.60** (0.60→0.01 dengeli merdiven) |
| En değerli üretim kaynağı | — | **İpek (0.01)** |
| Tüm bina maliyet çarpanı | 1.12 / 1.15 / 1.30 karışık | **1.15** |
| Bonus binaların çarpanı | 1.15 | **1.75** |
| Konut (Baraka/Ev) çarpanı | 1.30 | **2.5** |
| Bonus binaların bonusu | %15/seviye | **%2/seviye** |
| Ambar kilidi | 10 Depo | **1 Tarla** |
| Kaynak başlangıç kapasitesi | 40 – 2500 (karışık) | **Ham 200 · İpek 4** (tier'a göre düz) |
| Depo/Ambar kapasite katkısı | 250 / 125 … | **5 / 10 / 25 / 50 / 100** (kaynak değerine göre) |
| Sanayi girdi/çıktıları | 0.0000008 – 0.06 | **0.01 – 0.08** gibi net değerler (değer esaslı kar) |
| Paket kilitleri | önceki paket | **yalnızca bir önceki paketin satın alımı** |
| Bina maliyetlerinde güç dengesi | 500.000 Güç + 150 Su gibi uçurum | güç ile diğer kaynaklar **orantılı** |

---

## 2. Kaynaklar

### 2.1 Taban Kapasiteler (yeni)

| id | Ad | Emoji | Tier | Nadirlik | Taban Kapasite |
|---|---|---|---|---|---|
| power | Güç | 🏆 | raw | 1 | ∞ |
| altin | Altın | 🪙 | currency | 1 | ∞ |
| su | Su | 💧 | raw | 1 | 200 |
| yiyecek | Yiyecek | 🌾 | raw | 1 | 200 |
| odun | Odun | 🪵 | raw | 1 | 200 |
| tas | Taş | ⛰️ | raw | 1 | 200 |
| maden | Mineral | ⛏️ | raw | 1 | 200 |
| bilgi | Bilgi | 📖 | raw | 1 | 200 |
| inanc | İnanç | 🕯️ | raw | 1 | 200 |
| baharat | Baharat | 🌶️ | raw | 3 | 20 |
| sarap | Şarap | 🍷 | raw | 3 | 20 |
| ipek | İpek | 🧵 | raw | 4 | **4** |
| ekmek | Ekmek | 🍞 | processed | 2 | 500 |
| kereste | Kereste | 🪚 | processed | 2 | 500 |
| demir | Demir | ⚙️ | processed | 2 | 500 |
| kumas | Kumaş | 🧶 | processed | 3 | 100 |
| konyak | Konyak | 🥃 | processed | 4 | 50 |
| mermer | Mermer | 🗿 | processed | 4 | 50 |
| ilac | İlaç | 💊 | craft | 3 | 100 |
| celik | Çelik | 🔩 | craft | 4 | 50 |
| mobilya | Mobilya | 🛋️ | craft | 5 | 20 |
| heykel | Heykel | 🏛️ | craft | 5 | 20 |
| mucevher | Mücevher | 💎 | craft | 5 | 20 |

> Kural: aynı tier'daki kaynaklar aynı taban kapasiteyi kullanır. İstisna: nadir hamlar (Baharat/Şarap 20) ve en değerli kaynak olan İpek (4).

### 2.2 Depo / Ambar Katkıları (yeni)

| Kaynak | Depo başına | Ambar başına |
|---|---|---|
| Su, Yiyecek, Odun, Taş, Mineral, Bilgi, İnanç | 100 | 50 |
| Ekmek | 100 | 50 |
| Kereste, Demir | 50 | 25 |
| Baharat, Şarap | 25 | 12 |
| İlaç, Kumaş | 25 | 12 |
| Konyak, Çelik, Mermer | 10 | 5 |
| İpek | 5 | 2 |
| Mobilya, Heykel, Mücevher | 5 | 2 |

> Ölçek: kaynağın değeri arttıkça depolama katkısı azalır (5 / 10 / 25 / 50 / 100).

### 2.3 Satış Fiyatları (değişmedi)

| Kaynak | Fiyat | Kaynak | Fiyat |
|---|---|---|---|
| Ekmek | 1 | Konyak | 12 |
| Kereste | 2 | Çelik | 15 |
| Şarap | 2 | Mermer | 20 |
| Demir | 3 | Mobilya | 30 |
| İpek | 4 | Mücevher | 50 |
| İlaç | 6 | Heykel | 60 |
| Kumaş | 7 | | |

---

## 3. Binalar

### 3.1 Maliyet Çarpanları (yeni)

| Bina Türü | Çarpan |
|---|---|
| Üretici / Depo / İndirim / Depolama / İşçi bonusu | ×1.15 |
| Bonus binalar | ×1.75 |
| Konutlar (Baraka, Ev) | ×2.50 |
| Sanayi (tek seferlik) | çarpansız |
| Paketler | ×1.17 / ×1.22 / ×1.25 |

### 3.2 Üretici (producer) Binalar — üretim merdiveni 0.60 → 0.01

> Güç ve Su üreten binalar yalnızca Güç ile gelişir. Diğerleri üretim zincirindeki sıralarına göre uygun kaynak karışımıyla inşa edilir. Maliyetlerde güç ile diğer kaynaklar arasında uçurum yoktur (ör. 500.000 Güç + 150 Su gibi dengesizlik yok).

| Bina (id) | Üretim/sn | Çıktı | Yeni Maliyet | Parça |
|---|---|---|---|---|
| Güç Ocağı (`fountain`) | **0.60** | Güç | 10 Güç | 1 |
| Kuyu (`well`) | 0.30 | Su | 100 Güç | 1 |
| Tarla (`farm`) | 0.15 | Yiyecek | 300 Güç + 20 Su | 2 |
| Oduncu (`lumberjack`) | 0.08 | Odun | 400 Güç + 50 Yiyecek | 2 |
| Taş Ocağı (`tasOcagi`) | 0.04 | Taş | 600 Güç + 40 Odun | 2 |
| Maden (`mine`) | 0.02 | Mineral | 1200 Güç + 80 Odun + 20 Taş | 3 |
| Akademi (`academy`) | 0.04 | Bilgi | 2500 Güç + 120 Mineral + 50 Taş | 3 |
| Tapınak (`temple`) | 0.02 | İnanç | 5000 Güç + 200 Bilgi + 100 Taş | 3 |
| Bahçe (`garden`) | 0.01 | Baharat | 10000 Güç + 300 İnanç + 50 Taş | 3 |
| Üzüm Bağı (`vineyard`) | 0.01 | Şarap | 20000 Güç + 100 Mineral + 200 Odun | 3 |
| İpek Atölyesi (`silkWorkshop`) | **0.01** | İpek | 40000 Güç + 200 Su + 150 Odun | 3 |

Kilitler değişmedi: Güç Ocağı 5 Güç · Kuyu 10 Güç Ocağı · Tarla 10 Kuyu · Oduncu 10 Tarla · Taş Ocağı 1 Keresteci · Maden 8 Oduncu · Akademi 8 Maden · Tapınak 10 Akademi · Bahçe 10 Tapınak · Üzüm Bağı 8 Bahçe · İpek Atölyesi 8 Üzüm Bağı.

### 3.3 Bonus Binalar (bonus) — çarpan ×1.75, bonus %2/seviye

> Bonus binalar artık %15 değil, **her seviyede %2** bonus verir. Kendi hedef kaynağına bonus uygular.

| Bina (id) | Hedef | Bonus/seviye | Yeni Maliyet | Parça |
|---|---|---|---|---|
| Kumandanlık (`mansion`) | Güç | %2 | 50 Güç | 1 |
| Çeşme (`aqueduct`) | Su | %2 | 250 Güç + 30 Su | 2 |
| Değirmen (`mill`) | Yiyecek | %2 | 600 Güç + 40 Su + 20 Yiyecek | 3 |
| Keresteci (`lumbermill`) | Odun | %2 | 1500 Güç + 80 Yiyecek + 30 Odun | 3 |
| Taş Atölyesi (`tasAtolyesi`) | Taş | %2 | 2500 Güç + 80 Odun + 15 Taş | 3 |
| Sunak (`altar`) | İnanç | %2 | 35000 Güç + 1200 Bilgi + 250 İnanç + 100 Taş | 4 |
| Baharat Değirmeni (`spiceMill`) | Baharat | %2 | 90000 Güç + 900 İnanç + 5 Baharat + 100 Taş | 4 |

Kilitler değişmedi: Kumandanlık 5 Güç Ocağı · Çeşme 5 Kuyu · Değirmen 5 Tarla · Keresteci 1 Oduncu · Taş Atölyesi 1 Taş Ocağı · Sunak 5 Tapınak · Baharat Değirmeni 5 Bahçe.

### 3.4 Maliyet İndirimi Binaları (costBonus)

| Bina (id) | İndirim/seviye | Yeni Maliyet | Parça |
|---|---|---|---|
| Eritme Ocağı (`smeltery`) | %2 (min %50'ye kadar) | 6000 Güç + 250 Odun + 60 Mineral + 30 Taş | 4 |
| Dokuma Tezgahı (`loom`) | %2 (min %50'ye kadar) | 250000 Güç + 400 Odun + 2 İpek + 200 Taş | 4 |

Kilitler değişmedi: Eritme Ocağı 5 Maden · Dokuma Tezgahı 1 İpek Atölyesi.

### 3.5 Depolama Binaları

| Bina (id) | Tür | Yeni Maliyet | Parça | Görev |
|---|---|---|---|---|
| Depo (`depo`) | storage | 500 Güç + 20 Su | 2 | kaynağın `storagePerDepo` değeri kadar kapasite ekler |
| Ambar (`ambar`) | capacityBonus | 1500 Güç + 80 Su + 40 Yiyecek | 3 | `storagePerAmbar` kadar kapasite + **%5/seviye** çarpımsal kapasite |
| Şaraphane (`winery`) | storageBonus | 200000 Güç + 150 Mineral + 4 Şarap + 150 Taş | 4 | tüm kapasiteleri **%5/seviye** artırır |

Kilitler: Depo 1 Kuyu · **Ambar 1 Tarla** (yeni) · Şaraphane 1 Üzüm Bağı.

> Ambar kilidi eski halde "10 Depo" iken artık **1 adet Tarla** binasına bağlıdır.

### 3.6 İşçi Bonus Binası (workerBonus)

**Kütüphane** (`library`)
- Maliyet: 20000 Güç + 400 Mineral + 100 Bilgi + 60 Taş (4 parça) · Çarpan: ×1.15
- Bonus: tüm sanayi çıktısı **%10/seviye**
- Kilit: 5 Akademi

### 3.7 Konut Binaları (housing) — çarpan ×2.5

| Bina (id) | Konut Kapasitesi | Maliyet | Parça |
|---|---|---|---|
| Baraka (`baraka`) | 1 kişi | 100 Güç + 20 Su | 2 |
| Ev (`ev`) | 2 kişi | 800 Güç + 40 Yiyecek + 20 Odun + 15 Taş | 4 |

Kilitler değişmedi: Baraka 5 Güç Ocağı · Ev 10 Baraka.

---

## 4. Sanayi Binaları (Industry)

Sanayi binaları tek seferlik inşa edilir (`built`), maliyeti çarpansızdır (`ceil`). İşçiler atanır (`maxWorkers` sınırı) ve girdi mevcutken üretir.

> **Yeni girdi/çıktı kuralı:** değerler "insani" ve nettir (0.01 / 0.02 / 0.04 / 0.08 gibi, saniyede işçi başına). Oyun motoru oranları saniye başına uyguladığı için ham reçete oranları (örn. 0.50 → 1) bu ölçeğe çekilmiştir; çarpan oranlar korunur ve her sanayide kar satış değerinden gelir (örn. Fırın: 0.06 girdi → 0.08 çıktı).

| id | Ad | Maliyet (Güç + diğer) | Girdi/sn (işçi başına) → Çıktı/sn | Max İşçi | Kilit |
|---|---|---|---|---|---|
| firin | Fırın | 800 ⚡ + 30 💧 + 80 🌾 + 20 ⛰️ | 0.04 🌾 + 0.02 💧 → **0.08** 🍞 | 3 | 10 Tarla |
| keresteAtolyesi | Kereste Atölyesi | 1500 ⚡ + 150 🌾 + 60 🪵 | 0.02 🪵 → **0.04** 🪚 | 3 | 8 Oduncu |
| blacksmith | Demirci | 4000 ⚡ + 300 🪵 + 100 ⛏️ | 0.01 ⛏️ → **0.02** ⚙️ | 3 | 8 Maden |
| sifaOcagi | Şifa Ocağı | 15000 ⚡ + 1000 📖 + 250 🕯️ | 0.01 🕯️ + 0.01 🌶️ → **0.02** 💊 | 3 | 1 Bahçe |
| damitimevi | Damıtımevi | 25000 ⚡ + 800 🕯️ + 150 🌶️ | 0.02 🍷 → **0.01** 🥃 | 3 | 8 Üzüm Bağı |
| kumasAtolyesi | Kumaş Atölyesi | 60000 ⚡ + 300 🌶️ + 150 🍷 | 0.01 🧵 → **0.01** 🧶 | 3 | 8 İpek Atölyesi |
| celikFirini | Çelik Fırını | 120000 ⚡ + 1500 ⛏️ + 800 🪵 | 0.01 ⚙️ + 0.01 ⛏️ → **0.02** 🔩 | 4 | Demirci |
| mermerAtolyesi | Mermer Atölyesi | 150000 ⚡ + 2000 ⛰️ + 600 🪵 | 0.02 ⛰️ → **0.01** 🗿 | 3 | 10 Tapınak |
| mobilyaAtolyesi | Mobilya Atölyesi | 200000 ⚡ + 800 🪵 + 1000 ⛏️ + 2 🔩 | 0.01 🪚 + 0.01 🔩 → **0.01** 🛋️ | 3 | Çelik Fırını |
| mucevherAtolyesi | Mücevher Atölyesi | 250000 ⚡ + 500 🌶️ + 30 🧶 + 15 🗿 | 0.01 🧶 + 0.01 🔩 + 0.01 🗿 → **0.02** 💎 | 3 | Kumaş Atölyesi |
| heykelAtolyesi | Heykel Atölyesi | 300000 ⚡ + 50 🗿 + 25 🔩 + 1000 ⛰️ | 0.01 🗿 + 0.01 🔩 → **0.01** 🏛️ | 3 | Mermer Atölyesi |
| darphane | Darphane | 120000 ⚡ + 40 🍷 + 15 🧵 | 0.01 🍷 + 0.01 🧵 → **0.02** 🪙 | 3 | Kumaş Atölyesi |

Açıklamalar ve kilit zinciri değişmedi (Fırın→…→Darphane). Sanayi maliyetleri, güç ile diğer kaynakların orantısı gözetilerek dengelendi.

---

## 5. Paketler (Packs)

| id | Ad | Emoji | Açıklama | Baz Maliyet | Çarpan | Seviye Başına Bonus | Kilit |
|---|---|---|---|---|---|---|---|
| clickPower | Üretim Gücü | 🛠️ | Tüm binaların üretimini %5 artırır | 10 Bilgi | ×1.17 | %5 (tüm üretim) | — |
| critClick | Kudret | ⚡ | Güç üretimini %8 artırır | 40 Bilgi | ×1.25 | %8 (Güç) | 1 Üretim Gücü |
| autoClick | Zanaat | 🧰 | İşlenmiş ve craft ürün üretimini %8 artırır | 160 Bilgi | ×1.22 | %8 (processed + craft) | 1 Kudret |
| powerPatronage | İktidar | 👑 | Güç üretimini %10 artırır | 600 Bilgi | ×1.17 | %10 (Güç) | 1 Zanaat |

> **Kilit kuralı:** paketler yalnızca **bir önceki paketin satın alınmasıyla** açılır; hiçbir paket kilidi bir binaya bağlı değildir.

Paket maliyeti: `ceil(taban × çarpan^seviye)` (indirim yok).

---

## 6. Matematiksel Sabitler ve Formüller

### 6.1 Maliyetler

```
Bina maliyeti = ceil( tabanMaliyet × maliyetÇarpanı^adet × maliyetİndirimi )
  maliyetÇarpanı: üretici/depo vb. 1.15 · bonus 1.75 · konut 2.50
  maliyetİndirimi = max(0.50, 1 − (Eritme Ocağı + Dokuma Tezgahı) × adet × 0.02)

Sanayi maliyeti = ceil( tabanMaliyet )   // çarpansız, tek seferlik
Paket maliyeti  = ceil( tabanMaliyet × çarpan^seviye )
```

### 6.2 Üretim

```
Çıktı Çarpanı(resource) = 1 + Σ bonusBinalar(hedef=resource, +%2/adet)
                            + Σ paketBonusları
      paketBonusları: productionBonusPerLevel (herkese)
                      + powerBonusPerLevel (sadece Güç)
                      + productBonusPerLevel (sadece processed/craft, raw ve currency hariç)

Kaynak üretimi = Σ(üretici adet × üretim) × Çıktı Çarpanı
Sanayi çıktısı = Σ(işçi × çıktıOranı) × Çıktı Çarpanı × İşçi Çarpanı
İşçi Çarpanı   = 1 + Kütüphane adet × 0.10
Net Güç        = max(0, GüçÜretimi − GüçBakımı)
GüçBakımı      = Σ üreticiler(adet × üretim × 0.05)
                + Σ sanayi(işçi × her çıktıOranı × 0.05)
```

- Güç üretimi önce bakımı kapatır, kalan net güç birikir.
- Ham kaynak üretimi kapasiteyle sınırlanır: `min(kapasite, mevcut + üretim)`.
- Sanayi: girdi her tick kontrol edilir; girdi yetmezse `stalled`, çıktı kapasitesi doluysa `outputFull` olur ve üretim durur.
- Sanayi dönüşümünde kar satış değerinden gelir; çıktı oranı genellikle girdilerin toplamından büyüktür (örn. Fırın: 0.06 girdi → 0.08 çıktı), düşük değerli çıktılar (Konyak, Mermer) ise az girdi ister ve yüksek fiyatla kar eder.

### 6.3 Kapasite

```
Kapasite(resource) =
  ( tabanKapasite + Depo adet × storagePerDepo + Ambar adet × storagePerAmbar )
  × ( 1 + Ambar adet × 0.05 + Şaraphane adet × 0.05 )
```

- Güç ve Altın için `Infinity` (sınırsız).
- Ambar ve Şaraphane çarpanları toplanıp ×1 ile çarpılır (çarpımsal).
- Taban kapasiteler ve depo/ambar katkıları Bölüm 2'deki tablolardadır.

### 6.4 Satış ve Altın

```
Satış Fiyatı = RESOURCES[id].satisFiyati   // 0 veya tanımsızsa satılamaz
Otomatik Satış: mevcut > kapasite × 0.50  →  fazlalık satılır
Manuel Satış (Sell Surplus): aynı eşik (kapasite × 0.50)
```

Satış fiyatları Bölüm 2.3'teki tablodadır.

### 6.5 Nüfus

**Tüketim kuralı — kişi başına lineerdir:**
> Nüfus tüketimi **canlı kişi sayısıyla doğru orantılıdır**: 1 kişi saniyede X ürün tüketiyorsa, 10 kişi saniyede **10 × X** ürün tüketir. Tüketim kişi başına birim değeridir; toplam tüketim = `canlıKişi × kişiBaşınaOran`.

**Kişi başına / saniye tüketim oranları:**

| Kaynak | Oran | Sabit |
|---|---|---|
| Su | 0.001 | `POP_SU_RATE` |
| Yiyecek | 0.0012 | `POP_YIYECEK_RATE` |
| Ekmek | 0.0005 | `POP_EKMEK_RATE` |
| İlaç | 0.00015 | `POP_ILAC_RATE` |
| Altın | 0.0002 | `POP_GOLD_RATE` |
| İşçi ücreti (Altın) | 0.0005 / işçi | `WORKER_WAGE` |
| Şarap | 0.000002 | `LUXURY_RATES.sarap` |
| Konyak | 0.0000001 | `LUXURY_RATES.konyak` |
| Kumaş | 0.00000004 | `LUXURY_RATES.kumas` |
| Mobilya | 0.000004 | `LUXURY_RATES.mobilya` |
| Mücevher | 0.000001 | `LUXURY_RATES.mucevher` |
| Heykel | 0.000001 | `LUXURY_RATES.heykel` |

- Ekmek, yiyecek ihtiyacını **2.5 kat** değerinde karşılar: `karşılanan = ekmekKullanımı × 2.5`; kalan ihtiyaç ham yiyecekten düşülür.
- Toplam Altın ihtiyacı = `nüfus × 0.0002 + işçiSayısı × 0.0005`.

**Mutluluk (happiness target) kalemleri:**

| Kalem | Durum | Delta |
|---|---|---|
| Temiz Su | karşılanıyor / eksik | +10 / −15 |
| Ekmek & Yiyecek | karşılanıyor / eksik | +10 / −15 |
| İlaç | karşılanıyor / eksik | +5 / −10 |
| Lüks (Şarap→Heykel) | karşılanıyor / eksik | +5…+9 / −5…−9* |
| Altın Kutlama | karşılanıyor (opsiyonel) | +8 / 0 |
| Konut Konforu | her zaman (Ev oranı) | `round(evKapasiteOranı × 8)` |
| Rahatlama | Bahçe + Sunak | +1/bina (maks. +5) |
| İşgücü Dengesi | boşta oran ≤0.35 / >0.65 | +5 / −3 |

*Lüks mutluluk değerleri: Şarap 5, Konyak 6, Kumaş 7, Mobilya 7, Mücevher 8, Heykel 9. Lüks kalemleri yalnızca ilgili kaynağın üretimi varsa listelenir.

```
Hedef Mutluluk = clamp(0, 100, Σ delta)
Mevcut Mutluluk += (Hedef − Mevcut) × 0.05   // her tick yumuşak yaklaşım
```

**Göç (migration):**
- Koşul: `mevcut + göçmenler < konutKapasitesi` ve Su veya Yiyecek üretimi > 0.
- Aralık (saniye) mutluluğa göre: ≥70 → 45, ≥50 → 60, ≥30 → 90, <30 → 120.
- Her aralık dolunca 1 göçmen eklenir; konut kapasitesi müsaitse göçmen nüfusa katılır.

**Ölüm (deficiency):**
```
deficiency = max( suAçıkOranı, yiyecekAçıkOranı )
eşik: 0.20 (normal) · 0.12 (mutluluk < 30) · 0.28 (mutluluk ≥ 50)
excess = min(1, (deficiency − eşik) / (1 − eşik))
ölümOranı = excess × 0.05 × (ilaçYeterli ? 0.5 : 1)
```
- İlaç karşılanıyorsa ölüm oranı yarıya iner.
- Nüfus düşerse işçiler otomatik olarak (en yeni sanayiden başlayarak) işten çıkarılır: işçi ≤ canlı nüfus.

**İşçi kuralları:**
- İşçi ekleme: tesis inşa edilmişse, `maxWorkers` aşılmamışsa ve toplam işçi < canlı nüfuss.
- Boşta oran >0.65 → mutluluk −3, ≤0.35 → +5.

### 6.6 Kilitleme (Unlock) Sistemi

| Tip | Koşul | Örnek |
|---|---|---|
| `resource` | `kaynak >= amount` | Güç Ocağı: 5 Güç |
| `building` | `binaAdet >= count` | Ambar: 1 Tarla |
| `pack` | `paketSeviye >= level` (yalnızca önceki paket) | Kudret: 1 Üretim Gücü |
| `industry` | tesis inşa edilmiş | Çelik Fırını: Demirci |

---

## 7. Hızlı Referans: Ekonominin Akışı

1. **Güç** (üretici, 0.60) → her şeyin yapı taşı; bakım gideri var.
2. **Su / Yiyecek** (üretici, 0.30 / 0.15) → nüfus hayatta kalması ve Fırın için.
3. **Odun → Taş → Mineral** (0.08 / 0.04 / 0.02) → yapı ve sanayi girdileri.
4. **Fırın** (0.04🌾 + 0.02💧 → 0.08🍞) → Ekmek → nüfus + satış.
5. **Bilgi** (Akademi, 0.04) → paketler + Kütüphane/Şifa Ocağı.
6. **İnanç** (Tapınak, 0.02) → Bahçe + Sunak + Şifa Ocağı/Damıtımevi.
7. **Baharat / Şarap / İpek** (0.01, İpek en değerli) → ileri sanayi girdileri.
8. **Demir / Çelik / Kereste / Mermer / Kumaş** → üst tier üretim ve satış.
9. **Konyak / Mobilya / Mücevher / Heykel / Altın** → en üst üretim; Altın nüfusu mutlu eder ve otomatik satışı güçlendirir.
