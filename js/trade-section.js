/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       TİCARET BÖLÜMÜ ARAYÜZÜ                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { formatCount, formatDuration, triggerShake } from "./utils.js";
import {
  state,
  getResource,
  getTradeCurrent,
  getTradeTimer,
  getTradeCount,
  getResourceName,
  getResourceEmoji,
  getGoldLabel,
  acceptTrade,
  onChange,
} from "./game-state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    TİCARET BÖLÜMÜ OLUŞTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Ticaret Bölümü Bileşeni ─────────────────── */

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
  offerEmpty.textContent = "Tüccar yolda…";

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
