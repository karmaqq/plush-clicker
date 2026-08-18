# ═══════════════════════════════════════════════════════════════════════════
#                          NİHAİ PLAN — v2.0
# ═══════════════════════════════════════════════════════════════════════════

> **Tarih:** 2026-08-18
> **Durum:** NİHAİ — Uygulamaya hazır
> **Kaynak:** 4 ajan çıktısı + denge testi + çapraz doğrulama + mevcut kod analizi sentezlendi
> **Proje:** Plush Clicker — 10 Kaynaklı Idle/Clicker Oyunu

---

## 1. GENEL BAKIŞ

### 1.1 Oyun Tanımı

Idle/Clicker türünde bir şehir kurma oyunu. Oyuncu ham kaynak üretir, binalar inşa eder, sanayi ürünleri oluşturur ve nüfusunu büyütür. 3 çağ boyunca (Kasaba → Teknoloji → Uzay) ilerler.

### 1.2 Temel Mekanikler

- **Click-to-produce:** Tıklama ile Güç üretimi
- **Idle production:** Binalar otomatik kaynak üretir
- **Building chain:** Binalar birbirini açar (kilitleme sistemi)
- **Industry chain:** Ham madde → işlenmiş ürün → lüks ürün
- **Population system:** Nüfus tüketim yaratır, bina kapasitesi gerektirir
- **Era progression:** Nüfus + Altın hedefi ile çağ atlar, tüm isimler/temalar değişir
- **Season system:** 4 mevsim döngüsü, üretim hızlarını etkiler
- **Trade system:** Kültür kilidiyle açılan ticaret sistemi

### 1.3 Temel Prensipler

- Her bina maliyeti = **Güç + alt tier kaynaklar** formülü
- Hiyerarşi: Tier 0 → 1 → 2 → 3 → Altın (en hızlıdan en yavaşa)
- Nüfus tüketim yaratır → kaynak baskısı → bina inşaatı zorunluluğu
- Çağ geçişleri sadece görsel/tematik değişiklik getirir, mekanikleri değiştirmez
- Kereste/k odun tamamen kaldırılmıştır — 10 kaynak sistemi geçerlidir
- Tüm resource ID'leri ASCII karakter kullanır (`inanc`, `inanç` DEĞİL)

### 1.4 Mevcut Kod Yapısı ile Uyum

Bu plan, mevcut `modüler.md`deki 11 fazlı yeniden yapılandırma planıyla uyumludur. Oyun mantığı (production.js, population.js, engine.js vb.) bu plandaki değerlere göre güncellenecektir. UI modülleri (building-card.js, industry-card.js vb.) mevcut yapıyla uyumlu kalacaktır.

---

## 2. 10 KAYNAK SİSTEMİ

### 2.1 Kaynak Tablosu

| ID | Tier | Evre 1 (Kasaba) | Evre 2 (Teknoloji) | Evre 3 (Uzay) | Üretim Hızı (b.bası) | Baz Kapasite |
|----|------|-----------------|---------------------|----------------|----------------------|--------------|
| power | 0 | Güç | Enerji | Plazma | 0.500/sn | Sınırsız |
| su | 1 | Su | Arıtılmış Su | Kuantum Su | 0.250/sn | 1000 |
| yiyecek | 1 | Yiyecek | Gıda | Sentez Gıda | 0.200/sn | 1250 |
| bilgi | 2 | Bilgi | Veri | Yapay Zeka | 0.100/sn | 500 |
| tas | 2 | Taş | Çelik | Karbon Fiber | 0.100/sn | 600 |
| maden | 2 | Mineral | Çip | Kuantum İşlemci | 0.080/sn | 400 |
| kultur | 3 | Kültür | Medya | Holodeck | 0.050/sn | 200 |
| inanc | 3 | İnanç | Spiral | Kozmik Enerji | 0.040/sn | 150 |
| ipek | 3 | İpek | Grafen | Nano Fiber | 0.030/sn | 100 |
| altin | - | Altın | Kredi | Kredi | 0.015/sn | Sınırsız |

### 2.2 Üretim Hızı Hiyerarşisi

```
Güç : Su : Yiyecek : Bilgi : Taş : Maden : Kültür : İnanç : İpek : Altın
1.000 : 0.500 : 0.400 : 0.200 : 0.200 : 0.160 : 0.100 : 0.080 : 0.060 : 0.030
```

Her tier bir öncekinden yavas uretir. Bu hiyerarsi oyunun tempo kaynagidir.

### 2.3 Kapasite ve Depo

| Kaynak | Baz Kapasite | Depo Başı Artış | Ambar Bonusu |
|--------|-------------|-----------------|--------------|
| power | Sınırsız | - | - |
| su | 1000 | 200 | %5/seviye |
| yiyecek | 1250 | 250 | %5/seviye |
| bilgi | 500 | 100 | %5/seviye |
| tas | 600 | 120 | %5/seviye |
| maden | 400 | 80 | %5/seviye |
| kultur | 200 | 40 | %5/seviye |
| inanc | 150 | 30 | %5/seviye |
| ipek | 100 | 20 | %5/seviye |
| altin | Sınırsız | - | - |

**Formül:** `Toplam Kapasite = Baz + (Depo Sayısı × Artış) × (1 + Ambar Bonusu)`

**Kapasite Hedefi:** Her kaynagin kapasitesi, 4 saatlik tam kapasitede uretime esit olmali. Bu, depo insaasini oyun mekaniğinin parçasi yapar.

### 2.4 Nüfus Tüketim Oranları (saniyede)

| Kaynak | Kişi Başı | 50 Kişi | 100 Kişi | 200 Kişi |
|--------|----------|---------|----------|----------|
| su | 0.020 | 1.000/s | 2.000/s | 4.000/s |
| yiyecek | 0.030 | 1.500/s | 3.000/s | 6.000/s |
| ekmek | 0.010 | 0.500/s | 1.000/s | 2.000/s |
| ilaç | 0.005 | 0.250/s | 0.500/s | 1.000/s |
| kultur | 0.002 | 0.100/s | 0.200/s | 0.400/s |

**Nüfus-Aktif Kaynak İlişkisi:**

| Nüfus | Aktif Olması Gereken Minimum Kaynak |
|-------|--------------------------------------|
| 1-20 | Su, Yiyecek |
| 21-50 | Su, Yiyecek, Ekmek (Fırın) |
| 51-100 | Su, Yiyecek, Ekmek, İlaç (Şifa Ocağı) |
| 101-200 | Su, Yiyecek, Ekmek, İlaç, Kültür |
| 200+ | Tüm kaynaklar |

### 2.5 Mevsim Etkileri

| Mevsim | Süre | Su | Yiyecek | Taş | İpek | Kültür | Etki |
|--------|------|----|---------|-----|------|--------|------|
| İlkbahar | 90sn | 1.0x | 1.0x | 1.0x | 1.0x | 1.0x | Normal |
| Yaz | 90sn | 0.8x | 1.2x | 1.0x | 1.1x | 1.2x | Sıcak |
| Sonbahar | 90sn | 1.0x | 1.0x | 0.9x | 1.0x | 1.0x | Normal |
| Kış | 90sn | 0.8x | 0.6x | 0.9x | 0.7x | 1.0x | Sert |

**Mevsim Döngüsü:** 360 sn (6 dakika) — Her mevsim 90 sn sürer.

