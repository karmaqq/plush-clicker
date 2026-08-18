/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         BİNA KARTI ARAYÜZÜ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  getBadgeTier,
  canAfford,
  formatCount,
  formatNumber,
  createNumberCounter,
  createLockOverlay,
  triggerShake,
  resetResourceClass,
} from "./utils.js";
import { createTooltip, createCostRows, refreshCostRows } from "./tooltip.js";
import { BUILDINGS_DATA, ALL_BUILDINGS_DATA } from "./buildings.js";
import { PACKS_DATA } from "./packs.js";
import { RESOURCES } from "./resources.js";
import {
  state,
  getBuildingCount,
  getBuildingCost,
  getBuildingProduction,
  getBuildingBonus,
  getCapacityBonus,
  getOutputMultiplier,
  getSeasonMultiplier,
  getResource,
  getPackCount,
  getTotalProduction,
  getNetRate,
  getUnlock,
  fillUnlockDesc,
  getUnlockType,
  isNearUnlock,
  buyBuilding,
  getBuildingName,
  getResourceName,
  getResourceEmoji,
  getPackName,
  onChange,
} from "./game-state.js";

export const tooltip = createTooltip("building-tooltip");

const tooltipLive = { id: null, rows: [], effectValue: null, seviyeEl: null, bonusTotalEl: null };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       BİNA KARTI OLUŞTURUCU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Kart Bileşeni ─────────────────── */

export function createBuildingCard(id, data) {
  const isHousing = data.type === "housing";
  const isStorage = data.type === "storage";
  const isCapacityBonus = data.type === "capacityBonus";
  const isBonus = data.type === "bonus";
  const resourceId =
    isHousing || isStorage || isCapacityBonus || isBonus
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

  card.addEventListener("click", () => {
    if ((getUnlock(data) || getBuildingCount(id) > 0) && !buyBuilding(id)) {
      triggerShake(card);
    }
  });

  const lockOverlay = createLockOverlay();

  let tooltipActive = false;

  card.addEventListener("mouseenter", () => {
    if (!getUnlock(data) && getBuildingCount(id) === 0) return;
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
  else if (isBonus) emojiEl.textContent = bonusEmoji(data);
  else emojiEl.textContent = getResourceEmoji(resourceId);
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
      lockOverlay.lockName.textContent = getBuildingName(id);
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
      nameTextEl.textContent = getBuildingName(id);
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
/*                        BİNA BİLGİ KUTUCUĞU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Tooltip Oluşturucu ─────────────────── */

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

  tooltip.element.textContent = "";

  const title = document.createElement("div");
  title.className = "tooltip-title";
  title.textContent = getBuildingName(id);
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
    value.append("+", String(data.housingCapacity), " 👥");

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
      item.textContent = getResourceEmoji(rid) + " +" + per;
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
      item.textContent = getResourceEmoji(rid) + " +" + per;
      capGrid.appendChild(item);
    }

    effect.appendChild(capGrid);
  } else if (isBonus) {
    effectLabel.textContent = getResourceName(data.targetResource) + " Bonusu:";

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
    const outputMult = getOutputMultiplier(data.outputResource);

    effectLabel.textContent = getResourceName(data.outputResource) + " Üretimi:";

    const prodValue = document.createElement("span");
    prodValue.className = "effect-value";
    prodValue.append("+", formatNumber(data.production * getBuildingCount(id) * outputMult * seasonMult), "/s");

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
        bonusLabel.textContent = src.name;

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

/* ─────────────────── Bina Tooltip Güncelleyici ─────────────────── */

export function refreshBuildingTooltip() {
  if (tooltipLive.id == null) return;

  const id = tooltipLive.id;
  const data = ALL_BUILDINGS_DATA[id];
  const cost = getBuildingCost(id);

  if (tooltipLive.effectValue) {
    const seasonMult = getSeasonMultiplier(data.outputResource);
    const outputMult = getOutputMultiplier(data.outputResource);
    tooltipLive.effectValue.textContent = "";
    tooltipLive.effectValue.append(
      "+",
      formatNumber(data.production * getBuildingCount(id) * outputMult * seasonMult),
      "/s"
    );
    if (tooltipLive.seviyeEl) {
      tooltipLive.seviyeEl.textContent = "";
      tooltipLive.seviyeEl.append(
        "+",
        formatNumber(data.production * outputMult * seasonMult),
        "/s"
      );
    }
  }

  if (tooltipLive.bonusTotalEl) {
    tooltipLive.bonusTotalEl.textContent = "";
    tooltipLive.bonusTotalEl.append("%", formatCount(getBuildingBonus(id)));
  }

  refreshCostRows(tooltipLive.rows, cost, getResource, getNetRate);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       YARDIMCI FONKSİYONLAR                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function buildingNameText() {
  const span = document.createElement("span");
  span.className = "building-name-text";
  return span;
}

function bonusEmoji(data) {
  return getResourceEmoji(data.targetResource);
}

/* ─────────────────── Bonus Kaynak Listesi ─────────────────── */

function getBonusSources(resourceId) {
  const sources = [];

  for (const bid of Object.keys(BUILDINGS_DATA)) {
    const b = BUILDINGS_DATA[bid];
    if (b.type !== "bonus" || b.targetResource !== resourceId) continue;
    const count = getBuildingCount(bid);
    if (count <= 0) continue;
    sources.push({
      name: getBuildingName(bid),
      value: Math.round(count * b.bonusPerLevel * 100),
    });
  }

  for (const pid of Object.keys(PACKS_DATA)) {
    const p = PACKS_DATA[pid];
    const count = getPackCount(pid);
    if (count <= 0) continue;
    let bonusPerLevel = 0;
    if (p.productionBonusPerLevel) bonusPerLevel += p.productionBonusPerLevel;
    if (p.powerBonusPerLevel) bonusPerLevel += p.powerBonusPerLevel;
    if (p.productBonusPerLevel) bonusPerLevel += p.productBonusPerLevel;
    if (bonusPerLevel <= 0) continue;
    sources.push({
      name: getPackName(pid),
      value: Math.round(count * bonusPerLevel * 100),
    });
  }

  return sources;
}
