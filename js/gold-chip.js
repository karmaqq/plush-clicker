/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       ALTIN ÇİP ARAYÜZÜ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  getAltin,
  getNetRate,
  getWorkerCount,
  getIndustryOutput,
  getAutoSell,
  isSellable,
  getSellPrice,
  getTotalProduction,
  onChange,
} from "./game-state.js";
import { RESOURCES } from "./resources.js";
import { formatCount, formatNumber } from "./utils.js";
import { WORKER_WAGE_SEASONAL } from "./config.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       ALTIN ÇİP OLUŞTURUCU                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Altın Çip Bileşeni ─────────────────── */

export function createGoldChip() {
  const el = document.createElement("div");
  el.className = "gold-chip";
  el.tabIndex = 0;

  const icon = document.createElement("span");
  icon.textContent = "🪙";

  const value = document.createElement("span");
  value.className = "header-stat-value";

  el.append(icon, value);

  const tooltip = document.createElement("div");
  tooltip.className = "gold-tooltip";
  tooltip.hidden = true;

  const title = document.createElement("div");
  title.className = "gold-tooltip-title";

  const wageRow = createGoldRow("İşçi maaşları");
  const industryRow = createGoldRow("Sanayi üretimi");
  const sellRow = createGoldRow("Otomatik satış");

  const divider = document.createElement("div");
  divider.className = "tt-divider";

  const netRow = createGoldRow("Net");

  tooltip.append(title, wageRow.row, industryRow.row, sellRow.row, divider, netRow.row);
  el.appendChild(tooltip);

  let active = false;

  el.addEventListener("mouseenter", () => {
    active = true;
    refresh();
  });
  el.addEventListener("mouseleave", () => {
    active = false;
    tooltip.hidden = true;
  });
  el.addEventListener("focus", () => {
    active = true;
    refresh();
  });
  el.addEventListener("blur", () => {
    active = false;
    tooltip.hidden = true;
  });

  function refresh() {
    const gold = getAltin();
    title.textContent = "🪙 Altın " + formatCount(gold);

    const workerCount = getWorkerCount();
    const seasonalWage = workerCount * WORKER_WAGE_SEASONAL;
    wageRow.value.textContent = "-" + formatNumber(seasonalWage);
    wageRow.value.style.color = "#ff8a8a";

    const industryGold = getIndustryOutput("altin");
    if (industryGold > 0) {
      industryRow.row.hidden = false;
      industryRow.value.textContent = "+" + formatNumber(industryGold) + "/s";
      industryRow.value.style.color = "#7ee2a8";
    } else {
      industryRow.row.hidden = true;
    }

    const netRate = getNetRate("altin");
    let autoSellGold = 0;
    for (const rid of Object.keys(RESOURCES)) {
      if (!isSellable(rid)) continue;
      if (!getAutoSell(rid)) continue;
      const prod = getTotalProduction(rid);
      if (prod > 0) {
        autoSellGold += prod * getSellPrice(rid);
      }
    }

    if (autoSellGold > 0.001) {
      sellRow.row.hidden = false;
      sellRow.value.textContent = "+" + formatNumber(autoSellGold) + "/s";
      sellRow.value.style.color = "#7ee2a8";
    } else {
      sellRow.row.hidden = true;
    }

    netRow.value.textContent = (netRate >= 0 ? "+" : "") + formatNumber(netRate) + "/s";
    netRow.value.style.color = netRate >= 0 ? "#7ee2a8" : "#ff8a8a";

    tooltip.hidden = false;
  }

  function update() {
    value.textContent = formatCount(getAltin());
    if (active) refresh();
  }

  onChange(update);
  update();

  return { el, update };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      ALTIN SATIR OLUŞTURUCU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Altın Tooltip Satırı ─────────────────── */

function createGoldRow(labelText) {
  const row = document.createElement("div");
  row.className = "gold-tooltip-row";

  const label = document.createElement("span");
  label.className = "tt-label";
  label.textContent = labelText;

  const value = document.createElement("span");
  value.className = "tt-value";

  row.append(label, value);
  return { row, value };
}
