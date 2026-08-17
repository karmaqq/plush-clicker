# Plush Clicker - Modüler Yeniden Yapılandırma Planı

## GENEL KURALLAR

1. Bir faz tamamlanmadan diğerine geçilmez
2. Her faz kendi içinde bağımsızdır, önceki fazın çıktısına bağımlıdır
3. Her faz tamamlandığında proje tarayıcıda açılabilir ve çalışır olmalıdır
4. Import/export zincirlerinde sıfır hata hedeflenir
5. Dosya boyutları 50-200 satır aralığında tutulur
6. Her dosya tek bir sorumluluk alanı taşır

---

## MEVCUT DURUM

| Dosya | Satır | Fonksiyon | Sorun |
|-------|-------|-----------|-------|
| game-state.js | 1519 | 91 | God Module - 8 farklı sorumluluk |
| left-panel.js | 563 | 9 | Bina + paket + tooltip bir arada |
| right-panel.js | 515 | 6 | Sanayi kartı 275 satır |
| header-panel.js | 479 | 10 | Mutluluk, mevsim, göç bir arada |
| center-panel.js | 384 | 5 | Resource tooltip 121 satır |
| resources.js | 275 | 0 | Temiz |
| buildings.js | 257 | 0 | Temiz |
| v4.css | 166 | - | İsim tutarsız |
| tooltip.js | 96 | 4 | Temiz |
| utils.js | 123 | 11 | Temiz |
| industry.js | 134 | 0 | Temiz |
| packs.js | 109 | 0 | Temiz |
| main.js | 17 | 0 | Temiz |
| layout.js | 16 | 1 | Temiz |

Toplam: 137 fonksiyon, 4407 JS satırı, 1840 CSS satırı

---

## HEDEF DOSYA YAPISI

```
js/
  main.js                    (~20 satır)   entry point
  config.js                  (~80 satır)   ★ TÜM SABİT DEĞERLER
  state.js                   (~100 satır)  ★ state nesnesi, basit getter'lar, onChange
  persistence.js             (~130 satır)  ★ load/save/storage
  production.js              (~200 satır)  ★ üretim hesaplamaları
  population.js              (~200 satır)  ★ nüfus, mutluluk, göç
  trade.js                   (~60 satır)   ★ ticaret mantığı
  unlock.js                  (~70 satır)   ★ unlock sistemi + satın alma
  engine.js                  (~200 satır)  ★ produce() ana oyun döngüsü
  layout.js                  (16 satır)    mevcut
  resources.js               (275 satır)   mevcut
  buildings.js               (257 satır)   mevcut
  industry.js                (134 satır)   mevcut
  packs.js                   (109 satır)   mevcut
  utils.js                   (123 satır)   mevcut
  tooltip.js                 (96 satır)    mevcut
  building-card.js           (~170 satır)  ★ bina kartı UI
  pack-card.js               (~110 satır)  ★ paket kartı UI
  industry-card.js           (~280 satır)  ★ sanayi kartı UI
  trade-section.js           (~95 satır)   ★ ticaret bölümü UI
  happiness-chip.js          (~90 satır)   ★ mutluluk chip UI
  season-chip.js             (~90 satır)   ★ mevsim chip UI
  migration-strip.js         (~55 satır)   ★ göç şeridi UI
  resource-tile.js           (~130 satır)  ★ kaynak karosu UI
  header-panel.js            (~100 satır)  KÜÇÜLTÜLÜR
  left-panel.js              (~80 satır)   KÜÇÜLTÜLÜR
  right-panel.js             (~80 satır)   KÜÇÜLTÜLÜR
  center-panel.js            (~100 satır)  KÜÇÜLTÜLÜR

css/
  base.css                   (mevcut)
  layout.css                 (mevcut)
  header-panel.css           (mevcut)
  left-panel.css             (mevcut)
  center-panel.css           (mevcut)
  right-panel.css            (mevcut)
  tooltip.css                (mevcut)
  industry.css               (mevcut)
  components.css             (★ v4.css yeniden adlandır + eksik class'lar)
```

---

## FAZ 1: CONFIG OLUŞTURMA

