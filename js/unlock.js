/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     KİLİT SİSTEMİ VE SATIN ALMA                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { state, getResource, getBuildingCount, getPackCount } from "./state.js";
import { INDUSTRY_MAX_LEVEL } from "./config.js";
import { RESOURCES } from "./resources.js";
import { ALL_BUILDINGS_DATA } from "./buildings.js";
import { PACKS_DATA } from "./packs.js";
import { INDUSTRY_DATA } from "./industry.js";
import { canAfford } from "./utils.js";
import { getCostDiscount, getIndustryLevel, getIndustryMaxWorkers, getIndustryBuilt, getWorkerCount } from "./production.js";
import { getPopulationAlive } from "./population.js";
import { emit } from "./engine.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       KİLİT STRATEJİLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const UNLOCK_STRATEGIES = {
  building: {
    isMet: (unlock) => getBuildingCount(unlock.id) >= unlock.count,
    progress: (unlock) =>
      Math.min(getBuildingCount(unlock.id), unlock.count) + "/" + unlock.count,
    isNear: (unlock) => getBuildingCount(unlock.id) > 0,
    target: (unlock) => ALL_BUILDINGS_DATA[unlock.id].name,
  },
  pack: {
    isMet: (unlock) => getPackCount(unlock.id) >= unlock.level,
    progress: (unlock) =>
      Math.min(getPackCount(unlock.id), unlock.level) + "/" + unlock.level,
    isNear: (unlock) => getPackCount(unlock.id) > 0,
    target: (unlock) => PACKS_DATA[unlock.id].name,
  },
  resource: {
    isMet: (unlock) => getResource(unlock.id) >= unlock.amount,
    progress: (unlock) =>
      Math.min(getResource(unlock.id), unlock.amount) + "/" + unlock.amount,
    isNear: () => false,
    target: (unlock) => RESOURCES[unlock.id].name,
  },
  industry: {
    isMet: (unlock) => getIndustryBuilt(unlock.id),
    progress: (unlock) => (getIndustryBuilt(unlock.id) ? "1/1" : "0/1"),
    isNear: (unlock) => getIndustryBuilt(unlock.id),
    target: (unlock) => INDUSTRY_DATA[unlock.id].name,
  },
  all: {
    isMet: (unlock) =>
      unlock.conditions.every((c) => UNLOCK_STRATEGIES[c.type].isMet(c)),
    progress: (unlock) =>
      unlock.conditions
        .map((c) => UNLOCK_STRATEGIES[c.type].progress(c))
        .join(" + "),
    isNear: (unlock) =>
      unlock.conditions.some((c) => UNLOCK_STRATEGIES[c.type].isNear(c)),
    target: (unlock) =>
      unlock.conditions
        .map((c) => UNLOCK_STRATEGIES[c.type].target(c))
        .join(" + "),
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        KİLİT KONTROLLERİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kilit Durumu Kontrolü ─────────────────── */

export function getUnlock(data) {
  if (!data || !data.unlock) return true;

  const strategy = UNLOCK_STRATEGIES[data.unlock.type];
  return strategy ? strategy.isMet(data.unlock) : true;
}

/* ─────────────────── Kilit Türü Getter'ı ─────────────────── */

export function getUnlockType(data) {
  if (!data || !data.unlock) return null;
  return data.unlock.type;
}

/* ─────────────────── Yakın Kilit Kontrolü ─────────────────── */

export function isNearUnlock(data) {
  if (!data || !data.unlock) return true;

  const strategy = UNLOCK_STRATEGIES[data.unlock.type];
  return strategy ? strategy.isNear(data.unlock) : true;
}

/* ─────────────────── Kilit Açıklaması Dolgulayıcı ─────────────────── */

export function fillUnlockDesc(lockDesc, data) {
  lockDesc.textContent = "";
  if (!data || !data.unlock) return;

  const unlock = data.unlock;

  if (unlock.type === "all" && unlock.conditions) {
    for (let i = 0; i < unlock.conditions.length; i++) {
      const cond = unlock.conditions[i];
      const strategy = UNLOCK_STRATEGIES[cond.type];
      if (!strategy) continue;

      const met = strategy.isMet(cond);
      const name = strategy.target(cond);
      const progress = strategy.progress(cond);

      const span = document.createElement("span");
      span.className = met ? "lock-cond met" : "lock-cond unmet";
      span.textContent = name + " (" + progress + ")";
      lockDesc.appendChild(span);

      if (i < unlock.conditions.length - 1) {
        lockDesc.appendChild(document.createTextNode(" "));
      }
    }
  } else {
    const strategy = UNLOCK_STRATEGIES[unlock.type];
    if (!strategy) return;

    const met = strategy.isMet(unlock);
    const name = strategy.target(unlock);
    const progress = strategy.progress(unlock);

    const nameSpan = document.createElement("span");
    nameSpan.className = "lock-cond-name";
    nameSpan.textContent = name + " ";

    const progSpan = document.createElement("span");
    progSpan.className = met ? "lock-cond met" : "lock-cond unmet";
    progSpan.textContent = "(" + progress + ")";

    lockDesc.append(nameSpan, progSpan);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       MALİYET HESAPLAMALARI                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Maliyeti Hesaplayıcı ─────────────────── */

export function getBuildingCost(id) {
  const building = ALL_BUILDINGS_DATA[id];
  const multiplier = Math.pow(building.costMultiplier, getBuildingCount(id));
  const cost = {};

  for (const [resource, amount] of Object.entries(building.baseCost)) {
    cost[resource] = Math.ceil(amount * multiplier * getCostDiscount());
  }

  return cost;
}

/* ─────────────────── Paket Maliyeti Hesaplayıcı ─────────────────── */

export function getPackCost(id) {
  const pack = PACKS_DATA[id];
  const multiplier = Math.pow(pack.costMultiplier, getPackCount(id));
  const cost = {};

  for (const [resource, amount] of Object.entries(pack.baseCost)) {
    cost[resource] = Math.ceil(amount * multiplier);
  }

  return cost;
}

function pay(cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    state.resources[resource] -= amount;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SATIN ALMA İŞLEMLERİ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Satın Alma İşlemcisi ─────────────────── */

export function buyBuilding(id) {
  const building = ALL_BUILDINGS_DATA[id];
  if (!getUnlock(building)) return false;

  const cost = getBuildingCost(id);

  if (!canAfford(cost, getResource)) return false;

  pay(cost);
  state.buildings[id]++;
  emit();
  return true;
}

/* ─────────────────── Paket Satın Alma İşlemcisi ─────────────────── */

export function buyPack(id) {
  const pack = PACKS_DATA[id];
  if (!getUnlock(pack)) return false;

  const cost = getPackCost(id);

  if (!canAfford(cost, getResource)) return false;

  pay(cost);
  state.packs[id]++;
  emit();
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        SANAYİ İŞLEMLERİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sanayi Maliyeti Hesaplayıcı ─────────────────── */

export function getIndustryCost(id) {
  const industry = INDUSTRY_DATA[id];
  const cost = {};

  for (const [resource, amount] of Object.entries(industry.baseCost)) {
    cost[resource] = Math.ceil(amount);
  }

  return cost;
}

/* ─────────────────── Sanayi İnşaat İşlemcisi ─────────────────── */

export function buildIndustry(id) {
  const industry = INDUSTRY_DATA[id];
  const entry = state.industry[id];
  if (entry.built) return false;
  if (!getUnlock(industry)) return false;

  const cost = getIndustryCost(id);
  if (!canAfford(cost, getResource)) return false;

  pay(cost);
  entry.built = true;
  emit();
  return true;
}

/* ─────────────────── Sanayi Yükseltme Maliyeti Hesaplayıcı ─────────────────── */

export function getIndustryUpgradeCost(id) {
  const level = getIndustryLevel(id);
  if (level >= INDUSTRY_MAX_LEVEL) return null;

  const cost = {};
  for (const [resource, amount] of Object.entries(INDUSTRY_DATA[id].baseCost)) {
    cost[resource] = Math.ceil(amount * level);
  }
  return cost;
}

/* ─────────────────── Sanayi Yükseltme İşlemcisi ─────────────────── */

export function upgradeIndustry(id) {
  const entry = state.industry[id];
  if (!entry.built) return false;
  if (getIndustryLevel(id) >= INDUSTRY_MAX_LEVEL) return false;

  const cost = getIndustryUpgradeCost(id);
  if (!canAfford(cost, getResource)) return false;

  pay(cost);
  entry.level++;
  emit();
  return true;
}

/* ─────────────────── İşçi Ekleme İşlemcisi ─────────────────── */

export function addWorker(id) {
  const entry = state.industry[id];
  if (!entry.built) return false;
  if (entry.workers >= getIndustryMaxWorkers(id)) return false;
  if (getWorkerCount() >= getPopulationAlive()) return false;

  entry.workers++;
  emit();
  return true;
}

/* ─────────────────── İşçi Çıkarma İşlemcisi ─────────────────── */

export function removeWorker(id) {
  const entry = state.industry[id];
  if (entry.workers <= 0) return false;

  entry.workers--;
  emit();
  return true;
}
