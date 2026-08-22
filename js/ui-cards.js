/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          KART ARAYUZLERI                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  getBadgeTier,
  badge,
  canAfford,
  formatCount,
  formatNumber,
  createNumberCounter,
  createLockOverlay,
  triggerShake,
  resetResourceClass,
} from "./utils.js";
import { createTooltip, createCostRows, refreshCostRows } from "./tooltip.js";
import {
  BUILDINGS_DATA,
  ALL_BUILDINGS_DATA,
  INDUSTRY_DATA,
  PACKS_DATA,
  RESOURCES,
  AUTO_SELL_STEP_PCT,
} from "./game-data.js";
import {
  state,
  getBuildingCount,
  getBuildingCost,
  getBuildingProduction,
  getBuildingBonus,
  getBuildingPackMultiplier,
  getCapacityBonus,
  getOutputMultiplier,
  getSeasonMultiplier,
  getIndustryPackMultiplier,
  getWorkerMultiplier,
  getResource,
  getPackCount,
  getTotalProduction,
  getNetRate,
  getUnlock,
  fillUnlockDesc,
  getUnlockType,
  isNearUnlock,
  buyBuilding,
  getIndustry,
  getIndustryBuilt,
  getIndustryWorkers,
  getIndustryLevel,
  getIndustryMaxWorkers,
  getIndustryLevelMultiplier,
  getIndustryOutputById,
  getIndustryCost,
  buildIndustry,
  getIndustryUpgradeCost,
  upgradeIndustry,
  addWorker,
  removeWorker,
  getWorkerCost,
  getWorkerCount,
  getPopulationAlive,
  getPackCost,
  buyPack,
  getAutoSellPct,
  setAutoSellPct,
  getAutoSellLimit,
  UNLOCK_STRATEGIES,
  onChange,
} from "./game-core.js";
import { getBuildingName as getEraBuildingName, getBuildingEmoji as getEraBuildingEmoji, getResourceEmoji as getEraResourceEmoji, getResourceName as getEraResourceName, getPackName as getEraPackName, getGoldLabel } from "./era.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         BINA KARTI ARAYUZU                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const tooltip = createTooltip("building-tooltip");

const tooltipLive = { id: null, rows: [], effectValue: null, seviyeEl: null, bonusTotalEl: null, countEl: null };

