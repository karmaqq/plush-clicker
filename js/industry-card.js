/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SANAYİ KARTI ARAYÜZÜ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  canAfford,
  formatCount,
  formatNumber,
  createLockOverlay,
  triggerShake,
  getBadgeTier,
} from "./utils.js";
import { createTooltip, createCostRows, refreshCostRows } from "./tooltip.js";
import { INDUSTRY_DATA } from "./industry.js";
import {
  getResource,
  getNetRate,
  getUnlock,
  fillUnlockDesc,
  getUnlockType,
  isNearUnlock,
  getIndustry,
  getIndustryBuilt,
  getIndustryWorkers,
  getIndustryLevel,
  getIndustryMaxWorkers,
  getIndustryLevelMultiplier,
  getIndustryCost,
  buildIndustry,
  getIndustryUpgradeCost,
  upgradeIndustry,
  addWorker,
  removeWorker,
  getWorkerCost,
  getWorkerCount,
  getPopulationAlive,
  getResourceEmoji,
  onChange,
} from "./game-state.js";

export const industryTooltip = createTooltip("industry-tooltip");

const tooltipLive = { id: null, rows: [] };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SANAYİ KART OLUŞTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sanayi Kart Bileşeni ─────────────────── */

export function createIndustryCard(id, data) {
  const outputResource = Object.keys(data.output)[0];

  const card = document.createElement("div");
  card.className = "industry-card resource-" + outputResource;

  const lockOverlay = createLockOverlay();

  const head = document.createElement("div");
  head.className = "upgrade-head";

  const name = document.createElement("div");
  name.className = "upgrade-name";
  name.textContent = data.emoji + " " + data.name;

  const levelLabel = document.createElement("span");
  levelLabel.className = "badge building-badge";
  levelLabel.textContent = "0";

  head.append(name);

  const desc = document.createElement("div");
  desc.className = "upgrade-desc";
  desc.textContent = data.description;

  const flow = document.createElement("div");
  flow.className = "industry-flow";

  const inputRow = document.createElement("div");
  inputRow.className = "industry-flow-row";
  const inputLabel = document.createElement("span");
  inputLabel.className = "industry-flow-label";
  inputLabel.textContent = "Girdi:";
  const inputValue = document.createElement("span");
  inputValue.className = "industry-flow-value input-value";
  inputRow.append(inputLabel, inputValue);

  const outputRow = document.createElement("div");
  outputRow.className = "industry-flow-row";
  const outputLabel = document.createElement("span");
  outputLabel.className = "industry-flow-label";
  outputLabel.textContent = "Çıktı:";
  const outputValue = document.createElement("span");
  outputValue.className = "industry-flow-value output-value";
  outputRow.append(outputLabel, outputValue);

  flow.append(inputRow, outputRow);

  const warning = document.createElement("div");
  warning.className = "industry-warning";
  warning.hidden = true;

  const buildBtn = document.createElement("button");
  buildBtn.type = "button";
  buildBtn.className = "industry-build-btn";

  const costSpans = {};
  for (const resource of Object.keys(data.baseCost)) {
    const span = document.createElement("span");
    span.className = "industry-cost";
    buildBtn.appendChild(span);
    costSpans[resource] = span;
  }

  const buildText = document.createElement("span");
  buildText.className = "industry-build-text";
  buildText.textContent = "İnşa Et";
  buildBtn.appendChild(buildText);

  buildBtn.addEventListener("click", () => {
    if (getUnlock(data) && !buildIndustry(id)) {
      triggerShake(buildBtn);
    }
  });

  const buildRow = document.createElement("div");
  buildRow.className = "industry-build-row";

  const upgradeBtn = document.createElement("button");
  upgradeBtn.type = "button";
  upgradeBtn.className = "industry-build-btn";
  upgradeBtn.hidden = true;

  const upgradeCostSpans = {};
  for (const resource of Object.keys(data.baseCost)) {
    const span = document.createElement("span");
    span.className = "industry-cost";
    upgradeBtn.appendChild(span);
    upgradeCostSpans[resource] = span;
  }

  const maxText = document.createElement("span");
  maxText.className = "industry-build-text";
  maxText.hidden = true;
  upgradeBtn.appendChild(maxText);

  upgradeBtn.addEventListener("click", () => {
    if (!upgradeIndustry(id)) {
      triggerShake(upgradeBtn);
    }
  });

  buildRow.append(buildBtn, upgradeBtn, levelLabel);

  const controls = document.createElement("div");
  controls.className = "industry-controls";

  const minusBtn = document.createElement("button");
  minusBtn.type = "button";
  minusBtn.className = "worker-btn worker-minus";
  minusBtn.textContent = "−";

  const workerCount = document.createElement("span");
  workerCount.className = "worker-count";
  workerCount.textContent = "0/" + getIndustryMaxWorkers(id);

  const plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.className = "worker-btn worker-plus";
  plusBtn.textContent = "+";

  minusBtn.addEventListener("click", () => removeWorker(id));

  plusBtn.addEventListener("click", () => {
    if (!addWorker(id)) {
      triggerShake(plusBtn);
    }
  });

  controls.append(minusBtn, workerCount, plusBtn);

  head.append(controls);
  card.append(head, desc, flow, warning, buildRow, lockOverlay.element);

  let tooltipActive = false;

  card.addEventListener("mouseenter", () => {
    tooltipActive = true;
    buildIndustryTooltip(id);
    industryTooltip.show(card);
  });

  card.addEventListener("mouseleave", () => {
    tooltipActive = false;
    industryTooltip.hide();
  });

  function update() {
    const unlocked = getUnlock(data);
    card.classList.toggle("locked", !unlocked);

    if (!unlocked) {
      if (!isNearUnlock(data)) {
        if (!card.hidden) card.hidden = true;
        return;
      }
      card.hidden = false;
      lockOverlay.lockName.textContent = data.name;
      const unlockType = getUnlockType(data);
      fillUnlockDesc(lockOverlay.lockDesc, data);
      lockOverlay.lockDesc.classList.toggle("lock-req-building", unlockType === "building");
      lockOverlay.lockDesc.classList.toggle("lock-req-industry", unlockType === "industry");
      buildBtn.hidden = true;
      controls.hidden = true;
      flow.hidden = true;
      warning.hidden = true;
      return;
    }

    card.hidden = false;
    const built = getIndustryBuilt(id);
    card.classList.toggle("built", built);

    const workers = getIndustryWorkers(id);
    const entry = getIndustry(id);

    if (!built) {
      const cost = getIndustryCost(id);

      for (const [resource, span] of Object.entries(costSpans)) {
        const amount = cost[resource];
        const enough = getResource(resource) >= amount;
        span.textContent = getResourceEmoji(resource) + " " + formatCount(amount);
        span.classList.toggle("cost-ok", enough);
        span.classList.toggle("cost-missing", !enough);
      }

      levelLabel.textContent = "0";
      levelLabel.className = "badge building-badge badge-tier-0 badge-empty";
      buildBtn.hidden = false;
      upgradeBtn.hidden = true;
      buildBtn.classList.toggle("disabled", !canAfford(cost, getResource));
      controls.hidden = true;
      flow.hidden = true;
      warning.hidden = true;

      if (tooltipActive) refreshIndustryTooltip();
      return;
    }

    const level = getIndustryLevel(id);
    const maxWorkers = getIndustryMaxWorkers(id);
    const levelMult = getIndustryLevelMultiplier(id);

    buildBtn.hidden = true;
    upgradeBtn.hidden = false;

    const upgradeCost = getIndustryUpgradeCost(id);
    if (upgradeCost === null) {
      upgradeBtn.hidden = false;
      upgradeBtn.disabled = true;
      for (const span of Object.values(upgradeCostSpans)) {
        span.textContent = "";
      }
      maxText.textContent = data.name + " En Yüksek Seviyede";
      maxText.hidden = false;
    } else {
      upgradeBtn.hidden = false;
      upgradeBtn.disabled = false;
      maxText.hidden = true;
      for (const [resource, span] of Object.entries(upgradeCostSpans)) {
        const amount = upgradeCost[resource];
        const enough = getResource(resource) >= amount;
        span.textContent = getResourceEmoji(resource) + " " + formatCount(amount);
        span.classList.toggle("cost-ok", enough);
        span.classList.toggle("cost-missing", !enough);
      }
    }

    controls.hidden = false;
    flow.hidden = false;

    levelLabel.textContent = String(level);
    levelLabel.className = "badge building-badge badge-tier-" + getBadgeTier(level);
    workerCount.textContent = workers + "/" + maxWorkers;

    const inputParts = [];
    for (const [resource, rate] of Object.entries(data.input)) {
      const amount = workers * rate * levelMult;
      inputParts.push(getResourceEmoji(resource) + " -" + formatNumber(amount) + "/s");
    }
    inputValue.textContent = inputParts.join("  ");
    inputValue.classList.toggle("idle", workers === 0);

    const outputParts = [];
    for (const [resource, rate] of Object.entries(data.output)) {
      const amount = workers * rate * levelMult;
      outputParts.push(getResourceEmoji(resource) + " +" + formatNumber(amount) + "/s");
    }
    outputValue.textContent = outputParts.join("  ");
    outputValue.classList.toggle("idle", workers === 0);

    if (entry.stalled) {
      warning.textContent = "⚠️ Yetersiz girdi";
      warning.hidden = false;
    } else if (entry.outputFull) {
      warning.textContent = "⚠️ Depo dolu";
      warning.hidden = false;
    } else {
      warning.hidden = true;
    }

    minusBtn.disabled = workers <= 0;
    plusBtn.disabled = workers >= maxWorkers || getWorkerCount() >= getPopulationAlive();

    const workerCost = getWorkerCost(id);
    if (workerCost) {
      const costParts = [];
      for (const [resource, amount] of Object.entries(workerCost)) {
        costParts.push(getResourceEmoji(resource) + " " + formatCount(amount));
      }
      plusBtn.title = "İşçi ekle (" + costParts.join(", ") + ")";
    }

    if (tooltipActive) {
      refreshIndustryTooltip();
    }
  }

  onChange(update);
  update();

  return card;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        SANAYİ BİLGİ KUTUCUĞU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function buildIndustryTooltip(id) {
  const data = INDUSTRY_DATA[id];
  const cost = getIndustryCost(id);

  resetIndustryTooltipClass(id);

  industryTooltip.element.textContent = "";

  const title = document.createElement("div");
  title.className = "tooltip-title";
  title.textContent = data.emoji + " " + data.name;
  industryTooltip.element.appendChild(title);

  const effect = document.createElement("div");
  effect.className = "tooltip-effect";

  const effectLine = document.createElement("div");
  effectLine.className = "tooltip-effect-line";

  const effectLabel = document.createElement("span");
  effectLabel.className = "effect-label";
  effectLabel.textContent = "Üretim:";

  const effectValue = document.createElement("span");
  effectValue.className = "effect-value";
  effectValue.textContent = Object.entries(data.output)
    .map(([r, rate]) => getResourceEmoji(r) + " +" + formatNumber(rate) + "/s · işçi")
    .join("  ");

  effectLine.append(effectLabel, " ", effectValue);
  effect.appendChild(effectLine);
  industryTooltip.element.appendChild(effect);

  const costDivider = document.createElement("div");
  costDivider.className = "tt-divider";
  industryTooltip.element.appendChild(costDivider);

  const costs = document.createElement("div");
  costs.className = "tooltip-costs";

  tooltipLive.id = id;
  tooltipLive.rows = createCostRows(costs, cost);

  industryTooltip.element.appendChild(costs);
  refreshIndustryTooltip();
}

function refreshIndustryTooltip() {
  if (tooltipLive.id == null) return;

  const id = tooltipLive.id;
  const cost = getIndustryCost(id);

  refreshCostRows(tooltipLive.rows, cost, getResource, getNetRate);
}

function resetIndustryTooltipClass(id) {
  const outId = Object.keys(INDUSTRY_DATA[id].output)[0];
  industryTooltip.element.className = "tooltip industry-tooltip resource-" + outId;
}
