/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       TİCARET BÖLÜMÜ ARAYÜZÜ                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { formatCount, formatDuration, triggerShake } from "./utils.js";
import { RESOURCES } from "./resources.js";
import {
  getResource,
  getTradeCurrent,
  getTradeTimer,
  getTradeCount,
  getTradeInterval,
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

  const offerRow = document.createElement("div");
  offerRow.className = "trade-offer-row";
  offerRow.hidden = true;

  const getSpan = document.createElement("span");
  getSpan.className = "trade-offer-get";

  offerRow.append(getSpan);

  const acceptBtn = document.createElement("button");
  acceptBtn.type = "button";
  acceptBtn.className = "trade-accept-btn";

  acceptBtn.addEventListener("click", () => {
    if (!acceptTrade()) {
      triggerShake(acceptBtn);
    }
  });

  offerBody.append(offerEmpty, offerRow, acceptBtn);

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

    const hasOffer = !!current;

    offerEmpty.hidden = hasOffer;
    offerRow.hidden = !hasOffer;
    acceptBtn.hidden = !hasOffer;

    if (hasOffer) {
      const meta = RESOURCES[current.get.resource];
      getSpan.textContent = meta.emoji + " " + formatCount(current.get.amount) + " " + meta.name;
      const affordable = getResource("altin") >= current.cost;
      acceptBtn.classList.toggle("disabled", !affordable);
      acceptBtn.textContent = RESOURCES.altin.emoji + " " + formatCount(current.cost) + " Altın";
    }

    offerTimer.textContent = hasOffer
      ? "Sonraki teklif: " + formatDuration(timer) + " sn"
      : "Yeni teklif: " + formatDuration(timer) + " sn";

    accepted.textContent = "✅ Kabul edilen: " + count;
    interval.textContent = "Tüccar sıklığı: ~" + Math.round(getTradeInterval()) + " sn";
  }

  onChange(update);
  update();

  return { section, update };
}