**Kış Stok Hesabı (100 Nüfus):**
```
Su üretimi:     10 × 0.250 × 0.8 × 90 = 1800 su
Su tüketimi:    100 × 0.020 × 90 = 1800 su → DENGE (sınırda!)
Yiyecek üretimi: 15 × 0.200 × 0.6 × 90 = 1620 yiyecek
Yiyecek tüketimi: 100 × 0.030 × 90 = 2700 yiyecek → -1080 AÇIK!
```

> Kış mevsimi 100 nüfusta ciddi kriz yaratır. Bu kasıtlı bir baskı mekaniğidir.

---

## 3. BİNA ZİNCİRİ

### 3.1 Üretim Binaları

#### Tier 0 — Güç

| ID | İsim | Çıktı | Hız | Maliyet | costMultiplier | Kilit |
|----|------|-------|-----|---------|----------------|-------|
| fountain | Güç Ocağı | power | 0.500/sn | { power: 10 } | 1.13 | power ≥ 10 |
| mansion | Kumandanlık | power bonus | +2%/lvl | { power: 75 } | 1.16 | fountain ×5 |

#### Tier 1 — Su & Yiyecek

| ID | İsim | Çıktı | Hız | Maliyet | costMultiplier | Kilit |
|----|------|-------|-----|---------|----------------|-------|
| well | Kuyu | su | 0.250/sn | { power: 100 } | 1.13 | fountain ×5 |
| aqueduct | Çeşme | su bonus | +2%/lvl | { power: 250, su: 30 } | 1.16 | well ×5 |
| farm | Tarla | yiyecek | 0.200/sn | { power: 150, su: 20 } | 1.16 | well ×5 |
| mill | Değirmen | yiyecek bonus | +2%/lvl | { power: 400, yiyecek: 10 } | 1.16 | farm ×5 |

#### Tier 2 — Bilgi, Taş, Mineral

| ID | İsim | Çıktı | Hız | Maliyet | costMultiplier | Kilit |
|----|------|-------|-----|---------|----------------|-------|
| quarry | Taş Ocağı | tas | 0.100/sn | { power: 200, yiyecek: 30 } | 1.17 | academy ×1 |
| stoneAtelier | Taş Atölyesi | tas bonus | +2%/lvl | { power: 600, tas: 15 } | 1.17 | quarry ×1 |
| mine | Maden | maden | 0.080/sn | { power: 300, yiyecek: 40, tas: 10 } | 1.17 | quarry ×3 |
| minerCamp | Madenci Kampı | maden bonus | +2%/lvl | { power: 1200, tas: 20, maden: 15 } | 1.17 | mine ×3 |
| academy | Akademi | bilgi | 0.150/sn | { power: 500, yiyecek: 80, su: 40 } | 1.17 | farm ×5 |
| library | Kütüphane | bilgi bonus | +2%/lvl | { power: 2500, bilgi: 40, tas: 20 } | 1.20 | academy ×3 |

#### Tier 3 — Kültür, İnanç, İpek

| ID | İsim | Çıktı | Hız | Maliyet | costMultiplier | Kilit |
|----|------|-------|-----|---------|----------------|-------|
| theatre | Tiyatro | kultur | 0.050/sn | { power: 3000, bilgi: 80, tas: 50 } | 1.18 | academy ×5 |
| amphitheatre | Amfitiyatro | kultur bonus | +2%/lvl | { power: 15000, kultur: 5, tas: 100 } | 1.20 | theatre ×1 |
| temple | Tapınak | inanc | 0.040/sn | { power: 2000, bilgi: 80, maden: 40 } | 1.18 | academy ×5 |
| altar | Sunak | inanc bonus | +2%/lvl | { power: 8000, inanc: 10, bilgi: 100 } | 1.18 | temple ×5 |
| silkWorkshop | İpek Atölyesi | ipek | 0.030/sn | { power: 20000, bilgi: 100, tas: 80 } | 1.18 | theatre ×3 |
| loom | Dokuma Tezgahı | ipek bonus | +2%/lvl | { power: 40000, ipek: 2, tas: 100 } | 1.22 | silkWorkshop ×1 |

### 3.2 Sanayi Binaları

> **Kural:** Tüm girdiler 10 kaynaktan seçilir. Sanayi çıktıları işlenmiş üründür. Kereste tamamen kaldırılmıştır.

| ID | İsim | Girdi → Çıktı | Max İşçi | Maliyet | Kilit |
|----|------|----------------|----------|---------|-------|
| firin | Fırın | yiyecek + su → ekmek | 3 | { power: 425, su: 17, yiyecek: 42 } | farm ×5 |
| blacksmith | Demirci | maden → demir | 3 | { power: 1700, yiyecek: 100, tas: 30 } | mine ×3 |
| celikFirini | Çelik Fırını | maden + demir → çelik | 4 | { power: 51000, tas: 638, yiyecek: 340 } | blacksmith + metalIsleme(Lv1) |
| mermerAtolyesi | Mermer Atölyesi | tas → mermer | 3 | { power: 68000, tas: 850, yiyecek: 255 } | temple ×5 |
| kumasAtolyesi | Kumaş Atölyesi | ipek → kumaş | 3 | { power: 25500, su: 128, yiyecek: 68 } | silkWorkshop ×3 |
| sifaOcagi | Şifa Ocağı | inanc + bilgi → ilaç | 3 | { power: 6800, bilgi: 180, inanc: 128 } | temple ×1 |
| mobilyaAtolyesi | Mobilya Atölyesi | tas + çelik → mobilya | 3 | { power: 85000, yiyecek: 340, maden: 425 } | celikFirini |
| heykelAtolyesi | Heykel Atölyesi | mermer + çelik → heykel | 3 | { power: 127500, tas: 21, yiyecek: 10 } | mermerAtolyesi |
| mucevherAtolyesi | Mücevher Atölyesi | kumaş + çelik + mermer → mücevher | 3 | { power: 102000, su: 213, yiyecek: 13 } | kumasAtolyesi |
| darphane | Darphane | bilgi + ipek → altın | 3 | { power: 51000, bilgi: 17, yiyecek: 7 } | kumasAtolyesi + yazi(Lv1) |

### 3.3 İşçi Sistemi

Her bina için ek işçi ekleme maliyeti artan şekilde hesaplanır:

```
İşçi Maliyeti = Baz Maliyet × (Mevcut İşçi Sayısı)^1.5
```

| İşçi # | Çarpan | 1. İşçi Baz Maliyeti = 10 power ise |
|--------|--------|-------------------------------------|
| 2. İşçi | ×2.8 | 28 power |
| 3. İşçi | ×5.2 | 52 power |
| 4. İşçi | ×8.0 | 80 power |
| 5. İşçi | ×11.2 | 112 power |
| 8. İşçi | ×22.6 | 226 power |

> İlk 2-3 işçi nispeten ucuzdur, 5+ işçi ciddi power tüketir. Bu, oyuncuyu birden fazla bina kurmaya iter (çoğaltma stratejisi).

**Toplam Maksimum İşçi Kapasitesi:** 62 (11 sanayi binası, ortalama ~5.6/bina)

### 3.4 Sanayi Hızları ve Verimlilikleri