/* ─────────────────── Bina Kart Bileseni ─────────────────── */
export function createBuildingCard(id, data) {
  const isHousing = data.type === "housing";
  const isStorage = data.type === "storage";
  const isCapacityBonus = data.type === "capacityBonus";
  const isBonus = data.type === "bonus";
  const resourceId =
    isHousing || isStorage || isCapacityBonus || isBonus
      ? null
      : data.outputResource || data.targetResource;
  const hlResourceId =
    isHousing || isStorage || isCapacityBonus
      ? null
      : data.outputResource || data.targetResource;

  const card = document.createElement("div");
  card.className =
    "building-card " +
    (isHousing
      ? "building-housing"
      : isStorage
        ? "building-storage"
        : isCapacityBonus
          ? "building-capacity-bonus"
          : isBonus
            ? "building-special-bonus"
            : "resource-" + resourceId) +
    (isBonus || isCapacityBonus ? " building-bonus" : "");
  if (hlResourceId) {
    card.dataset.hlOut = hlResourceId;
    if (!isBonus) card.dataset.hlRel = hlResourceId;
  } else {
    card.dataset.hlCost = "building:" + id;
    if (isHousing) {
      card.dataset.hlWithPop = "1";
      card.dataset.hlTargetHousing = "1";
    }
  }

  card.addEventListener("click", () => {
    if ((getUnlock(data) || getBuildingCount(id) > 0) && !buyBuilding(id)) {
      triggerShake(card);
    }
  });

  const lockOverlay = createLockOverlay();

  let tooltipActive = false;

  card.addEventListener("mouseenter", () => {
    if (!getUnlock(data) && getBuildingCount(id) === 0) {
      buildLockedTooltip(id, data);
      tooltip.show(card);
      return;
    }
    tooltipActive = true;
    buildBuildingTooltip(id, data);
    tooltip.show(card);
  });

  card.addEventListener("mouseleave", () => {
    tooltipActive = false;
    tooltip.hide();
  });

  const name = document.createElement("div");
  name.className = "building-name";
  const emojiEl = document.createElement("span");
  emojiEl.className = "building-card-emoji";
  if (isHousing) emojiEl.textContent = "👥";
  else if (isStorage) emojiEl.textContent = "📦";
  else if (isCapacityBonus) emojiEl.textContent = "📦";
  else if (isBonus) emojiEl.textContent = getEraBuildingEmoji(id);
  else emojiEl.textContent = getEraResourceEmoji(resourceId);
  const nameTextEl = buildingNameText();
  name.append(emojiEl, nameTextEl);

  const badgeRow = document.createElement("div");
  badgeRow.className = "building-badge-row";

  const badgeEl = document.createElement("span");
  badgeEl.className = "badge building-badge";
  badgeRow.appendChild(badgeEl);

  const rate = document.createElement("div");
  rate.className = "building-rate";
  const rateCounter = createNumberCounter();

  if (isHousing) {
    rate.append(rateCounter.span);
  } else if (isStorage) {
    const rateLabel = document.createElement("span");
    rateLabel.className = "num-display";
    rateLabel.textContent = "Kapasite";
    rate.append(rateLabel);
  } else if (isCapacityBonus) {
    rate.append(rateCounter.span);
  } else if (isBonus) {
    rate.append(rateCounter.span);
  } else {
    const plus = document.createElement("span");
    plus.className = "building-rate-plus";
    plus.textContent = "+";
    const rateSuffix = document.createElement("span");
    rateSuffix.className = "building-rate-suffix";
    rateSuffix.textContent = "/s";
    rateCounter.span.classList.add("rate-producer");
    rate.append(plus, rateCounter.span, rateSuffix);
  }

  card.append(name, rate, badgeRow, lockOverlay.element);

  let lastOwned = null;
  let lastEra = null;
  let cost = null;

  function update() {
    const ownedAny = getBuildingCount(id) > 0;
    const unlocked = getUnlock(data);
    card.classList.toggle("locked", !unlocked && !ownedAny);

    const currentEra = state.era.current;
    const eraChanged = currentEra !== lastEra;
    if (eraChanged) {
      lastEra = currentEra;
      card.classList.remove("demolished");
    }

    if (!unlocked && !ownedAny) {
      if (!isNearUnlock(data)) {
        if (!card.hidden) card.hidden = true;
        return;
      }
      card.hidden = false;
      lockOverlay.lockName.textContent = getEraBuildingName(id);
      const unlockType = getUnlockType(data);
      fillUnlockDesc(lockOverlay.lockDesc, data);
      lockOverlay.lockDesc.classList.toggle("lock-req-building", unlockType === "building");
      lockOverlay.lockDesc.classList.toggle("lock-req-pack", unlockType === "pack");
      nameTextEl.textContent = "";
      rate.hidden = true;
      lastOwned = null;
      badgeEl.textContent = "0";
      badgeEl.className = "badge building-badge badge-tier-0 badge-empty";
      return;
    }

    card.hidden = false;
    rate.hidden = false;

    const owned = getBuildingCount(id);

    if (owned !== lastOwned || eraChanged) {
      lastOwned = owned;
      cost = getBuildingCost(id);
      nameTextEl.textContent = getEraBuildingName(id);
      badgeEl.textContent = String(owned);
      badgeEl.className =
        "badge building-badge badge-tier-" +
        getBadgeTier(owned) +
        (owned === 0 ? " badge-empty" : "");
    }

    if (isHousing) {
      const housingText = "+" + formatCount(data.housingCapacity);
      if (rateCounter.span.textContent !== housingText) {
        rateCounter.span.textContent = housingText;
      }
    } else if (isCapacityBonus) {
      const capBonusText = "%" + formatCount(getCapacityBonus(id));
      if (rateCounter.span.textContent !== capBonusText) {
        rateCounter.span.textContent = capBonusText;
      }
    } else if (isBonus) {
      const bonusText = "%" + formatCount(getBuildingBonus(id));
      if (rateCounter.span.textContent !== bonusText) {
        rateCounter.span.textContent = bonusText;
      }
    } else {
      rateCounter.update(getBuildingProduction(id) * getSeasonMultiplier(data.outputResource));
    }

    card.classList.toggle("affordable", canAfford(cost, getResource));

    if (tooltipActive) {
      refreshBuildingTooltip();
    }
  }

  onChange(update);
  update();

  function demolish() {
    return new Promise((resolve) => {
      if (card.classList.contains("demolished")) { resolve(); return; }
      card.classList.add("demolishing");
      card.addEventListener("animationend", () => {
        card.classList.remove("demolishing");
        card.classList.add("demolished");
        resolve();
      }, { once: true });
    });
  }

  return { element: card, demolish };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        BINA BILGI KUTUCUGU                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function buildLockedTooltip(id, data) {
  resetResourceClass(tooltip.element, "power");
  tooltip.element.textContent = "";
  const title = document.createElement("div");
  title.className = "tooltip-title";
  title.textContent = getEraBuildingName(id);
  tooltip.element.appendChild(title);
  const lockedLabel = document.createElement("div");
  lockedLabel.className = "tooltip-effect";
  const lockedLine = document.createElement("div");
  lockedLine.className = "tooltip-effect-line";
  const lockedText = document.createElement("span");
  lockedText.className = "effect-label";
  lockedText.textContent = " Kilitli";
  lockedLine.appendChild(lockedText);
  lockedLabel.appendChild(lockedLine);
  tooltip.element.appendChild(lockedLabel);
  const divider = document.createElement("div");
  divider.className = "tt-divider";
  tooltip.element.appendChild(divider);
  const reqSection = document.createElement("div");
  reqSection.className = "tooltip-effect";
  const reqTitle = document.createElement("div");
  reqTitle.className = "tooltip-effect-line";
  const reqLabel = document.createElement("span");
  reqLabel.className = "effect-label";
  reqLabel.textContent = "Koşul:";
  reqTitle.appendChild(reqLabel);
  reqSection.appendChild(reqTitle);
  const unlock = data.unlock;
  if (unlock) {
    if (unlock.type === "all" && unlock.conditions) {
      for (const cond of unlock.conditions) {
        const strategy = UNLOCK_STRATEGIES[cond.type];
        if (!strategy) continue;
        const met = strategy.isMet(cond);
        const name = strategy.target(cond);
        const progress = strategy.progress(cond);
        const condLine = document.createElement("div");
        condLine.className = "tooltip-effect-line";
        const condName = document.createElement("span");
        condName.className = "lock-cond-name";
        condName.textContent = name + " ";
        const condProg = document.createElement("span");
        condProg.className = met ? "lock-cond met" : "lock-cond unmet";
        condProg.textContent = "(" + progress + ")";
        condLine.append(condName, condProg);
        reqSection.appendChild(condLine);
      }
    } else {
      const strategy = UNLOCK_STRATEGIES[unlock.type];
      if (strategy) {
        const met = strategy.isMet(unlock);
        const name = strategy.target(unlock);
        const progress = strategy.progress(unlock);
        const condLine = document.createElement("div");
        condLine.className = "tooltip-effect-line";
        const condName = document.createElement("span");
        condName.className = "lock-cond-name";
        condName.textContent = name + " ";
        const condProg = document.createElement("span");
        condProg.className = met ? "lock-cond met" : "lock-cond unmet";
        condProg.textContent = "(" + progress + ")";
        condLine.append(condName, condProg);
        reqSection.appendChild(condLine);
      }
    }
  }
  tooltip.element.appendChild(reqSection);
}

export function buildBuildingTooltip(id, data) {
  const cost = getBuildingCost(id);
  const isStorage = data.type === "storage";
  const isCapacityBonus = data.type === "capacityBonus";
  const isBonus = data.type === "bonus";
  const isHousing = data.type === "housing";
  const resourceId =
    isHousing || isStorage || isCapacityBonus || isBonus
      ? null
      : data.outputResource || data.targetResource;
  const output = isHousing || isBonus ? null : RESOURCES[resourceId];

  resetResourceClass(tooltip.element, isHousing || isStorage || isCapacityBonus || isBonus ? "power" : resourceId);
  tooltipLive.countEl = null;
  tooltip.element.textContent = "";
  const title = document.createElement("div");
  title.className = "tooltip-title";
  if (isHousing) {
    const countBadge = badge(getBuildingCount(id));
    tooltipLive.countEl = countBadge;
    title.append(countBadge, " ", getEraBuildingName(id));
  } else {
    title.textContent = getEraBuildingName(id);
  }
  tooltip.element.appendChild(title);
  const effect = document.createElement("div");
  effect.className = "tooltip-effect";
  const effectLine = document.createElement("div");
  effectLine.className = "tooltip-effect-line";
  const effectLabel = document.createElement("span");
  effectLabel.className = "effect-label";

  if (isHousing) {
    effectLabel.textContent = "Nüfus Kapasitesi:";
    const value = document.createElement("span");
    value.className = "effect-value";
    value.append("+", String(data.housingCapacity), " ");
    effectLine.append(effectLabel, " ", value);
    effect.appendChild(effectLine);
  } else if (isStorage) {
    effectLabel.textContent = "Kapasite Katkısı:";
    const value = document.createElement("span");
    value.className = "effect-value";
    value.textContent = "Tüm kaynaklara";
    effectLine.append(effectLabel, " ", value);
    effect.appendChild(effectLine);
    const capGrid = document.createElement("div");
    capGrid.className = "storage-cap-grid";
    for (const rid of Object.keys(RESOURCES)) {
      const per = RESOURCES[rid].storagePerDepo;
      if (!per) continue;
      if (getTotalProduction(rid) <= 0) continue;
      const item = document.createElement("span");
      item.className = "storage-cap-item";
      item.textContent = getEraResourceEmoji(rid) + " +" + per;
      capGrid.appendChild(item);
    }
    effect.appendChild(capGrid);
  } else if (isCapacityBonus) {
    effectLabel.textContent = "Kapasite bonusu:";
    const value = document.createElement("span");
    value.className = "effect-value";
    value.textContent = "+%" + Math.round(data.capacityBonusPerLevel * 100) + " / seviye";
    effectLine.append(effectLabel, " ", value);
    effect.appendChild(effectLine);
    const capGrid = document.createElement("div");
    capGrid.className = "storage-cap-grid";
    for (const rid of Object.keys(RESOURCES)) {
      const per = RESOURCES[rid].storagePerAmbar;
      if (!per) continue;
      if (getTotalProduction(rid) <= 0) continue;
      const item = document.createElement("span");
      item.className = "storage-cap-item";
      item.textContent = getEraResourceEmoji(rid) + " +" + per;
      capGrid.appendChild(item);
    }
    effect.appendChild(capGrid);
  } else if (isBonus) {
    effectLabel.textContent = getEraResourceName(data.targetResource) + " Bonusu:";
    const prodValue = document.createElement("span");
    prodValue.className = "effect-value";
    prodValue.append("%", formatCount(getBuildingBonus(id)));
    effectLine.append(effectLabel, " ", prodValue);
    effect.appendChild(effectLine);
    const seviyeLine = document.createElement("div");
    seviyeLine.className = "tooltip-effect-line";
    const seviyeLabel = document.createElement("span");
    seviyeLabel.className = "effect-label";
    seviyeLabel.textContent = "Seviye:";
    const seviyeValue = document.createElement("span");
    seviyeValue.className = "effect-value";
    seviyeValue.append("%", formatCount(data.bonusPerLevel * 100));
    seviyeLine.append(seviyeLabel, " ", seviyeValue);
    effect.appendChild(seviyeLine);
    tooltipLive.bonusTotalEl = prodValue;
  } else {
    const seasonMult = getSeasonMultiplier(data.outputResource);
    const packMult = getBuildingPackMultiplier();
    const outputMult = getOutputMultiplier(data.outputResource) * packMult;
    effectLabel.textContent = getEraResourceName(data.outputResource) + " Üretimi:";
    const prodValue = document.createElement("span");
    prodValue.className = "effect-value";
    prodValue.append("+", formatNumber(getBuildingProduction(id) * seasonMult), "/s");
    effectLine.append(effectLabel, " ", prodValue);
    effect.appendChild(effectLine);
    const seviyeLine = document.createElement("div");
    seviyeLine.className = "tooltip-effect-line";
    const seviyeLabel = document.createElement("span");
    seviyeLabel.className = "effect-label";
    seviyeLabel.textContent = "Seviye:";
    const seviyeValue = document.createElement("span");
    seviyeValue.className = "effect-value";
    seviyeValue.append("+", formatNumber(data.production * outputMult * seasonMult), "/s");
    seviyeLine.append(seviyeLabel, " ", seviyeValue);
    effect.appendChild(seviyeLine);
    const bonusSources = getBonusSources(data.outputResource);
    if (bonusSources.length > 0) {
      const bonusDivider = document.createElement("div");
      bonusDivider.className = "tt-divider";
      effect.appendChild(bonusDivider);
      for (const src of bonusSources) {
        const bonusLine = document.createElement("div");
        bonusLine.className = "tooltip-effect-line";
        const bonusLabel = document.createElement("span");
        bonusLabel.className = "effect-label";
        bonusLabel.textContent = src.emoji + " " + src.name;
        const bonusValue = document.createElement("span");
        bonusValue.className = "effect-value";
        bonusValue.textContent = "%" + src.value;
        bonusLine.append(bonusLabel, " ", bonusValue);
        effect.appendChild(bonusLine);
      }
    }
    tooltipLive.effectValue = prodValue;
    tooltipLive.seviyeEl = seviyeValue;
  }

  tooltip.element.appendChild(effect);
  const costDivider = document.createElement("div");
  costDivider.className = "tt-divider";
  tooltip.element.appendChild(costDivider);
  const costs = document.createElement("div");
  costs.className = "tooltip-costs";
  tooltipLive.id = id;
  tooltipLive.rows = createCostRows(costs, cost);
  tooltip.element.appendChild(costs);
  refreshBuildingTooltip();
}

export function refreshBuildingTooltip() {
  if (tooltipLive.id == null) return;
  const id = tooltipLive.id;
  const data = ALL_BUILDINGS_DATA[id];
  const cost = getBuildingCost(id);
  if (tooltipLive.effectValue) {
    const seasonMult = getSeasonMultiplier(data.outputResource);
    const outputMult = getOutputMultiplier(data.outputResource) * getBuildingPackMultiplier();
    tooltipLive.effectValue.textContent = "";
    tooltipLive.effectValue.append("+", formatNumber(getBuildingProduction(id) * seasonMult), "/s");
    if (tooltipLive.seviyeEl) {
      tooltipLive.seviyeEl.textContent = "";
      tooltipLive.seviyeEl.append("+", formatNumber(data.production * outputMult * seasonMult), "/s");
    }
  }
  if (tooltipLive.bonusTotalEl) {
    tooltipLive.bonusTotalEl.textContent = "";
    tooltipLive.bonusTotalEl.append("%", formatCount(getBuildingBonus(id)));
  }
  if (tooltipLive.countEl) {
    const owned = getBuildingCount(id);
    tooltipLive.countEl.textContent = String(owned);
    tooltipLive.countEl.className = "badge tt-badge badge-tier-" + getBadgeTier(owned);
  }
  refreshCostRows(tooltipLive.rows, cost, getResource, getNetRate);
}

/* ─────────────────── Yardimci Fonksiyonlar ─────────────────── */
function buildingNameText() {
  const span = document.createElement("span");
  span.className = "building-name-text";
  return span;
}

function getBonusSources(resourceId) {
  const sources = [];
  for (const bid of Object.keys(BUILDINGS_DATA)) {
    const b = BUILDINGS_DATA[bid];
    if (b.type !== "bonus" || b.targetResource !== resourceId) continue;
    const count = getBuildingCount(bid);
    if (count <= 0) continue;
    sources.push({ name: getEraBuildingName(bid), value: Math.round(count * b.bonusPerLevel * 100), emoji: getEraBuildingEmoji(bid) });
  }
  for (const pid of Object.keys(PACKS_DATA)) {
    const p = PACKS_DATA[pid];
    const count = getPackCount(pid);
    if (count <= 0) continue;
    let bonusPerLevel = 0;
    if (p.productionBonusPerLevel) bonusPerLevel += p.productionBonusPerLevel;
    if (resourceId === "power" && p.powerBonusPerLevel) bonusPerLevel += p.powerBonusPerLevel;
    if (bonusPerLevel <= 0) continue;
    sources.push({ name: getEraPackName(pid), value: Math.round(count * bonusPerLevel * 100), emoji: p.emoji });
  }
  return sources;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SANAYI KARTI ARAYUZU                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const industryTooltip = createTooltip("industry-tooltip");

const industryTooltipLive = {
  id: null,
  rows: [],
  totalOutEl: null,
  perWorkerEl: null,
  inEl: null,
  inRowEl: null,
  workerEl: null,
  bonusDividerEl: null,
  bonusListEl: null,
  warnEl: null,
  costsEl: null,
  costDividerEl: null,
};

/* ─────────────────── Sanayi Kart Bileseni ─────────────────── */
export function createIndustryCard(id, data) {
  const outputResource = Object.keys(data.output)[0];
  const industryResIds = [...Object.keys(data.input), ...Object.keys(data.output)].join(" ");
  const card = document.createElement("div");
  card.className = "industry-card resource-" + outputResource;
  card.dataset.hlIn = Object.keys(data.input).join(" ");
  card.dataset.hlOut = Object.keys(data.output).join(" ");
  card.dataset.hlRel = industryResIds;
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
  buildBtn.dataset.hlCost = "industry:" + id;
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
    if (getUnlock(data) && !buildIndustry(id)) { triggerShake(buildBtn); }
  });
  const buildRow = document.createElement("div");
  buildRow.className = "industry-build-row";
  const upgradeBtn = document.createElement("button");
  upgradeBtn.type = "button";
  upgradeBtn.className = "industry-build-btn";
  upgradeBtn.hidden = true;
  upgradeBtn.dataset.hlCost = "industryUpgrade:" + id;
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
    if (!upgradeIndustry(id)) { triggerShake(upgradeBtn); }
  });
  const autoSellSupported = Number.isFinite(RESOURCES[outputResource].baseCapacity);
  const autoSellBtn = document.createElement("button");
  autoSellBtn.type = "button";
  autoSellBtn.className = "autosell-btn";
  autoSellBtn.hidden = true;
  const autosellMenu = document.createElement("div");
  autosellMenu.className = "autosell-menu";
  autosellMenu.hidden = true;
  document.body.appendChild(autosellMenu);
  function buildAutosellMenu() {
    autosellMenu.textContent = "";
    const limit = getAutoSellLimit();
    const currentPct = getAutoSellPct(outputResource);
    const title = document.createElement("div");
    title.className = "autosell-title";
    title.textContent = "Otomatik Satış";
    autosellMenu.appendChild(title);
    const divider = document.createElement("div");
    divider.className = "autosell-divider";
    autosellMenu.appendChild(divider);
    const options = [{ pct: 0, label: "Kapalı" }];
    for (let pct = AUTO_SELL_STEP_PCT; pct <= limit; pct += AUTO_SELL_STEP_PCT) {
      options.unshift({ pct, label: "%" + pct });
    }
    for (const opt of options) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "autosell-option" + (opt.pct === currentPct ? " active" : "");
      item.textContent = opt.label;
      if (opt.pct === currentPct) {
        const mark = document.createElement("span");
        mark.className = "autosell-check";
        mark.textContent = "✓";
        item.appendChild(mark);
      }
      item.addEventListener("click", () => {
        setAutoSellPct(outputResource, opt.pct);
        closeAutosellMenu();
      });
      autosellMenu.appendChild(item);
    }
  }
  function positionAutosellMenu() {
    const margin = 8;
    const gap = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = autoSellBtn.getBoundingClientRect();

    autosellMenu.style.maxHeight = "";
    const menuW = autosellMenu.offsetWidth;
    let menuH = autosellMenu.offsetHeight;

    const spaceAbove = rect.top - margin;
    const spaceBelow = vh - rect.bottom - margin;

    let openUp;
    if (menuH <= spaceAbove && menuH <= spaceBelow) {
      openUp = spaceAbove >= spaceBelow;
    } else if (menuH <= spaceAbove) {
      openUp = true;
    } else if (menuH <= spaceBelow) {
      openUp = false;
    } else {
      openUp = spaceAbove >= spaceBelow;
      autosellMenu.style.maxHeight = Math.max(120, (openUp ? spaceAbove : spaceBelow) - gap) + "px";
      menuH = autosellMenu.offsetHeight;
    }

    let top = openUp ? rect.top - menuH - gap : rect.bottom + gap;
    top = Math.min(Math.max(margin, top), vh - menuH - margin);

    let left = rect.left;
    if (left + menuW > vw - margin) left = vw - margin - menuW;
    left = Math.max(margin, left);

    autosellMenu.style.left = Math.round(left) + "px";
    autosellMenu.style.top = Math.round(top) + "px";
  }
  function closeAutosellMenu() {
    if (autosellMenu.hidden) return;
    autosellMenu.hidden = true;
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScrollOrResize, true);
    window.removeEventListener("resize", onScrollOrResize);
  }
  function onDocClick(e) {
    if (!autosellMenu.contains(e.target) && !autoSellBtn.contains(e.target)) closeAutosellMenu();
  }
  function onKeyDown(e) {
    if (e.key === "Escape") closeAutosellMenu();
  }
  function onScrollOrResize() {
    closeAutosellMenu();
  }
  function openAutosellMenu() {
    buildAutosellMenu();
    autosellMenu.hidden = false;
    autosellMenu.style.visibility = "hidden";
    positionAutosellMenu();
    autosellMenu.style.visibility = "";
    industryTooltip.hide();
    tooltipActive = false;
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
  }
  autoSellBtn.addEventListener("click", () => {
    if (!autosellMenu.hidden) closeAutosellMenu();
    else openAutosellMenu();
  });
  buildRow.append(autoSellBtn, buildBtn, upgradeBtn, levelLabel);
  const controls = document.createElement("div");
  controls.className = "industry-controls";
  const minusBtn = document.createElement("button");
  minusBtn.type = "button";
  minusBtn.className = "worker-btn worker-minus";
  minusBtn.textContent = "−";
  minusBtn.dataset.hlWithPop = "1";
  const workerCount = document.createElement("span");
  workerCount.className = "worker-count";
  workerCount.textContent = "0/" + getIndustryMaxWorkers(id);
  const plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.className = "worker-btn worker-plus";
  plusBtn.textContent = "+";
  plusBtn.dataset.hlWithPop = "1";
  minusBtn.addEventListener("click", () => removeWorker(id));
  plusBtn.addEventListener("click", () => {
    if (!addWorker(id)) { triggerShake(plusBtn); }
  });
  controls.append(minusBtn, workerCount, plusBtn);
  head.append(controls);
  card.append(head, desc, flow, warning, buildRow, lockOverlay.element);

  let tooltipActive = false;
  let lastEra = state.era.current;
  card.addEventListener("mouseenter", () => {
    if (!autosellMenu.hidden) return;
    tooltipActive = true;
    buildIndustryTooltip(id);
    industryTooltip.show(card);
  });
  card.addEventListener("mouseleave", () => {
    tooltipActive = false;
    industryTooltip.hide();
  });

  function update() {
    const currentEra = state.era.current;
    if (currentEra !== lastEra) {
      lastEra = currentEra;
      card.classList.remove("demolished");
    }
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
      closeAutosellMenu();
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
        span.textContent = getEraResourceEmoji(resource) + " " + formatCount(amount);
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
      autoSellBtn.hidden = true;
      closeAutosellMenu();
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
      delete upgradeBtn.dataset.hlCost;
      for (const span of Object.values(upgradeCostSpans)) { span.textContent = ""; }
      maxText.textContent = data.name + " En Yüksek Seviyede";
      maxText.hidden = false;
    } else {
      upgradeBtn.hidden = false;
      upgradeBtn.disabled = false;
      upgradeBtn.dataset.hlCost = "industryUpgrade:" + id;
      maxText.hidden = true;
      for (const [resource, span] of Object.entries(upgradeCostSpans)) {
        const amount = upgradeCost[resource];
        const enough = getResource(resource) >= amount;
        span.textContent = getEraResourceEmoji(resource) + " " + formatCount(amount);
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
      inputParts.push(getEraResourceEmoji(resource) + " −" + formatNumber(amount) + "/s");
    }
    inputValue.textContent = inputParts.join("  ");
    inputValue.classList.toggle("idle", workers === 0);
    const outputParts = [];
    for (const resource of Object.keys(data.output)) {
      const amount = getIndustryOutputById(id, resource);
      outputParts.push(getEraResourceEmoji(resource) + " +" + formatNumber(amount) + "/s");
    }
    outputValue.textContent = outputParts.join("  ");
    outputValue.classList.toggle("idle", workers === 0);
    if (entry.stalled) {
      warning.textContent = "⚠️ Yetersiz girdi";
      warning.hidden = false;
    } else {
      warning.hidden = true;
    }
    if (autoSellSupported) {
      autoSellBtn.hidden = false;
      const pct = getAutoSellPct(outputResource);
      autoSellBtn.textContent = pct > 0 ? "%" + pct : "⟳";
      autoSellBtn.classList.toggle("active", pct > 0);
      autoSellBtn.title = pct > 0
        ? "Otomatik satış: kapasitenin %" + (100 - pct) + "'ından fazlası satılır"
        : "Otomatik satış: Kapalı";
    } else {
      autoSellBtn.hidden = true;
    }
    minusBtn.disabled = workers <= 0;
    plusBtn.disabled = workers >= maxWorkers || getWorkerCount() >= getPopulationAlive();
    const workerCost = getWorkerCost(id);
    if (workerCost) {
      const costParts = [];
      for (const [resource, amount] of Object.entries(workerCost)) {
        costParts.push(getEraResourceEmoji(resource) + " " + formatCount(amount));
      }
      plusBtn.title = "İşçi ekle (" + costParts.join(", ") + ")";
    }
    if (tooltipActive) { refreshIndustryTooltip(); }
  }

  onChange(update);
  update();
  return card;
}

