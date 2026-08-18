/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        NÜFUS YÖNETİMİ                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  POP_SU_RATE,
  POP_YIYECEK_RATE,
  POP_EKMEK_RATE,
  POP_ILAC_RATE,
  POP_GOLD_RATE,
  LUXURY_ORDER,
  LUXURY_RATES,
  LUXURY_HAPPINESS,
  TICKS_PER_SECOND,
  ARRIVAL_DURATION,
} from "./config.js";
import { state, getResource, getBuildingCount, getPopulationAlive } from "./state.js";
import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA, HOUSING_DATA } from "./buildings.js";
import { INDUSTRY_DATA } from "./industry.js";
import {
  getTotalProduction,
  getWorkerCount,
  getIndustryMaxWorkers,
  isSellable,
  getAutoSell,
  getSellPrice,
} from "./production.js";

export { getPopulationAlive } from "./state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          NÜFUS VERİLERİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Güncel Nüfus Getter'ı ─────────────────── */

export function getPopulationCurrent() {
  return state.population.current;
}

/* ─────────────────── Nüfus Kapasitesi Hesaplayıcı ─────────────────── */

export function getPopulationCapacity() {
  let capacity = 0;

  for (const id of Object.keys(HOUSING_DATA)) {
    const building = HOUSING_DATA[id];
    if (building.type === "housing") {
      capacity += getBuildingCount(id) * building.housingCapacity;
    }
  }

  return capacity;
}

/* ─────────────────── Nüfus Memnuniyeti Getter'ı ─────────────────── */

export function getPopulationSatisfaction() {
  return state.population.satisfaction;
}

/* ─────────────────── Nüfus Eksiklik Oranı Getter'ı ─────────────────── */

export function getPopulationDeficiency() {
  return state.population.deficiency;
}

/* ─────────────────── Göçmen Sayısı Getter'ı ─────────────────── */

export function getPopulationMigrants() {
  return state.population.migrants;
}

/* ─────────────────── Göçmen Kuyruğu Getter'ı ─────────────────── */