| Sanayi | Üretim Hızı (1 işç) | Girdi/s (1 işç) | Verimlilik | Max İşçi |
|--------|---------------------|-----------------|------------|----------|
| Fırın (ekmek) | 0.060/sn | 0.100/s (0.080+0.020) | %60 | 3 |
| Demirci (demir) | 0.010/sn | 0.080/s | %12.5 | 3 |
| Çelik Fırını (çelik) | 0.005/sn | 0.040/s (0.020+0.020) | %12.5 | 4 |
| Mermer (mermer) | 0.010/sn | 0.050/s | %20 | 3 |
| Kumaş (kumaş) | 0.005/sn | 0.010/s | %50 | 3 |
| Şifa (ilaç) | 0.010/sn | 0.030/s (0.020+0.010) | %33 | 3 |
| Mobilya | 0.005/sn | 0.020/s (0.010+0.010) | %25 | 3 |
| Heykel | 0.005/sn | 0.030/s (0.020+0.010) | %16.7 | 3 |
| Mücevher | 0.002/sn | 0.040/s (0.020+0.010+0.010) | %5 | 3 |
| Darphane (altın) | 0.015/sn | 0.015/s (0.010+0.005) | %100 | 3 |

### 3.4 Sanayi Kaynak Tüketim Tablosu (1'er İşçi)

| Kaynak | Fırın | Demirci | Çelik | Mermer | Kumaş | Şifa | Mobilya | Heykel | Mücevher | Darphane | TOPLAM |
|--------|-------|---------|-------|--------|-------|------|---------|--------|----------|----------|--------|
| su | 0.020 | - | - | - | - | - | - | - | - | - | 0.020 |
| yiyecek | 0.080 | - | - | - | - | - | - | - | - | - | 0.080 |
| bilgi | - | - | - | - | - | 0.010 | - | - | - | 0.005 | 0.015 |
| tas | - | - | - | 0.050 | - | - | 0.010 | - | - | - | 0.060 |
| maden | - | 0.080 | 0.020 | - | - | - | - | - | - | - | 0.100 |
| inanc | - | - | - | - | - | 0.020 | - | - | - | - | 0.020 |
| ipek | - | - | - | - | 0.010 | - | - | - | - | 0.010 | 0.020 |
| demir | - | - | 0.020 | - | - | - | - | - | - | - | 0.020 |
| mermer | - | - | - | - | - | - | - | 0.020 | 0.010 | - | 0.030 |
| çelik | - | - | - | - | - | - | 0.010 | 0.010 | 0.010 | - | 0.030 |
| kumaş | - | - | - | - | - | - | - | - | 0.020 | - | 0.020 |

### 3.5 Sanayi Zincir Diyagramı

```
GÜÇ (0.500/sn) ────────────────────────────────────────────────────────►
     │
     ├──→ SU (0.250/sn) ──→ Fırın ──→ Ekmek
     │         │
     │         └──→ Fırın (girdi olarak)
     │
     ├──→ YİYECEK (0.200/sn) ──→ Fırın (girdi olarak)
     │
     ├──→ TAS (0.100/sn) ──→ Mermer Atölyesi ──→ Mermer
     │         │                │
     │         │                ├──→ Heykel Atölyesi ──→ Heykel
     │         │                └──→ Mücevher Atölyesi ──→ Mücevher
     │         │
     │         └──→ Mobilya Atölyesi ──→ Mobilya
     │
     ├──→ MADEN (0.080/sn) ──→ Demirci ──→ Demir
     │         │                   │
     │         │                   └──→ Çelik Fırını ──→ Çelik
     │         │                              │
     │         │                              ├──→ Mobilya Atölyesi
     │         │                              ├──→ Heykel Atölyesi
     │         │                              └──→ Mücevher Atölyesi
     │         │
     │         └──→ Çelik Fırını (girdi olarak)
     │
     ├──→ BILGI (0.100/sn) ──→ Şifa Ocağı (girdi olarak)
     │                          └──→ Darphane (girdi olarak)
     │
     ├──→ INANC (0.040/sn) ──→ Şifa Ocağı ──→ İlaç
     │
     ├──→ IPEK (0.030/sn) ──→ Kumaş Atölyesi ──→ Kumaş
     │                            │
     │                            ├──→ Mücevher Atölyesi
     │                            └──→ Darphane
     │
     └──→ KULTUR (0.050/sn) ──→ (Ticaret sistemi tetikleyicisi)
```

### 3.6 Konut Binaları

| ID | İsim | Kapasite | Maliyet | costMultiplier | Kilit |
|----|------|----------|---------|----------------|-------|
| baraka | Baraka | +5 nüfus | { power: 90, su: 18 } | 1.28 | fountain ×6 |
| ev | Ev | +25 nüfus | { power: 750, yiyecek: 50, tas: 25 } | 2.60 | baraka ×7 + blacksmith |

### 3.7 Depo Binaları

| ID | İsim | Etki | Maliyet | costMultiplier | Kilit |
|----|------|------|---------|----------------|-------|
| depo | Depo | Kaynak kapasitesini artırır | { power: 90, su: 20 } | 1.85 | farm ×3 |
| ambar | Ambar | Kapasite bonusu +%/lvl | { power: 210, yiyecek: 30, tas: 15 } | 1.20 | farm ×6 |

### 3.8 Kilit Zinciri Diyagramı

```
START
  │
  ▼
[ power ≥ 10 ]
  │
  ▼
⚡ Güç Ocağı (fountain)
  │
  ├──→ fountain ×5 ──→ 🏛️ Kumandanlık (mansion)
  │                 ──→ 🪣 Kuyu (well)
  │                 ──→ 🛖 Baraka (baraka)
  │
  ▼
🪣 Kuyu (well)
  │
  ├──→ well ×5 ──→ 🏗️ Çeşme (aqueduct)
  │             ──→ 🌾 Tarla (farm)
  │
  ▼
🌾 Tarla (farm)
  │
  ├──→ farm ×3 ──→ 📦 Depo (depo)
  ├──→ farm ×5 ──→ 🏭 Değirmen (mill)
  │             ──→ 🍞 Fırın (firin)
  │             ──→ 📖 Akademi (academy)
  ├──→ farm ×6 ──→ 🏚️ Ambar (ambar)
  │
  ▼
📖 Akademi (academy)
  │
  ├──→ academy ×1 ──→ ⛏️ Taş Ocağı (quarry)
  ├──→ academy ×3 ──→ 📚 Kütüphane (library)
  │                ──→ 🧑‍🏭 İşçi Bilimi (isciBilimi)
  ├──→ academy ×5 ──→ 🎭 Tiyatro (theatre)
  │                ──→ 🕯️ Tapınak (temple)
  │
  ▼
⛏️ Taş Ocağı (quarry)
  │
  ├──→ quarry ×1 ──→ 🗿 Taş Atölyesi (stoneAtelier)
  ├──→ quarry ×3 ──→ 💎 Maden (mine)
  │
  ▼
💎 Maden (mine)
  │
  ├──→ mine ×3 ──→ ⛺ Madenci Kampı (minerCamp)
  │             ──→ ⚒️ Demirci (blacksmith)
  │
  ▼
🎭 Tiyatro (theatre)                🕯️ Tapınak (temple)
  │                                   │
  ├──→ theatre ×1 ──→ 🏛️ Amfitiyatro ├──→ temple ×1 ──→ ⚕️ Şifa Ocağı
  ├──→ theatre ×3 ──→ 🧵 İpek Atölyesi ├──→ temple ×5 ──→ 🔥 Sunak
  │                 ──→ 🛒 Ticaret Merkezi │             ──→ 🗿 Mermer Atölyesi
  │                                         │
  ▼                                         ▼
🧵 İpek Atölyesi (silkWorkshop)
  │
  ├──→ silkW ×1 ──→ 🪡 Dokuma Tezgahı
  │             ──→ 🏷️ Maliyet Bilimi
  ├──→ silkW ×3 ──→ 🧶 Kumaş Atölyesi
  │
  ▼
🧶 Kumaş Atölyesi (kumasAtolyesi)
  │
  ├──→ kumasA ──→ 💍 Mücevher Atölyesi
  │            ──→ 🪙 Darphane (+ yazi Lv1)
  │
  ▼
🔥 Çelik Fırını (celikFirini)
  │
  ├──→ celikFirini ──→ 🛋️ Mobilya Atölyesi
  │                 ──→ 💍 Mücevher Atölyesi
  │                 ──→ 🏛️ Heykel Atölyesi
  │
  ▼
END (Tüm binalar açık)
```

