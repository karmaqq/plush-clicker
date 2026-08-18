/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TİCARET YÖNETİMİ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  TRADE_INTERVAL_MIN,
  TRADE_INTERVAL_MAX,
  TRADE_PRICES,
} from "./config.js";
import { state, getResource, getPackCount } from "./state.js";
import { RESOURCES } from "./resources.js";
import { PACKS_DATA } from "./packs.js";
import { getResourceCapacity } from "./production.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TİCARET VERİLERİ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Ticaret Aralığı Hesaplayıcı ─────────────────── */

export function getTradeInterval() {
  const bonus = getTradeBonusTotal();
  const base = Math.random() * (TRADE_INTERVAL_MAX - TRADE_INTERVAL_MIN) + TRADE_INTERVAL_MIN;
  return Math.max(120, base / (1 + bonus));
}

function getTradeBonusTotal() {
  let bonus = 0;
  for (const id of Object.keys(PACKS_DATA)) {
    const pack = PACKS_DATA[id];
    if (pack.tradeBonusPerLevel) {
      bonus += getPackCount(id) * pack.tradeBonusPerLevel;
    }
  }
  return bonus;
}

/* ─────────────────── Güncel Teklif Getter'ı ─────────────────── */

export function getTradeCurrent() {
  return state.trade.current;
}

/* ─────────────────── Ticaret Zamanlayıcı Getter'ı ─────────────────── */

export function getTradeTimer() {
  return state.trade.timer;
}

/* ─────────────────── Ticaret Sayacı Getter'ı ─────────────────── */

export function getTradeCount() {
  return state.trade.count;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TEKLİF ÜRETİMİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function generateTradeOffer() {
  const resourceIds = Object.keys(TRADE_PRICES);
  const offerCount = Math.floor(Math.random() * 3) + 1;
  const offers = [];

  for (let i = 0; i < offerCount; i++) {
    const resourceId = resourceIds[Math.floor(Math.random() * resourceIds.length)];
    const priceData = TRADE_PRICES[resourceId];
    const amount = Math.floor(Math.random() * 20) + 1;
    const cost = Math.floor(
      Math.random() * (priceData.buy[1] - priceData.buy[0] + 1) + priceData.buy[0]
    ) * amount;

    offers.push({
      resource: resourceId,
      amount,
      cost: Math.max(1, cost),
    });
  }

  return { offers };
}

export { generateTradeOffer };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        TİCARET İŞLEMLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Teklif Kabul İşlemcisi ─────────────────── */

export function acceptTrade(offerIndex) {
  const offer = state.trade.current;
  if (!offer || !offer.offers) return false;

  const selected = offer.offers[offerIndex];
  if (!selected) return false;
  if (getResource("altin") < selected.cost) return false;

  const capacity = getResourceCapacity(selected.resource);
  if (
    Number.isFinite(capacity) &&
    getResource(selected.resource) >= capacity
  ) {
    return false;
  }

  state.resources.altin -= selected.cost;
  state.resources[selected.resource] = Number.isFinite(capacity)
    ? Math.min(capacity, getResource(selected.resource) + selected.amount)
    : getResource(selected.resource) + selected.amount;

  offer.offers.splice(offerIndex, 1);
  if (offer.offers.length === 0) {
    state.trade.current = null;
    state.trade.interval = getTradeInterval();
    state.trade.timer = state.trade.interval;
  }

  state.trade.count++;

  return true;
}
