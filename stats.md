# Plush Clicker — Oyun İstatistikleri ve Denge Dokümantasyonu

Bu doküman, **uygulanmış denge değerlerini** gösterir. `js/buildings.js`, `js/resources.js`, `js/industry.js` kod dosyalarıyla senkron tutulur; bir değer değiştiğinde kod da bu dokümana göre güncellenmelidir.

Kaynak değerleri `js/buildings.js`, `js/resources.js`, `js/packs.js`, `js/industry.js`, `js/game-state.js` temel alınarak hazırlanmıştır.

---

## 1. Genel Bakış

| Özellik | Değer |
|---|---|
| Oyun başlangıcı | 100 Güç (kayıt yoksa / yeni oyun) |
| Tick hızı | 5 tick/saniye (`TICK_MS = 200 ms`) |
| Kayıt | localStorage, anahtar `plush-clicker:state-v9` |
| Kayıt aralığı | değişiklik sonrası 500 ms gecikmeli |
| Para birimi | Altın (🪙) |
| Gösterim formatı | tr-TR, 2 ondalık (`formatNumber`) |
| Roset seviyesi (badge) | ≥200 → 5, ≥100 → 4, ≥50 → 3, ≥25 → 2, ≥10 → 1, aksi 0 |

**Çekirdek döngü:**
- Üretici binalar ham kaynak üretir → kapasiteye kadar birikir.
- Sanayi tesisleri işçilerle üretir → girdi harcar, çıktı verir.
- Nüfus kaynak tüketir (mutluluk hedefini belirler) ve göç ile büyür.
- İşlenmiş/craft ürünler Altın'a satılır; Altın da nüfusu mutlu eder.

### 1.1 Değişiklik Özeti (Kittens Game denge uyarlaması)

| Konu | Eski | Yeni |
|---|---|---|
| Güç Ocağı üretimi | 0.60 | **0.625** (KG Catnip Field 0.625/sn) |
| Taban kapasite düzeni | ham kaynaklar **200** (düz) | **KG gibi asimetrik** (Yiyecek 3500, Su 1400, Odun 140, Taş/Mineral/Bilgi 175, İnanç 70, Demir 35…) |
| Depo/Ambar katkısı | düz 100/50 | **taban kapasiteyle orantılı** (~%18 / ~%9) |
| Bonus bina çarpanı | 1.75 | **1.16–1.22** (bina bazında) |
| Güç Ocağı / Çeşme / Kumandanlık çarpanı | 1.15 / 1.75 | **1.13 / 1.16 / 1.16** |
| Depo çarpanı | 1.15 | **1.85** |
| Konut çarpanı | Baraka 2.5 · Ev 1.15 | **Baraka 1.28** (değersiz, çok sayıda) · **Ev 2.60** (değerli, dik büyür) |
| Nüfus tüketimi | çok düşük (1 Tarla ~125 kişi) | **KG ölçeği** (1 Tarla ~1.5 kişi, 1 Kuyu ~3–4 kişi) |
| Bina maliyetleri | 10 → 250.000 Güç | **KG büyüklüğüne indirildi** (Depo 90, Ambar 210, Ev 750…) |
| Sanayi dönüşümü | 2:1 (kar odaklı) | **KG gibi kayıplı** (örn. 8 Mineral → 1 Demir); kar satıştan |
| Güç Ocağı kilidi | 5 Güç | **10 Güç** (KG: 10 catnip) |
| Bonus binaların bonusu | %2/seviye | **değişmedi** |
| Ambar kilidi | 1 Tarla | **6 Tarla** |
| Sanayi kayıp oranları | 3:1–5:1 | **KG reçete ölçeğine çekildi** (Kereste 6:1, Demir 8:1, Mermer 5:1, Çelik 8:1, Mobilya 4:1…) |
| Tapınak / Kütüphane / Ev | güç + ham kaynak | **işlenmiş kaynak eklendi** (Tapınak +2 Demir, Kütüphane +3 Demir, Ev +8 Kereste +3 Demir; güç payı düşürüldü) |
| Bilim paketleri | 4 paket · 10/40/160/600 Bilgi | **12 paket · 30/70/160/380/850/1900/4200** (+5 yeni paket: İşçi Bilimi, Depo Bilimi, Maliyet Bilimi, Craft Atölyesi, Ticaret Bilimi) |
| Kilit ölçeği | bina kilitleri 8–10 seviye | **KG ölçeği 1–6** (Kuyu 5 Çeşme, Tarla 5 Kuyu, Maden 5 Oduncu, Ev 7 Baraka…) |
| Yeni binalar | — | **Tiyatro** (Kültür üretici), **Amfitiyatro** (Kültür bonus); Atölye/Ticaret Merkezi pakete dönüştü (Craft Atölyesi / Ticaret Bilimi) |
| Yeni kaynak | — | **Kültür** (🏛️, ham, mutluluk kalemi) |
| Mevsimler | — | **4 mevsim**, 45 sn döngü, kaynak çarpanları |
| Prestij | — | **Paragon** (+%0.5 üretim/puan) + **Karma** (+%0.25 mutluluk/puan) |
| Ticaret | — | Tüccar teklifleri (Altın → kaynak), Ticaret Bilimi paketi hız/boyut |
| Kayıt sürümü | v8 | **v9** (eski v8 silinir, yeni başlangıç) |
| İlk üretici maliyeti | Kuyu 100⚡+10🌾 (chicken-egg: yiyecek için Tarla→Su→Kuyu) | **Kuyu yalnız 100⚡** (KG Well gibi tek kaynak; Su→Tarla→Yiyecek zinciri açar) |