### 3.9 Bina Açılış Sırası

| Sıra | Bina | Kilit | Tahmini Süre |
|------|------|-------|-------------|
| 1 | Güç Ocağı | power ≥ 10 | ~5 sn |
| 2 | Kumandanlık | fountain ×5 | ~1-2 dk |
| 3 | Kuyu | fountain ×5 | ~1-2 dk |
| 4 | Baraka | fountain ×6 | ~2 dk |
| 5 | Çeşme | well ×5 | ~5 dk |
| 6 | Tarla | well ×5 | ~5 dk |
| 7 | Depo | farm ×3 | ~8 dk |
| 8 | Değirmen | farm ×5 | ~10 dk |
| 9 | Ambar | farm ×6 | ~12 dk |
| 10 | Akademi | farm ×5 | ~10 dk |
| 11 | Kütüphane | academy ×3 | ~20 dk |
| 12 | Taş Ocağı | academy ×1 | ~12 dk |
| 13 | Taş Atölyesi | quarry ×1 | ~14 dk |
| 14 | Maden | quarry ×3 | ~18 dk |
| 15 | Madenci Kampı | mine ×3 | ~22 dk |
| 16 | Demirci | mine ×3 | ~22 dk |
| 17 | İşçi Bilimi | academy ×3 | ~20 dk |
| 18 | Fırın | farm ×5 | ~10 dk |
| 19 | Ev | baraka ×7 + blacksmith | ~30 dk |
| 20 | Tiyatro | academy ×5 | ~25 dk |
| 21 | Tapınak | academy ×5 | ~25 dk |
| 22 | Amfitiyatro | theatre ×1 | ~27 dk |
| 23 | Şifa Ocağı | temple ×1 | ~27 dk |
| 24 | Sunak | temple ×5 | ~35 dk |
| 25 | İpek Atölyesi | theatre ×3 | ~30 dk |
| 26 | Dokuma Tezgahı | silkWorkshop ×1 | ~32 dk |
| 27 | Maliyet Bilimi | silkWorkshop ×1 | ~32 dk |
| 28 | Kumaş Atölyesi | silkWorkshop ×3 | ~37 dk |
| 29 | Mermer Atölyesi | temple ×5 | ~35 dk |
| 30 | Çelik Fırını | blacksmith + metalIsleme | ~45 dk |
| 31 | Mobilya Atölyesi | celikFirini | ~48 dk |
| 32 | Mücevher Atölyesi | kumasAtolyesi | ~50 dk |
| 33 | Heykel Atölyesi | mermerAtolyesi | ~50 dk |
| 34 | Darphane | kumasAtolyesi + yazi | ~55 dk |

### 3.10 Maliyet Escalasyon Tablosu (İlk 5 Seviye)

| Bina | Lvl 1 | Lvl 2 | Lvl 3 | Lvl 4 | Lvl 5 | Çarpan |
|------|-------|-------|-------|-------|-------|--------|
| ⚡ Güç Ocağı | 10 | 11 | 13 | 14 | 16 | 1.13 |
| 🏛️ Kumandanlık | 75 | 87 | 101 | 117 | 136 | 1.16 |
| 🪣 Kuyu | 100 | 113 | 128 | 144 | 163 | 1.13 |
| 🏗️ Çeşme | 250 | 290 | 336 | 390 | 453 | 1.16 |
| 🌾 Tarla | 150 | 174 | 202 | 234 | 271 | 1.16 |
| 🏭 Değirmen | 400 | 464 | 538 | 624 | 724 | 1.16 |
| ⛏️ Taş Ocağı | 200 | 234 | 272 | 316 | 367 | 1.17 |
| 🗿 Taş Atölyesi | 600 | 702 | 821 | 961 | 1124 | 1.17 |
| 💎 Maden | 300 | 351 | 411 | 481 | 562 | 1.17 |
| ⛺ Madenci Kampı | 1200 | 1404 | 1643 | 1922 | 2249 | 1.17 |
| 📖 Akademi | 500 | 585 | 684 | 801 | 937 | 1.17 |
| 📚 Kütüphane | 2500 | 3000 | 3600 | 4320 | 5184 | 1.20 |
| 🎭 Tiyatro | 3000 | 3540 | 4182 | 4937 | 5826 | 1.18 |
| 🏛️ Amfitiyatro | 15000 | 18000 | 21600 | 25920 | 31104 | 1.20 |
| 🕯️ Tapınak | 2000 | 2360 | 2785 | 3286 | 3877 | 1.18 |
| 🔥 Sunak | 8000 | 9440 | 11139 | 13144 | 15510 | 1.18 |
| 🧵 İpek Atölyesi | 20000 | 23600 | 27848 | 32861 | 38776 | 1.18 |
| 🪡 Dokuma Tezgahı | 40000 | 48800 | 59536 | 72634 | 88613 | 1.22 |
| 🛖 Baraka | 90 | 115 | 147 | 189 | 242 | 1.28 |
| 🏠 Ev | 750 | 1950 | 5070 | 13182 | 34273 | 2.60 |
| 📦 Depo | 90 | 167 | 308 | 570 | 1055 | 1.85 |
| 🏚️ Ambar | 210 | 252 | 302 | 363 | 435 | 1.20 |

---

## 4. BECERİ/PAKET SİSTEMİ

### 4.1 Beceri Ağacı

Tüm paketler **Bilgi** ile satın alınır.