function buildIndustryTooltip(id) {
  const data = INDUSTRY_DATA[id];
  const cost = getCurrentIndustryCost(id);
  resetIndustryTooltipClass(id);
  industryTooltip.element.textContent = "";
  const title = document.createElement("div");
  title.className = "tooltip-title";
  title.textContent = data.emoji + " " + data.name;
  industryTooltip.element.appendChild(title);

  const effect = document.createElement("div");
  effect.className = "tooltip-effect";

  const inLine = document.createElement("div");
  inLine.className = "tooltip-effect-line";
  const inLabel = document.createElement("span");
  inLabel.className = "effect-label";
  inLabel.textContent = "Girdi:";
  const inValue = document.createElement("span");
  inValue.className = "tt-neg";
  inLine.append(inLabel, " ", inValue);
  effect.appendChild(inLine);

  const totalOutLine = document.createElement("div");
  totalOutLine.className = "tooltip-effect-line";
  const totalOutLabel = document.createElement("span");
  totalOutLabel.className = "effect-label";
  totalOutLabel.textContent = "Çıktı:";
  const totalOutValue = document.createElement("span");
  totalOutValue.className = "effect-value";
  totalOutValue.textContent = industryTotalOutputText(id);
  totalOutLine.append(totalOutLabel, " ", totalOutValue);
  effect.appendChild(totalOutLine);

  industryTooltip.element.appendChild(effect);

  const flowDivider = document.createElement("div");
  flowDivider.className = "tt-divider";
  industryTooltip.element.appendChild(flowDivider);

  const perWorkerEffect = document.createElement("div");
  perWorkerEffect.className = "tooltip-effect";

  const perWorkerLine = document.createElement("div");
  perWorkerLine.className = "tooltip-effect-line";
  const perWorkerLabel = document.createElement("span");
  perWorkerLabel.className = "effect-label";
  perWorkerLabel.textContent = "İşçi başına:";
  const perWorkerValue = document.createElement("span");
  perWorkerValue.className = "effect-value";
  perWorkerValue.textContent = industryEffectiveOutputText(id);
  perWorkerLine.append(perWorkerLabel, " ", perWorkerValue);
  perWorkerEffect.appendChild(perWorkerLine);

  const workerLine = document.createElement("div");
  workerLine.className = "tooltip-effect-line";
  const workerLabel = document.createElement("span");
  workerLabel.className = "effect-label";
  workerLabel.textContent = "İşçi:";
  const workerValue = document.createElement("span");
  workerValue.style.color = "#ffffff";
  workerLine.append(workerLabel, " ", workerValue);
  perWorkerEffect.appendChild(workerLine);

  industryTooltip.element.appendChild(perWorkerEffect);

  const bonusDivider = document.createElement("div");
  bonusDivider.className = "tt-divider";
  industryTooltip.element.appendChild(bonusDivider);
  const bonusList = document.createElement("div");
  bonusList.className = "tooltip-effect";
  industryTooltip.element.appendChild(bonusList);

  const warn = document.createElement("div");
  warn.className = "tt-note";
  warn.hidden = true;
  industryTooltip.element.appendChild(warn);

  const costDivider = document.createElement("div");
  costDivider.className = "tt-divider";
  industryTooltip.element.appendChild(costDivider);
  const costs = document.createElement("div");
  costs.className = "tooltip-costs";
  industryTooltip.element.appendChild(costs);

  industryTooltipLive.id = id;
  industryTooltipLive.totalOutEl = totalOutValue;
  industryTooltipLive.perWorkerEl = perWorkerValue;
  industryTooltipLive.inEl = inValue;
  industryTooltipLive.inRowEl = inLine;
  industryTooltipLive.workerEl = workerValue;
  industryTooltipLive.bonusDividerEl = bonusDivider;
  industryTooltipLive.bonusListEl = bonusList;
  industryTooltipLive.warnEl = warn;
  industryTooltipLive.costsEl = costs;
  industryTooltipLive.costDividerEl = costDivider;

  if (cost) {
    industryTooltipLive.rows = createCostRows(costs, cost);
    costDivider.hidden = false;
    costs.hidden = false;
  } else {
    industryTooltipLive.rows = [];
    costDivider.hidden = true;
    costs.hidden = true;
  }
  refreshIndustryTooltip();
}

