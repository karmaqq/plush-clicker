# Plush Clicker — Oyun İstatistikleri ve Denge Dokümantasyonu

Bu doküman, **uygulanmış denge değerlerini** gösterir. `js/buildings.js`, `js/resources.js`, `js/industry.js` kod dosyalarıyla senkron tutulur; bir değer değiştiğinde kod da bu dokümana göre güncellenmelidir.

Kaynak değerleri `js/buildings.js`, `js/resources.js`, `js/packs.js`, `js/industry.js`, `js/game-state.js` temel alınarak hazırlanmıştır.

---

## 1. Genel Bakış

| Özellik | Değer |
|---|---|
| Oyun başlangıcı | 40 Güç (kayıt yoksa) |
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
| Taban kapasite düzeni | ham kaynaklar **200** (düz) | **KG gibi asimetrik** (Yiyecek 5000, Su 2000, Odun 200, Taş/Mineral/Bilgi 250, İnanç 100, Demir 50…) |
| Depo/Ambar katkısı | düz 100/50 | **taban kapasiteyle orantılı** (~%25 / ~%12.5) |
| Bonus bina çarpanı | 1.75 | **1.15** (KG %-bonus binaları 1.12–1.15) |
| Güç Ocağı / Çeşme / Kumandanlık çarpanı | 1.15 / 1.75 | **1.12** (KG Aqueduct/Catnip Field) |
| Depo çarpanı | 1.15 | **1.75** (KG Barn 1.75) |
| Konut çarpanı | Baraka 2.5 · Ev 2.5 | **Baraka 2.5** (KG Hut) · **Ev 1.15** (KG Log House) |
| Nüfus tüketimi | çok düşük (1 Tarla ~125 kişi) | **KG ölçeği** (1 Tarla ~1.5 kişi, 1 Kuyu ~3–4 kişi) |
| Bina maliyetleri | 10 → 250.000 Güç | **KG büyüklüğüne indirildi** (Depo 50, Ambar 150, Ev 600…) |
| Sanayi dönüşümü | 2:1 (kar odaklı) | **KG gibi kayıplı** (örn. 8 Mineral → 1 Demir); kar satıştan |
| Güç Ocağı kilidi | 5 Güç | **10 Güç** (KG: 10 catnip) |
| Bonus binaların bonusu | %2/seviye | **değişmedi** |
| Ambar kilidi | 1 Tarla | **değişmedi** |
| Sanayi kayıp oranları | 3:1–5:1 | **KG reçete ölçeğine çekildi** (Kereste 6:1, Demir 8:1, Mermer 5:1, Çelik 8:1, Mobilya 4:1…) |
| Tapınak / Kütüphane / Ev | güç + ham kaynak | **işlenmiş kaynak eklendi** (Tapınak +2 Demir, Kütüphane +3 Demir, Ev +2 Kereste; güç payı düşürüldü) |
| Bilim paketleri | 4 paket · 10/40/160/600 Bilgi | **7 paket · KG eğrisi 30/100/300/500/900/1500/3600** (+3 yeni paket: Metal İşleme, Yazı, Eritme) |
| Kilit ölçeği | bina kilitleri 8–10 seviye | **KG ölçeği 1–5** (Kuyu 5 Çeşme, Tarla 5 Kuyu, Maden 5 Oduncu…) |
| Yeni binalar | — | **Atölye** (productBonus), **Amfitiyatro** (Kültür üretici), **Ticaret Merkezi** (tradeBonus) |
| Yeni kaynak | — | **Kültür** (🏛️, ham, mutluluk kalemi) |
| Mevsimler | — | **4 mevsim**, 45 sn döngü, kaynak çarpanları |
| Prestij | — | **Paragon** (+%0.5 üretim/puan) + **Karma** (+%0.25 mutluluk/puan) |
| Ticaret | — | Tüccar teklifleri (Altın → kaynak), Ticaret Merkezi hız/boyut |
| Kayıt sürümü | v8 | **v9** (eski v8 silinir, yeni başlangıç) |
| İlk üretici maliyeti | Kuyu 100⚡+10🌾 (chicken-egg: yiyecek için Tarla→Su→Kuyu) | **Kuyu yalnız 100⚡** (KG Well gibi tek kaynak; Su→Tarla→Yiyecek zinciri açar) |