---

## 2. Kaynaklar

### 2.1 Taban Kapasiteler (yeni)

| id | Ad | Emoji | Tier | Nadirlik | Taban Kapasite |
|---|---|---|---|---|---|
| power | Güç | 🏆 | raw | 1 | ∞ |
| altin | Altın | 🪙 | currency | 1 | ∞ |
| su | Su | 💧 | raw | 1 | 1400 |
| yiyecek | Yiyecek | 🌾 | raw | 1 | 3500 |
| odun | Odun | 🪵 | raw | 1 | 140 |
| tas | Taş | 🪨 | raw | 1 | 175 |
| maden | Mineral | 💎 | raw | 1 | 175 |
| bilgi | Bilgi | 📖 | raw | 1 | 175 |
| inanc | İnanç | 🕯️ | raw | 1 | 70 |
| baharat | Baharat | 🌶️ | raw | 3 | 14 |
| kultur | Kültür | 🏛️ | raw | 2 | 35 |
| sarap | Şarap | 🍷 | raw | 3 | 14 |
| ipek | İpek | 🧵 | raw | 4 | 3 |
| ekmek | Ekmek | 🍞 | processed | 2 | 700 |
| kereste | Kereste | 🪚 | processed | 2 | 350 |
| demir | Demir | ⚙️ | processed | 2 | 35 |
| kumas | Kumaş | 🧶 | processed | 3 | 70 |
| konyak | Konyak | 🥃 | processed | 4 | 35 |
| mermer | Mermer | 🗿 | processed | 4 | 35 |
| ilac | İlaç | 💊 | craft | 3 | 70 |
| celik | Çelik | 🔩 | craft | 4 | 35 |
| mobilya | Mobilya | 🛋️ | craft | 5 | 14 |
| heykel | Heykel | 🏛️ | craft | 5 | 14 |
| mucevher | Mücevher | 💎 | craft | 5 | 14 |

> Kapasite düzeni **Kittens Game** dengesine göre asimetriktir: Yiyecek (3500) geniş, malzeme kaynakları (Odun 140, Taş/Mineral/Bilgi 175, İnanç 70) dar ve nadir kaynaklar çok dar (İpek 3). Depo/Ambar katkıları bu taban değerlerle orantılıdır (Bölüm 2.2).

### 2.2 Depo / Ambar Katkıları (yeni)

| Kaynak | Depo başına | Ambar başına |
|---|---|---|
| Yiyecek | 630 | 315 |
| Su | 250 | 125 |
| Ekmek | 125 | 65 |
| Kereste | 65 | 30 |
| Odun | 25 | 12 |
| Taş, Mineral, Bilgi | 32 | 16 |
| İnanç | 13 | 6 |
| Kültür | 6 | 3 |
| Kumaş, İlaç | 13 | 6 |
| Demir, Konyak, Çelik, Mermer | 6 | 3 |
| Baharat, Şarap | 3 | 1 |
| İpek | 1 | 1 |
| Mobilya, Heykel, Mücevher | 3 | 1 |

> Ölçek: depo/ambar katkısı kaynağın **taban kapasitesiyle orantılıdır** (~%18 / ~%9) — KG'de Ahır'ın her kaynağa taban kapasitenin katları kadar ekleme yapması gibi.

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
| Üreticiler: Güç Ocağı, Kuyu | ×1.13 |
| Üreticiler: Tarla, Oduncu | ×1.16 |
| Üreticiler: Taş Ocağı, Maden, Akademi | ×1.17 |
| Üreticiler: Tapınak, Bahçe, Üzüm Bağı, İpek Atölyesi, Tiyatro | ×1.18 |
| Bonus: Kumandanlık, Çeşme, Değirmen | ×1.16 |
| Bonus: Keresteci, Taş Atölyesi, Madenci Kampı | ×1.17 |
| Bonus: Sunak, Baharat Değirmeni | ×1.18 |
| Bonus: Şaraphane, Amfitiyatro | ×1.20 |
| Bonus: Dokuma Tezgahı | ×1.22 |
| Depo | **×1.85** |
| Ambar | ×1.20 |
| Konut: Baraka | **×1.28** (değersiz, çok sayıda) |
| Konut: Ev | **×2.60** (değerli, dik büyür) |
| Sanayi (tek seferlik) | çarpansız |
| Paketler | ×1.20 |

