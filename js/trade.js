/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TICARET YONETIMI                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  TRADE_INTERVAL_MIN,
  TRADE_INTERVAL_MAX,
  TRADE_PRICES,
  PACKS_DATA,
} from "./game-data.js";
import {
  state,
  getResource,
  getPackCount,
  getResourceCapacity,
} from "./game-core.js";
import { formatCount, formatDuration, triggerShake } from "./utils.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TICARET VERILERI                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Ticaret Araligi Hesaplayici ─────────────────── */
export function getTradeInterval() {
  const bonus = getTradeBonusTotal();
  const base = Math.random() * (TRADE_INTERVAL_MAX - TRADE_INTERVAL_MIN) + TRADE_INTERVAL_MIN;
  return Math.max(120, base / (1 + bonus));
}

/* ─────────────────── Ticaret Bonus Toplami ─────────────────── */
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

/* ─────────────────── Guncel Teklif Getter'i ─────────────────── */
export function getTradeCurrent() {
  return state.trade.current;
}

/* ─────────────────── Ticaret Zamanlayici Getter'i ─────────────────── */
export function getTradeTimer() {
  return state.trade.timer;
}

/* ─────────────────── Ticaret Sayaci Getter'i ─────────────────── */
export function getTradeCount() {
  return state.trade.count;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TEKLIF URETIMI                                   */
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
/*                        TICARET ISLEMLERI                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Teklif Kabul Islemcisi ─────────────────── */
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       TICARET BOLUMU ARAYUZU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { getResourceName, getResourceEmoji, getGoldLabel } from "./era.js";
import { onChange } from "./game-core.js";

/* ─────────────────── Ticaret Bolumu Bileseni ─────────────────── */
export function createTradeSection() {
  const section = document.createElement("div");
  section.className = "trade-section";
  section.hidden = true;

  const offerCard = document.createElement("div");
  offerCard.className = "trade-offer";

  const offerHead = document.createElement("div");
  offerHead.className = "trade-offer-head";

  const offerName = document.createElement("div");
  offerName.className = "trade-offer-name";
  offerName.textContent = "Ticaret Teklifi";

  const offerTimer = document.createElement("div");
  offerTimer.className = "trade-offer-timer";

  offerHead.append(offerName, offerTimer);

  const offerBody = document.createElement("div");
  offerBody.className = "trade-offer-body";

  const offerEmpty = document.createElement("div");
  offerEmpty.className = "trade-offer-empty";
  offerEmpty.textContent = "Tüccar yolda...";

  const offersContainer = document.createElement("div");
  offersContainer.className = "trade-offers-container";

  offerBody.append(offerEmpty, offersContainer);

  const stats = document.createElement("div");
  stats.className = "trade-stats";

  const accepted = document.createElement("div");
  accepted.className = "trade-stat";
  const interval = document.createElement("div");
  interval.className = "trade-stat";

  stats.append(accepted, interval);

  offerCard.append(offerHead, offerBody, stats);

  section.append(offerCard);

  /* ─────────────────── Guncelleme Fonksiyonu ─────────────────── */
  function update() {
    const current = getTradeCurrent();
    const timer = getTradeTimer();
    const count = getTradeCount();

    const hasOffer = !!current && current.offers && current.offers.length > 0;

    offerEmpty.hidden = hasOffer;

    while (offersContainer.firstChild) {
      offersContainer.removeChild(offersContainer.firstChild);
    }

    if (hasOffer) {
      for (let i = 0; i < current.offers.length; i++) {
        const offer = current.offers[i];

        const row = document.createElement("div");
        row.className = "trade-offer-row";

        const getSpan = document.createElement("span");
        getSpan.className = "trade-offer-get";
        getSpan.textContent = getResourceEmoji(offer.resource) + " " + formatCount(offer.amount) + " " + getResourceName(offer.resource);

        const acceptBtn = document.createElement("button");
        acceptBtn.type = "button";
        acceptBtn.className = "trade-accept-btn";

        const affordable = getResource("altin") >= offer.cost;
        acceptBtn.classList.toggle("disabled", !affordable);
        acceptBtn.textContent = getResourceEmoji("altin") + " " + formatCount(offer.cost) + " " + getGoldLabel();

        const idx = i;
        acceptBtn.addEventListener("click", () => {
          if (!acceptTrade(idx)) {
            triggerShake(acceptBtn);
          }
        });

        row.append(getSpan, acceptBtn);
        offersContainer.appendChild(row);
      }
    }

    offerTimer.textContent = hasOffer
      ? ""
      : "Yeni teklif: " + formatDuration(timer) + " sn";

    accepted.textContent = "✅ Kabul edilen: " + count;
    interval.textContent = "Tüccar sıklığı: ~" + Math.round(state.trade.interval) + " sn";
  }

  onChange(update);
  update();

  return { section, update };
}