**Hedef:** Tüm sabit değerleri tek dosyada topla
**Bağımlılık:** Önceki faz yok (ilk faz)
**Etkilediği dosyalar:** Sadece yeni config.js dosyası oluşturulur, mevcut dosyalar değişmez
**Test:** Dosya oluşturup import edilebilir olduğunu doğrula

### Oluşturulacak Dosya: `js/config.js`

Taşınacak değerler (game-state.js içinden):

```
SEASON_DURATION = 45
INDUSTRY_MAX_LEVEL = 5
SEASONS_DATA = { ilkbahar, yaz, sonbahar, kis }
SEASON_ORDER = Object.keys(SEASONS_DATA)
TRADE_INTERVAL = 45
TRADE_PRICES = { odun: 1, tas: 1.5, ... }
TRADE_AMOUNTS = { 1: [25, 40], 2: [10, 20], ... }
POP_SU_RATE = 0.08
POP_YIYECEK_RATE = 0.1
POP_EKMEK_RATE = 0.02
POP_ILAC_RATE = 0.005
POP_GOLD_RATE = 0.004
WORKER_WAGE = 0.01
LUXURY_ORDER = ["sarap", "konyak", ...]
LUXURY_RATES = { sarap: 0.0005, konyak: 0.00005, ... }
LUXURY_HAPPINESS = { sarap: 5, konyak: 6, ... }
TICKS_PER_SECOND = 5
TICK_MS = 1000 / TICKS_PER_SECOND
ARRIVAL_DURATION = 30
STORAGE_KEY = "plush-clicker:state-v9"
```

Export formatı:
```js
export const SEASON_DURATION = 45;
export const INDUSTRY_MAX_LEVEL = 5;
export const SEASONS_DATA = { ... };
// ... tüm sabitler
export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;
```

---

## FAZ 2: STATE + PERSISTENCE

**Hedef:** Veri yönetimini iki dosyaya böl
**Bağımlılık:** Faz 1 (config.js)
**Etkilediği dosyalar:** game-state.js'den iki yeni dosya oluşur, mevcut dosyalar ETKİLENMEZ
**Test:** State nesnesi oluşturulabilmeli, localStorage'a yazılabilmeli

### 2a: `js/state.js` (~100 satır)

İçerik:
- `state` nesnesi (boş initial: resources, buildings, packs, industry, population, season, trade, settings)
- `freshIndustryEntry()` fonksiyonu
- `listeners` Set'i
- `emit(snapshot)` fonksiyonu
- `onChange(fn)` export
- `getResource(id)` export
- `getPower()` export
- `getAltin()` export
- `getBuildingCount(id)` export
- `getPackCount(id)` export
- `getSeason()` export
- `getSeasonTimer()` export

Import: `config.js` (SEASON_DURATION, SEASONS_DATA)

### 2b: `js/persistence.js` (~130 satır)

İçerik:
- `initState()` - config'deki verilerle state'i doldur
- `loadState()` - localStorage'dan yükle
- `saveState()` - localStorage'a yaz
- `scheduleSave()` - 500ms gecikmeli kayıt
- `clearLegacyStorage()` - V3-V8 temizliği
- `loadNumericMap()`, `loadIndustry()`, `loadPopulation()`, `loadSettings()`, `loadSeason()`, `loadTrade()`
- `resetGame()` export
- `window.addEventListener("pagehide", ...)` otomatik kayıt

Import: `config.js`, `state.js`, `resources.js`, `buildings.js`, `industry.js`, `packs.js`

---

## FAZ 3: ÜRETİM HESAPLAMALARI

**Hedef:** Tüm üretim/kapasite/tüketim mantığını tek dosyada topla
**Bağımlılık:** Faz 1 (config), Faz 2 (state)
**Etkilediği dosyalar:** Yeni production.js dosyası, mevcut dosyalar ETKİLENMEZ
**Test:** Üretim hesaplamaları doğru sonuç dönmeli

### `js/production.js` (~200 satır)