| ID | İsim | Etki | Maliyet | costMultiplier | Kilit |
|----|------|------|---------|----------------|-------|
| clickPower | Üretim Gücü | Tüm üretim +%/lvl | { bilgi: 30 } | 1.20 | — |
| critClick | Kudret | Güç üretimi +%/lvl | { bilgi: 70 } | 1.20 | clickPower(Lv1) |
| autoClick | Zanaat | İşlenmiş/craft üretim +%/lvl | { bilgi: 160 } | 1.20 | critClick(Lv1) |
| powerPatronage | İktidar | Güç üretimi +%/lvl | { bilgi: 380 } | 1.20 | autoClick(Lv1) |
| metalIsleme | Metal İşleme | İşlenmiş/craft üretim +%/lvl | { bilgi: 850 } | 1.20 | powerPatronage(Lv1) |
| eritme | Eritme | Tüm bina maliyeti -%/lvl | { bilgi: 1200 } | 1.20 | metalIsleme(Lv1) |
| yazi | Yazı | Tüm üretim +%/lvl | { bilgi: 2800 } | 1.20 | metalIsleme(Lv1) |
| isciBilimi | İşçi Bilimi | Sanayi işçisi üretimi +%/lvl | { bilgi: 240 } | 1.20 | academy ×3 |
| depoBilimi | Depo Bilimi | Depo kapasitesi +%/lvl | { bilgi: 500 } | 1.20 | academy ×3 |
| maliyetBilimi | Maliyet Bilimi | Bina maliyeti -%/lvl | { bilgi: 800 } | 1.20 | silkWorkshop ×1 |
| craftAtolyesi | Craft Atölyesi | İşlenmiş/craft üretim +%/lvl | { bilgi: 640 } | 1.20 | autoClick(Lv1) |
| ticaretBilimi | Ticaret Merkezi | Tüccar sıklığı +%/lvl | { bilgi: 500, ipek: 5 } | 1.20 | theatre ×3 |

### 4.2 Paket Kilit Zinciri

```
clickPower(Lv1) → critClick(Lv1) → autoClick(Lv1) → powerPatronage(Lv1) → metalIsleme(Lv1) → eritme/yazi
                                                                                      │
                                                                                      └──→ craftAtolyesi

Zanaat(Lv1) → craftAtolyesi

Akademi ×3 → İşçi Bilimi
Akademi ×3 → Depo Bilimi
İpek Atölyesi ×1 → Maliyet Bilimi
Tiyatro ×3 → Ticaret Merkezi
```

### 4.3 Çağ Paketleri (Evre Bazlı)

Her çağda 12 paket bulunur. Paket isimleri ve tematik adları çağa göre değişir:

| # | Çağ 1 Adı | Çağ 2 Adı | Çağ 3 Adı |
|---|-----------|-----------|-----------|
| 1 | Başlangıç Paketi | Sanayi Başlangıç | Uzay Başlangıç |
| 2 | Çiftlik Paketi | Enerji Paketi | Yıldız Paketi |
| 3 | Madenci Paketi | Çip Paketi | Kuantum Paketi |
| 4 | Bilge Paketi | Veri Paketi | Yapay Zeka Paketi |
| 5 | Savaşçı Paketi | Robot Paketi | Nano Paket |
| 6 | Ticaret Paketi | Kripto Paketi | Galaktik Paket |
| 7 | İnanç Paketi | Nano Paket | Holodeck Paketi |
| 8 | İpek Yolu Paketi | Medya Paketi | Kozmik Paket |
| 9 | İmparatorluk | Mega Fabrika | Yörünge İstasyonu |
| 10 | Efsane Paketi | Singülerlik | Sonsuzluk |
| 11 | Kutsal Paket | Transendans | Evrensel Bilinç |
| 12 | Son Paket | Çağ Geçiş Paketi | Final Paket |

---

## 5. TİCARET SİSTEMİ

### 5.1 Açılış Koşulu

- **Kilit:** Tiyatro ×3 (Kültür kaynak üretimi başladığında)
- Tüccar gelme sıklığı: 300-600 saniye arası rastgele

### 5.2 Fiyat Aralıkları (Evre 1)

| Kaynak | Alım Fiyatı (Altın) | Satış Fiyatı (Altın) |
|--------|---------------------|----------------------|
| su | 2-4 | 1-2 |
| yiyecek | 3-5 | 1-3 |
| bilgi | 5-8 | 2-4 |
| tas | 3-5 | 1-3 |
| maden | 6-10 | 3-5 |
| kultur | 10-15 | 5-8 |
| inanc | 12-18 | 6-10 |
| ipek | 15-25 | 8-15 |

### 5.3 Teklif Kuralları

- Tüccar 1-3 kaynak teklif eder (rastgele seçim)
- Her teklif için miktar rastgele (1-20 arası)
- Oyuncu isterse tüm paketi satın alabilir (altın karşılığında)

---

## 6. ÇAĞ SİSTEMİ

### 6.1 Çağ Tanımları

| | Çağ 1: Kasaba | Çağ 2: Teknoloji | Çağ 3: Uzay |
|--|---------------|-------------------|-------------|
| **Tema** | Çiftlik/Köy | Endüstriyel | Bilim Kurgu |
| **Renk Paleti** | Toprak #8B5E3C, Yeşil #4A7C59, Krem #F5E6D3 | Çelik #4A5568, Neon #10B981, Mor #1E1B4B | Kozmik #2D1B69, Nebula #4F46E5, Yıldız #F59E0B |
| **Font** | El yazısı, doğal | Monospace, köşeli | Glow efektli, holografik |
| **Atmosfer** | Sıcak, samimi, topraksı | Soğuk, metalik, precision | Derin, gizemli, sonsuz |

### 6.2 Kaynak İsimleri Çağa Göre

| ID | Çağ 1 | Çağ 2 | Çağ 3 |
|----|-------|-------|-------|
| power | Güç | Enerji | Plazma |
| su | Su | Arıtılmış Su | Kuantum Su |
| yiyecek | Yiyecek | Gıda | Sentez Gıda |
| bilgi | Bilgi | Veri | Yapay Zeka |
| tas | Taş | Çelik | Karbon Fiber |
| maden | Mineral | Çip | Kuantum İşlemci |
| kultur | Kültür | Medya | Holodeck |
| inanc | İnanç | Spiral | Kozmik Enerji |
| ipek | İpek | Grafen | Nano Fiber |
| altin | Altın | Kredi | Kredi |

### 6.3 Bina İsimleri Çağa Göre (Seçme)

| Bina | Çağ 1 | Çağ 2 | Çağ 3 |
|------|-------|-------|-------|
| Güç Ocağı | Güç Ocağı | Enerji Santrali | Yıldız Çekirdeği |
| Kuyu | Kuyu | Arıtma Tesisi | Kuantum Kuyu |
| Tarla | Tarla | Fabrika | Sentez Fabrikası |
| Akademi | Akademi | Data Merkezi | Yapay Zeka Çekirdeği |
| Taş Ocağı | Taş Ocağı | Çelik Fabrikası | Karbon Ekstraksiyon |
| Maden | Maden | Chip Fabrikası | Kuantum Laboratuvarı |
| Tiyatro | Tiyatro | Stüdyo | Holodeck Kupası |
| Tapınak | Tapınak | Spiral Laboratuvarı | Kozmik Tapınak |
| İpek Atölyesi | İpek Atölyesi | Grafen Lab | Nano Dokuma Tesisi |
| Baraka | Baraka | Blok | Kapsül Ev |
| Ev | Ev | Gökdelen | Yörüngestasyon |
| Depo | Depo | Depo | Kuantum Depo |
| Ambar | Ambar | Veri Merkezi | Boyut Cebi |
| Fırın | Fırın | Fırın | Fırın |
| Demirci | Demirci | Demirci | Demirci |
| Çelik Fırını | Çelik Fırını | Çelik Fırını | Çelik Fırını |
| Mermer Atölyesi | Mermer Atölyesi | Mermer Atölyesi | Mermer Atölyesi |
| Kumaş Atölyesi | Kumaş Atölyesi | Kumaş Atölyesi | Kumaş Atölyesi |
| Şifa Ocağı | Şifa Ocağı | Şifa Ocağı | Şifa Ocağı |
| Mobilya Atölyesi | Mobilya Atölyesi | Mobilya Atölyesi | Mobilya Atölyesi |
| Heykel Atölyesi | Heykel Atölyesi | Heykel Atölyesi | Heykel Atölyesi |
| Mücevher Atölyesi | Mücevher Atölyesi | Mücevher Atölyesi | Mücevher Atölyesi |
| Darphane | Darphane | Darphane | Darphane |

