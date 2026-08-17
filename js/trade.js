/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           TİCARET YÖNETİMİ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  TRADE_INTERVAL,
  TRADE_PRICES,
  TRADE_AMOUNTS,
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
  return Math.max(12, TRADE_INTERVAL / (1 + getTradeBonusTotal()));
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
  const resources = Object.keys(TRADE_PRICES);
  const resource = resources[Math.floor(Math.random() * resources.length)];
  const meta = RESOURCES[resource];
  const range = TRADE_AMOUNTS[meta.rarity] || TRADE_AMOUNTS[2];
  const amount =
    Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  const postBonus = 1 + getTradeBonusTotal();
  const boosted = Math.round(amount * postBonus);

  const cost = Math.max(1, Math.round(boosted * TRADE_PRICES[resource] * 0.6));

  return {
    cost,
    get: { resource, amount: boosted },
  };
}

export { generateTradeOffer };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        TİCARET İŞLEMLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Teklif Kabul İşlemcisi ─────────────────── */

export function acceptTrade() {
  const offer = state.trade.current;
  if (!offer) return false;
  if (getResource("altin") < offer.cost) return false;

  const capacity = getResourceCapacity(offer.get.resource);
  if (
    Number.isFinite(capacity) &&
    getResource(offer.get.resource) >= capacity
  ) {
    return false;
  }

  state.resources.altin -= offer.cost;
  state.resources[offer.get.resource] = Number.isFinite(capacity)
    ? Math.min(capacity, getResource(offer.get.resource) + offer.get.amount)
    : getResource(offer.get.resource) + offer.get.amount;

  state.trade.current = null;
  state.trade.timer = getTradeInterval();
  state.trade.count++;

  return true;
}
