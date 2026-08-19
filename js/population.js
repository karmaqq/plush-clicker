/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        NÜFUS YÖNETİMİ                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  POP_SU_RATE,
  POP_YIYECEK_RATE,
  POP_EKMEK_RATE,
  POP_ILAC_RATE,
  POP_KULTUR_RATE,
  TICKS_PER_SECOND,
  ARRIVAL_DURATION,
  WORKER_WAGE_SEASONAL,
  SEASON_DURATION,
} from "./config.js";
import { state, getResource, getBuildingCount, getPopulationAlive } from "./state.js";
import { RESOURCES } from "./resources.js";
import { HOUSING_DATA } from "./buildings.js";
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

  if (alive <= 0) return { items, target: 100 };

  const ticks = TICKS_PER_SECOND;
  let target = 100;

  /* ═══ HAYATI KAYNAKLAR — Her zaman değerlendirilir ═══ */

  const suNeed = (alive * POP_SU_RATE) / ticks;
  const suMet = getResource("su") >= suNeed;
  if (!suMet) {
    const penalty = 15;
    target -= penalty;
  }
  items.push({
    emoji: "💧", label: "Temiz Su",
    delta: suMet ? 0 : -15, met: suMet,
  });

  const foodNeed = (alive * POP_YIYECEK_RATE) / ticks;
  const foodMet = getResource("yiyecek") >= foodNeed;
  if (!foodMet) {
    const penalty = 12;
    target -= penalty;
  }
  items.push({
    emoji: "🌾", label: "Yiyecek",
    delta: foodMet ? 0 : -12, met: foodMet,
  });

  /* ═══ SAĞLIK — Üretim zinciri varsa değerlendirilir ═══ */

  if (state.industry.sifaOcagi?.built) {
    const ilacNeed = (alive * POP_ILAC_RATE) / ticks;
    const ilacMet = getResource("ilac") >= ilacNeed;
    if (!ilacMet) {
      const penalty = 7;
      target -= penalty;
    }
    items.push({
      emoji: "💊", label: "İlaç",
      delta: ilacMet ? 0 : -7, met: ilacMet,
    });
  }

  /* ═══ LÜKS TIER 1 — Düşük nüfus eşiği ═══ */

  if (alive >= 5 && state.industry.firin?.built) {
    const ekmekNeed = (alive * POP_EKMEK_RATE) / ticks;
    const ekmekMet = getResource("ekmek") >= ekmekNeed;
    if (!ekmekMet) {
      const penalty = 5;
      target -= penalty;
    }
    items.push({
      emoji: "🍞", label: "Ekmek",
      delta: ekmekMet ? 0 : -5, met: ekmekMet,
    });
  }

  /* ═══ LÜKS TIER 2 — Orta nüfus eşiği ═══ */

  if (alive >= 20 && getBuildingCount("theatre") > 0) {
    const kulturNeed = (alive * POP_KULTUR_RATE) / ticks;
    const kulturMet = getResource("kultur") >= kulturNeed;
    if (!kulturMet) {
      const penalty = 5;
      target -= penalty;
    }
    items.push({
      emoji: "🎭", label: "Kültür",
      delta: kulturMet ? 0 : -5, met: kulturMet,
    });
  }

  /* ═══ LÜKS TIER 3 — Yüksek nüfus eşiği ═══ */

  if (alive >= 30 && getBuildingCount("temple") > 0) {
    const inancMet = getResource("inanç") > 0;
    if (!inancMet) {
      const penalty = 4;
      target -= penalty;
    }
    items.push({
      emoji: "🕯️", label: "İnanç",
      delta: inancMet ? 0 : -4, met: inancMet,
    });
  }

  if (alive >= 50 && getBuildingCount("silkWorkshop") > 0) {
    const ipekMet = getResource("ipek") > 0;
    if (!ipekMet) {
      const penalty = 5;
      target -= penalty;
    }
    items.push({
      emoji: "🧵", label: "İpek",
      delta: ipekMet ? 0 : -5, met: ipekMet,
    });
  }

  /* ═══ KONUT KONFORU ═══ */

  const evCap = getBuildingCount("ev") * HOUSING_DATA.ev.housingCapacity;
  const barakaCap =
    getBuildingCount("baraka") * HOUSING_DATA.baraka.housingCapacity;
  const totalCap = evCap + barakaCap;
  const evRatio = totalCap > 0 ? evCap / totalCap : 0;

  if (alive >= 10 && totalCap > 0) {
    if (evRatio < 0.2) {
      const penalty = 4;
      target -= penalty;
      items.push({ emoji: "🏠", label: "Konut Konforu", delta: -penalty, met: false });
    } else if (evRatio < 0.5) {
      const penalty = 2;
      target -= penalty;
      items.push({ emoji: "🏠", label: "Konut Konforu", delta: -penalty, met: false });
    } else {
      items.push({ emoji: "🏠", label: "Konut Konforu", delta: 0, met: true });
    }
  }

  /* ═══ MAAŞLAR ═══ */

  const wagesMet = state.population.wagesPaid;
  if (alive >= 5) {
    if (!wagesMet) {
      const penalty = 8;
      target -= penalty;
    }
    items.push({
      emoji: "💰", label: "İşçi Maaşları",
      delta: wagesMet ? 0 : -8, met: wagesMet,
    });
  }

  /* ═══ İŞGÜCÜ DENGESİ ═══ */

  let totalJobSlots = 0;
  for (const id of Object.keys(INDUSTRY_DATA)) {
    if (state.industry[id].built) totalJobSlots += getIndustryMaxWorkers(id);
  }
  if (totalJobSlots > 0) {
    const idleRatio = 1 - getWorkerCount() / alive;
    const jobMet = idleRatio <= 0.65;
    if (!jobMet) {
      const penalty = 3;
      target -= penalty;
    }
    items.push({
      emoji: "👷", label: "İşgücü Dengesi",
      delta: jobMet ? 0 : -3, met: jobMet,
    });
  }

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
    state.population.wagesPaid = true;
    return false;
  }

  const happiness = computeHappinessBreakdown();
  let changed = false;

  const suNeed = (alive * POP_SU_RATE) / TICKS_PER_SECOND;
  const suUsed = Math.min(getResource("su"), suNeed);
  state.resources.su -= suUsed;
  if (suUsed > 0) changed = true;

  const foodNeed = (alive * POP_YIYECEK_RATE) / TICKS_PER_SECOND;
  const foodUsed = Math.min(getResource("yiyecek"), foodNeed);
  state.resources.yiyecek -= foodUsed;
  if (foodUsed > 0) changed = true;

  const ekmekNeed = (alive * POP_EKMEK_RATE) / TICKS_PER_SECOND;
  const ekmekUsed = Math.min(getResource("ekmek"), ekmekNeed);
  state.resources.ekmek -= ekmekUsed;
  if (ekmekUsed > 0) changed = true;

  const ilacNeed = (alive * POP_ILAC_RATE) / TICKS_PER_SECOND;
  const ilacUsed = Math.min(getResource("ilac"), ilacNeed);
  state.resources.ilac -= ilacUsed;
  if (ilacUsed > 0) changed = true;
  state.population.ilacOk = ilacUsed >= ilacNeed * 0.80;

  const kulturNeed = (alive * POP_KULTUR_RATE) / TICKS_PER_SECOND;
  const kulturUsed = Math.min(getResource("kultur"), kulturNeed);
  state.resources.kultur -= kulturUsed;
  if (kulturUsed > 0) changed = true;

  /* ═══ MAAŞ ÖDEMESİ ═══ */

  const workerCount = getWorkerCount();
  const wageCostPerTick = (workerCount * WORKER_WAGE_SEASONAL) / SEASON_DURATION / TICKS_PER_SECOND;
  if (wageCostPerTick > 0) {
    const goldAvailable = getResource("altin");
    if (goldAvailable >= wageCostPerTick) {
      state.resources.altin -= wageCostPerTick;
      state.population.wagesPaid = true;
    } else {
      state.resources.altin = Math.max(0, goldAvailable - wageCostPerTick);
      state.population.wagesPaid = false;
    }
    changed = true;
  } else {
    state.population.wagesPaid = true;
  }

  /* ═══ TATMİN GÜNCELLEMESİ ═══ */

  const sat = state.population.satisfaction;
  const newSat = sat + (happiness.target - sat) * 0.10;
  if (Math.abs(newSat - sat) > 0.001) {
    state.population.satisfaction = newSat;
    changed = true;
  }

  const suDeficitRatio = suNeed > 0 ? suDeficit(suNeed, suUsed) : 0;
  const foodDeficitRatio = foodNeed > 0 ? foodDeficit(foodNeed, foodUsed) : 0;
  state.population.deficiency = Math.max(suDeficitRatio, foodDeficitRatio);

  return changed;
}

function suDeficit(need, used) {
  return Math.max(0, need - used) / need;
}

function foodDeficit(need, used) {
  return Math.max(0, need - used) / need;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YAŞAM DÖNGÜSÜ                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Yaşam Döngüsü İşlemcisi ─────────────────── */

export function applyPopulationLifecycle() {
  let changed = false;

  if (getPopulationAlive() > 0) {
    const sat = state.population.satisfaction;
    let threshold = 0.25;
    if (sat < 30) threshold = 0.15;
    else if (sat >= 50) threshold = 0.35;

    const deficiency = state.population.deficiency || 0;
    if (deficiency > threshold) {
      const excess = Math.min(1, (deficiency - threshold) / (1 - threshold));
      const ilacFactor = state.population.ilacOk ? 0.5 : 1;
      const deathRate = excess * 0.025 * ilacFactor;
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
