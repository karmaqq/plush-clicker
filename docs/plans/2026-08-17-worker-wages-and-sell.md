# İşçi Maaşı, Tekli Satış ve Mutluluk Planı

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** İşçi maaşlarını mevsimlik sisteme geçir, tekli satış butonu ekle, maaş mutluluk etkisini düzenle

**Architecture:** Maaşlar saniyelik altın tüketimi yerine mevsim geçişlerinde tek seferde ödenir. Tekli satış butonu kaynak kartlarına eklenir. Maaş ödemesi mutluluk hesabına dahil edilir.

**Tech Stack:** Vanilla JS, ES Modules, CSS

---

## Task 1: Mevsimlik Maaş Ödeme Sistemi

**Files:**
- Modify: `js/config.js`
- Modify: `js/state.js`
- Modify: `js/population.js`
- Modify: `js/engine.js`
- Modify: `js/production.js`
- Modify: `js/gold-chip.js`

### Step 1: Maaş sabitlerini güncelle

`js/config.js` dosyasında `WORKER_WAGE` sabitini mevsimlik ödeme için ayarla:

```javascript
// Mevcut:
export const WORKER_WAGE = 0.01;

// Yeni:
export const WORKER_WAGE_SEASONAL = 15;
```

### Step 2: State'e maaş durumu ekle

`js/state.js` dosyasında `state.population` içine maaş durumu ekle:

```javascript
// state.population içine:
wagesPaid: true,
```

Ayrıca `state.js`'te `initState()` fonksiyonunu bul ve `wagesPaid: true` olarak ayarla.

### Step 3: Mevsim geçişinde maaş öde

`js/engine.js` dosyasında mevsim geçişi bölümünü bul (satır ~202-208) ve maaş ödeme mantığını ekle:

```javascript
/* 5) Mevsim geçişi */
state.season.timer -= 1 / TICKS_PER_SECOND;
if (state.season.timer <= 0) {
    const idx = SEASON_ORDER.indexOf(state.season.id);
    state.season.id = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
    state.season.timer = SEASON_DURATION;
    
    // Mevsimlik maaş ödemesi
    const totalWage = getWorkerCount() * WORKER_WAGE_SEASONAL;
    if (getResource("altin") >= totalWage) {
        state.resources.altin -= totalWage;
        state.population.wagesPaid = true;
    } else {
        state.population.wagesPaid = false;
    }
    
    changed = true;
}
```

`engine.js`'in import kısmına `getWorkerCount` ve `WORKER_WAGE_SEASONAL` ekle.

### Step 4: Saniyelik altın tüketiminden maaşı çıkar

`js/population.js` dosyasında `consumePopulation()` fonksiyonunu bul ve altın tüketim satırını güncelle:

```javascript
// Mevcut:
const goldNeed =
    (alive * POP_GOLD_RATE + getWorkerCount() * WORKER_WAGE) / TICKS_PER_SECOND;

// Yeni:
const goldNeed = (alive * POP_GOLD_RATE) / TICKS_PER_SECOND;
```

Artık sadece nüfus altın tüketiyor, işçi maaşları ayrı ödeniyor.

### Step 5: Altın çip tooltip'ini güncelle

`js/gold-chip.js` dosyasında `refresh()` fonksiyonunu güncelle:

```javascript
function refresh() {
    const gold = getAltin();
    title.textContent = "🪙 Altın " + formatCount(gold);

    const workerCount = getWorkerCount();
    const seasonalWage = workerCount * WORKER_WAGE_SEASONAL;
    wageRow.value.textContent = "-" + formatNumber(seasonalWage) + "/mevsim";
    wageRow.value.style.color = "#ff8a8a";

    // ... geri kalan kod aynı
}
```

Ayrıca `WORKER_WAGE` import'unu `WORKER_WAGE_SEASONAL` olarak değiştir.

### Step 6: Doğrula

Oyunu aç, işçi ekle, mevsim geçişini bekle. Altın düşmeli ve "İşçi maaşları" satırı "/mevsim" göstermeli.

---

## Task 2: Maaş Mutluluk Etkisi