İçerik:
- `getResourceProduction(resource)` - ham bina üretimi
- `getIndustryOutput(resource)` - sanayi üretimi
- `getTotalProduction(resource)` export
- `getNetRate(resource)` export
- `getResourceConsumption(resource)` export
- `getOutputMultiplier(resource)` export
- `getBuildingProduction(id)` export
- `getBuildingBonus(id)` export
- `getResourceCapacity(resource)` export
- `getCapacityBonus(id)` export
- `getCostDiscount()` - private
- `getWorkerMultiplier()` - private
- `getPowerProduction()` - private
- `getPowerMaintenance()` - private
- `getSeasonMultiplier(resource)` export
- `getSellPrice(resource)` export
- `isSellable(resource)` export
- `getAutoSell(resource)` export
- `toggleAutoSell(resource)` export
- `autoSellSurplus()` - private
- `getInfoProduction()` - private
- `hasInfoProduction()` export

Import: `config.js`, `state.js`, `resources.js`, `buildings.js`, `industry.js`, `packs.js`, `utils.js`

---

## FAZ 4: NÜFUS YÖNETİMİ

**Hedef:** Nüfus, mutluluk, göç mantığını tek dosyada topla
**Bağımlılık:** Faz 1-3 (config, state, production)
**Etkilediği dosyalar:** Yeni population.js dosyası, mevcut dosyalar ETKİLENMEZ
**Test:** Nüfus hesaplamaları doğru sonuç dönmeli

### `js/population.js` (~200 satır)

İçerik:
- `getPopulationCurrent()` export
- `getPopulationAlive()` export
- `getPopulationCapacity()` export
- `getPopulationSatisfaction()` export
- `getPopulationDeficiency()` export
- `getHappinessBreakdown()` export
- `computeHappinessBreakdown()` - private (132 satır)
- `getMigrationInterval()` export
- `getArrivalDuration()` export
- `getPopulationMigrants()` export
- `getMigrantQueue()` export
- `consumePopulation()` - private
- `applyPopulationLifecycle()` - private
- `trimWorkers()` - private
- `suDeficit()` - private
- `foodDeficit()` - private

Import: `config.js`, `state.js`, `resources.js`, `buildings.js`, `industry.js`, `production.js` (getTotalProduction, getResourceCapacity)

---

## FAZ 5: TİCARET + UNLOCK

**Hedef:** Ticaret ve unlock mantığını ayrı dosyalara taşı
**Bağımlılık:** Faz 1-4
**Etkilediği dosyalar:** Yeni trade.js ve unlock.js, mevcut dosyalar ETKİLENMEZ

### 5a: `js/trade.js` (~60 satır)

İçerik:
- `getTradeInterval()` export
- `getTradeBonusTotal()` - private
- `getTradeCurrent()` export
- `getTradeTimer()` export
- `getTradeCount()` export
- `generateTradeOffer()` - private
- `acceptTrade()` export

Import: `config.js`, `state.js`, `resources.js`, `packs.js`, `production.js` (getResourceCapacity), `state.js` (onChange→emit)

### 5b: `js/unlock.js` (~70 satır)

İçerik:
- `UNLOCK_STRATEGIES` nesnesi
- `getUnlock(data)` export
- `getUnlockProgress(data)` - private
- `getUnlockType(data)` export
- `isNearUnlock(data)` export
- `getUnlockText(data)` export
- `getBuildingCost(id)` export
- `getPackCost(id)` export
- `pay(cost)` - private
- `buyBuilding(id)` export
- `buyPack(id)` export

Import: `config.js`, `state.js`, `resources.js`, `buildings.js`, `industry.js`, `packs.js`, `utils.js` (canAfford)

---

## FAZ 6: GAME ENGINE

**Hedef:** Ana oyun döngüsünü tek dosyada topla
**Bağımlılık:** Faz 1-5 (tüm mantık modülleri)
**Etkilediği dosyalar:** Yeni engine.js, mevcut dosyalar ETKİLENMEZ
**Test:** produce() fonksiyonu çağrılmalı, state güncellenmeli

### `js/engine.js` (~200 satır)