function refreshIndustryTooltip() {
  if (industryTooltipLive.id == null) return;
  const id = industryTooltipLive.id;
  if (industryTooltipLive.totalOutEl) {
    industryTooltipLive.totalOutEl.textContent = industryTotalOutputText(id);
  }
  if (industryTooltipLive.perWorkerEl) {
    industryTooltipLive.perWorkerEl.textContent = industryEffectiveOutputText(id);
  }
  if (industryTooltipLive.inEl && industryTooltipLive.inRowEl) {
    const inputText = industryInputText(id);
    industryTooltipLive.inEl.textContent = inputText;
    industryTooltipLive.inRowEl.hidden = inputText === "";
  }
  if (industryTooltipLive.workerEl) {
    const workers = getIndustryWorkers(id);
    industryTooltipLive.workerEl.textContent =
      workers + " / " + getIndustryMaxWorkers(id);
  }
  fillIndustryBonusRows(id);
  if (industryTooltipLive.warnEl) {
    const entry = getIndustry(id);
    industryTooltipLive.warnEl.hidden = !(entry && entry.stalled);
    industryTooltipLive.warnEl.textContent = "⚠️ Yetersiz girdi";
  }
  const cost = getCurrentIndustryCost(id);
  if (!cost) {
    industryTooltipLive.costDividerEl.hidden = true;
    industryTooltipLive.costsEl.hidden = true;
    return;
  }
  industryTooltipLive.costDividerEl.hidden = false;
  industryTooltipLive.costsEl.hidden = false;
  refreshCostRows(industryTooltipLive.rows, cost, getResource, getNetRate);
}

