/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       KAYNAK KAROSU ARAYÜZÜ                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  formatCount,
  formatNumber,
  formatDuration,
  strong,
  badge,
  resetResourceClass,
} from "./utils.js";
import { createTooltip } from "./tooltip.js";
import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA } from "./buildings.js";
import {
  getResource,
  getResourceCapacity,
  getTotalProduction,
  getResourceConsumption,
  getBuildingCount,
  getSellPrice,
  isSellable,
  getAutoSell,
  toggleAutoSell,
  sellOne,
  getNetRate,
  getSeasonMultiplier,
  getPower,
  onChange,
} from "./game-state.js";

const tooltip = createTooltip("resource-tooltip");

const tooltipLive = { id: null, capEl: null, timeEl: null, totalEl: null, consEl: null, sellEl: null, sellRow: null, seasonRow: null, seasonEl: null };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    KAYNAK KAROSU OLUŞTURUCU                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Karo Bileşeni ─────────────────── */

export function createResourceTile(id) {
  const meta = RESOURCES[id];
  const sellable = isSellable(id);

  const element = document.createElement("div");
  element.className = "resource-tile resource-" + id;
  element.hidden = true;

  const head = document.createElement("div");
  head.className = "resource-tile-head";

  const emoji = document.createElement("span");
  emoji.className = "resource-tile-emoji";
  emoji.textContent = meta.emoji;

  const name = document.createElement("span");
  name.className = "resource-tile-name";
  name.textContent = meta.name;

  const production = document.createElement("span");
  production.className = "resource-bar-production";

  head.append(emoji, name, production);

  const bar = document.createElement("div");
  bar.className = "resource-bar-track";

  const fill = document.createElement("div");
  fill.className = "resource-bar-fill";

  bar.appendChild(fill);

  const foot = document.createElement("div");
  foot.className = "resource-tile-foot";

  const capLabel = document.createElement("span");
  capLabel.className = "resource-tile-cap";

  foot.append(capLabel);

  let autoSellBtn = null;
  let sellOneBtn = null;

  if (sellable) {
    autoSellBtn = document.createElement("button");
    autoSellBtn.type = "button";
    autoSellBtn.className = "auto-sell-btn";
    autoSellBtn.textContent = "⟳";
    autoSellBtn.title = "Otomatik satış";

    autoSellBtn.addEventListener("click", () => toggleAutoSell(id));

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

    foot.append(autoSellBtn, sellOneBtn);
  }

  element.append(head, bar, foot);

  element.addEventListener("mouseenter", () => {
    buildResourceTooltip(id);
    tooltip.show(element);
  });

  element.addEventListener("mouseleave", () => {
    tooltipLive.id = null;
    tooltip.hide();
  });

  let lastCapText = null;
  let lastFillPct = null;
  let lastProdText = null;
  let lastNetNegative = null;

  function update(snapshot) {
    const current = getResource(id);
    const capacity = snapshot ? snapshot.derived[id].capacity : getResourceCapacity(id);
    const productionValue = snapshot ? snapshot.derived[id].production : getTotalProduction(id);
    const consumptionValue = snapshot ? snapshot.derived[id].consumption : getResourceConsumption(id);
    const net = productionValue - consumptionValue;

    const active = productionValue > 0 || current > 0;

    if (element.hidden === active) {
      element.hidden = !active;
    }
    if (!active) {
      lastCapText = null;
      lastFillPct = null;
      lastProdText = null;
      lastNetNegative = null;
      return;
    }

    const netNegative = consumptionValue > productionValue && (productionValue > 0 || current > 0);
    if (netNegative !== lastNetNegative) {
      lastNetNegative = netNegative;
      element.classList.toggle("net-negative", netNegative);
    }

    const capText = formatCount(current);
    if (capText !== lastCapText) {
      lastCapText = capText;
      capLabel.textContent = capText;
    }

    const pct = capacity > 0 ? (current / capacity) * 100 : 0;
    const pctClamped = Math.min(pct, 100);
    if (pctClamped !== lastFillPct) {
      lastFillPct = pctClamped;
      fill.style.width = pctClamped + "%";
      fill.style.background = getBarColor(id, pctClamped);
    }

    const prodText =
      net > 0
        ? "+" + formatNumber(net) + "/s"
        : net < 0
          ? "−" + formatNumber(-net) + "/s"
          : "";
    if (prodText !== lastProdText) {
      lastProdText = prodText;
      production.textContent = prodText;
    }

    if (sellable) {
      autoSellBtn.classList.toggle("auto-on", getAutoSell(id));
      autoSellBtn.title = getAutoSell(id) ? "Otomatik satış: AÇIK" : "Otomatik satış: KAPALI";
    }
  }

  return { element, update };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       KAYNAK BİLGİ KUTUCUĞU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function buildResourceTooltip(id) {
  const meta = RESOURCES[id];
  const sellable = isSellable(id);

  resetResourceClass(tooltip.element, id);

  tooltip.element.textContent = "";

  const title = document.createElement("div");
  title.className = "tt-title";
  title.append(meta.emoji + " ", meta.name);
  tooltip.element.appendChild(title);

  const cap = document.createElement("div");
  cap.className = "tt-cap";
  const capStrong = strong("");
  const timeEl = document.createElement("span");
  timeEl.className = "tt-time";
  timeEl.hidden = true;
  cap.append("Depo: ", capStrong, " ", timeEl);
  tooltip.element.appendChild(cap);

  const capDivider = document.createElement("div");
  capDivider.className = "tt-divider";
  tooltip.element.appendChild(capDivider);

  const seasonRow = document.createElement("div");
  seasonRow.className = "tt-row tt-season";
  seasonRow.hidden = true;
  const seasonEl = document.createElement("strong");
  seasonEl.className = "season-up";
  seasonRow.append("Mevsim: ", seasonEl);
  tooltip.element.appendChild(seasonRow);

  const buildingRows = [];
  for (const bid of Object.keys(BUILDINGS_DATA)) {
    const b = BUILDINGS_DATA[bid];
    if (b.type !== "producer" || b.outputResource !== id) continue;

    const count = getBuildingCount(bid);
    if (count <= 0) continue;

    buildingRows.push({
      b,
      count,
      total: count * b.production,
    });
  }

  if (buildingRows.length) {
    for (const r of buildingRows) {
      const row = document.createElement("div");
      row.className = "tt-row";

      row.append(badge(r.count), r.b.name + ":", strong("+" + formatNumber(r.total) + "/s"));

      tooltip.element.appendChild(row);
    }
  }

  const bonusRows = [];
  for (const bid of Object.keys(BUILDINGS_DATA)) {
    const b = BUILDINGS_DATA[bid];
    if (b.type !== "bonus" || b.targetResource !== id) continue;

    const count = getBuildingCount(bid);
    if (count <= 0) continue;

    bonusRows.push({
      b,
      count,
      info: "%" + Math.round(count * b.bonusPerLevel * 100),
    });
  }

  if (bonusRows.length) {
    for (const r of bonusRows) {
      const row = document.createElement("div");
      row.className = "tt-row";

      row.append(badge(r.count), r.b.name + " ", strong(r.info));

      tooltip.element.appendChild(row);
    }
  }

  const divider = document.createElement("div");
  divider.className = "tt-divider";
  tooltip.element.appendChild(divider);

  const sellRow = document.createElement("div");
  sellRow.className = "tt-total";
  const sellStrong = strong("");
  sellRow.append("Satış Fiyatı: ", sellStrong);
  sellRow.hidden = !sellable;
  tooltip.element.appendChild(sellRow);

  const totalRow = document.createElement("div");
  totalRow.className = "tt-total";
  const totalStrong = strong("");
  totalRow.append("Üretim: ", totalStrong);
  tooltip.element.appendChild(totalRow);

  const consRow = document.createElement("div");
  consRow.className = "tt-total";
  const consStrong = strong("");
  consRow.append("Tüketim: ", consStrong);
  tooltip.element.appendChild(consRow);

  tooltipLive.id = id;
  tooltipLive.capEl = capStrong;
  tooltipLive.timeEl = timeEl;
  tooltipLive.totalEl = totalStrong;
  tooltipLive.consEl = consStrong;
  tooltipLive.sellEl = sellStrong;
  tooltipLive.sellRow = sellRow;
  tooltipLive.seasonRow = seasonRow;
  tooltipLive.seasonEl = seasonEl;
  refreshResourceTooltip();
}

function refreshResourceTooltip(snapshot) {
  if (tooltipLive.id == null) return;

  const id = tooltipLive.id;
  const current = getResource(id);
  const capacity = snapshot ? snapshot.derived[id].capacity : getResourceCapacity(id);
  const productionValue = snapshot ? snapshot.derived[id].production : getTotalProduction(id);
  const consumptionValue = snapshot ? snapshot.derived[id].consumption : getResourceConsumption(id);

  tooltipLive.capEl.textContent = formatCount(current) + " / " + formatCount(capacity);
  tooltipLive.totalEl.textContent = "+" + formatNumber(productionValue) + "/s";
  tooltipLive.consEl.textContent = consumptionValue > 0 ? "−" + formatNumber(consumptionValue) + "/s" : "−";
  tooltipLive.sellRow.hidden = !isSellable(id);
  tooltipLive.sellEl.textContent = formatCount(getSellPrice(id)) + " 🪙";

  const seasonMult = getSeasonMultiplier(id);
  tooltipLive.seasonRow.hidden = seasonMult === 1;
  if (seasonMult !== 1) {
    const pct = (seasonMult - 1) * 100;
    tooltipLive.seasonEl.textContent = (pct >= 0 ? "+" : "−") + Math.round(Math.abs(pct)) + "%";
    tooltipLive.seasonEl.className = pct >= 0 ? "season-up" : "season-down";
  }

  const net = snapshot ? snapshot.derived[id].net : getNetRate(id);
  const remaining = capacity - current;
  if (Number.isFinite(capacity) && remaining > 0.5 && net > 0.0001) {
    tooltipLive.timeEl.textContent = formatDuration(remaining / net);
    tooltipLive.timeEl.hidden = false;
  } else {
    tooltipLive.timeEl.hidden = true;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       YARDIMCI FONKSİYONLAR                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getBarColor(id, pct) {
  const meta = RESOURCES[id];
  if (pct >= 85) return "linear-gradient(90deg, #8f2d2d, #ff5a5a)";
  return "linear-gradient(90deg, " + meta.colorDark + ", " + meta.colorBright + ")";
}