### 3.2 Üretici (producer) Binalar — üretim merdiveni 0.625 → 0.01

> Güç ve Su üreten binalar yalnızca Güç ile gelişir. Diğerleri üretim zincirindeki sıralarına göre uygun kaynak karışımıyla inşa edilir. Maliyetler Kittens Game büyüklüğüne indirildi (KG: Catnip Field 10, Barn 50 wood, Log House 200+250).

| Bina (id) | Üretim/sn | Çıktı | Yeni Maliyet | Parça |
|---|---|---|---|---|
| Güç Ocağı (`fountain`) | **0.625** | Güç | 10 Güç | 1 |
| Kuyu (`well`) | 0.30 | Su | 100 Güç | 1 |
| Tarla (`farm`) | 0.15 | Yiyecek | 150 Güç + 20 Su | 2 |
| Oduncu (`lumberjack`) | 0.08 | Odun | 200 Güç + 30 Yiyecek | 2 |
| Taş Ocağı (`tasOcagi`) | 0.04 | Taş | 300 Güç + 20 Odun | 2 |
| Maden (`mine`) | 0.02 | Mineral | 600 Güç + 40 Odun + 10 Taş | 3 |
| Akademi (`academy`) | 0.04 | Bilgi | 1000 Güç + 50 Mineral + 25 Taş | 3 |
| Tapınak (`temple`) | 0.02 | İnanç | 2000 Güç + 80 Bilgi + 40 Taş + 2 Demir | 3 |
| Bahçe (`garden`) | 0.01 | Baharat | 5000 Güç + 150 İnanç + 25 Taş | 3 |
| Üzüm Bağı (`vineyard`) | 0.01 | Şarap | 10000 Güç + 80 Mineral + 100 Odun | 3 |
| İpek Atölyesi (`silkWorkshop`) | **0.01** | İpek | 20000 Güç + 150 Su + 80 Odun | 3 |
| Tiyatro (`theatre`) | **0.01** | Kültür | 30000 Güç + 150 Odun + 100 Taş | 3 |