/* ─────────────────── Sanayi Bonus Satirlari Doldurucu ─────────────────── */
function fillIndustryBonusRows(id) {
  const listEl = industryTooltipLive.bonusListEl;
  if (!listEl) return;
  listEl.textContent = "";

  const levelPct = Math.round((getIndustryLevelMultiplier(id) - 1) * 100);
  if (levelPct > 0) {
    const levelLine = document.createElement("div");
    levelLine.className = "tooltip-effect-line";
    const levelLabel = document.createElement("span");
    levelLabel.className = "effect-label";
    levelLabel.textContent = "Seviye:";
    const levelValue = document.createElement("span");
    levelValue.className = "effect-value";
    levelValue.textContent = "%" + levelPct;
    levelLine.append(levelLabel, " ", levelValue);
    listEl.appendChild(levelLine);
  }

  for (const pid of Object.keys(PACKS_DATA)) {
    const pack = PACKS_DATA[pid];
    const count = getPackCount(pid);
    if (count <= 0) continue;
    let pct = 0;
    if (pack.industryBonusPerLevel) pct += count * pack.industryBonusPerLevel * 100;
    if (pack.workerBonusPerLevel) pct += count * pack.workerBonusPerLevel * 100;
    if (pct <= 0) continue;
    const line = document.createElement("div");
    line.className = "tooltip-effect-line";
    const label = document.createElement("span");
    label.className = "effect-label";
    label.textContent = pack.emoji + " " + getEraPackName(pid) + ":";
    const value = document.createElement("span");
    value.className = "effect-value";
    value.textContent = "%" + Math.round(pct);
    line.append(label, " ", value);
    listEl.appendChild(line);
  }

  const hasRows = listEl.childElementCount > 0;
  listEl.hidden = !hasRows;
  if (industryTooltipLive.bonusDividerEl) {
    industryTooltipLive.bonusDividerEl.hidden = !hasRows;
  }
}