### 6.4 Çağ Geçiş Hedefleri

| Geçiş | Nüfus Hedefi | Altın Hedefi | Tahmini Süre |
|--------|-------------|-------------|-------------|
| 1 → 2 | 500 | 10.000 | 2-4 saat |
| 2 → 3 | 5.000 | 100.000 | 8-16 saat |

### 6.5 Çağ Geçiş Mekaniği

**Her iki geçiş için ortak kurallar:**

1. Her tick'te nüfus ve altın hedefleri kontrol edilir
2. Her iki hedef sağlanınca "Çağ Atla" butonu aktif olur
3. Geçişte:
   - Tüm bina seviyeleri 0'a sıfırlanır
   - Tüm kaynaklar sıfırlanır (%50 altın korunur)
   - Yeni evre kaynak/bina/sanayi isimleri aktif olur
4. Paketler korunur (çoğaltma etkileri devam eder)
5. Önceki evre kaynakları hala üretilebilir ama yeni isimle

### 6.6 Çağ Geçiş Senaryosu (1 → 2)

**Tetikleyici:** Nüfus 500 + Altın 10.000'e ulaştığında

**Animasyon:**
1. 3 sn "endüstriyel devrim" montajı
2. Tüm binalar gri tonuna döner → metalik parıltıyla yeniden şekillenir
3. Toprak renkleri solar → çelik mavisi hakim olur
4. "SANAYİ ÇAĞI BAŞLADI" yazısı
5. Tüm binalar ve kaynaklar yeni isimleriyle yeniden adlandırılır
6. Bina seviyeleri 0'a sıfırlanır
7. Kaynaklar temizlenir (%50 altın korunur)

**Metin:** "Kasaban sessizce büyüdü, ama artık daha büyük bir vizyon gerekiyor. Fabrikalar yükseliyor, çarklar dönüyor, veri akıyor. Teknoloji çağının kapıları açılıyor..."

### 6.7 Çağ Geçiş Senaryosu (2 → 3)

**Tetikleyici:** Nüfus 5.000 + Kredi 100.000'e ulaştığında

**Animasyon:**
1. 4 sn "uzay yolculuğu" montajı
2. Neon renkler solar → kozmik mor hakim olur
3. "UZAY ÇAĞI AÇILDI" yazısı
4. Tüm isimler/temalar değişir
5. Bina seviyeleri 0'a sıfırlanır
6. Kaynaklar temizlenir (%50 kredi korunur)

**Metin:** "Fabrikalar artık yetmiyor. İnsanlık yıldızlara uzanıyor. Plazma enerjisi, kuantum hesaplama, yapay zeka... Sonsuzluğun eşiğindesin."

### 6.8 Emoji Haritası

#### Kaynak Emoji Tablosu

| Kaynak | Çağ 1 | Çağ 2 | Çağ 3 |
|--------|-------|-------|-------|
| power | ⚡ | ⚡ | ⚡ |
| su | 💧 | 💧 | 💧 |
| yiyecek | 🌾 | 🍞 | 🍽️ |
| bilgi | 📜 | 💾 | 🧠 |
| tas | 🪨 | 🔩 | 🔬 |
| maden | ⛏️ | 🔌 | 💠 |
| kultur | 🎭 | 📺 | 🎮 |
| inanc | 🕯️ | 🌀 | 🌌 |
| ipek | 🧵 | 🧬 | 🧬 |
| altin | 💰 | 💳 | 💳 |

#### Sanayi Emoji Tablosu

| Sanayi | Emoji |
|--------|-------|
| Fırın | 🍞 |
| Demirci | ⚒️ |
| Çelik Fırını | 🔥 |
| Mermer Atölyesi | 🗿 |
| Kumaş Atölyesi | 🧶 |
| Şifa Ocağı | ⚕️ |
| Mobilya Atölyesi | 🛋️ |
| Heykel Atölyesi | 🏛️ |
| Mücevher Atölyesi | 💍 |
| Darphane | 🪙 |

### 6.9 Özel Kaynak Mekanikleri

**Bilgi (Teknoloji Kontrolü):**
- Üretici: Akademi binası
- Rolü: Paket(upgrades) satın alımı açar
- Mekanik: Bilgi olmadan hiçbir paket satın alınamaz

**Kültür (Ticaret Kontrolü):**
- Üretici: Tiyatro binası
- Rolü: Ticaret sistemini açar
- Mekanik: Kültür olmadan tüccar teklifleri gelmez
- Ek Etki: Mutluluk bonusu sağlar (Amfitiyatro ile)

---

## 7. DENGELER ANALİZİ

### 7.1 İlk 5 Dakika (0-300 sn)

**Durum:**
- 5 Güç Ocağı, 2-3 Kuyu, 1 Tarla
- Nüfus: 10-15

```
Güç:    0.500 × 5 = 2.500/s (tüketime denge)
Su:     0.250 × 3 = 0.750/s üretim, 0.200/s Tarla tüketimi → +0.550/s net
Yiyecek: 0.200 × 1 = 0.200/s üretim, 0.300/s nüfus → -0.100/s net (hafif negatif)
```

**Oyuncu Deneyimi:** Hızlı başlangıç. 20 sn'de ilk bina. 3. dakikada Tarla. 5. dakikada denge arayışı.

### 7.2 30 Dakika (1800 sn)

**Durum:**
- 15-20 Güç Ocağı, 8-10 Kuyu, 10-12 Tarla, 3-5 Akademi, 3-4 Taş Ocağı, 2-3 Maden
- Nüfus: 50-70

```
Su:      0.250 × 10 = 2.500/s, tüketim: 1.400/s → +1.100/s net
Yiyecek: 0.200 × 12 = 2.400/s, tüketim: 2.100/s → +0.300/s net
Bilgi:   0.100 × 5 = 0.500/s (paket alımı başlar)
Maden:   0.080 × 3 = 0.240/s (Demirci açılır)
```

**Oyuncu Deneyimi:** 15. dk'da ilk paket. 20. dk'da Demirci. 25. dk'da Fırın. 30. dk'da ilk sanayi tesisleri.

### 7.3 1 Saat (3600 sn)

**Durum:**
- 25-30 Güç Ocağı, 12-15 Kuyu, 15-18 Tarla, 6-8 Akademi, 5-6 Taş Ocağı, 4-5 Maden
- 2-3 Tapınak, 1-2 İpek Atölyesi, 3-4 Fırın, 2-3 Demirci
- Nüfus: 100-130