İçerik:
- `produce()` export - ana oyun döngüsü (117 satır)
  - Power üretimini uygula
  - Ham kaynak üretimini uygula
  - Sanayi girdi/çıktılarını uygula
  - Nüfus tüketimini uygula
  - Nüfus yaşam döngüsünü uygula
  - Otomatik satışı uygula
  - Mevsim geçişini kontrol et
  - Ticaret zamanlayıcısını güncelle

Import: `config.js`, `state.js`, `resources.js`, `buildings.js`, `industry.js`, `production.js`, `population.js`, `trade.js`

---

## FAZ 7: UI MODÜLLERİ

**Hedef:** Panel dosyalarındaki büyük fonksiyonları bağımsız modüllere böl
**Bağımlılık:** Faz 1-6 (tüm mantık modülleri hazır)
**Etkilediği dosyalar:** Yeni UI dosyaları + panel dosyaları küçültülür
**Test:** Her UI modülü bağımsız import edilebilmeli

### 7a: `js/building-card.js` (~170 satır)

left-panel.js'den taşınacak:
- `createBuildingCard(id, data)` export
- `buildBuildingTooltip(id, data)` export
- `refreshBuildingTooltip()` export
- `tooltipLive` nesnesi
- `buildingNameText()` - private
- `bonusEmoji(data)` - private
- `getBonusEffectInfo(data)` - private

Import: `utils.js`, `tooltip.js`, `buildings.js`, `resources.js`, `game-state.js` (state modüllerinden)

Export edilen `tooltip` nesnesi: `left-panel.js`'deki `createTooltip("building-tooltip")` çağrısı

### 7b: `js/pack-card.js` (~110 satır)

left-panel.js'den taşınacak:
- `createPackCard(id, data)` export

Import: `utils.js`, `buildings.js`, `resources.js`, `packs.js`, `game-state.js`

### 7c: `js/industry-card.js` (~280 satır)

right-panel.js'den taşınacak:
- `createIndustryCard(id, data)` export
- `buildIndustryTooltip(id)` export
- `refreshIndustryTooltip()` export
- `resetIndustryTooltipClass(id)` - private
- `tooltipLive` nesnesi
- `industryTooltip` nesnesi

Import: `utils.js`, `tooltip.js`, `industry.js`, `resources.js`, `game-state.js`

### 7d: `js/trade-section.js` (~95 satır)

right-panel.js'den taşınacak:
- `createTradeSection()` export

Import: `utils.js`, `resources.js`, `game-state.js`

### 7e: `js/happiness-chip.js` (~90 satır)

header-panel.js'den taşınacak:
- `createHappinessChip()` export
- `createHappinessSection(titleText)` - private
- `fillHappinessList(sec, items)` - private

Import: `resources.js`, `buildings.js`, `game-state.js`

### 7f: `js/season-chip.js` (~90 satır)

header-panel.js'den taşınacak:
- `createSeasonChip()` export

Import: `game-state.js` (getSeason, getSeasonTimer, onChange)

### 7g: `js/migration-strip.js` (~55 satır)

header-panel.js'den taşınacak:
- `createMigrationStrip()` export
- `spawnMigrant(strip, remaining)` - private

Import: `game-state.js` (getMigrantQueue, getArrivalDuration, onChange)

### 7h: `js/resource-tile.js` (~130 satır)

center-panel.js'den taşınacak:
- `createResourceTile(id)` export
- `buildResourceTooltip(id)` - private
- `refreshResourceTooltip(snapshot)` - private
- `getBarColor(id, pct)` - private
- `tooltipLive` nesnesi

Import: `utils.js`, `tooltip.js`, `resources.js`, `buildings.js`, `game-state.js`

---

## FAZ 8: PANEL KÜÇÜLTME

**Hedef:** Panel dosyalarını sadece iskelet haline getir
**Bağımlılık:** Faz 7 (UI modülleri hazır)
**Etkilediği dosyalar:** 4 panel dosyası küçültülür
**Test:** Her panel doğru alt modülleri oluşturmalı

### `js/left-panel.js` (~80 satır)

```
Import: createBuildingCard, createPackCard, buildingTooltip (tooltip), game-state
Export: createLeftPanel()
```

Sadece: tab bar oluştur, bina grid + paket listesi oluştur, tab geçiş mantığı

### `js/right-panel.js` (~80 satır)