/* ─────────────────── Sanayi Etkin Cikti Metni ─────────────────── */
function industryEffectiveOutputText(id) {
  const levelMult = getIndustryLevelMultiplier(id);
  const packMult = getIndustryPackMultiplier();
  const workerMult = getWorkerMultiplier();
  return Object.entries(INDUSTRY_DATA[id].output)
    .map(([r, rate]) => getEraResourceEmoji(r) + " +" + formatNumber(rate * levelMult * packMult * workerMult) + "/s · işçi")
    .join("  ");
}

/* ─────────────────── Sanayi Toplam Cikti Metni ─────────────────── */
function industryTotalOutputText(id) {
  const workers = getIndustryWorkers(id);
  const levelMult = getIndustryLevelMultiplier(id);
  const packMult = getIndustryPackMultiplier();
  const workerMult = getWorkerMultiplier();
  return Object.entries(INDUSTRY_DATA[id].output)
    .map(([r, rate]) => getEraResourceEmoji(r) + " +" + formatNumber(rate * levelMult * packMult * workerMult * workers) + "/s")
    .join("  ");
}

/* ─────────────────── Sanayi Girdi Metni ─────────────────── */
function industryInputText(id) {
  const entries = Object.entries(INDUSTRY_DATA[id].input);
  if (entries.length === 0) return "";
  const workers = getIndustryWorkers(id);
  const levelMult = getIndustryLevelMultiplier(id);
  return entries
    .map(([r, rate]) => getEraResourceEmoji(r) + " −" + formatNumber(rate * levelMult * workers) + "/s")
    .join("  ");
}