**Files:**
- Modify: `js/population.js`

### Step 1: Happiness breakdown'a maaş ekle

`js/population.js` dosyasında `computeHappinessBreakdown()` fonksiyonunu bul ve "Altın Kutlama" satırının hemen altına maaş mutluluk kalemini ekle:

```javascript
// Altın Kutlama satırından sonra:
const wagesMet = state.population.wagesPaid;
items.push({
    emoji: "💰",
    label: "İşçi Maaşları",
    delta: wagesMet ? 20 : -10,
    met: wagesMet,
});
```

### Step 2: Doğrula

Oyunu aç, işçi ekle, mevsim geçişini bekle. Maaş ödenmezse mutluluk -10, ödenirse +20 etkilemeli.

---

## Task 3: Tekli Satış Butonu

**Files:**
- Modify: `js/production.js`
- Modify: `js/resource-tile.js`
- Modify: `js/game-state.js`
- Modify: `css/center-panel.css`

### Step 1: Satış fonksiyonu oluştur

`js/production.js` dosyasına yeni fonksiyon ekle:

```javascript
/* ─────────────────── Tekli Satış ─────────────────── */

export function sellOne(resource) {
    if (!isSellable(resource)) return false;
    if (getResource(resource) < 1) return false;
    state.resources[resource] -= 1;
    state.resources.altin += getSellPrice(resource);
    return true;
}
```

### Step 2: Barrel export'a ekle

`js/game-state.js` dosyasında `sellOne` fonksiyonunu export listesine ekle.

### Step 3: Butonu oluştur

`js/resource-tile.js` dosyasında `createResourceTile()` fonksiyonunda auto-sell butonunun hemen altına tekli satış butonu ekle:

```javascript
// auto-sell butonundan sonra:
let sellOneBtn = null;

if (sellable) {
    sellOneBtn = document.createElement("button");
    sellOneBtn.type = "button";
    sellOneBtn.className = "sell-one-btn";
    sellOneBtn.textContent = "1";
    sellOneBtn.title = "1 birim sat";

    sellOneBtn.addEventListener("click", () => {
        if (sellOne(id)) {
            sellOneBtn.classList.add("sold-flash");
            setTimeout(() => sellOneBtn.classList.remove("sold-flash"), 300);
        }
    });

    foot.appendChild(sellOneBtn);
}
```

### Step 4: CSS ekle

`css/center-panel.css` dosyasına yeni stiller ekle:

```css
/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       TEKLİ SATIŞ BUTONU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

.sell-one-btn {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    color: #ffd166;
    background: #2b333d;
    border: 1px solid #5a4a2e;
    border-radius: 0.375rem;
    padding: 0.2rem 0.45rem;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease;
}

.sell-one-btn:hover {
    background: #3a3a2a;
    border-color: #ffd166;
}

.sell-one-btn.sold-flash {
    background: #3a5a2a;
    border-color: #9fd88f;
    color: #9fd88f;
}
```

Ayrıca `resource-tile-foot` stilini güncelle:

```css
.resource-tile-foot {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    min-width: 0;
}
```

### Step 5: Import ekle

`js/resource-tile.js` dosyasının import kısmına `sellOne` fonksiyonunu ekle.

### Step 6: Doğrula

Oyunu aç, satılabilir bir kaynak üret (örn. ekmek). "1" butonu görünmeli. Tıkla, 1 birim satılmalı ve altın artmalı.

---

## Kontrol Noktaları

1. **Task 1 tamamlandı:** Maaşlar mevsim geçişlerinde ödeniyor mu? Altın çip tooltip'inde "/mevsim" görünüyor mu?
2. **Task 2 tamamlandı:** Maaş ödenmezse mutluluk -10, ödenirse +20 etkiliyor mu?
3. **Task 3 tamamlandı:** Tekli satış butonu görünüyor mu? Her tıklamada 1 birim satılıyor mu?
4. **Genel test:** Tüm mekanikler birlikte çalışıyor mu? Mevsim geçişi → maaş ödemesi → mutluluk değişimi → tekli satış çalışması?
