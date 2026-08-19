/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TİCARET YÖNETİMİ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  TRADE_MERCHANT_MIN_GOLD,
  TRADE_MERCHANT_MAX_GOLD,
  TRADE_MERCHANT_MAX_ACTIVE,
  TRADE_MERCHANT_STAY_MIN,
  TRADE_MERCHANT_STAY_MAX,
  TRADE_MERCHANT_INTERVAL_MIN,
  TRADE_MERCHANT_INTERVAL_MAX,
  TRADE_ITEM_POOL,
} from "./game-data.js";
import {
  state,
  getResource,
  getResourceCapacity,
  onChange,
} from "./game-core.js";
import { formatCount, formatDuration, triggerShake } from "./utils.js";
import { getResourceName, getResourceEmoji } from "./era.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YARDIMCI FONKSİYONLAR                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Rastgele Tam Sayı Üretici ─────────────────── */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ─────────────────── Rastgele Ondalıklı Sayı Üretici ─────────────────── */
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/* ─────────────────── Tüccar İsim Havuzu ─────────────────── */
const MERCHANT_NAMES = [
  "Tüccar", "Tüccar", "Tüccar",
];

/* ─────────────────── Miktar Rozeti Oluşturucu ─────────────────── */
function getQtyBadgeClass(qty) {
  if (qty >= 40) return "trade-badge-high";
  if (qty >= 20) return "trade-badge-mid";
  if (qty >= 1) return "trade-badge-low";
  return "trade-badge-zero";
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TİCARET VERİLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tüccar Oluşturucu ─────────────────── */
function createMerchant(id) {
  const budget = randomBetween(TRADE_MERCHANT_MIN_GOLD, TRADE_MERCHANT_MAX_GOLD);
  const stayDuration = randomBetween(TRADE_MERCHANT_STAY_MIN, TRADE_MERCHANT_STAY_MAX);

  const sellsToPlayer = generateMerchantItems(budget * 0.6);
  const buysFromPlayer = generateMerchantItems(budget * 0.4);

  return {
    id,
    name: MERCHANT_NAMES[(id - 1) % MERCHANT_NAMES.length],
    budget,
    stayDuration,
    stayRemaining: stayDuration,
    sellsToPlayer,
    buysFromPlayer,
  };
}

/* ─────────────────── Ürün Listesi Üretici ─────────────────── */
function generateMerchantItems(budget) {
  const poolKeys = Object.keys(TRADE_ITEM_POOL);
  const items = [];
  let spent = 0;
  let attempts = 0;

  while (items.length < 5 && attempts < 200) {
    attempts++;
    const resourceId = poolKeys[Math.floor(Math.random() * poolKeys.length)];
    if (items.some(i => i.resourceId === resourceId)) continue;

    const itemData = TRADE_ITEM_POOL[resourceId];
    const qty = randomBetween(itemData.minQty, itemData.maxQty);
    const unitPrice = itemData.basePrice;
    const totalCost = qty * unitPrice;

    if (spent + totalCost > budget) continue;

    const priceModifier = randomFloat(-0.30, 0.40);

    items.push({
      resourceId,
      quantity: qty,
      unitPrice,
      finalUnitPrice: +(unitPrice * (1 + priceModifier)).toFixed(4),
      priceModifier,
    });
    spent += totalCost;
  }
  return items;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TÜCCAR DURUMU                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

let activeMerchantId = null;

/* ─────────────────── Aktif Tüccar Getter'ı ─────────────────── */
export function getActiveMerchant() {
  if (activeMerchantId !== null) {
    const found = state.trade.merchants.find(m => m.id === activeMerchantId);
    if (found) return found;
  }
  activeMerchantId = state.trade.merchants.length > 0 ? state.trade.merchants[0].id : null;
  return state.trade.merchants.find(m => m.id === activeMerchantId) || null;
}

/* ─────────────────── Aktif Tüccar Değiştirici ─────────────────── */
export function setActiveMerchant(id) {
  activeMerchantId = id;
}

/* ─────────────────── Tüccar Sayısı Getter'ı ─────────────────── */
export function getMerchantCount() {
  return state.trade.merchants.length;
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

  if (state.trade.spawnTimer <= 0 && state.trade.merchants.length < TRADE_MERCHANT_MAX_ACTIVE) {
    state.trade.merchants.push(createMerchant(state.trade.nextId++));
    state.trade.spawnTimer = randomBetween(TRADE_MERCHANT_INTERVAL_MIN, TRADE_MERCHANT_INTERVAL_MAX);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TİCARET İŞLEMLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tüccardan Satın Alma ─────────────────── */
export function buyFromMerchant(merchantId, itemIndex, quantity) {
  const merchant = state.trade.merchants.find(m => m.id === merchantId);
  if (!merchant) return false;

  const item = merchant.sellsToPlayer[itemIndex];
  if (!item || quantity <= 0 || quantity > item.quantity) return false;

  const cost = Math.floor(quantity * item.finalUnitPrice);
  if (getResource("altin") < cost) return false;

  const cap = getResourceCapacity(item.resourceId);
  if (Number.isFinite(cap) && getResource(item.resourceId) >= cap) return false;

  state.resources.altin -= cost;
  state.resources[item.resourceId] = Number.isFinite(cap)
    ? Math.min(cap, getResource(item.resourceId) + quantity)
    : getResource(item.resourceId) + quantity;

  item.quantity -= quantity;
  if (item.quantity <= 0) merchant.sellsToPlayer.splice(itemIndex, 1);
  state.trade.count++;
  return true;
}

/* ─────────────────── Tüccara Satış ─────────────────── */
export function sellToMerchant(merchantId, itemIndex, quantity) {
  const merchant = state.trade.merchants.find(m => m.id === merchantId);
  if (!merchant) return false;

  const item = merchant.buysFromPlayer[itemIndex];
  if (!item || quantity <= 0 || quantity > item.quantity) return false;
  if (getResource(item.resourceId) < quantity) return false;

  const payment = Math.floor(quantity * item.finalUnitPrice);
  const cap = getResourceCapacity("altin");

  state.resources[item.resourceId] -= quantity;
  state.resources.altin = Number.isFinite(cap)
    ? Math.min(cap, state.resources.altin + payment)
    : state.resources.altin + payment;

  item.quantity -= quantity;
  if (item.quantity <= 0) merchant.buysFromPlayer.splice(itemIndex, 1);
  state.trade.count++;
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       TİCARET BÖLÜMÜ ARAYÜZÜ                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Ürün Satırı Oluşturucu ─────────────────── */
function createTradeRow(item, direction, merchant) {
  const row = document.createElement("div");
  row.className = "trade-row resource-" + item.resourceId;
  row.dataset.resId = item.resourceId;
  row.dataset.dir = direction;

  /* Sütun 1: Benim stokum */
  const colStock = document.createElement("div");
  colStock.className = "trade-col trade-col-stock";

  const myStockBadge = document.createElement("span");
  myStockBadge.className = "trade-badge trade-badge-mine";
  updateBadgeContent(myStockBadge, item.resourceId);

  colStock.appendChild(myStockBadge);

  /* Sütun 2: Emoji + Kaynak adı */
  const colInfo = document.createElement("div");
  colInfo.className = "trade-col trade-col-info";

  const emoji = document.createElement("span");
  emoji.className = "trade-col-emoji";
  emoji.textContent = getResourceEmoji(item.resourceId);

  const name = document.createElement("span");
  name.className = "trade-col-name";
  name.textContent = getResourceName(item.resourceId);

  colInfo.append(emoji, name);

  /* Sütun 3: Birim fiyat */
  const colPrice = document.createElement("div");
  colPrice.className = "trade-col trade-col-price";

  const goldSm = document.createElement("span");
  goldSm.className = "gold-sm";
  goldSm.textContent = getResourceEmoji("altin");

  const priceNum = document.createElement("span");
  priceNum.className = "trade-price-num";
  priceNum.textContent = Math.floor(item.finalUnitPrice).toLocaleString("tr-TR");

  colPrice.append(goldSm, " ", priceNum);

  /* Sütun 4: Kar/zarar oranı */
  const colMod = document.createElement("div");
  colMod.className = "trade-col trade-col-modifier";

  const pct = Math.round(item.priceModifier * 100);
  const mod = document.createElement("span");
  mod.className = "trade-price-modifier " + (pct > 0 ? "trade-modifier-up" : pct < 0 ? "trade-modifier-down" : "");
  mod.textContent = pct !== 0 ? (pct > 0 ? "+" : "") + pct + "%" : "\u2014";
  colMod.appendChild(mod);

  /* Sütun 5: Tüccar stoğu */
  const colMerchant = document.createElement("div");
  colMerchant.className = "trade-col trade-col-merchant";

  const theirBadge = document.createElement("span");
  theirBadge.className = "trade-badge trade-badge-theirs";
  updateTheirBadge(theirBadge, item.quantity);

  colMerchant.appendChild(theirBadge);

  /* Sütun 6: Adet input + toplam fiyat butonu */
  const colAction = document.createElement("div");
  colAction.className = "trade-col trade-col-action";

  const inputWrap = document.createElement("div");
  inputWrap.className = "trade-qty-wrap";

  const btnDown = document.createElement("button");
  btnDown.type = "button";
  btnDown.className = "trade-qty-arrow";
  btnDown.textContent = "\u25C0";

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "0";
  qtyInput.max = String(item.quantity);
  qtyInput.step = "1";
  qtyInput.value = "0";
  qtyInput.className = "trade-qty-input";

  const btnUp = document.createElement("button");
  btnUp.type = "button";
  btnUp.className = "trade-qty-arrow";
  btnUp.textContent = "\u25B6";

  const maxBtn = document.createElement("button");
  maxBtn.type = "button";
  maxBtn.className = "trade-max-btn";
  maxBtn.textContent = "MAX";
  maxBtn.addEventListener("click", () => {
    const cap = getResourceCapacity("altin");
    const playerGold = Math.floor(getResource("altin"));
    let maxQty = 0;
    if (direction === "buy") {
      const affordByGold = Math.floor(playerGold / item.finalUnitPrice);
      maxQty = Math.min(item.quantity, affordByGold);
    } else {
      const playerStock = Math.floor(getResource(item.resourceId));
      const affordByMerchant = Math.floor(merchant.budget / item.finalUnitPrice);
      maxQty = Math.min(item.quantity, playerStock, affordByMerchant);
    }
    qtyInput.value = String(maxQty);
    refreshBtn();
  });

  inputWrap.append(btnDown, qtyInput, btnUp, maxBtn);

  function clampInput(val) {
    const n = Math.max(0, Math.min(val, item.quantity));
    qtyInput.value = String(n);
    refreshBtn();
  }

  btnDown.addEventListener("click", () => {
    clampInput((parseInt(qtyInput.value, 10) || 0) - 1);
  });

  btnUp.addEventListener("click", () => {
    clampInput((parseInt(qtyInput.value, 10) || 0) + 1);
  });

  qtyInput.addEventListener("input", () => {
    const v = parseInt(qtyInput.value, 10);
    if (!isNaN(v)) clampInput(v);
    else refreshBtn();
  });

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "trade-btn";

  function refreshBtn() {
    const qty = parseInt(qtyInput.value, 10) || 0;
    const total = Math.floor(qty * item.finalUnitPrice);
    const sign = direction === "buy" ? "-" : "+";
    btn.textContent = qty > 0
      ? getResourceEmoji("altin") + " " + sign + total.toLocaleString("tr-TR")
      : getResourceEmoji("altin") + " 0";
    btn.classList.toggle("trade-btn-spend", direction === "buy" && qty > 0);
    btn.classList.toggle("trade-btn-earn", direction === "sell" && qty > 0);

    const overMax = qty > item.quantity;
    const invalid = qty <= 0 || overMax;
    btn.classList.toggle("disabled", invalid);

    qtyInput.classList.toggle("trade-qty-over", overMax);
  }
  refreshBtn();

  btn.addEventListener("click", () => {
    const qty = parseInt(qtyInput.value, 10) || 0;
    if (qty <= 0) {
      triggerShake(qtyInput);
      return;
    }

    const ok = direction === "buy"
      ? buyFromMerchant(merchant.id, item._index, qty)
      : sellToMerchant(merchant.id, item._index, qty);
    if (!ok) {
      triggerShake(btn);
    } else {
      qtyInput.value = "0";
      refreshBtn();
    }
  });

  colAction.append(inputWrap, btn);
  row.append(colStock, colInfo, colPrice, colMod, colMerchant, colAction);
  return row;
}

/* ─────────────────── Badge İçerik Güncelleyici ─────────────────── */
function updateBadgeContent(badgeEl, resourceId) {
  const qty = Math.floor(getResource(resourceId));
  badgeEl.textContent = formatCount(qty);
  badgeEl.className = "trade-badge trade-badge-mine " + getQtyBadgeClass(qty);
}

/* ─────────────────── Tüccar Badge Güncelleyici ─────────────────── */
function updateTheirBadge(badgeEl, qty) {
  badgeEl.textContent = "x" + qty;
  badgeEl.className = "trade-badge trade-badge-theirs " + getQtyBadgeClass(qty);
}

/* ─────────────────── Ticaret Bölümü Bileşeni ─────────────────── */
export function createTradeSection() {
  const section = document.createElement("div");
  section.className = "trade-section";
  section.hidden = true;

  /* Ust bar: tuccar sekmeleri */
  const tabBar = document.createElement("div");
  tabBar.className = "trade-tab-bar";

  /* Tuccar bakiyesi */
  const balanceArea = document.createElement("div");
  balanceArea.className = "trade-balance";

  /* Liste */
  const listWrap = document.createElement("div");
  listWrap.className = "trade-list-wrap";

  /* Baslik satiri — list-wrap icinde, sticky */
  const header = document.createElement("div");
  header.className = "trade-header";

  const hdrStock = document.createElement("div");
  hdrStock.className = "trade-header-col";
  hdrStock.textContent = "Stok";

  const hdrProduct = document.createElement("div");
  hdrProduct.className = "trade-header-col";
  hdrProduct.textContent = "\u00dcrün";

  const hdrPrice = document.createElement("div");
  hdrPrice.className = "trade-header-col";
  hdrPrice.textContent = "Birim Fiyat";

  const hdrModifier = document.createElement("div");
  hdrModifier.className = "trade-header-col";
  hdrModifier.textContent = "De\u011fi\u015fim";

  const hdrMerchant = document.createElement("div");
  hdrMerchant.className = "trade-header-col";
  hdrMerchant.textContent = "T\u00fcccar";

  const hdrAction = document.createElement("div");
  hdrAction.className = "trade-header-col";
  hdrAction.textContent = "\u0130\u015flem";

  header.append(hdrStock, hdrProduct, hdrPrice, hdrModifier, hdrMerchant, hdrAction);

  const list = document.createElement("div");
  list.className = "trade-list";
  listWrap.append(header, list);

  /* Alt durum cubugu */
  const statusBar = document.createElement("div");
  statusBar.className = "trade-status";

  tabBar.appendChild(balanceArea);
  section.append(tabBar, listWrap, statusBar);

  /* ─────────────────── Durum Takibi ─────────────────── */
  let tabMap = new Map();
  let lastMerchantId = null;
  let rowPool = [];
  let dividerEl = null;

  /* ─────────────────── Tab Bar Guncelle ─────────────────── */
  function syncTabs() {
    const merchants = state.trade.merchants;
    const active = getActiveMerchant();

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
        label.textContent = "Tüccar " + (i + 1);

        const timer = document.createElement("span");
        timer.className = "trade-tab-timer";
        timer.textContent = formatDuration(m.stayRemaining);

        tab.append(label, timer);
        tab.addEventListener("click", () => {
          setActiveMerchant(m.id);
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
  }

  /* ─────────────────── Liste Guncelle (Diff Tabanlı) ─────────────────── */
  function syncList() {
    const active = getActiveMerchant();
    const merchantChanged = active && active.id !== lastMerchantId;

    /* Tüccar değiştiyse veya ilk açılışsa tam yeniden oluştur */
    if (merchantChanged || (lastMerchantId === null && active)) {
      lastMerchantId = active ? active.id : null;
      list.innerHTML = "";
      rowPool = [];
      dividerEl = null;
    }

    if (!active) {
      list.innerHTML = "";
      rowPool = [];
      dividerEl = null;
      return;
    }

    const buyCount = active.sellsToPlayer.length;
    const sellCount = active.buysFromPlayer.length;
    const needsDivider = buyCount > 0 && sellCount > 0;

    if (needsDivider && !dividerEl) {
      dividerEl = document.createElement("div");
      dividerEl.className = "trade-divider";
    }

    /* Tum satirlari topla: buy + sell */
    const allItems = [];
    active.sellsToPlayer.forEach((item, i) => {
      item._index = i;
      allItems.push({ item, direction: "buy", merchant: active });
    });
    active.buysFromPlayer.forEach((item, i) => {
      item._index = i;
      allItems.push({ item, direction: "sell", merchant: active });
    });

    const targetCount = allItems.length + (needsDivider ? 1 : 0);

    /* fazlalari kaldir */
    while (list.children.length > targetCount) {
      list.removeChild(list.lastChild);
    }

    /* divider'i dogru yere yerlestir */
    if (needsDivider) {
      const curIdx = dividerEl.parentNode === list ? [...list.children].indexOf(dividerEl) : -1;
      if (curIdx !== buyCount) {
        if (dividerEl.parentNode === list) list.removeChild(dividerEl);
        list.insertBefore(dividerEl, list.children[buyCount] || null);
      }
    } else if (dividerEl && dividerEl.parentNode === list) {
      list.removeChild(dividerEl);
    }

    /* guncelle veya olustur */
    for (let i = 0; i < allItems.length; i++) {
      const { item, direction, merchant } = allItems[i];
      const offset = needsDivider && i >= buyCount ? 1 : 0;
      const childIdx = i + offset;
      let row = list.children[childIdx];

      if (!row || row === dividerEl || row.dataset.resId !== item.resourceId || row.dataset.dir !== direction) {
        row = createTradeRow(item, direction, merchant);
        if (list.children[childIdx] && list.children[childIdx] !== dividerEl) {
          list.replaceChild(row, list.children[childIdx]);
        } else {
          list.insertBefore(row, list.children[childIdx] || null);
        }
      }

      /* Satir icerigini guncelle (DOM'i yeniden olusturmadan) */
      updateTradeRow(row, item, direction, merchant);
    }
  }

  /* ─────────────────── Satir Icerik Guncelleyici ─────────────────── */
  function updateTradeRow(row, item, direction, merchant) {
    const mineBadge = row.querySelector(".trade-badge-mine");
    if (mineBadge) updateBadgeContent(mineBadge, item.resourceId);

    const theirBadge = row.querySelector(".trade-badge-theirs");
    if (theirBadge) updateTheirBadge(theirBadge, item.quantity);

    const priceNum = row.querySelector(".trade-price-num");
    if (priceNum) {
      priceNum.textContent = Math.floor(item.finalUnitPrice).toLocaleString("tr-TR");
    }

    const mod = row.querySelector(".trade-price-modifier");
    if (mod) {
      const pct = Math.round(item.priceModifier * 100);
      mod.className = "trade-price-modifier " + (pct > 0 ? "trade-modifier-up" : pct < 0 ? "trade-modifier-down" : "");
      mod.textContent = pct !== 0 ? (pct > 0 ? "+" : "") + pct + "%" : "\u2014";
    }

    const qtyInput = row.querySelector(".trade-qty-input");
    if (qtyInput) {
      qtyInput.max = String(item.quantity);
      const currentVal = parseInt(qtyInput.value, 10) || 0;
      if (currentVal > item.quantity) {
        qtyInput.value = item.quantity;
      }
    }

    const btn = row.querySelector(".trade-btn");
    if (btn) {
      const qty = parseInt(row.querySelector(".trade-qty-input")?.value, 10) || 0;
      const total = Math.floor(qty * item.finalUnitPrice);
      const sign = direction === "buy" ? "-" : "+";
      btn.textContent = qty > 0
        ? getResourceEmoji("altin") + " " + sign + total.toLocaleString("tr-TR")
        : getResourceEmoji("altin") + " 0";
      btn.classList.toggle("trade-btn-spend", direction === "buy" && qty > 0);
      btn.classList.toggle("trade-btn-earn", direction === "sell" && qty > 0);
      btn.classList.toggle("disabled", qty <= 0 || qty > item.quantity);
    }
  }

  /* ─────────────────── Guncelleme Fonksiyonu ─────────────────── */
  function update() {
    syncTabs();
    syncList();

    const active = getActiveMerchant();
    balanceArea.textContent = active
      ? getResourceEmoji("altin") + " " + active.budget.toLocaleString("tr-TR")
      : "";

    statusBar.textContent = "Toplam işlem: " + state.trade.count;
  }

  onChange(update);
  update();

  return { section, update };
}