/* ─────────────────── Guncel Sanayi Maliyeti ─────────────────── */
function getCurrentIndustryCost(id) {
  return getIndustryBuilt(id) ? getIndustryUpgradeCost(id) : getIndustryCost(id);
}

function resetIndustryTooltipClass(id) {
  const outId = Object.keys(INDUSTRY_DATA[id].output)[0];
  industryTooltip.element.className = "tooltip industry-tooltip resource-" + outId;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       PAKET KARTI ARAYUZU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Paket Kart Bileseni ─────────────────── */
export function createPackCard(id, data) {
  const resourceId = Object.keys(data.baseCost)[0];
  const card = document.createElement("div");
  card.className = "upgrade-card resource-" + resourceId;
  card.dataset.packId = id;
  const lockOverlay = createLockOverlay();
  const head = document.createElement("div");
  head.className = "upgrade-head";
  const name = document.createElement("div");
  name.className = "upgrade-name";
  name.textContent = data.emoji + " " + getEraPackName(id);
  const level = document.createElement("div");
  level.className = "upgrade-level";
  level.textContent = "Seviye 0";
  head.append(name, level);
  const desc = document.createElement("div");
  desc.className = "upgrade-desc";
  desc.textContent = data.description;
  const effect = document.createElement("div");
  effect.className = "upgrade-effect";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "upgrade-btn";
  btn.dataset.hlCost = "pack:" + id;
  btn.addEventListener("click", () => {
    if (!buyPack(id)) { triggerShake(btn); }
  });
  card.append(head, desc, effect, btn, lockOverlay.element);
  const costSpans = {};
  for (const resource of Object.keys(data.baseCost)) {
    const span = document.createElement("span");
    span.className = "upgrade-cost";
    span.resource = resource;
    btn.appendChild(span);
    costSpans[resource] = span;
  }
  const doneText = document.createElement("span");
  doneText.className = "upgrade-done-text";
  doneText.textContent = "Tamamlandı";
  doneText.hidden = true;
  btn.appendChild(doneText);
  const packTooltip = createTooltip("pack-tooltip");
  let tooltipActive = false;
  btn.addEventListener("mouseenter", () => {
    if (!getUnlock(data) && getPackCount(id) === 0) return;
    tooltipActive = true;
    buildPackTooltip(id, data);
    packTooltip.show(btn);
  });
  btn.addEventListener("mouseleave", () => {
    tooltipActive = false;
    packTooltip.hide();
  });
  const ttLive = { id: null, rows: [], effectEl: null, totalEl: null, dividerEl: null, costsWrapEl: null };
  let lastEra = null;
  const AFFORD_TOLERANCE = 0.02;
  let stableOk = {};

  function buildPackTooltip(packId, packData) {
    const count = getPackCount(packId);
    const packCost = getPackCost(packId);
    const packMaxed = Boolean(packData.maxLevel && count >= packData.maxLevel);
    packTooltip.element.textContent = "";
    const title = document.createElement("div");
    title.className = "tooltip-title";
    title.textContent = packData.emoji + " " + getEraPackName(packId);
    packTooltip.element.appendChild(title);
    const effectDiv = document.createElement("div");
    effectDiv.className = "tooltip-effect";
    const descLine = document.createElement("div");
    descLine.className = "tooltip-effect-line";
    descLine.textContent = packData.description;
    effectDiv.appendChild(descLine);
    const hasPerLevel = Object.keys(packData).some((k) => k.endsWith("PerLevel"));
    if (hasPerLevel) {
      const effectLine = document.createElement("div");
      effectLine.className = "tooltip-effect-line";
      const effectLabel = document.createElement("span");
      effectLabel.className = "effect-label";
      effectLabel.textContent = "Toplam etki:";
      const effectValue = document.createElement("span");
      effectValue.className = "effect-value";
      effectLine.append(effectLabel, " ", effectValue);
      effectDiv.appendChild(effectLine);
      const perLine = document.createElement("div");
      perLine.className = "tooltip-effect-line";
      const perLabel = document.createElement("span");
      perLabel.className = "effect-label";
      perLabel.textContent = "Seviye bonusu:";
      const perValue = document.createElement("span");
      perValue.className = "effect-value";
      perValue.textContent = getPerLevelText(packData);
      perLine.append(perLabel, " ", perValue);
      effectDiv.appendChild(perLine);
      ttLive.totalEl = effectValue;
    } else {
      ttLive.totalEl = null;
    }
    packTooltip.element.appendChild(effectDiv);
    const divider = document.createElement("div");
    divider.className = "tt-divider";
    packTooltip.element.appendChild(divider);
    const costsWrap = document.createElement("div");
    costsWrap.className = "tooltip-costs";
    ttLive.id = packId;
    ttLive.dividerEl = divider;
    ttLive.costsWrapEl = costsWrap;
    ttLive.rows = createCostRows(costsWrap, packCost);
    if (packMaxed) {
      divider.hidden = true;
      costsWrap.hidden = true;
    }
    packTooltip.element.appendChild(costsWrap);
    refreshPackTooltip();
  }

  function refreshPackTooltip() {
    if (ttLive.id == null) return;
    const packData = PACKS_DATA[ttLive.id];
    const count = getPackCount(ttLive.id);
    const packCost = getPackCost(ttLive.id);
    if (ttLive.totalEl) { ttLive.totalEl.textContent = getTotalEffectText(packData, count); }
    const packMaxed = Boolean(packData.maxLevel && count >= packData.maxLevel);
    if (ttLive.dividerEl && ttLive.costsWrapEl) {
      ttLive.dividerEl.hidden = packMaxed;
      ttLive.costsWrapEl.hidden = packMaxed;
    }
    if (!packMaxed) {
      refreshCostRows(ttLive.rows, packCost, getResource, getNetRate);
    }
  }

  function update() {
    const unlocked = getUnlock(data);
    card.classList.toggle("locked", !unlocked);
    const currentEra = state.era.current;
    if (currentEra !== lastEra) {
      lastEra = currentEra;
      name.textContent = data.emoji + " " + getEraPackName(id);
    }
    if (!unlocked) {
      if (!isNearUnlock(data)) {
        if (!card.hidden) card.hidden = true;
        return;
      }
      card.hidden = false;
      lockOverlay.lockName.textContent = getEraPackName(id);
      fillUnlockDesc(lockOverlay.lockDesc, data);
      lockOverlay.lockDesc.classList.toggle("lock-req-building", getUnlockType(data) === "building");
      lockOverlay.lockDesc.classList.toggle("lock-req-pack", getUnlockType(data) === "pack");
      return;
    }
    card.hidden = false;
    const count = getPackCount(id);
    level.textContent = count + "/" + data.maxLevel;
    let effectText = "";
    if (data.productionBonusPerLevel) { effectText = "Bina üretimi: +%" + Math.round(count * data.productionBonusPerLevel * 100); }
    else if (data.powerBonusPerLevel) { effectText = "Güç üretimi: +%" + Math.round(count * data.powerBonusPerLevel * 100); }
    else if (data.industryBonusPerLevel) { effectText = "Sanayi üretimi: +%" + Math.round(count * data.industryBonusPerLevel * 100); }
    else if (data.costDiscountPerLevel) { effectText = "Bina maliyeti: −%" + Math.round(count * data.costDiscountPerLevel * 100); }
    else if (data.workerBonusPerLevel) { effectText = "İşçi üretimi: +%" + Math.round(count * data.workerBonusPerLevel * 100); }
    else if (data.storageBonusPerLevel) { effectText = "Kapasite: +%" + Math.round(count * data.storageBonusPerLevel * 100); }
    else if (data.autoSellPerLevel) { effectText = "Otomatik satış limiti: %" + count * AUTO_SELL_STEP_PCT; }
    effect.textContent = effectText;
    const cost = getPackCost(id);
    const packMaxed = data.maxLevel && count >= data.maxLevel;
    card.classList.toggle("finished", Boolean(packMaxed));
    doneText.hidden = !packMaxed;
    let affordable = true;
    for (const [resource, amount] of Object.entries(cost)) {
      const span = costSpans[resource];
      if (packMaxed) { span.hidden = true; continue; }
      span.hidden = false;
      const value = getResource(resource);
      if (value >= amount) {
        stableOk[resource] = true;
      } else if (value < amount * (1 - AFFORD_TOLERANCE)) {
        stableOk[resource] = false;
      }
      const ok = stableOk[resource];
      if (!ok) affordable = false;
      span.textContent = getEraResourceEmoji(resource) + " " + formatCount(amount);
      span.classList.toggle("cost-ok", ok);
      span.classList.toggle("cost-missing", !ok);
    }
    btn.classList.toggle("disabled", !affordable || packMaxed);
    if (tooltipActive) { refreshPackTooltip(); }
  }

  onChange(update);
  update();
  return card;
}

function getPerLevelText(data) {
  if (data.productionBonusPerLevel) return "%" + Math.round(data.productionBonusPerLevel * 100);
  if (data.powerBonusPerLevel) return "%" + Math.round(data.powerBonusPerLevel * 100);
  if (data.industryBonusPerLevel) return "%" + Math.round(data.industryBonusPerLevel * 100);
  if (data.costDiscountPerLevel) return "%" + Math.round(data.costDiscountPerLevel * 100);
  if (data.workerBonusPerLevel) return "%" + Math.round(data.workerBonusPerLevel * 100);
  if (data.storageBonusPerLevel) return "%" + Math.round(data.storageBonusPerLevel * 100);
  if (data.autoSellPerLevel) return "+" + AUTO_SELL_STEP_PCT + "% limit";
  return "%0";
}

function getTotalEffectText(data, count) {
  if (data.productionBonusPerLevel) return "+" + Math.round(count * data.productionBonusPerLevel * 100) + "%";
  if (data.powerBonusPerLevel) return "+" + Math.round(count * data.powerBonusPerLevel * 100) + "%";
  if (data.industryBonusPerLevel) return "+" + Math.round(count * data.industryBonusPerLevel * 100) + "%";
  if (data.costDiscountPerLevel) return "−" + Math.round(count * data.costDiscountPerLevel * 100) + "%";
  if (data.workerBonusPerLevel) return "+" + Math.round(count * data.workerBonusPerLevel * 100) + "%";
  if (data.storageBonusPerLevel) return "+" + Math.round(count * data.storageBonusPerLevel * 100) + "%";
  if (data.autoSellPerLevel) return "%" + count * AUTO_SELL_STEP_PCT + " limit";
  return "+0%";
}