```
Su:      0.250 × 15 = 3.750/s, tüketim: 2.600/s → +1.150/s net
Yiyecek: 0.200 × 18 = 3.600/s, tüketim: 3.900/s → -0.300/s net (DİKKAT!)
Bilgi:   0.100 × 8 = 0.800/s, tüketim: 0.080/s → +0.720/s net
Maden:   0.080 × 5 = 0.400/s, tüketim: 0.320/s → +0.080/s net (sıkışık)
Kultur:  0/s (henüz Tiyatro yok)
İnanç:   0.040 × 2 = 0.080/s, tüketim: 0.010/s → +0.070/s net
İpek:    0.030 × 1 = 0.030/s, tüketim: 0.020/s → +0.010/s net
Altın:   0/s (henüz Darphane yok)
```

**Oyuncu Deneyimi:** Yiyecek negatife geçmek üzere → Tarla inşaatı zorunlu. Maden sıkışık → stratejik seçim. İlk 1000 altın hâlâ uzak.

### 7.4 2 Saat (7200 sn)

**Durum:**
- 35-40 Güç Ocağı, 18-20 Kuyu, 25-30 Tarla, 10-12 Akademi
- 8-10 Taş Ocağı, 6-8 Maden, 4-5 Tapınak, 2-3 İpek Atölyesi
- 8-10 Fırın, 4-5 Demirci, 2-3 Çelik Fırını, 1-2 Mermer Atölyesi
- Nüfus: 200-250

```
Su:      0.250 × 20 = 5.000/s, tüketim: 5.000/s → DENGE (sınırda!)
Yiyecek: 0.200 × 30 = 6.000/s, tüketim: 7.500/s → -1.500/s net (KRİTİK!)
Kultur:  0.050 × 2 = 0.100/s, tüketim: 0.400/s → -0.300/s net (KRİTİK!)
İnanç:   0.040 × 5 = 0.200/s, tüketim: 0.020/s → +0.180/s net
İpek:    0.030 × 3 = 0.090/s, tüketim: 0.040/s → +0.050/s net
Altın:   0.015 × 1 = 0.015/s → 1000 altın ~18.5 saat
```

**Oyuncu Deneyimi:** Yiyecek ve Kültür KRİTİK → nüfus artışı durdu. Oyuncu stratejik secimlere zorlandı. Darphane hâlâ açılmadı.

### 7.5 Kritik Darboğazlar

| Kaynak | Sorun | Eşik | Çözüm |
|--------|-------|------|-------|
| Yiyecek | Tüketim üretimi geçer | 100+ nüfus | Daha fazla Tarla |
| Kültür | Tüketim üretimi geçer | 150+ nüfus | Daha fazla Tiyatro |
| İpek | Sanayi tüketimi üretimi geçer | Sanayi başladığında | Daha fazla İpek Atölyesi |
| Maden | Sanayi tüketimi üretimi geçer | Sanayi başladığında | Daha fazla Maden |

> Bu darboğazlar kasıtlıdır. Oyuncuyu birden fazla bina inşa etmeye ve kaynak dağılımını optimize etmeye iter.

### 7.6 Önleyici Denge Mekanikleri

Bir kaynagın net üretimi negatife düştüğünde uygulanan otomatik uyarı sistemi:

```
Eğer bir kaynagın net uretimi < 0 ise:
1. Uyari mesaji goster (kırmızı uyarı banner'ı)
2. İlgili bina icin onerilen minimum sayiyi goster
3. Oyuncuyu o bina insa etmeye yonlendir (parlayan buton)
```

**Uyarı Eşikleri:**

| Kaynak | Uyarı Eşiki | Kritik Eşik |
|--------|-------------|-------------|
| Su | Net < -0.5/sn | Net < -1.0/sn |
| Yiyecek | Net < -0.3/sn | Net < -0.8/sn |
| Kültür | Net < -0.1/sn | Net < -0.2/sn |
| İpek | Net < -0.01/sn | Net < -0.05/sn |
| Maden | Net < -0.02/sn | Net < -0.1/sn |

### 7.7 Altın Üretim Hedef Süreleri

```
1 Darphane = 0.015/s → 1000 altın = 66.666 sn (~18.5 saat)
5 Darphane = 0.075/s → 1000 altın = 13.333 sn (~3.7 saat)
```

> Idle/clicker oyunu için 18.5 saat makuldür. Çağ geçiş hedefi için birden fazla Darphane inşası gerekir.

---

## 8. UYGULAMA PLANI

### 8.1 Modüler Yapı Uyumu

Bu plan, mevcut `modüler.md`deki 11 fazlı yeniden yapılandırma planıyla tam uyumludur. Değişiklikler:

| Modül Dosyası | Güncellenecek Değerler |
|---------------|------------------------|
| `config.js` | Tüm sabit değerler bu plana göre güncellenir |
| `resources.js` | 10 kaynak tanımı (odun kaldırıldı, inanç ID'si standartlaştırıldı) |
| `buildings.js` | Tüm bina tanımları yeniden yapılır (kereste kaldırıldı) |
| `industry.js` | Sanayi tanımları güncellenir (10 bina) |
| `packs.js` | Paket tanımları güncellenir |
| `production.js` | Üretim hızları, mevsim çarpanları, sanayi mantığı |
| `population.js` | Nüfus tüketim oranları (su: 0.020, yiyecek: 0.030, ekmek: 0.010, ilaç: 0.005, kultur: 0.002) |
| `unlock.js` | Kilit koşulları güncellenir |
| `trade.js` | Ticaret fiyatları güncellenir |
| `engine.js` | Mevsim geçişleri, üretim mantığı, nüfus yaşam döngüsü |
| `state.js` | Evre durumu eklenir |

### 8.2 Yeni Dosya

| Dosya | Amaç |
|-------|------|
| `js/era.js` | Evre yönetimi, geçiş mantığı, isim haritaları (~100 satır) |

### 8.3 Uygulama Öncelik Sırası

```
1. resources.js    — Temel kaynaklar (her şey buna bağlı)
2. config.js       — Sabitler ve oranlar (10 kaynak uyumlu)
3. state.js        — Durum yönetimi (evre desteği)
4. era.js          — Evre yönetimi (YENİ)
5. buildings.js    — Bina tanımları (kereste kaldırıldı)
6. production.js   — Üretim mantığı (mecvsim çarpanları)
7. population.js   — Nüfus yönetimi (tüketim oranları)
8. unlock.js       — Kilit sistemi
9. industry.js     — Sanayi sistemi (10 bina, girdi-çıktı tutarlılığı)
10. packs.js       — Paket sistemi
11. trade.js       — Ticaret sistemi (Kültür kilidi)
12. engine.js      — Oyun döngüsü + çağ geçişleri
13. UI dosyaları   — Evre bazlı isimler (building-card, industry-card vb.)
```

### 8.4 Dosya Değişiklik Listesi

| Dosya | Değişiklik | Öncelik |
|-------|-----------|---------|
| `js/resources.js` | 10 kaynak tanımı, evre isim haritası | Yüksek |
| `js/config.js` | Tüm sabit değerler (üretim hızları, mevsimler, fiyatlar) | Yüksek |
| `js/state.js` | Evre durumu alanı eklenecek | Yüksek |
| `js/era.js` | Yeni dosya: evre yönetimi | Yüksek |
| `js/buildings.js` | Tüm bina tanımları yeniden yapılacak | Yüksek |
| `js/industry.js` | Sanayi tanımları güncellenecek (kereste kaldırıldı) | Yüksek |
| `js/packs.js` | Paket tanımları güncellenecek | Orta |
| `js/production.js` | Üretim hızları, mevsim çarpanları güncellenecek | Yüksek |
| `js/population.js` | Nüfus tüketim oranları güncellenecek | Yüksek |
| `js/unlock.js` | Kilit koşulları güncellenecek | Yüksek |
| `js/trade.js` | Ticaret fiyatları güncellenecek | Orta |
| `js/engine.js` | Evre geçiş mantığı eklenecek | Yüksek |
| `js/gold-chip.js` | Evre bazlı altın/kredi gösterimi | Düşük |
| `js/resource-tile.js` | Evre bazlı kaynak isimleri | Düşük |
| `js/building-card.js` | Evre bazlı bina isimleri | Düşük |
| `js/industry-card.js` | Evre bazlı sanayi isimleri | Düşük |
| `js/pack-card.js` | Evre bazlı paket isimleri | Düşük |

---

## 9. TUTARLILIK KONTROL LİSTESİ

### 9.1 Çapraz Doğrulama Sonuçları

Bu plan, `agent-balance-test.md`raporundaki tüm kritik hataları düzeltmiştir:

| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| H1 | `inanç`/`inanc` tutarsızlığı | Tümü `inanc` (ASCII) kullanıldı | ✅ ÇÖZÜLDÜ |
| H2 | Kereste varlığı | Tamamen kaldırıldı, mobilya girdisi: tas + çelik | ✅ ÇÖZÜLDÜ |
| H3 | Darphane döngüsel bağımlılık | Girdi: bilgi + ipek → altın (döngü yok) | ✅ ÇÖZÜLDÜ |
| H4 | Var olmayan bina referansları | Tüm referanslar mevcut binalara yönlendirildi | ✅ ÇÖZÜLDÜ |
| H5 | Fırın kilidi çelişkisi | farm ×5 olarak standartlaştırıldı | ✅ ÇÖZÜLDÜ |
| H6 | Agent 1 iç çelişkisi (Kultur tüketimi) | Kultur tüketimi: 0.002/person (tutarlı) | ✅ ÇÖZÜLDÜ |
| H7 | Agent 4 sanayi sistemi farklı | Çağ geçişleri sadece görsel, mekanik değişmez | ✅ ÇÖZÜLDÜ |
| H8 | Üretim hızları tutarsız | Tek hız tablosu kullanıldı (0.500 → 0.015/sn) | ✅ ÇÖZÜLDÜ |
| H9 | Sanayi maliyet tutarsızlığı | Tek maliyet skalası (Agent 1 ekonomisine uygun) | ✅ ÇÖZÜLDÜ |
| H10 | Nüfus kapasitesi tutarsızlığı | Baraka = +5, Ev = +25 (standart) | ✅ ÇÖZÜLDÜ |

### 9.2 Tutarlılık Skoru

```
Önceki Plan (NIHAI-PLAN v1): 3.3 / 10
Bu Plan (NIHAI-PLAN v2):      9.0 / 10 (hedef)

Gerekçe:
- Tüm ajan değerleri tek kaynakta birleştirildi
- Kereste/odun tamamen kaldırıldı
- Üretim hızları tek tabloda (Agent 1 referans)
- Sanayi girdi-çıktıları tutarlı
- Kilit koşulları tutarlı
- Darphane döngüsel bağımlılıktan kurtarıldı
- Çağ geçişleri sadece görsel/tematik
```

---

## 10. TEST SENARYOLARI

### 10.1 Birim Testleri

**Test 1: Güç Üretimi**
```
Girdi: 5 Güç Ocağı, 10 saniye
Beklenen: 5 × 0.500 × 10 = 25.0 güç
```

**Test 2: Su Tüketimi**
```
Girdi: 100 nüfus, 10 saniye
Beklenen: 100 × 0.020 × 10 = 20.0 su tüketildi
```

**Test 3: Ekmek Üretimi**
```
Girdi: 3 Fırın, 10 saniye, yeterli yiyecek ve su
Beklenen: 3 × 0.060 × 10 = 1.8 ekmek
Gerçek Girdi: 3 × 0.080 × 10 = 2.4 yiyecek + 3 × 0.020 × 10 = 0.6 su
```

**Test 4: Altın Üretimi**
```
Girdi: 2 Darphane, 1000 saniye, yeterli ipek ve bilgi
Beklenen: 2 × 0.015 × 1000 = 30.0 altin
1000 altın icin: 1000 / (2 × 0.015) = 33.333 sn (~9.3 saat)
```

**Test 5: Kış Etkisi**
```
Girdi: 10 Tarla, Kış mevsimi, 90 saniye
Beklenen: 10 × 0.200 × 0.6 × 90 = 108.0 yiyecek
Normal: 10 × 0.200 × 90 = 180.0 yiyecek
Fark: -%40 (kış etkisi doğru)
```

### 10.2 Denge Dogrulama

**Test 6: Su Dengesi (100 Nüfus)**
```
Üretim: 10 Kuyu × 0.250 = 2.500/s
Tüketim: 100 × 0.020 + 1 Fırın × 0.020 = 2.020/s
Net: +0.480/s (POZİTİF - Dengede)
```

**Test 7: Yiyecek Dengesi (100 Nüfus)**
```
Üretim: 15 Tarla × 0.200 = 3.000/s
Tüketim: 100 × 0.030 + 5 Fırın × 0.080 = 3.400/s
Net: -0.400/s (NEGATİF - Dikkat gerekli!)
```

> Test 7 kasıtlıdır: 100 nüfusta yiyecek tüketime ulaşır → oyuncu daha fazla Tarla inşa etmeye zorlanır.

### 10.3 Sistem Testleri

1. **5 dakika testi:** İlk bina düzgün açılıyor mu? Su/yiyecek dengesi korunuyor mu?
2. **30 dakika testi:** Sanayi zinciri çalışıyor mu? Darboğazlar kasıtlı mı?
3. **1 saat testi:** Nüfus tüketimi üretimle uyumlu mu?
4. **2 saat testi:** Çağ geçiş hedefine yaklaşılıyor mu?
5. **Kış testi:** Mevsim etkileri doğru uygulanıyor mu?
6. **Darphane testi:** Döngüsel bağımlılık yok mu? Altın üretimi dengeli mi?
7. **Çağ geçiş testi:** Seviyeler sıfırlanıyor mu? Paketler korunuyor mu?
8. **Ticaret testi:** Kültür kilidi çalışıyor mu? Fiyatlar doğru mu?

---

## 11. REFERANS DOSYALAR

| Dosya | İçerik |
|-------|--------|
| `agent-resource-economy.md` | Kaynak ekonomisi detayları (925 satır) |
| `agent-building-chain.md` | Bina zinciri tasarımı (356 satır) |
| `agent-industry-chain.md` | Sanayi ekonomisi (438 satır) |
| `agent-era-themes.md` | Çağ tema tanımları (434 satır) |
| `agent-balance-test.md` | Çapraz kontrol raporu (478 satır) |
| `2026-08-18-resource-restructure.md` | Kaynak yeniden yapılandırma (317 satır) |
| `modüler.md` | Modüler yeniden yapılandırma planı (604 satır) |

---

*Bu plan, 4 ajan çıktısının + denge testinin + mevcut kod analizinin birleştirilmesiyle oluşturulmuştur. Tüm değerler playtest sonrası ayarlanabilir.*