---

## 2. Kaynaklar

### 2.1 Taban Kapasiteler (yeni)

| id | Ad | Emoji | Tier | Nadirlik | Taban Kapasite |
|---|---|---|---|---|---|
| power | Güç | 🏆 | raw | 1 | ∞ |
| altin | Altın | 🪙 | currency | 1 | ∞ |
| su | Su | 💧 | raw | 1 | 2000 |
| yiyecek | Yiyecek | 🌾 | raw | 1 | 5000 |
| odun | Odun | 🪵 | raw | 1 | 200 |
| tas | Taş | 🪨 | raw | 1 | 250 |
| maden | Mineral | 💎 | raw | 1 | 250 |
| bilgi | Bilgi | 📖 | raw | 1 | 250 |
| inanc | İnanç | 🕯️ | raw | 1 | 100 |
| baharat | Baharat | 🌶️ | raw | 3 | 20 |
| kultur | Kültür | 🏛️ | raw | 1 | **50** |
| sarap | Şarap | 🍷 | raw | 3 | 20 |
| ipek | İpek | 🧵 | raw | 4 | **4** |
| ekmek | Ekmek | 🍞 | processed | 2 | 1000 |
| kereste | Kereste | 🪚 | processed | 2 | 500 |
| demir | Demir | ⚙️ | processed | 2 | 50 |
| kumas | Kumaş | 🧶 | processed | 3 | 100 |
| konyak | Konyak | 🥃 | processed | 4 | 50 |
| mermer | Mermer | 🗿 | processed | 4 | 50 |
| ilac | İlaç | 💊 | craft | 3 | 100 |
| celik | Çelik | 🔩 | craft | 4 | 50 |
| mobilya | Mobilya | 🛋️ | craft | 5 | 20 |
| heykel | Heykel | 🏛️ | craft | 5 | 20 |
| mucevher | Mücevher | 💎 | craft | 5 | 20 |

> Kapasite düzeni **Kittens Game** dengesine göre asimetriktir: Yiyecek (KG Catnip 5000) geniş, malzeme kaynakları (Odun 200, Taş/Mineral/Bilgi 250, İnanç 100) dar ve nadir kaynaklar çok dar (İpek 4). Depo/Ambar katkıları bu taban değerlerle orantılıdır (Bölüm 2.2).

### 2.2 Depo / Ambar Katkıları (yeni)

| Kaynak | Depo başına | Ambar başına |
|---|---|---|
| Yiyecek | 1000 | 500 |
| Su | 500 | 250 |
| Ekmek | 250 | 125 |
| Kereste | 125 | 60 |
| Odun | 50 | 25 |
| Taş, Mineral, Bilgi | 50 | 25 |
| İnanç | 25 | 12 |
| Kültür | 12 | 6 |
| Kumaş, İlaç | 25 | 12 |
| Demir, Konyak, Çelik, Mermer | 12 | 6 |
| Baharat, Şarap | 5 | 2 |
| İpek | 2 | 1 |
| Mobilya, Heykel, Mücevher | 5 | 2 |

> Ölçek: depo/ambar katkısı kaynağın **taban kapasitesiyle orantılıdır** (~%25 / ~%12.5) — KG'de Ahır'ın her kaynağa taban kapasitenin katları kadar ekleme yapması gibi.

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
| Üreticiler (Kuyu, Tarla, Oduncu, …) | ×1.15 |
| Güç Ocağı / Kumandanlık / Çeşme | **×1.12** (KG Catnip Field / Aqueduct) |
| Bonus binalar | **×1.15** |
| Depo | **×1.75** (KG Barn) |
| Ambar / İndirim / Depolama / İşçi bonusu | ×1.15 |
| Konut: Baraka | ×2.50 (KG Hut) |
| Konut: Ev | **×1.15** (KG Log House) |
| Sanayi (tek seferlik) | çarpansız |
| Paketler | ×1.17 / ×1.22 / ×1.25 |

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

