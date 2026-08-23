/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TİCARET YÖNETİMİ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  TRADE_MERCHANT_STAY_MIN,
  TRADE_MERCHANT_STAY_MAX,
  TRADE_MERCHANT_INTERVAL_MIN,
  TRADE_MERCHANT_INTERVAL_MAX,
  TRADE_MERCHANT_BUDGET_MIN,
  TRADE_MERCHANT_BUDGET_MAX,
  TRADE_ITEM_POOL,
  TRADE_ITEMS_ORDER,
} from "./game-data.js";
import {
  state,
  getResource,
  getResourceCapacity,
  onChange,
} from "./game-core.js";
import { formatCount, formatDuration, triggerShake } from "./utils.js";
import { getResourceName, getResourceEmoji } from "./era.js";
import { refreshHighlight } from "./highlight.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YARDIMCI FONKSİYONLAR                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TRADE_MERCHANT_MAX_ITEMS = 10;

/* ─────────────────── Rastgele Tam Sayı Üretici ─────────────────── */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ─────────────────── Rastgele Ondalıklı Sayı Üretici ─────────────────── */
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/* ─────────────────── Karıştır (Fisher-Yates) ─────────────────── */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─────────────────── Miktar Rozeti Oluşturucu ─────────────────── */
function getQtyBadgeClass(qty) {
  if (qty >= 100) return "trade-badge-high";
  if (qty >= 30) return "trade-badge-mid";
  if (qty >= 1) return "trade-badge-low";
  return "trade-badge-zero";
}