Kilitler (KG ölçeği, yeni): **Güç Ocağı 10 Güç** (KG 10 catnip) · Kuyu **5** Güç Ocağı · Tarla **5** Kuyu · Oduncu **5** Tarla · Taş Ocağı **1** Oduncu (taş, Maden'den önce üretilir) · Maden **5** Oduncu · Akademi **3** Maden · Tapınak **5** Akademi · Bahçe **5** Tapınak · Üzüm Bağı **3** Bahçe · İpek Atölyesi **3** Üzüm Bağı · Tiyatro **3** İpek Atölyesi.

### 3.3 Bonus Binalar (bonus) — bonus %2/seviye

> Bonus binaların çarpanı bina bazında değişir (**×1.16–1.22**, Bölüm 3.1). Bonus her seviyede **%2**'dir.

| Bina (id) | Hedef | Bonus/seviye | Yeni Maliyet | Parça |
|---|---|---|---|---|
| Kumandanlık (`mansion`) | Güç | %2 | 75 Güç | 1 |
| Çeşme (`aqueduct`) | Su | %2 | 250 Güç + 30 Su | 2 |
| Değirmen (`mill`) | Yiyecek | %2 | 400 Güç + 30 Su + 10 Yiyecek | 3 |
| Keresteci (`lumbermill`) | Odun | %2 | 400 Güç + 30 Yiyecek + 10 Odun | 3 |
| Taş Atölyesi (`tasAtolyesi`) | Taş | %2 | 800 Güç + 40 Odun + 10 Taş | 3 |
| Madenci Kampı (`madenciKampi`) | Mineral | %2 | 2000 Güç + 25 Mineral + 15 Taş | 4 |
| Sunak (`altar`) | İnanç | %2 | 8000 Güç + 400 Bilgi + 100 İnanç + 50 Taş | 4 |
| Baharat Değirmeni (`spiceMill`) | Baharat | %2 | 20000 Güç + 400 İnanç + 3 Baharat + 50 Taş | 4 |
| Şaraphane (`winery`) | Şarap | %2 | 40000 Güç + 100 Mineral + 3 Şarap + 75 Taş | 4 |
| Amfitiyatro (`amphitheatre`) | Kültür | %2 | 50000 Güç + 5 İpek + 100 Taş | 4 |
| Dokuma Tezgahı (`loom`) | İpek | %2 | 60000 Güç + 200 Odun + 2 İpek + 100 Taş | 4 |

Kilitler (KG ölçeği, yeni): Kumandanlık 5 Güç Ocağı · Çeşme **5** Kuyu · Değirmen **5** Tarla · Keresteci 1 Oduncu · Taş Atölyesi 1 Taş Ocağı · Madenci Kampı **3** Maden · Sunak **5** Tapınak · Baharat Değirmeni **5** Bahçe · Şaraphane 1 Üzüm Bağı · Amfitiyatro 1 Tiyatro · Dokuma Tezgahı 1 İpek Atölyesi.

### 3.4 Maliyet İndirimi (paketler)

> Maliyet indirimi artık **bina ile değil, paketlerle** sağlanır: **Eritme** (%2) ve **Maliyet Bilimi** (%2). Dokuma Tezgahı bir **bonus** binadır (İpek üretimi %2, Bölüm 3.3). Formül: `max(0.50, 1 − (Eritme + Maliyet Bilimi) × adet × 0.02)`.

| Paket (id) | İndirim/seviye | Kilit |
|---|---|---|
| Eritme (`eritme`) | %2 (min %50'ye kadar) | 1 Metal İşleme |
| Maliyet Bilimi (`maliyetBilimi`) | %2 (min %50'ye kadar) | 1 İpek Atölyesi |

### 3.5 Depolama Binaları

| Bina (id) | Tür | Yeni Maliyet | Parça | Görev |
|---|---|---|---|---|
| Depo (`depo`) | storage | **90 Güç + 20 Su** | 2 | kaynağın `storagePerDepo` değeri kadar kapasite ekler |
| Ambar (`ambar`) | capacityBonus | 210 Güç + 55 Su + 30 Yiyecek + 15 Odun | 3 | `storagePerAmbar` kadar kapasite + **%5/seviye** çarpımsal kapasite |

Kilitler (KG ölçeği, yeni): Depo **3 Tarla** · Ambar **6 Tarla**.

> Şaraphane artık depolama değil, **Şarap bonus binasıdır** (Bölüm 3.3). Kapasite çarpanı ise **Depo Bilimi** paketinden gelir (Bölüm 5).

### 3.6 Kütüphane (bonus — Bilgi)

**Kütüphane** (`library`)
- Tür: **bonus** (Bilgi üretimi)
- Maliyet: 4000 Güç + 120 Mineral + 40 Bilgi + 20 Taş + 3 Demir (5 parça) · Çarpan: ×1.20
- Bonus: Bilgi üretimi **%2/seviye**
- Kilit: **3** Akademi

> Sanayi işçi üretimi bonusu artık bina değil, **İşçi Bilimi** paketiyle sağlanır: sanayi işçi üretimi **%10/seviye** (Bölüm 5).

### 3.7 Konut Binaları (housing)

> Baraka ucuz ve çok sayıda inşa edilir (**×1.28**, 1 kişi); **Ev** değerlidir ve dik büyür (**×2.60**, 2 kişi).

| Bina (id) | Konut Kapasitesi | Çarpan | Maliyet | Parça |
|---|---|---|---|---|
| Baraka (`baraka`) | 1 kişi | ×1.28 | 90 Güç + 18 Su | 2 |
| Ev (`ev`) | 2 kişi | **×2.60** | 750 Güç + 50 Yiyecek + 25 Odun + 12 Taş + 8 Kereste + 3 Demir | 4 |

Kilitler (KG ölçeği, yeni): Baraka **6** Güç Ocağı · Ev **7 Baraka + Demirci** (`all` tipi kilit).

### 3.8 Yeni Binalar (v9)

| Bina (id) | Tür | Etki | Maliyet | Çarpan | Kilit |
|---|---|---|---|---|---|
| Tiyatro (`theatre`) | producer | **Kültür 0.01/sn** | 30000 Güç + 150 Odun + 100 Taş | ×1.18 | 3 İpek Atölyesi |
| Amfitiyatro (`amphitheatre`) | bonus | **Kültür üretimi +%2/seviye** | 50000 Güç + 5 İpek + 100 Taş | ×1.20 | 1 Tiyatro |

> **Atölye ve Ticaret Merkezi artık bina değil** — karşılıkları paket olarak gelir: **Craft Atölyesi** (işlenmiş + craft üretimi +%6/seviye) ve **Ticaret Bilimi** (tüccar sıklığı + teklif boyutu +%50/seviye). Bölüm 5.

---

## 4. Sanayi Binaları (Industry)

Sanayi binaları tek seferlik inşa edilir (`built`), maliyeti çarpansızdır (`ceil`). İşçiler atanır (`maxWorkers` sınırı) ve girdi mevcutken üretir.

> **Yeni girdi/çıktı kuralı (Kittens Game):** dönüşümler **kayıplıdır** — KG'de Eritme Ocağı 5 Mineral → 1 Demir dönüştürür. Proje aynı oran mantığını kullanır (örn. Demirci 0.08 Mineral → 0.01 Demir). Kar satış değerinden gelir; girdiler ham olduğundan kayıplı dönüşüm karlı kalır. Değerler saniyede işçi başınadır.

| id | Ad | Maliyet (Güç + diğer) | Girdi/sn (işçi başına) → Çıktı/sn | Max İşçi | Kilit |
|---|---|---|---|---|---|
| firin | Fırın | 425 ⚡ + 17 💧 + 42 🌾 + 13 🪨 | 0.08 🌾 + 0.02 💧 → **0.06** 🍞 | 3 | 5 Tarla |
| keresteAtolyesi | Kereste Atölyesi | 680 ⚡ + 68 🌾 + 25 🪵 + 13 🪨 | 0.06 🪵 → **0.01** 🪚 | 3 | 5 Oduncu |
| blacksmith | Demirci | 1700 ⚡ + 128 🪵 + 42 💎 | 0.08 💎 → **0.01** ⚙️ | 3 | 3 Maden |
| sifaOcagi | Şifa Ocağı | 6800 ⚡ + 425 📖 + 128 🕯️ | 0.02 🕯️ + 0.01 🌶️ → **0.01** 💊 | 3 | 1 Bahçe |
| damitimevi | Damıtımevi | 12750 ⚡ + 340 🕯️ + 68 🌶️ | 0.02 🍷 → **0.005** 🥃 | 3 | 3 Üzüm Bağı |
| kumasAtolyesi | Kumaş Atölyesi | 25500 ⚡ + 128 🌶️ + 68 🍷 | 0.01 🧵 → **0.005** 🧶 | 3 | 3 İpek Atölyesi |
| celikFirini | Çelik Fırını | 51000 ⚡ + 638 💎 + 340 🪵 | 0.02 ⚙️ + 0.02 💎 → **0.005** 🔩 | 4 | **all**: Demirci + 1 Metal İşleme |
| mermerAtolyesi | Mermer Atölyesi | 68000 ⚡ + 850 🪨 + 255 🪵 | 0.05 🪨 → **0.01** 🗿 | 3 | 5 Tapınak |
| mobilyaAtolyesi | Mobilya Atölyesi | 85000 ⚡ + 340 🪵 + 425 💎 + 1 🔩 | 0.01 🪚 + 0.01 🔩 → **0.005** 🛋️ | 3 | Çelik Fırını |
| mucevherAtolyesi | Mücevher Atölyesi | 102000 ⚡ + 213 🌶️ + 13 🧶 + 7 🗿 | 0.02 🧶 + 0.01 🔩 + 0.01 🗿 → **0.01** 💎 | 3 | Kumaş Atölyesi |
| heykelAtolyesi | Heykel Atölyesi | 127500 ⚡ + 21 🗿 + 10 🔩 + 425 🪨 | 0.02 🗿 + 0.01 🔩 → **0.005** 🏛️ | 3 | Mermer Atölyesi |
| darphane | Darphane | 51000 ⚡ + 17 🍷 + 7 🧵 | 0.02 🍷 + 0.01 🧵 → **0.01** 🪙 | 3 | **all**: Kumaş Atölyesi + 1 Yazı |

Sanayi kilitleri KG ölçeğine çekildi: Fırın 5 Tarla · Kereste Atölyesi 5 Oduncu · Demirci 3 Maden · Damıtımevi 3 Üzüm Bağı · Kumaş Atölyesi 3 İpek Atölyesi · Mermer Atölyesi 5 Tapınak. Çelik Fırını ve Darphane artık **`all` tipi kilit** kullanır (tesis + paket şartı). Maliyetler yaklaşık %50 aşağı çekildi.

> **Tesis seviyesi (yeni):** her tesis seviye alır (maks. 5). Seviye çarpanı `1.2^(seviye−1)`, maks işçi `base + 3×(seviye−1)`, yükseltme maliyeti `ceil(tabanMaliyet × seviye)`.

> **KG crafting kayıp yapısı (yeni):** dönüşümler Kittens Game reçeteleriyle orantılı olarak kayıplıdır — KG'de Beam 175 Odun→1, Slab 100 Mineral→1, Steel 100 Demir+100 Kömür→1. Proje ölçeğinde: Kereste 6:1, Demir 8:1, Mermer 5:1, Çelik 8:1, Mobilya/Mücevher/Heykel ~2–4:1. Girdiler ham olduğundan kar satış değerinden gelir.

---

## 5. Paketler (Packs)

| id | Ad | Emoji | Açıklama | Baz Maliyet | Çarpan | Seviye Başına Bonus | Kilit |
|---|---|---|---|---|---|---|---|
| clickPower | Üretim Gücü | 🛠️ | Tüm binaların üretimini %5 artırır | 30 Bilgi | ×1.20 | %5 (tüm üretim) | — |
| critClick | Kudret | ⚡ | Güç üretimini %8 artırır | 70 Bilgi | ×1.20 | %8 (Güç) | 1 Üretim Gücü |
| autoClick | Zanaat | 🧰 | İşlenmiş ve craft ürün üretimini %8 artırır | 160 Bilgi | ×1.20 | %8 (processed + craft) | 1 Kudret |
| powerPatronage | İktidar | 👑 | Güç üretimini %10 artırır | 380 Bilgi | ×1.20 | %10 (Güç) | 1 Zanaat |
| metalIsleme | Metal İşleme | ⚙️ | İşlenmiş ve craft ürün üretimini %8 artırır | 850 Bilgi | ×1.20 | %8 (processed + craft) | 1 İktidar |
| eritme | Eritme | ⚒️ | Tüm bina maliyetlerini %2 azaltır | 1900 Bilgi | ×1.20 | %2 (bina maliyeti) | 1 Metal İşleme |
| yazi | Yazı | 📜 | Tüm binaların üretimini %5 artırır | 4200 Bilgi | ×1.20 | %5 (tüm üretim) | 1 Metal İşleme |
| isciBilimi | İşçi Bilimi | 🧑‍🏭 | Sanayi işçilerinin üretimini %10 artırır | 240 Bilgi | ×1.20 | %10 (sanayi işçi) | 3 Akademi |
| depoBilimi | Depo Bilimi | 📦 | Tüm kaynak depo kapasitelerini %5 artırır | 20 Şarap | ×1.20 | %5 (kapasite) | 1 Üzüm Bağı |
| maliyetBilimi | Maliyet Bilimi | 🏷️ | Tüm bina maliyetlerini %2 azaltır | 10 İpek | ×1.20 | %2 (bina maliyeti) | 1 İpek Atölyesi |
| craftAtolyesi | Craft Atölyesi | 🧵 | İşlenmiş ve craft ürün üretimini %6 artırır | 640 Bilgi | ×1.20 | %6 (processed + craft) | 1 Zanaat |
| ticaretBilimi | Ticaret Bilimi | 🛒 | Tüccar sıklığını ve teklif boyutunu %50 artırır | 40 Şarap + 20 İpek | ×1.20 | %50 (ticaret) | 3 Üzüm Bağı |

> **Kilit kuralı:** Bilgi paketleri **zincir kilitlidir** (önceki paket); Yazı ve Eritme ikisi de Metal İşleme'ye bağlıdır. Ekstra paketler (İşçi Bilimi, Depo Bilimi, Maliyet Bilimi, Ticaret Bilimi) **bina kilitlerine** bağlıdır. Baz maliyetler Kittens Game teknoloji maliyet eğrisinden türetilmiştir (KG: Calendar 30, Agriculture 100, Archery 300, Mining 500, Metal Working 900, Writing 3600).

Paket maliyeti: `ceil(taban × 1.20^seviye)` (indirim yok).

---

## 6. Matematiksel Sabitler ve Formüller

### 6.1 Maliyetler

```
Bina maliyeti = ceil( tabanMaliyet × maliyetÇarpanı^adet × maliyetİndirimi )
  maliyetÇarpanı: bina bazında (Bölüm 3.1) · Baraka 1.28 · Ev 2.60
  maliyetİndirimi = max(0.50, 1 − (Eritme paketi + Maliyet Bilimi paketi) × adet × 0.02)

Sanayi maliyeti = ceil( tabanMaliyet )   // çarpansız, tek seferlik
Sanayi yükseltme maliyeti = ceil( tabanMaliyet × seviye )   // seviye 1→2, 2→3 …
Paket maliyeti  = ceil( tabanMaliyet × 1.20^seviye )
```

### 6.2 Üretim

```
Çıktı Çarpanı(resource) = 1 + Σ bonusBinalar(hedef=resource, +%2/adet)
                            + Σ paketBonusları
                            + Prestij Üretim Bonusu (Paragon × 0.005)
      paketBonusları: productionBonusPerLevel (herkese)
                      + powerBonusPerLevel (sadece Güç)
                      + productBonusPerLevel (sadece processed/craft, raw ve currency hariç)
                      (productBonus paketleri: Zanaat %8 · Metal İşleme %8 · Craft Atölyesi %6)

Mevsim Çarpanı(resource) = SEASONS_DATA[mevsim].modifiers[resource]  // yoksa 1
Kaynak üretimi = Σ(üretici adet × üretim) × Çıktı Çarpanı × Mevsim Çarpanı
Sanayi çıktısı = Σ(işçi × çıktıOranı × seviyeÇarpanı) × Çıktı Çarpanı × İşçi Çarpanı
seviyeÇarpanı  = 1.2^(seviye − 1)   // tesis seviyesi (maks. 5)
İşçi Çarpanı   = 1 + İşçi Bilimi paketi adet × 0.10
Net Güç        = max(0, GüçÜretimi − GüçBakımı)
GüçBakımı      = Σ üreticiler(adet × üretim × 0.05)
                + Σ sanayi(işçi × her çıktıOranı × 0.05)
```

> **Mevsimler:** 4 mevsim 45 saniyede bir döner (İlkbahar → Yaz → Sonbahar → Kış → …). Üretici üretimi mevsim çarpanıyla çarpılır; mevsimi değişmeyen kaynaklarda çarpan 1'dir. (KG'deki mevsimsel verim farklarına benzer.)

- Güç üretimi önce bakımı kapatır, kalan net güç birikir.
- Ham kaynak üretimi kapasiteyle sınırlanır: `min(kapasite, mevcut + üretim)`.
- Sanayi: girdi her tick kontrol edilir; girdi yetmezse `stalled`, çıktı kapasitesi doluysa `outputFull` olur ve üretim durur.
- Sanayi dönüşümü **kayıplıdır** (KG Eritme Ocağı gibi: 8 Mineral → 1 Demir, Mermer 5:1, Kereste 6:1); girdiler ham olduğundan kar yine satış değerinden gelir. Yüksek değerli çıktılar (Konyak, Mermer, Mücevher) yüksek fiyatla kar eder.
### 6.3 Kapasite

```
Kapasite(resource) =
  ( tabanKapasite + Depo adet × storagePerDepo + Ambar adet × storagePerAmbar )
  × ( 1 + Ambar adet × 0.05 + Depo Bilimi paketi adet × 0.05 )
```

- Güç ve Altın için `Infinity` (sınırsız).
- Ambar ve Depo Bilimi çarpanları toplanıp ×1'e eklenir (çarpımsal).
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

**Kişi başına / saniye tüketim oranları (Kittens Game ölçeği):**

| Kaynak | Oran | Sabit |
|---|---|---|
| Su | **0.08** | `POP_SU_RATE` |
| Yiyecek | **0.10** | `POP_YIYECEK_RATE` |
| Ekmek | **0.02** | `POP_EKMEK_RATE` |
| İlaç | **0.005** | `POP_ILAC_RATE` |
| Altın | **0.004** | `POP_GOLD_RATE` |
| İşçi ücreti (Altın) | **0.01** / işçi | `WORKER_WAGE` |
| Şarap | 0.0005 | `LUXURY_RATES.sarap` |
| Konyak | 0.00005 | `LUXURY_RATES.konyak` |
| Kumaş | 0.00002 | `LUXURY_RATES.kumas` |
| Mobilya | 0.001 | `LUXURY_RATES.mobilya` |
| Mücevher | 0.0003 | `LUXURY_RATES.mucevher` |
| Heykel | 0.0003 | `LUXURY_RATES.heykel` |

- Ekmek, yiyecek ihtiyacını **2.5 kat** değerinde karşılar: `karşılanan = ekmekKullanımı × 2.5`; kalan ihtiyaç ham yiyecekten düşülür.
- Ölçek: 1 Tarla (0.15/sn) ~1.5 kişiyi, 1 Kuyu (0.30/sn) ~3–4 kişiyi besler (KG: 1 üretici ~1–2 kedi).
- Toplam Altın ihtiyacı = `nüfus × 0.004 + işçiSayısı × 0.01`.

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
| Kültür | Kültür üretimi var (Tiyatro) + Amfitiyatro mevcut | +1/bina (maks. +8) |
| İşgücü Dengesi | boşta oran ≤0.35 / >0.65 | +5 / −3 |

*Lüks mutluluk değerleri: Şarap 5, Konyak 6, Kumaş 7, Mobilya 7, Mücevher 8, Heykel 9. Lüks kalemleri yalnızca ilgili kaynağın üretimi varsa listelenir. Kültür kalemi yalnızca Kültür üretimi varken ve en az 1 Amfitiyatro varsa listelenir (KG'deki Festivals/Kültür mutluluk etkisine benzer). **Karma** bonusu hedefe doğrudan eklenir: `hedef + Karma × 0.25`.

```
Hedef Mutluluk = clamp(0, 100, Σ delta) + Karma × 0.25   // Karma kalıcı prestij bonusu
Mevcut Mutluluk += (Hedef − Mevcut) × 0.05   // her tick yumuşak yaklaşım
```

**Göç (migration):**
- Koşul: `mevcut + göçmenler < konutKapasitesi` ve Su veya Yiyecek üretimi > 0.
- Aralık (saniye) mutluluğa göre: ≥70 → 45, ≥50 → 60, ≥30 → 90, <30 → 120. (Göç sıklığı = tooltip'te gösterilen değer.)
- Her aralık dolunca 1 göçmen **yola çıkar** (`migrants++`); varış, sabit **30 sn** (`ARRIVAL_DURATION`) sonra olur ve nüfusu **oyun tarafı** ekler (UI animasyonu yalnızca görseldir, nüfusu eklemez). Konut kapasitesi müsaitse göçmen nüfusa katılır, değilse yolda bekler.

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
| `resource` | `kaynak >= amount` | Güç Ocağı: 10 Güç |
| `building` | `binaAdet >= count` | Ambar: 6 Tarla · İşçi Bilimi: 3 Akademi |
| `pack` | `paketSeviye >= level` | Kudret: 1 Üretim Gücü |
| `industry` | tesis inşa edilmiş | Mermer Atölyesi: 5 Tapınak |
| `all` | **tüm** koşullar sağlanmalı | Çelik Fırını: Demirci + 1 Metal İşleme · Ev: 7 Baraka + Demirci |

- `all` tipinde ilerleme koşullar `"1/1 + 1/1"` biçiminde birleştirilir; yakınlık (isNear) koşullardan herhangi biri sağlanınca kart gösterilir.

### 6.7 Mevsimler (v9)

- 4 mevsim, süre **45 sn** (`SEASON_DURATION`), sıralama İlkbahar → Yaz → Sonbahar → Kış.
- Üretici üretimi mevsim çarpanıyla çarpılır (`getSeasonMultiplier`), sanayi üretimi etkilenmez.

| Mevsim | Emoji | Çarpanlar |
|---|---|---|
| İlkbahar | 🌱 | Su ×1.15 · Yiyecek ×1.10 |
| Yaz | ☀️ | Su ×1.25 · Yiyecek ×1.20 · Odun ×0.90 |
| Sonbahar | 🍂 | Odun ×1.20 · Maden ×1.15 · Yiyecek ×0.95 |
| Kış | ❄️ | Su ×0.65 · Yiyecek ×0.65 · Odun ×1.15 |

### 6.8 Prestij (v9)

- Sıfırlama (Sıfırla butonu) oyun içi kayıtları siler ama prestiji korur.
- Kazanımlar (mevcut nüfus ve mutluluktan): `Paragon += floor(ölümsüz/10)`, `Karma += floor(ölümsüz × mutluluk / 1000)`, `Sıfırlama sayacı +1`.
- Sıfırlama sonrası başlangıç: **tüm binalar 5'er adet**, Güç **100** (paket/sanayi/nüfus sıfırlanır).
- Etkiler: **Paragon** → üretim +%0.5/puan (`getPrestigeProductionBonus`), **Karma** → mutluluk +%0.25/puan.
- Header'da ⛩️ Paragon / 🌟 Karma chip'i gösterilir (kaynak yoksa soluk).

### 6.9 Ticaret (v9)

- Tüccar, `getTradeInterval()` saniyede bir teklif üretir: `max(12, 45 / (1 + TicaretBilimi paketi × 0.5))`.
- Teklif: rastgele kaynak → miktar `TRADE_AMOUNTS[nadirlik]` aralığında (nadirlik 1: 25–40 · 2: 10–20 · 3: 5–10 · 4: 2–6 · 5: 1–3), **Ticaret Bilimi** paketi boyut bonusuyla (**+%50/seviye**) artırılır; maliyet `round(miktar × fiyat × 0.6)` Altın.
- Taban fiyatlar: Odun 1 · Taş 1.5 · Maden 2 · Bilgi 2 · İnanç 2 · Baharat 3 · Ekmek 1 · Kereste 2 · Demir 3 · İlaç 6 · Kumaş 7 · Konyak 12 · Çelik 15 · Mermer 20 · Mobilya 30 · Mücevher 50 · Heykel 60. (Kaynağın kendi satış fiyatı varsa o kullanılır.)
- Teklif kabulü: Altın yeterli ve hedef kaynak kapasitesi dolu değilse; kabul edilince teklif tükenir, sayaç +1, süre sıfırlanır.
- Sağ panel **Ticaret** sekmesinde teklif kartı ve tüccar sıklığı gösterilir.

---

## 7. Hızlı Referans: Ekonominin Akışı

1. **Güç** (üretici, 0.625) → her şeyin yapı taşı; bakım gideri var.
2. **Su / Yiyecek** (üretici, 0.30 / 0.15) → nüfus hayatta kalması ve Fırın için; 1 Kuyu ~3–4, 1 Tarla ~1.5 kişi besler.
3. **Odun → Taş → Mineral** (0.08 / 0.04 / 0.02) → yapı ve sanayi girdileri.
4. **Fırın** (0.08🌾 + 0.02💧 → 0.06🍞) → Ekmek → nüfus + satış.
5. **Bilgi** (Akademi, 0.04) → paketler (30/70/160/380/850/1900/4200) + Kütüphane/Şifa Ocağı.
6. **İnanç** (Tapınak, 0.02) → Bahçe + Sunak + Şifa Ocağı/Damıtımevi.
7. **Baharat / Şarap / İpek** (0.01, İpek en değerli) → ileri sanayi girdileri.
8. **Demir / Çelik / Kereste / Mermer / Kumaş** → üst tier üretim ve satış (kayıplı dönüşüm, KG mantığı).
9. **Konyak / Mobilya / Mücevher / Heykel / Altın** → en üst üretim; Altın nüfusu mutlu eder ve otomatik satışı güçlendirir.
10. **Kültür** (Tiyatro, 0.01; Amfitiyatro bonus) → mutluluk kalemi (+1/bina, maks +8).
11. **Mevsimler** üretici üretimini döngüsel olarak güçlendirir/zayıflatır; **Ticaret** Altın→kaynak takası sağlar.
12. **Prestij** (Sıfırla) kalıcı Paragon/Karma bonusu biriktirir.
