/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         PAKET KARTI ARAYÜZÜ                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  formatCount,
  createLockOverlay,
  triggerShake,
} from "./utils.js";
import { state } from "./state.js";
import { PACKS_DATA } from "./packs.js";
import { createTooltip, createCostRows, refreshCostRows } from "./tooltip.js";
import {
  getPackCount,
  getPackCost,
  getResource,
  getNetRate,
  getUnlock,
  fillUnlockDesc,
  getUnlockType,
  isNearUnlock,
  buyPack,
  getPackName,
  getResourceEmoji,
  onChange,
} from "./game-state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       PAKET KARTI OLUŞTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Paket Kart Bileşeni ─────────────────── */

export function createPackCard(id, data) {
  const resourceId = Object.keys(data.baseCost)[0];

  const card = document.createElement("div");
  card.className = "upgrade-card resource-" + resourceId;

  const lockOverlay = createLockOverlay();

  const head = document.createElement("div");
  head.className = "upgrade-head";

  const name = document.createElement("div");
  name.className = "upgrade-name";
  name.textContent = data.emoji + " " + getPackName(id);

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

  btn.addEventListener("click", () => {
    if (!buyPack(id)) {
      triggerShake(btn);
    }
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

  const tooltip = createTooltip("pack-tooltip");
  let tooltipActive = false;

  btn.addEventListener("mouseenter", () => {
    if (!getUnlock(data) && getPackCount(id) === 0) return;
    tooltipActive = true;
    buildPackTooltip(id, data);
    tooltip.show(btn);
  });

  btn.addEventListener("mouseleave", () => {
    tooltipActive = false;
    tooltip.hide();
  });

  const ttLive = { id: null, rows: [], effectEl: null, totalEl: null };

  let lastEra = null;

  function buildPackTooltip(packId, packData) {
    const packCost = getPackCost(packId);
    const count = getPackCount(packId);

    tooltip.element.textContent = "";

    const title = document.createElement("div");
    title.className = "tooltip-title";
    title.textContent = packData.emoji + " " + getPackName(packId);
    tooltip.element.appendChild(title);

    const effectDiv = document.createElement("div");
    effectDiv.className = "tooltip-effect";

    const descLine = document.createElement("div");
    descLine.className = "tooltip-effect-line";
    descLine.textContent = packData.description;
    effectDiv.appendChild(descLine);

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

    tooltip.element.appendChild(effectDiv);

    const divider = document.createElement("div");
    divider.className = "tt-divider";
    tooltip.element.appendChild(divider);

    ttLive.id = packId;
    ttLive.totalEl = effectValue;
    ttLive.rows = createCostRows(tooltip.element, packCost);

    refreshPackTooltip();
  }

  function refreshPackTooltip() {
    if (ttLive.id == null) return;

    const packData = PACKS_DATA[ttLive.id];
    const count = getPackCount(ttLive.id);
    const packCost = getPackCost(ttLive.id);

    if (ttLive.totalEl) {
      ttLive.totalEl.textContent = getTotalEffectText(packData, count);
    }

    refreshCostRows(ttLive.rows, packCost, getResource, getNetRate);
  }

  function update() {
    const unlocked = getUnlock(data);
    card.classList.toggle("locked", !unlocked);

    const currentEra = state.era.current;
    if (currentEra !== lastEra) {
      lastEra = currentEra;
      name.textContent = data.emoji + " " + getPackName(id);
    }

    if (!unlocked) {
      if (!isNearUnlock(data)) {
        if (!card.hidden) card.hidden = true;
        return;
      }
      card.hidden = false;
      lockOverlay.lockName.textContent = getPackName(id);
      fillUnlockDesc(lockOverlay.lockDesc, data);
      lockOverlay.lockDesc.classList.toggle("lock-req-building", getUnlockType(data) === "building");
      lockOverlay.lockDesc.classList.toggle("lock-req-pack", getUnlockType(data) === "pack");
      return;
    }

    card.hidden = false;

    const count = getPackCount(id);
    level.textContent = "Seviye " + count;

    let effectText = "";
    if (data.productionBonusPerLevel) {
      effectText = "Tüm üretim: +%" + Math.round(count * data.productionBonusPerLevel * 100);
    } else if (data.powerBonusPerLevel) {
      effectText = "Güç üretimi: +%" + Math.round(count * data.powerBonusPerLevel * 100);
    } else if (data.costDiscountPerLevel) {
      effectText = "Bina maliyeti: −%" + Math.round(count * data.costDiscountPerLevel * 100);
    } else if (data.productBonusPerLevel) {
      effectText = "Ürün üretimi: +%" + Math.round(count * data.productBonusPerLevel * 100);
    } else if (data.workerBonusPerLevel) {
      effectText = "İşçi üretimi: +%" + Math.round(count * data.workerBonusPerLevel * 100);
    } else if (data.storageBonusPerLevel) {
      effectText = "Kapasite: +%" + Math.round(count * data.storageBonusPerLevel * 100);
    } else if (data.tradeBonusPerLevel) {
      effectText = "Ticaret: +%" + Math.round(count * data.tradeBonusPerLevel * 100);
    }
    effect.textContent = effectText;

    const cost = getPackCost(id);
    let affordable = true;
    for (const [resource, amount] of Object.entries(cost)) {
      const span = costSpans[resource];
      const ok = getResource(resource) >= amount;
      span.textContent = getResourceEmoji(resource) + " " + formatCount(amount);
      span.classList.toggle("cost-ok", ok);
      span.classList.toggle("cost-missing", !ok);
      if (!ok) affordable = false;
    }
    btn.classList.toggle("disabled", !affordable);

    if (tooltipActive) {
      refreshPackTooltip();
    }
  }

  onChange(update);
  update();

  return card;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       YARDIMCI FONKSİYONLAR                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Seviye Bonus Metni ─────────────────── */

function getPerLevelText(data) {
  if (data.productionBonusPerLevel) return "%" + Math.round(data.productionBonusPerLevel * 100);
  if (data.powerBonusPerLevel) return "%" + Math.round(data.powerBonusPerLevel * 100);
  if (data.costDiscountPerLevel) return "%" + Math.round(data.costDiscountPerLevel * 100);
  if (data.productBonusPerLevel) return "%" + Math.round(data.productBonusPerLevel * 100);
  if (data.workerBonusPerLevel) return "%" + Math.round(data.workerBonusPerLevel * 100);
  if (data.storageBonusPerLevel) return "%" + Math.round(data.storageBonusPerLevel * 100);
  if (data.tradeBonusPerLevel) return "%" + Math.round(data.tradeBonusPerLevel * 100);
  return "%0";
}

/* ─────────────────── Toplam Etki Metni ─────────────────── */

function getTotalEffectText(data, count) {
  if (data.productionBonusPerLevel) return "+" + Math.round(count * data.productionBonusPerLevel * 100) + "%";
  if (data.powerBonusPerLevel) return "+" + Math.round(count * data.powerBonusPerLevel * 100) + "%";
  if (data.costDiscountPerLevel) return "−" + Math.round(count * data.costDiscountPerLevel * 100) + "%";
  if (data.productBonusPerLevel) return "+" + Math.round(count * data.productBonusPerLevel * 100) + "%";
  if (data.workerBonusPerLevel) return "+" + Math.round(count * data.workerBonusPerLevel * 100) + "%";
  if (data.storageBonusPerLevel) return "+" + Math.round(count * data.storageBonusPerLevel * 100) + "%";
  if (data.tradeBonusPerLevel) return "+" + Math.round(count * data.tradeBonusPerLevel * 100) + "%";
  return "+0%";
}