```
Import: createIndustryCard, createTradeSection, game-state
Export: createRightPanel()
```

Sadece: tab bar oluştur, sanayi listesi + ticaret bölümü, tab geçiş mantığı

### `js/header-panel.js` (~100 satır)

```
Import: createHappinessChip, createSeasonChip, createMigrationStrip, createPopBlock, createHousingChip, game-state
Export: createHeaderPanel()
```

Sadece: üst satırı oluştur, alt elemanları birleştir, update fonksiyonu

### `js/center-panel.js` (~100 satır)

```
Import: createResourceTile, createBuildingCard (storage için), game-state
Export: createCenterPanel()
```

Sadece: güç başlığı, resource grid'leri oluştur, storage bölümünü oluştur

---

## FAZ 9: CSS DÜZENLEME

**Hedef:** v4.css'i yeniden adlandır ve eksik class'ları ekle
**Bağımlılık:** Faz 8 (tüm UI değişimleri tamam)
**Etkilediği dosyalar:** CSS dosyaları + index.html
**Test:** Tüm stiller doğru uygulanmalı

### Yapılacaklar:

1. `css/v4.css` → `css/components.css` olarak yeniden adlandır
2. Eksik CSS class'larını ekle:
   - `.num-whole`, `.num-frac` (utils.js createNumberCounter için)
   - `.resource-tooltip`, `.building-tooltip`, `.industry-tooltip` (tooltip class'ları)
   - `.housing-chip-icon`, `.housing-chip-name` (header panel için)
   - `.season-chip-icon`, `.happiness-chip-icon` (header panel için)
   - `.pop-count`, `.header-stat-value`, `.happiness-list` (header panel için)
3. `index.html`'de css/v4.css referansını css/components.css olarak güncelle

---

## FAZ 10: IMPORT/EXPORT DOĞRULAMA

**Hedef:** Tüm import zincirlerini kontrol et, sıfır hata
**Bağımlılık:** Faz 9 (tüm dosyalar hazır)
**Etkilediği dosyalar:** Gerekirse düzeltmeler
**Test:** Tarayıcıda oyun açılmalı, tüm fonksiyonlar çalışmalı

### Kontrol Listesi:

1. Her yeni dosyanın export'ları doğru mu?
2. Her import doğru yolu mu gösteriyor?
3. Döngüsel bağımlılık var mı?
4. Tüm UI modülleri doğru panel tarafından import ediliyor mu?
5. `main.js` doğru modülleri import ediyor mu?
6. `index.html` doğru CSS dosyalarını yüklüyor mu?

### main.js Güncel Hali:

```js
import { createLayout } from "./layout.js";
import { createHeaderPanel } from "./header-panel.js";
import { createLeftPanel } from "./left-panel.js";
import { createCenterPanel } from "./center-panel.js";
import { createRightPanel } from "./right-panel.js";
import { produce, TICK_MS } from "./engine.js";

const layout = createLayout({
    header: createHeaderPanel(),
    left: createLeftPanel(),
    center: createCenterPanel(),
    right: createRightPanel(),
});

document.body.appendChild(layout);
window.setInterval(produce, TICK_MS);
```

---

## FAZ 11: DEAD CODE TEMİZLİĞİ

**Hedef:** Legacy ve kullanılmayan kodları temizle
**Bağımlılık:** Faz 10 (doğrulama tamam)
**Test:** Oyun hala çalışmalı

### Temizlenecekler:

1. `clearLegacyStorage()` fonksiyonu (V3-V8 anahtarları) - persistence.js içinde
2. `v4.css` → `components.css` dönüşümünde `.resource-altin` class'ı (kullanılmıyor)

---

## BAĞIMLILIK GRAFİĞİ (HEDEF)

```
config.js  (hiç import almaz)
    │
state.js  (config import eder)
    │
    ├── persistence.js  (config, state, resources, buildings, industry, packs import eder)
    │
    ├── production.js   (config, state, resources, buildings, industry, packs, utils import eder)
    │
    ├── population.js   (config, state, resources, buildings, industry, production import eder)
    │
    ├── trade.js        (config, state, resources, packs, production import eder)
    │
    ├── unlock.js       (config, state, resources, buildings, industry, packs, utils import eder)
    │
    └── engine.js       (config, state, resources, buildings, industry, production, population, trade import eder)

resources.js  (import almaz - saf veri)
buildings.js  (import almaz - saf veri)
industry.js   (import almaz - saf veri)
packs.js      (import almaz - saf veri)

utils.js      (resources import eder)
tooltip.js    (resources, utils import eder)

UI MODÜLLERİ (hepsi state modüllerinden import eder):
    building-card.js    → utils, tooltip, buildings, resources, state, production, unlock
    pack-card.js        → utils, resources, packs, state, unlock
    industry-card.js    → utils, tooltip, industry, resources, state, unlock
    trade-section.js    → utils, resources, state, trade
    happiness-chip.js   → resources, buildings, state, population
    season-chip.js      → state, config
    migration-strip.js  → state, population
    resource-tile.js    → utils, tooltip, resources, buildings, state, production

PANELLER (iskelet, sadece UI modüllerini import eder):
    header-panel.js → createPopBlock, createHousingChip, createHappinessChip, createSeasonChip, createMigrationStrip, state
    left-panel.js   → createBuildingCard, createPackCard, tooltip, state
    right-panel.js  → createIndustryCard, createTradeSection, state
    center-panel.js → createResourceTile, createBuildingCard, state

layout.js  (import almaz)
main.js    (layout, header-panel, left-panel, center-panel, right-panel, engine import eder)
```

---

## DOSYA BOYUTU HEDEFLERİ

| Dosya | Hedef Satır | Maksimum |
|-------|-------------|----------|
| config.js | 80 | 100 |
| state.js | 100 | 120 |
| persistence.js | 130 | 150 |
| production.js | 200 | 220 |
| population.js | 200 | 220 |
| trade.js | 60 | 80 |
| unlock.js | 70 | 90 |
| engine.js | 200 | 220 |
| building-card.js | 170 | 200 |
| pack-card.js | 110 | 130 |
| industry-card.js | 280 | 300 |
| trade-section.js | 95 | 110 |
| happiness-chip.js | 90 | 110 |
| season-chip.js | 90 | 110 |
| migration-strip.js | 55 | 70 |
| resource-tile.js | 130 | 150 |
| header-panel.js | 100 | 120 |
| left-panel.js | 80 | 100 |
| right-panel.js | 80 | 100 |
| center-panel.js | 100 | 120 |

En büyük dosya: industry-card.js (~280 satır) - sanayi kartının karmaşıklığından dolayı

---

## SORUMLULUK MATRİSİ

| Fonksiyon Grubu | Ait Olduğu Dosya | Export |
|-----------------|------------------|--------|
| Tüm sabit değerler | config.js | hepsi export |
| State nesnesi + basit getter'lar | state.js | getResource, getPower, vb. |
| Load/Save/Reset | persistence.js | resetGame |
| Üretim hesaplamaları | production.js | getTotalProduction, vb. |
| Nüfus + mutluluk | population.js | getPopulationCurrent, vb. |
| Ticaret | trade.js | acceptTrade, vb. |
| Unlock + satın alma | unlock.js | buyBuilding, buyPack, vb. |
| Game loop | engine.js | produce, TICK_MS |
| Bina kartı UI | building-card.js | createBuildingCard, vb. |
| Paket kartı UI | pack-card.js | createPackCard |
| Sanayi kartı UI | industry-card.js | createIndustryCard, vb. |
| Ticaret bölümü UI | trade-section.js | createTradeSection |
| Mutluluk chip UI | happiness-chip.js | createHappinessChip |
| Mevsim chip UI | season-chip.js | createSeasonChip |
| Göç şeridi UI | migration-strip.js | createMigrationStrip |
| Kaynak karosu UI | resource-tile.js | createResourceTile |
| Sol panel iskeleti | left-panel.js | createLeftPanel |
| Sağ panel iskeleti | right-panel.js | createRightPanel |
| Header panel iskeleti | header-panel.js | createHeaderPanel |
| Merkez panel iskeleti | center-panel.js | createCenterPanel |