Kilitler (KG ölçeği, yeni): **Güç Ocağı 10 Güç** (KG 10 catnip) · Kuyu **5** Güç Ocağı · Tarla **5** Kuyu · Oduncu **5** Tarla · Taş Ocağı **1** Oduncu (taş, Maden'den önce üretilir) · Maden **5** Oduncu · Akademi **3** Maden · Tapınak **5** Akademi · Bahçe **5** Tapınak · Üzüm Bağı **3** Bahçe · İpek Atölyesi **3** Üzüm Bağı.

### 3.3 Bonus Binalar (bonus) — çarpan ×1.15, bonus %2/seviye

> Bonus binaların çarpanı Kittens Game'deki %-bonus binaları gibi **×1.15**'e çekildi. Bonus her seviyede **%2**'dir (değişmedi).

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

Kilitler (KG ölçeği, yeni): Kumandanlık 5 Güç Ocağı · Çeşme **3** Kuyu · Değirmen **3** Tarla · Keresteci 1 Oduncu · Taş Atölyesi 1 Taş Ocağı · Madenci Kampı **3** Maden · Sunak **3** Tapınak · Baharat Değirmeni **3** Bahçe.

### 3.4 Maliyet İndirimi Binaları (costBonus)

| Bina (id) | İndirim/seviye | Yeni Maliyet | Parça |
|---|---|---|---|
| Dokuma Tezgahı (`loom`) | %2 (min %50'ye kadar) | 60000 Güç + 200 Odun + 2 İpek + 100 Taş | 4 |

Kilitler (KG ölçeği, yeni): Dokuma Tezgahı 1 İpek Atölyesi.

### 3.5 Depolama Binaları

| Bina (id) | Tür | Yeni Maliyet | Parça | Görev |
|---|---|---|---|---|
| Depo (`depo`) | storage | **50 Güç** | 2 | kaynağın `storagePerDepo` değeri kadar kapasite ekler |
| Ambar (`ambar`) | capacityBonus | 150 Güç + 40 Su + 20 Yiyecek | 3 | `storagePerAmbar` kadar kapasite + **%5/seviye** çarpımsal kapasite |
| Şaraphane (`winery`) | storageBonus | 40000 Güç + 100 Mineral + 3 Şarap + 75 Taş | 4 | tüm kapasiteleri **%5/seviye** artırır |

Kilitler (KG ölçeği, yeni): Depo 1 Kuyu · **Ambar 5 Tarla** · Şaraphane 1 Üzüm Bağı.

### 3.6 İşçi Bonus Binası (workerBonus)

**Kütüphane** (`library`)
- Maliyet: 4000 Güç + 120 Mineral + 40 Bilgi + 20 Taş + 3 Demir (5 parça) · Çarpan: ×1.15
- Bonus: tüm sanayi çıktısı **%10/seviye**
- Kilit: **3** Akademi (KG ölçeği, yeni)

### 3.7 Konut Binaları (housing)

> Baraka KG Kulübesi (×2.5, 1 kişi) gibi kalır; **Ev**, KG Kereste Evi gibi **×1.15** ve 2 kişilik olur.

| Bina (id) | Konut Kapasitesi | Çarpan | Maliyet | Parça |
|---|---|---|---|---|
| Baraka (`baraka`) | 1 kişi | ×2.50 | 50 Güç + 10 Su | 2 |
| Ev (`ev`) | 2 kişi | **×1.15** | 400 Güç + 20 Yiyecek + 10 Odun + 5 Taş + 2 Kereste | 4 |

Kilitler (KG ölçeği, yeni): Baraka 5 Güç Ocağı · Ev **5** Baraka.

### 3.8 Yeni Özel Binalar (v9)

| Bina (id) | Tür | Etki | Maliyet | Çarpan | Kilit |
|---|---|---|---|---|---|
| Atölye (`workshop`) | productBonus | **işlenmiş + craft üretimi +%6/seviye** | 5000 Güç + 250 Odun + 100 Mineral + 30 Taş + 5 Demir | ×1.15 | **all**: Sanayi Demirci + 1 Zanaat paketi |
| Amfitiyatro (`amphitheatre`) | producer | **Kültür 0.01/sn** | 8000 Güç + 300 Bilgi + 150 Taş + 2 Mermer | ×1.15 | 5 Tapınak |
| Ticaret Merkezi (`tradePost`) | tradeBonus | tüccar sıklığı + teklif boyutu **+%50/seviye** | 10000 Güç + 400 İnanç + 100 Kereste + 2 Demir | ×1.15 | 3 Üzüm Bağı |

> **`all` kilit tipi:** koşulların **tamamı** sağlanmalı (ör. Atölye = Demirci inşa edilmiş **ve** 1 Zanaat paketi). İlerleme `"1/1 + 1/1"` biçiminde gösterilir.

---

## 4. Sanayi Binaları (Industry)

Sanayi binaları tek seferlik inşa edilir (`built`), maliyeti çarpansızdır (`ceil`). İşçiler atanır (`maxWorkers` sınırı) ve girdi mevcutken üretir.

> **Yeni girdi/çıktı kuralı (Kittens Game):** dönüşümler **kayıplıdır** — KG'de Eritme Ocağı 5 Mineral → 1 Demir dönüştürür. Proje aynı oran mantığını kullanır (örn. Demirci 0.05 Mineral → 0.01 Demir). Kar satış değerinden gelir; girdiler ham olduğundan kayıplı dönüşüm karlı kalır. Değerler saniyede işçi başınadır.

| id | Ad | Maliyet (Güç + diğer) | Girdi/sn (işçi başına) → Çıktı/sn | Max İşçi | Kilit |
|---|---|---|---|---|---|
| firin | Fırın | 500 ⚡ + 20 💧 + 50 🌾 + 15 🪨 | 0.08 🌾 + 0.02 💧 → **0.06** 🍞 | 3 | 10 Tarla |
| keresteAtolyesi | Kereste Atölyesi | 800 ⚡ + 80 🌾 + 30 🪵 + 15 🪨 | 0.06 🪵 → **0.01** 🪚 | 3 | 8 Oduncu |
| blacksmith | Demirci | 2000 ⚡ + 150 🪵 + 50 💎 | 0.08 💎 → **0.01** ⚙️ | 3 | 8 Maden |
| sifaOcagi | Şifa Ocağı | 8000 ⚡ + 500 📖 + 150 🕯️ | 0.02 🕯️ + 0.01 🌶️ → **0.01** 💊 | 3 | 1 Bahçe |
| damitimevi | Damıtımevi | 15000 ⚡ + 400 🕯️ + 80 🌶️ | 0.02 🍷 → **0.005** 🥃 | 3 | 8 Üzüm Bağı |
| kumasAtolyesi | Kumaş Atölyesi | 30000 ⚡ + 150 🌶️ + 80 🍷 | 0.01 🧵 → **0.005** 🧶 | 3 | 8 İpek Atölyesi |
| celikFirini | Çelik Fırını | 60000 ⚡ + 750 💎 + 400 🪵 | 0.02 ⚙️ + 0.02 💎 → **0.005** 🔩 | 4 | **all**: Demirci + 1 Metal İşleme |
| mermerAtolyesi | Mermer Atölyesi | 80000 ⚡ + 1000 🪨 + 300 🪵 | 0.05 🪨 → **0.01** 🗿 | 3 | 10 Tapınak |
| mobilyaAtolyesi | Mobilya Atölyesi | 100000 ⚡ + 400 🪵 + 500 💎 + 1 🔩 | 0.01 🪚 + 0.01 🔩 → **0.005** 🛋️ | 3 | Çelik Fırını |
| mucevherAtolyesi | Mücevher Atölyesi | 120000 ⚡ + 250 🌶️ + 15 🧶 + 8 🗿 | 0.02 🧶 + 0.01 🔩 + 0.01 🗿 → **0.01** 💎 | 3 | Kumaş Atölyesi |
| heykelAtolyesi | Heykel Atölyesi | 150000 ⚡ + 25 🗿 + 12 🔩 + 500 🪨 | 0.02 🗿 + 0.01 🔩 → **0.005** 🏛️ | 3 | Mermer Atölyesi |
| darphane | Darphane | 60000 ⚡ + 20 🍷 + 8 🧵 | 0.02 🍷 + 0.01 🧵 → **0.01** 🪙 | 3 | **all**: Kumaş Atölyesi + 1 Yazı |

Sanayi kilitleri KG ölçeğine çekildi: Fırın 5 Tarla · Kereste Atölyesi 5 Oduncu · Demirci 3 Maden · Damıtımevi 3 Üzüm Bağı · Kumaş Atölyesi 3 İpek Atölyesi · Mermer Atölyesi 5 Tapınak. Çelik Fırını ve Darphane artık **`all` tipi kilit** kullanır (tesis + paket şartı). Maliyetler yaklaşık %50 aşağı çekildi.

> **KG crafting kayıp yapısı (yeni):** dönüşümler Kittens Game reçeteleriyle orantılı olarak kayıplıdır — KG'de Beam 175 Odun→1, Slab 100 Mineral→1, Steel 100 Demir+100 Kömür→1. Proje ölçeğinde: Kereste 6:1, Demir 8:1, Mermer 5:1, Çelik 8:1, Mobilya/Mücevher/Heykel ~2–4:1. Girdiler ham olduğundan kar satış değerinden gelir.

---

## 5. Paketler (Packs)

| id | Ad | Emoji | Açıklama | Baz Maliyet | Çarpan | Seviye Başına Bonus | Kilit |
|---|---|---|---|---|---|---|---|
| clickPower | Üretim Gücü | 🛠️ | Tüm binaların üretimini %5 artırır | 30 Bilgi | ×1.17 | %5 (tüm üretim) | — |
| critClick | Kudret | ⚡ | Güç üretimini %8 artırır | 100 Bilgi | ×1.25 | %8 (Güç) | 1 Üretim Gücü |
| autoClick | Zanaat | 🧰 | İşlenmiş ve craft ürün üretimini %8 artırır | 300 Bilgi | ×1.22 | %8 (processed + craft) | 1 Kudret |
| powerPatronage | İktidar | 👑 | Güç üretimini %10 artırır | 500 Bilgi | ×1.17 | %10 (Güç) | 1 Zanaat |
| metalIsleme | Metal İşleme | ⚙️ | İşlenmiş ve craft ürün üretimini %8 artırır | 900 Bilgi | ×1.22 | %8 (processed + craft) | 1 İktidar |
| eritme | Eritme | ⚒️ | Tüm bina maliyetlerini %2 azaltır | 1500 Bilgi | ×1.17 | %2 (bina maliyeti) | 1 Metal İşleme |
| yazi | Yazı | 📜 | Tüm binaların üretimini %5 artırır | 3600 Bilgi | ×1.17 | %5 (tüm üretim) | 1 Metal İşleme |

> **Kilit kuralı:** paketler yalnızca **bir önceki paketin satın alınmasıyla** açılır; hiçbir paket kilidi bir binaya bağlı değildir. Baz maliyetler Kittens Game teknoloji maliyet eğrisinden türetilmiştir (KG: Calendar 30, Agriculture 100, Archery 300, Mining 500, Metal Working 900, Writing 3600).

Paket maliyeti: `ceil(taban × çarpan^seviye)` (indirim yok).

---

## 6. Matematiksel Sabitler ve Formüller

### 6.1 Maliyetler

```
Bina maliyeti = ceil( tabanMaliyet × maliyetÇarpanı^adet × maliyetİndirimi )
  maliyetÇarpanı: üretici/bonus/ambar vb. 1.15 · Güç Ocağı/Kumandanlık/Çeşme 1.12
                 · Depo 1.75 · Baraka 2.50 · Ev 1.15
  maliyetİndirimi = max(0.50, 1 − (Eritme paketi + Dokuma Tezgahı) × adet × 0.02)

Sanayi maliyeti = ceil( tabanMaliyet )   // çarpansız, tek seferlik
Paket maliyeti  = ceil( tabanMaliyet × çarpan^seviye )
```

### 6.2 Üretim

```
Çıktı Çarpanı(resource) = 1 + Σ bonusBinalar(hedef=resource, +%2/adet)
                            + Σ paketBonusları
                            + productBonusBinalar(Atölye, +%6/adet) [yalnızca processed/craft]
                            + Prestij Üretim Bonusu (Paragon × 0.005)
      paketBonusları: productionBonusPerLevel (herkese)
                      + powerBonusPerLevel (sadece Güç)
                      + productBonusPerLevel (sadece processed/craft, raw ve currency hariç)

Mevsim Çarpanı(resource) = SEASONS_DATA[mevsim].modifiers[resource]  // yoksa 1
Kaynak üretimi = Σ(üretici adet × üretim) × Çıktı Çarpanı × Mevsim Çarpanı
Sanayi çıktısı = Σ(işçi × çıktıOranı) × Çıktı Çarpanı × İşçi Çarpanı
İşçi Çarpanı   = 1 + Kütüphane adet × 0.10
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
| Kültür | Kültür üretimi var (Amfitiyatro) | +1/bina (maks. +8) |
| İşgücü Dengesi | boşta oran ≤0.35 / >0.65 | +5 / −3 |

*Lüks mutluluk değerleri: Şarap 5, Konyak 6, Kumaş 7, Mobilya 7, Mücevher 8, Heykel 9. Lüks kalemleri yalnızca ilgili kaynağın üretimi varsa listelenir. Kültür kalemi yalnızca Kültür üretimi olduğunda listelenir (KG'deki Festivals/Kültür mutluluk etkisine benzer). **Karma** bonusu hedefe doğrudan eklenir: `hedef + Karma × 0.25`.

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
| `building` | `binaAdet >= count` | Ambar: 5 Tarla |
| `pack` | `paketSeviye >= level` (yalnızca önceki paket) | Kudret: 1 Üretim Gücü |
| `industry` | tesis inşa edilmiş | Mermer Atölyesi: 5 Tapınak |
| `all` | **tüm** koşullar sağlanmalı | Çelik Fırını: Demirci + 1 Metal İşleme |

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
- Etkiler: **Paragon** → üretim +%0.5/puan (`getPrestigeProductionBonus`), **Karma** → mutluluk +%0.25/puan.
- Header'da ⛩️ Paragon / 🌟 Karma chip'i gösterilir (kaynak yoksa soluk).

### 6.9 Ticaret (v9)

- Tüccar, `getTradeInterval()` saniyede bir teklif üretir: `max(12, 45 / (1 + TicaretMerkezi × 0.5))`.
- Teklif: rastgele kaynak → miktar `TRADE_AMOUNTS[nadirlik]` aralığında, Ticaret Merkezi boyut bonusuyla artırılır; maliyet `round(miktar × fiyat × 0.6)` Altın.
- Taban fiyatlar: Odun 1 · Taş 1.5 · Maden 2 · Bilgi 2 · İnanç 2 · Baharat 3 · Ekmek 1 · Kereste 2 · Demir 3 · İlaç 6 · Kumaş 7 · Konyak 12 · Çelik 15 · Mermer 20 · Mobilya 30 · Mücevher 50 · Heykel 60. (Kaynağın kendi satış fiyatı varsa o kullanılır.)
- Teklif kabulü: Altın yeterli ve hedef kaynak kapasitesi dolu değilse; kabul edilince teklif tükenir, sayaç +1, süre sıfırlanır.
- Sağ panel **Ticaret** sekmesinde Ticaret Merkezi kartı ve teklif kartı gösterilir.

---

## 7. Hızlı Referans: Ekonominin Akışı

1. **Güç** (üretici, 0.625) → her şeyin yapı taşı; bakım gideri var.
2. **Su / Yiyecek** (üretici, 0.30 / 0.15) → nüfus hayatta kalması ve Fırın için; 1 Kuyu ~3–4, 1 Tarla ~1.5 kişi besler.
3. **Odun → Taş → Mineral** (0.08 / 0.04 / 0.02) → yapı ve sanayi girdileri.
4. **Fırın** (0.08🌾 + 0.02💧 → 0.06🍞) → Ekmek → nüfus + satış.
5. **Bilgi** (Akademi, 0.04) → paketler (KG eğrisi: 30/100/300/500/900/3600) + Kütüphane/Şifa Ocağı.
6. **İnanç** (Tapınak, 0.02) → Bahçe + Sunak + Şifa Ocağı/Damıtımevi.
7. **Baharat / Şarap / İpek** (0.01, İpek en değerli) → ileri sanayi girdileri.
8. **Demir / Çelik / Kereste / Mermer / Kumaş** → üst tier üretim ve satış (kayıplı dönüşüm, KG mantığı).
9. **Konyak / Mobilya / Mücevher / Heykel / Altın** → en üst üretim; Altın nüfusu mutlu eder ve otomatik satışı güçlendirir.
10. **Kültür** (Amfitiyatro, 0.01) → mutluluk kalemi (+1/bina, maks +8).
11. **Mevsimler** üretici üretimini döngüsel olarak güçlendirir/zayıflatır; **Ticaret** Altın→kaynak takası sağlar.
12. **Prestij** (Sıfırla) kalıcı Paragon/Karma bonusu biriktirir.