export function getMigrantQueue() {
  return state.population.migrantQueue;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          MUTLULUK HESAPLAMASI                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Mutluluk Kırılım Hesaplayıcı ─────────────────── */

export function getHappinessBreakdown() {
  return computeHappinessBreakdown();
}

function computeHappinessBreakdown() {
  const alive = getPopulationAlive();
  const items = [];

  if (alive <= 0) return { items, target: 50 };

  const ticks = TICKS_PER_SECOND;

  const suNeed = (alive * POP_SU_RATE) / ticks;
  const suMet = getResource("su") >= suNeed;
  items.push({
    emoji: "💧",
    label: "Temiz Su",
    delta: suMet ? 10 : -15,
    met: suMet,
  });

  const ekmekNeed = (alive * POP_EKMEK_RATE) / ticks;
  const foodNeed = (alive * POP_YIYECEK_RATE) / ticks;
  const foodMet =
    getResource("ekmek") >= ekmekNeed &&
    getResource("yiyecek") >= Math.max(0, foodNeed - ekmekNeed * 2.5);
  items.push({
    emoji: "🍞",
    label: "Ekmek & Yiyecek",
    delta: foodMet ? 10 : -15,
    met: foodMet,
  });

  const ilacNeed = (alive * POP_ILAC_RATE) / ticks;
  const ilacMet = getResource("ilac") >= ilacNeed;
  items.push({
    emoji: "💊",
    label: "İlaç",
    delta: ilacMet ? 5 : -10,
    met: ilacMet,
  });

  for (const luxury of LUXURY_ORDER) {
    if (getTotalProduction(luxury) <= 0) continue;
    const need = (alive * LUXURY_RATES[luxury]) / ticks;
    const met = getResource(luxury) >= need;
    const value = LUXURY_HAPPINESS[luxury];
    const delta = met ? value : -value;
    items.push({
      emoji: RESOURCES[luxury].emoji,
      label: RESOURCES[luxury].name,
      delta,
      met,
    });
  }

  const goldNeed = (alive * POP_GOLD_RATE) / ticks;
  const goldMet = getResource("altin") >= goldNeed;
  items.push({
    emoji: "🥂",
    label: "Altın Kutlama",
    delta: goldMet ? 8 : 0,
    met: goldMet,
    optional: true,
  });

  const wagesMet = state.population.wagesPaid;
  items.push({
    emoji: "💰",
    label: "İşçi Maaşları",
    delta: wagesMet ? 20 : -10,
    met: wagesMet,
  });

  const evCap = getBuildingCount("ev") * HOUSING_DATA.ev.housingCapacity;
  const barakaCap =
    getBuildingCount("baraka") * HOUSING_DATA.baraka.housingCapacity;
  const totalCap = evCap + barakaCap;
  const evRatio = totalCap > 0 ? evCap / totalCap : 0;
  const housingDelta = Math.round(evRatio * 8);
  if (housingDelta > 0) {
    items.push({
      emoji: "🏠",
      label: "Konut Konforu",
      delta: housingDelta,
      met: true,
    });
  }

  let buildingDelta = 0;
  for (const id of Object.keys(BUILDINGS_DATA)) {
    const building = BUILDINGS_DATA[id];
    if (building.happinessPerLevel) {
      buildingDelta += getBuildingCount(id) * building.happinessPerLevel;
    }
  }
  buildingDelta = Math.min(5, buildingDelta);
  if (buildingDelta > 0) {
    items.push({
      emoji: "🌿",
      label: "Rahatlama",
      delta: buildingDelta,
      met: true,
    });
  }

  const cultureProd = getTotalProduction("kultur");
  if (cultureProd > 0) {
    const cultureDelta = Math.min(8, getBuildingCount("amphitheatre"));
    if (cultureDelta > 0) {
      items.push({
        emoji: "🏛️",
        label: "Kültür",
        delta: cultureDelta,
        met: true,
      });
    }
  }

  let totalJobSlots = 0;
  for (const id of Object.keys(INDUSTRY_DATA)) {
    if (state.industry[id].built) totalJobSlots += getIndustryMaxWorkers(id);
  }
  let idleDelta = 0;
  if (totalJobSlots > 0) {
    const idleRatio = 1 - getWorkerCount() / alive;
    if (idleRatio <= 0.35) idleDelta = 5;
    else if (idleRatio > 0.65) idleDelta = -3;
  }
  if (idleDelta !== 0) {
    items.push({
      emoji: "👷",
      label: "İşgücü Dengesi",
      delta: idleDelta,
      met: idleDelta > 0,
    });
  }

  let target = 0;
  for (const item of items) target += item.delta;
  target = Math.max(0, Math.min(100, target));

  return { items, target };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          GÖÇ YÖNETİMİ                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Göç Aralığı Hesaplayıcı ─────────────────── */

export function getMigrationInterval() {
  const sat = state.population.satisfaction;
  if (sat >= 70) return 45;
  if (sat >= 50) return 60;
  if (sat >= 30) return 90;
  return 120;
}

/* ─────────────────── Varış Süresi Getter'ı ─────────────────── */

export function getArrivalDuration() {
  return ARRIVAL_DURATION;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          NÜFUS TÜKETİMİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Nüfus Tüketim İşlemcisi ─────────────────── */

export function consumePopulation() {
  const alive = getPopulationAlive();
  if (alive <= 0) {
    state.population.deficiency = 0;
    state.population.ilacOk = false;
    return false;
  }

  const happiness = computeHappinessBreakdown();
  let changed = false;

  const suNeed = (alive * POP_SU_RATE) / TICKS_PER_SECOND;
  const suUsed = Math.min(getResource("su"), suNeed);
  state.resources.su -= suUsed;
  if (suUsed > 0) changed = true;

  const ekmekNeed = (alive * POP_EKMEK_RATE) / TICKS_PER_SECOND;
  const ekmekUsed = Math.min(getResource("ekmek"), ekmekNeed);
  state.resources.ekmek -= ekmekUsed;
  if (ekmekUsed > 0) changed = true;

  const foodNeed = (alive * POP_YIYECEK_RATE) / TICKS_PER_SECOND;
  const coveredByEkmek = ekmekUsed * 2.5;
  const foodRemain = Math.max(0, foodNeed - coveredByEkmek);
  const foodUsed = Math.min(getResource("yiyecek"), foodRemain);
  state.resources.yiyecek -= foodUsed;
  if (foodUsed > 0) changed = true;

  const ilacNeed = (alive * POP_ILAC_RATE) / TICKS_PER_SECOND;
  const ilacUsed = Math.min(getResource("ilac"), ilacNeed);
  state.resources.ilac -= ilacUsed;
  if (ilacUsed > 0) changed = true;
  state.population.ilacOk = ilacUsed >= ilacNeed * 0.99;

  const goldNeed = (alive * POP_GOLD_RATE) / TICKS_PER_SECOND;
  const goldUsed = Math.min(getResource("altin"), goldNeed);
  state.resources.altin -= goldUsed;
  if (goldUsed > 0) changed = true;

  for (const luxury of LUXURY_ORDER) {
    const need = (alive * LUXURY_RATES[luxury]) / TICKS_PER_SECOND;
    const used = Math.min(getResource(luxury), need);
    state.resources[luxury] -= used;
    if (used > 0) changed = true;
  }

  const sat = state.population.satisfaction;
  const newSat = sat + (happiness.target - sat) * 0.05;
  if (Math.abs(newSat - sat) > 0.01) {
    state.population.satisfaction = newSat;
    changed = true;
  }

  const suDeficitRatio = suNeed > 0 ? suDeficit(suNeed, suUsed) : 0;
  const foodDeficitRatio =
    foodNeed > 0 ? foodDeficit(foodNeed, coveredByEkmek, foodUsed) : 0;
  state.population.deficiency = Math.max(suDeficitRatio, foodDeficitRatio);

  return changed;
}

function suDeficit(need, used) {
  return Math.max(0, need - used) / need;
}

function foodDeficit(need, coveredByEkmek, foodUsed) {
  return Math.max(0, Math.max(0, need - coveredByEkmek) - foodUsed) / need;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YAŞAM DÖNGÜSÜ                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Yaşam Döngüsü İşlemcisi ─────────────────── */

export function applyPopulationLifecycle() {
  let changed = false;

  if (getPopulationAlive() > 0) {
    const sat = state.population.satisfaction;
    let threshold = 0.2;
    if (sat < 30) threshold = 0.12;
    else if (sat >= 50) threshold = 0.28;

    const deficiency = state.population.deficiency || 0;
    if (deficiency > threshold) {
      const excess = Math.min(1, (deficiency - threshold) / (1 - threshold));
      const ilacFactor = state.population.ilacOk ? 0.5 : 1;
      const deathRate = excess * 0.05 * ilacFactor;
      const deathAmount =
        (state.population.current * deathRate) / TICKS_PER_SECOND;

      if (deathAmount > 0) {
        state.population.current = Math.max(
          0,
          state.population.current - deathAmount,
        );
        changed = true;
        if (trimWorkers()) changed = true;
      }
    }
  }

  const queue = state.population.migrantQueue;
  const capacity = getPopulationCapacity();
  const hasFoodProduction =
    getTotalProduction("su") > 0 || getTotalProduction("yiyecek") > 0;
  if (state.population.current + queue.length < capacity && hasFoodProduction) {
    state.population.migrationTimer -= 1 / TICKS_PER_SECOND;
    if (state.population.migrationTimer <= 0) {
      queue.push({ remaining: ARRIVAL_DURATION });
      state.population.migrants = queue.length;
      state.population.migrationTimer = getMigrationInterval();
      changed = true;
    }
  } else {
    state.population.migrationTimer = 0;
  }

  if (queue.length > 0) {
    for (const migrant of queue) {
      migrant.remaining -= 1 / TICKS_PER_SECOND;
    }
    while (queue.length > 0 && queue[0].remaining <= 0) {
      queue.shift();
      state.population.migrants = queue.length;
      if (state.population.current + queue.length <= capacity) {
        state.population.current++;
      }
      changed = true;
    }
  }

  return changed;
}

function trimWorkers() {
  const alive = getPopulationAlive();
  let total = getWorkerCount();
  if (total <= alive) return false;

  let changed = false;
  const ids = Object.keys(INDUSTRY_DATA).reverse();

  for (const id of ids) {
    if (total <= alive) break;
    const entry = state.industry[id];
    const remove = Math.min(entry.workers, total - alive);
    if (remove > 0) {
      entry.workers -= remove;
      total -= remove;
      changed = true;
    }
  }

  return changed;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          OTOMATİK SATIŞ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Otomatik Satış İşlemcisi ─────────────────── */

export function autoSellSurplus() {
  let changed = false;

  for (const id of Object.keys(RESOURCES)) {
    if (!isSellable(id)) continue;
    if (!getAutoSell(id)) continue;

    const current = getResource(id);
    if (current < 1) continue;

    const amount = Math.floor(current);
    state.resources[id] -= amount;
    state.resources.altin += amount * getSellPrice(id);
    changed = true;
  }

  return changed;
}