/* ─────────────────── Fiyat Hesaplayıcı ─────────────────── */
function getFinalPrice(resourceId, merchant) {
  const pool = TRADE_ITEM_POOL[resourceId];
  if (!pool) return 0;
  const deltas = merchant.priceDeltas;
  const delta = deltas ? deltas[resourceId] || 0 : 0;
  return Math.max(1, pool.basePrice + delta);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TİCARET VERİLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tüccar Oluşturucu ─────────────────── */
function createMerchant(id) {
  const budget = randomBetween(TRADE_MERCHANT_BUDGET_MIN, TRADE_MERCHANT_BUDGET_MAX);
  const stayDuration = randomBetween(TRADE_MERCHANT_STAY_MIN, TRADE_MERCHANT_STAY_MAX);

  const candidates = shuffle(TRADE_ITEMS_ORDER.slice());
  const stock = {};
  const priceDeltas = {};
  let spent = 0;
  let itemCount = 0;

  for (const resId of candidates) {
    const pool = TRADE_ITEM_POOL[resId];
    priceDeltas[resId] = Math.round(pool.basePrice * randomFloat(-0.60, 0.40));

    if (itemCount >= TRADE_MERCHANT_MAX_ITEMS) {
      stock[resId] = 0;
      continue;
    }

    const qty = randomBetween(pool.minQty, pool.maxQty);
    const cost = qty * pool.basePrice;
    if (spent + cost <= budget) {
      stock[resId] = qty;
      spent += cost;
      itemCount++;
    } else {
      stock[resId] = 0;
    }
  }

  for (const resId of TRADE_ITEMS_ORDER) {
    if (!(resId in stock)) {
      stock[resId] = 0;
    }
    if (!(resId in priceDeltas)) {
      priceDeltas[resId] = Math.round(TRADE_ITEM_POOL[resId].basePrice * randomFloat(-0.60, 0.40));
    }
  }

  return {
    id,
    budget,
    stock,
    priceDeltas,
    stayDuration,
    stayRemaining: stayDuration,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TÜCCAR DURUMU                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

let activeMerchantId = null;

/* ─────────────────── Aktif Tüccar Getter'ı ─────────────────── */
function getActiveMerchant() {
  if (activeMerchantId !== null) {
    const found = state.trade.merchants.find(m => m.id === activeMerchantId);
    if (found) return found;
  }
  activeMerchantId = state.trade.merchants.length > 0 ? state.trade.merchants[0].id : null;
  return state.trade.merchants.find(m => m.id === activeMerchantId) || null;
}

/* ─────────────────── Aktif Tüccar Değiştirici ─────────────────── */
function setActiveMerchant(id) {
  activeMerchantId = id;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TÜCCAR GÜNCELLEME                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tüccar Güncelleme Döngüsü ─────────────────── */
let skipMerchantUpdate = false;

export function setSkipMerchantUpdate(val) {
  skipMerchantUpdate = val;
}

export function updateMerchants(delta) {
  if (skipMerchantUpdate) return;

  state.trade.spawnTimer -= delta;

  for (let i = state.trade.merchants.length - 1; i >= 0; i--) {
    state.trade.merchants[i].stayRemaining -= delta;
    if (state.trade.merchants[i].stayRemaining <= 0) {
      state.trade.merchants.splice(i, 1);
    }
  }

  if (state.trade.spawnTimer <= 0) {
    state.trade.merchants.push(createMerchant(state.trade.nextId++));
    state.trade.spawnTimer = randomBetween(TRADE_MERCHANT_INTERVAL_MIN, TRADE_MERCHANT_INTERVAL_MAX);
    if (activeMerchantId === null && state.trade.merchants.length === 1) {
      activeMerchantId = state.trade.merchants[0].id;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TİCARET İŞLEMLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tüccardan Satın Alma ─────────────────── */
function buyFromMerchant(merchantId, resourceId, quantity) {
  const merchant = state.trade.merchants.find(m => m.id === merchantId);
  if (!merchant) return false;

  const merchantStock = merchant.stock[resourceId] || 0;
  if (quantity <= 0 || quantity > merchantStock) return false;

  const finalPrice = getFinalPrice(resourceId, merchant);
  const cost = quantity * finalPrice;
  if (getResource("altin") < cost) return false;

  const cap = getResourceCapacity(resourceId);
  const current = getResource(resourceId);
  if (Number.isFinite(cap) && current >= cap) return false;

  const actualQty = Number.isFinite(cap) ? Math.min(quantity, cap - current) : quantity;

  state.resources.altin -= cost;
  state.resources[resourceId] += actualQty;
  merchant.stock[resourceId] -= actualQty;
  merchant.budget += cost;
  state.trade.count++;
  return true;
}

/* ─────────────────── Tüccara Satış ─────────────────── */
function sellToMerchant(merchantId, resourceId, quantity) {
  const merchant = state.trade.merchants.find(m => m.id === merchantId);
  if (!merchant) return false;

  if (quantity <= 0 || getResource(resourceId) < quantity) return false;

  const finalPrice = getFinalPrice(resourceId, merchant);
  const payment = quantity * finalPrice;
  const goldCap = getResourceCapacity("altin");

  state.resources[resourceId] -= quantity;
  state.resources.altin = Number.isFinite(goldCap)
    ? Math.min(goldCap, state.resources.altin + payment)
    : state.resources.altin + payment;

  merchant.stock[resourceId] = (merchant.stock[resourceId] || 0) + quantity;
  merchant.budget -= payment;
  state.trade.count++;
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       TİCARET BÖLÜMÜ ARAYÜZÜ                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Maksimum Alış Miktarı ─────────────────── */
function getMaxBuyQty(resourceId, merchant) {
  const playerGold = Math.floor(getResource("altin"));
  const finalPrice = getFinalPrice(resourceId, merchant);
  const affordByGold = Math.floor(playerGold / finalPrice);
  const cap = getResourceCapacity(resourceId);
  const currentStock = getResource(resourceId);
  const spaceLeft = Number.isFinite(cap) ? Math.max(0, Math.floor(cap - currentStock)) : Infinity;
  const merchantStock = merchant.stock[resourceId] || 0;
  return Math.floor(Math.max(0, Math.min(merchantStock, affordByGold, spaceLeft)));
}

/* ─────────────────── Maksimum Satış Miktarı ─────────────────── */
function getMaxSellQty(resourceId, merchant) {
  const playerStock = Math.floor(getResource(resourceId));
  const finalPrice = getFinalPrice(resourceId, merchant);
  const affordByMerchant = Math.floor(merchant.budget / finalPrice);
  return Math.floor(Math.max(0, Math.min(playerStock, affordByMerchant)));
}

/* ─────────────────── Badge İçerik Güncelleyici ─────────────────── */
function updateBadgeContent(badgeEl, resourceId) {
  const qty = Math.floor(getResource(resourceId));
  badgeEl.textContent = formatCount(qty);
  badgeEl.className = "trade-badge trade-badge-mine " + getQtyBadgeClass(qty);
}

/* ─────────────────── Tüccar Badge Güncelleyici ─────────────────── */
function updateTheirBadge(badgeEl, qty) {
  badgeEl.textContent = formatCount(qty);
  badgeEl.className = "trade-badge trade-badge-theirs " + getQtyBadgeClass(qty);
}

/* ─────────────────── Ürün Satırı Oluşturucu ─────────────────── */
function createTradeRow(resourceId, merchant) {
  const row = document.createElement("div");
  row.className = "trade-row resource-" + resourceId;
  row.dataset.resId = resourceId;

  const pool = TRADE_ITEM_POOL[resourceId];
  const finalPrice = getFinalPrice(resourceId, merchant);

  /* Sütun 1: Emoji + İsim */
  const colInfo = document.createElement("div");
  colInfo.className = "trade-col trade-col-info";

  const emoji = document.createElement("span");
  emoji.className = "trade-col-emoji";
  emoji.textContent = getResourceEmoji(resourceId);

  const name = document.createElement("span");
  name.className = "trade-col-name";
  name.textContent = getResourceName(resourceId);

  colInfo.append(emoji, name);

  /* Sütun 2: Birim fiyat */
  const colPrice = document.createElement("div");
  colPrice.className = "trade-col trade-col-price";

  const goldSm = document.createElement("span");
  goldSm.className = "gold-sm";
  goldSm.textContent = getResourceEmoji("altin");

  const priceNum = document.createElement("span");
  priceNum.className = "trade-price-num";
  priceNum.textContent = Math.floor(finalPrice).toLocaleString("tr-TR");

  colPrice.append(goldSm, " ", priceNum);

  /* Sütun 3: Kar/zarar oranı */
  const colMod = document.createElement("div");
  colMod.className = "trade-col trade-col-modifier";

  const delta = finalPrice - pool.basePrice;
  const mod = document.createElement("span");
  mod.className = "trade-price-modifier " + (delta > 0 ? "trade-modifier-up" : delta < 0 ? "trade-modifier-down" : "");
  mod.textContent = delta > 0 ? "\u25B2 +" + delta : delta < 0 ? "\u25BC \u2212" + Math.abs(delta) : "\u2014";
  colMod.appendChild(mod);

  /* Sütun 4: Benim stoğum */
  const colStock = document.createElement("div");
  colStock.className = "trade-col trade-col-stock";

  const myStockBadge = document.createElement("span");
  myStockBadge.className = "trade-badge trade-badge-mine";
  updateBadgeContent(myStockBadge, resourceId);

  colStock.appendChild(myStockBadge);

  /* Sütun 5: < [input] > tek sütun */
  const colQty = document.createElement("div");
  colQty.className = "trade-col trade-col-qty";

  const qtyGroup = document.createElement("div");
  qtyGroup.className = "trade-qty-group";

  const btnLeft = document.createElement("button");
  btnLeft.type = "button";
  btnLeft.className = "trade-qty-arrow";
  btnLeft.textContent = "\u25C0";

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "0";
  qtyInput.max = "0";
  qtyInput.step = "1";
  qtyInput.value = "0";
  qtyInput.className = "trade-qty-input";

  const btnRight = document.createElement("button");
  btnRight.type = "button";
  btnRight.className = "trade-qty-arrow";
  btnRight.textContent = "\u25B6";

  qtyGroup.append(btnLeft, qtyInput, btnRight);
  colQty.appendChild(qtyGroup);

  function clampInput(val) {
    const maxBuy = getMaxBuyQty(resourceId, merchant);
    const maxSell = getMaxSellQty(resourceId, merchant);
    const n = Math.max(-maxSell, Math.min(val, maxBuy));
    qtyInput.value = String(n);
    refreshBtn();
  }

  qtyInput.addEventListener("input", () => {
    const v = parseInt(qtyInput.value, 10);
    if (!isNaN(v)) clampInput(v);
    else refreshBtn();
  });

  btnLeft.addEventListener("click", () => {
    const maxBuy = getMaxBuyQty(resourceId, merchant);
    if (maxBuy > 0) {
      qtyInput.value = String(maxBuy);
      refreshBtn();
    } else {
      triggerShake(qtyInput);
    }
  });

  btnRight.addEventListener("click", () => {
    const maxSell = getMaxSellQty(resourceId, merchant);
    if (maxSell > 0) {
      qtyInput.value = String(-maxSell);
      refreshBtn();
    } else {
      triggerShake(qtyInput);
    }
  });

  /* Sütun 6: Tüccar stoğu */
  const colMerchant = document.createElement("div");
  colMerchant.className = "trade-col trade-col-merchant";

  const theirBadge = document.createElement("span");
  theirBadge.className = "trade-badge trade-badge-theirs";
  updateTheirBadge(theirBadge, merchant.stock[resourceId] || 0);

  colMerchant.appendChild(theirBadge);

  /* Sütun 7: Maliyet butonu */
  const colCost = document.createElement("div");
  colCost.className = "trade-col trade-col-cost";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "trade-btn";

  function refreshBtn() {
    const qty = parseInt(qtyInput.value, 10) || 0;
    const maxBuy = getMaxBuyQty(resourceId, merchant);
    const maxSell = getMaxSellQty(resourceId, merchant);
    const total = Math.floor(Math.abs(qty) * finalPrice);

    if (qty > 0) {
      btn.textContent = getResourceEmoji("altin") + " -" + total.toLocaleString("tr-TR");
      btn.classList.add("trade-btn-spend");
      btn.classList.remove("trade-btn-earn");
    } else if (qty < 0) {
      btn.textContent = getResourceEmoji("altin") + " +" + total.toLocaleString("tr-TR");
      btn.classList.add("trade-btn-earn");
      btn.classList.remove("trade-btn-spend");
    } else {
      btn.textContent = getResourceEmoji("altin") + " 0";
      btn.classList.remove("trade-btn-spend", "trade-btn-earn");
    }

    const overMax = qty > maxBuy || qty < -maxSell;
    const invalid = qty === 0 || overMax;
    btn.classList.toggle("disabled", invalid);

    qtyInput.classList.toggle("trade-qty-over", overMax);

    btnLeft.disabled = maxBuy <= 0;
    btnRight.disabled = maxSell <= 0;
  }
  refreshBtn();

  btn.addEventListener("click", () => {
    const qty = parseInt(qtyInput.value, 10) || 0;
    if (qty === 0) {
      triggerShake(qtyInput);
      return;
    }

    let ok;
    if (qty > 0) {
      ok = buyFromMerchant(merchant.id, resourceId, qty);
    } else {
      ok = sellToMerchant(merchant.id, resourceId, Math.abs(qty));
    }

    if (!ok) {
      triggerShake(btn);
    } else {
      qtyInput.value = "0";
      refreshBtn();
    }
  });

  colCost.appendChild(btn);
  row.append(colInfo, colPrice, colMod, colStock, colQty, colMerchant, colCost);
  return row;
}

/* ─────────────────── Satır İçerik Güncelleyici ─────────────────── */
function updateTradeRow(row, resourceId, merchant) {
  const mineBadge = row.querySelector(".trade-badge-mine");
  if (mineBadge) updateBadgeContent(mineBadge, resourceId);

  const theirBadge = row.querySelector(".trade-badge-theirs");
  if (theirBadge) updateTheirBadge(theirBadge, merchant.stock[resourceId] || 0);

  const priceNum = row.querySelector(".trade-price-num");
  if (priceNum) {
    const fp = getFinalPrice(resourceId, merchant);
    priceNum.textContent = Math.floor(fp).toLocaleString("tr-TR");
  }

  const mod = row.querySelector(".trade-price-modifier");
  if (mod) {
    const pool = TRADE_ITEM_POOL[resourceId];
    const fp = getFinalPrice(resourceId, merchant);
    const delta = fp - pool.basePrice;
    mod.className = "trade-price-modifier " + (delta > 0 ? "trade-modifier-up" : delta < 0 ? "trade-modifier-down" : "");
    mod.textContent = delta > 0 ? "\u25B2 +" + delta : delta < 0 ? "\u25BC \u2212" + Math.abs(delta) : "\u2014";
  }

  const name = row.querySelector(".trade-col-name");
  if (name) {
    const depleted = getResource(resourceId) <= 0 && (merchant.stock[resourceId] || 0) <= 0;
    name.classList.toggle("depleted", depleted);
  }

  const qtyInput = row.querySelector(".trade-qty-input");
  const btnLeft = row.querySelector(".trade-qty-arrow:first-of-type");
  const btnRight = row.querySelector(".trade-qty-arrow:last-of-type");
  const btn = row.querySelector(".trade-btn");

  if (qtyInput) {
    const maxBuy = getMaxBuyQty(resourceId, merchant);
    const maxSell = getMaxSellQty(resourceId, merchant);
    const currentVal = parseInt(qtyInput.value, 10) || 0;
    if (currentVal > maxBuy) qtyInput.value = String(maxBuy);
    if (currentVal < -maxSell) qtyInput.value = String(-maxSell);

    if (btnLeft) btnLeft.disabled = maxBuy <= 0;
    if (btnRight) btnRight.disabled = maxSell <= 0;

    if (btn) {
      const qty = parseInt(qtyInput.value, 10) || 0;
      const fp = getFinalPrice(resourceId, merchant);
      const total = Math.floor(Math.abs(qty) * fp);
      if (qty > 0) {
        btn.textContent = getResourceEmoji("altin") + " -" + total.toLocaleString("tr-TR");
        btn.classList.add("trade-btn-spend");
        btn.classList.remove("trade-btn-earn");
      } else if (qty < 0) {
        btn.textContent = getResourceEmoji("altin") + " +" + total.toLocaleString("tr-TR");
        btn.classList.add("trade-btn-earn");
        btn.classList.remove("trade-btn-spend");
      } else {
        btn.textContent = getResourceEmoji("altin") + " 0";
        btn.classList.remove("trade-btn-spend", "trade-btn-earn");
      }
      const overMax = qty > maxBuy || qty < -maxSell;
      btn.classList.toggle("disabled", qty === 0 || overMax);
      qtyInput.classList.toggle("trade-qty-over", overMax);
    }
  }
}

/* ─────────────────── Ticaret Bölümü Bileşeni ─────────────────── */
export function createTradeSection() {
  const section = document.createElement("div");
  section.className = "trade-section";
  section.hidden = true;

  /* Üst bar: tüccar sekmeleri + bakiye */
  const tabBar = document.createElement("div");
  tabBar.className = "trade-tab-bar";

  const balanceArea = document.createElement("div");
  balanceArea.className = "trade-balance";

  /* Liste */
  const listWrap = document.createElement("div");
  listWrap.className = "trade-list-wrap";

  /* Başlık satırı — list-wrap icinde, sticky */
  const header = document.createElement("div");
  header.className = "trade-header";

  const hdrProduct = document.createElement("div");
  hdrProduct.className = "trade-header-col";
  hdrProduct.textContent = "\u00dcr\u00fcn";

  const hdrPrice = document.createElement("div");
  hdrPrice.className = "trade-header-col";
  hdrPrice.textContent = "Fiyat";

  const hdrModifier = document.createElement("div");
  hdrModifier.className = "trade-header-col";
  hdrModifier.textContent = "De\u011fişim";

  const hdrStock = document.createElement("div");
  hdrStock.className = "trade-header-col";
  hdrStock.textContent = "Stok";

  const hdrQty = document.createElement("div");
  hdrQty.className = "trade-header-col";
  hdrQty.textContent = "Miktar";

  const hdrMerchant = document.createElement("div");
  hdrMerchant.className = "trade-header-col";
  hdrMerchant.textContent = "Tüccar";

  const hdrCost = document.createElement("div");
  hdrCost.className = "trade-header-col";
  hdrCost.textContent = "Maliyet";

  header.append(hdrProduct, hdrPrice, hdrModifier, hdrStock, hdrQty, hdrMerchant, hdrCost);

  const list = document.createElement("div");
  list.className = "trade-list";

  /* Boş durum — tüccar yokken veya stoğu bitince gösterilir */
  const emptyState = document.createElement("div");
  emptyState.className = "trade-empty";
  emptyState.hidden = true;

  const emptyIcon = document.createElement("div");
  emptyIcon.className = "trade-empty-icon";

  const emptyTitle = document.createElement("div");
  emptyTitle.className = "trade-empty-title";

  const emptySubtitle = document.createElement("div");
  emptySubtitle.className = "trade-empty-subtitle";

  const emptyTimer = document.createElement("strong");
  emptyTimer.className = "trade-empty-timer";

  emptyState.append(emptyIcon, emptyTitle, emptySubtitle);

  listWrap.append(header, list, emptyState);

  /* Alt durum cubugu */
  const statusBar = document.createElement("div");
  statusBar.className = "trade-status";

  tabBar.appendChild(balanceArea);
  section.append(tabBar, listWrap, statusBar);

  /* ─────────────────── Durum Takibi ─────────────────── */
  let tabMap = new Map();
  let prevMerchantIds = [];
  let lastMerchantId = null;
  let rowEls = [];

  /* ─────────────────── Boş Durum Gösterici ─────────────────── */
  function showEmptyState(mode) {
    if (mode === "noMerchant") {
      emptyIcon.textContent = "\uD83D\uDC2A";
      emptyTitle.textContent = "Tüccar yolda";
      emptySubtitle.textContent = "";
      emptySubtitle.append("Bir sonraki tüccar ", emptyTimer, " içinde gelir");
    } else {
      emptyIcon.textContent = "\uD83D\uDCE6";
      emptyTitle.textContent = "Stok tükendi";
      emptySubtitle.textContent = "";
      emptySubtitle.append("Bu tüccarda ticareti yapılacak ürün kalmadı");
    }
    emptyState.hidden = false;
  }

  /* ─────────────────── Aktif Sekme Sınıfı Güncelle ─────────────────── */
  function refreshActiveTabClass() {
    const active = getActiveMerchant();
    for (const [id, tab] of tabMap) {
      tab.classList.toggle("active", active !== null && id === active.id);
    }
  }

  /* ─────────────────── Tab Bar Guncelle (Artımlı) ─────────────────── */
  function syncTabs() {
    const merchants = state.trade.merchants;
    const active = getActiveMerchant();

    const currentIds = [];
    for (let i = 0; i < Math.min(3, merchants.length); i++) {
      currentIds.push(merchants[i].id);
    }

    const listChanged = currentIds.length !== prevMerchantIds.length ||
      currentIds.some((id, i) => id !== prevMerchantIds[i]);

    if (listChanged) {
      const existingTabs = tabBar.querySelectorAll(".trade-tab");
      existingTabs.forEach(t => t.remove());
      tabMap.clear();

      for (let i = 0; i < 3; i++) {
        const m = merchants[i];
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "trade-tab";

        const label = document.createElement("span");
        label.className = "trade-tab-label";

        if (m) {
          label.textContent = "T\u00fccar " + (i + 1);

          const timer = document.createElement("span");
          timer.className = "trade-tab-timer";
          timer.textContent = formatDuration(m.stayRemaining);

          tab.append(label, timer);
          tab.addEventListener("click", () => {
            setActiveMerchant(m.id);
            refreshActiveTabClass();
          });
          tab.classList.toggle("active", active && m.id === active.id);
          tabMap.set(m.id, tab);
        } else {
          tab.classList.add("empty");
          label.textContent = "";
          tab.appendChild(label);
        }

        tabBar.insertBefore(tab, balanceArea);
      }

      prevMerchantIds = currentIds;
    } else {
      for (const [id, tab] of tabMap) {
        const timer = tab.querySelector(".trade-tab-timer");
        if (timer) {
          const m = merchants.find(x => x.id === id);
          if (m) timer.textContent = formatDuration(m.stayRemaining);
        }
      }
      refreshActiveTabClass();
    }
  }

  /* ─────────────────── Liste Guncelle (Diff Tabanlı) ─────────────────── */
  function syncList() {
    const active = getActiveMerchant();
    const merchantChanged = active && active.id !== lastMerchantId;

    if (merchantChanged || (lastMerchantId === null && active)) {
      lastMerchantId = active ? active.id : null;
      list.innerHTML = "";
      rowEls = [];
    }

    if (!active) {
      showEmptyState("noMerchant");
      list.innerHTML = "";
      rowEls = [];
      return;
    }

    const activeResIds = TRADE_ITEMS_ORDER.filter(resId => (active.stock[resId] || 0) > 0);

    if (activeResIds.length === 0) {
      showEmptyState("stockEmpty");
    } else {
      emptyState.hidden = true;
    }

    while (rowEls.length > activeResIds.length) {
      list.removeChild(list.lastChild);
      rowEls.pop();
    }

    for (let i = 0; i < activeResIds.length; i++) {
      const resId = activeResIds[i];

      if (i >= rowEls.length) {
        const row = createTradeRow(resId, active);
        list.appendChild(row);
        rowEls.push(row);
      }

      const row = rowEls[i];
      if (row.dataset.resId !== resId) {
        const newRow = createTradeRow(resId, active);
        list.replaceChild(newRow, row);
        rowEls[i] = newRow;
      }

      updateTradeRow(row, resId, active);
    }
  }

  /* ─────────────────── Guncelleme Fonksiyonu ─────────────────── */
  function update() {
    syncTabs();
    syncList();

    const active = getActiveMerchant();
    balanceArea.hidden = !active;
    balanceArea.textContent = active
      ? getResourceEmoji("altin") + " " + active.budget.toLocaleString("tr-TR")
      : "";

    if (!active) {
      emptyTimer.textContent = formatDuration(state.trade.spawnTimer);
    }

    statusBar.textContent = "Toplam i\u015flem: " + state.trade.count;
    refreshHighlight();
  }

  onChange(update);
  update();

  return { section, update };
}
