/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          GAME CORE / CEKIRDEK MEKANIKLER                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  SEASON_DURATION,
  SEASONS_DATA,
  SEASON_ORDER,
  TRADE_MERCHANT_INTERVAL_MIN,
  TRADE_MERCHANT_INTERVAL_MAX,
  TICKS_PER_SECOND,
  TICK_MS,
  OFFLINE_MAX_SECONDS,
  INDUSTRY_MAX_LEVEL,
  STORAGE_KEY,
  ARRIVAL_DURATION,
  POP_SU_RATE,
  POP_YIYECEK_RATE,
  POP_EKMEK_RATE,
  POP_ILAC_RATE,
  POP_KULTUR_RATE,
  WORKER_WAGE_SEASONAL,
  RESOURCES,
  BUILDINGS_DATA,
  STORAGE_DATA,
  ALL_BUILDINGS_DATA,
  PACKS_DATA,
  INDUSTRY_DATA,
} from "./game-data.js";
import { canAfford } from "./utils.js";
import { checkEraAdvance, getResourceName, getBuildingName, getPackName } from "./era.js";
import {
  consumePopulation,
  applyPopulationLifecycle,
  autoSellSurplus,
  getPopulationCapacity,
} from "./population.js";
import { updateMerchants, setSkipMerchantUpdate } from "./trade.js";

export { TICK_MS };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          DURUM YONETIMI                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const state = {
  resources: {},
  buildings: {},
  packs: {},
  industry: {},
  population: {
    current: 0,
    migrants: 0,
    satisfaction: 50,
    migrationTimer: 0,
    migrantQueue: [],
    deficiency: 0,
    ilacOk: false,
    wagesPaid: true,
  },
  season: {
    id: "ilkbahar",
    timer: SEASON_DURATION,
  },
  trade: {
    merchants: [],
    spawnTimer: Math.random() * (TRADE_MERCHANT_INTERVAL_MAX - TRADE_MERCHANT_INTERVAL_MIN) + TRADE_MERCHANT_INTERVAL_MIN,
    nextId: 1,
    count: 0,
  },
  era: {
    current: 1,
    transitioning: false,
  },
  settings: {
    autoSell: {},
  },
  lastActive: Date.now(),
};

for (const id of Object.keys(RESOURCES)) {
  state.resources[id] = 0;
}
state.resources.power = 40;

for (const id of Object.keys(ALL_BUILDINGS_DATA)) {
  state.buildings[id] = 0;
}

for (const id of Object.keys(PACKS_DATA)) {
  state.packs[id] = 0;
}

/* ─────────────────── Sanayi Giris Olusturucu ─────────────────── */

export function freshIndustryEntry() {
  return {
    built: false,
    workers: 0,
    stalled: false,
    outputFull: false,
    level: 1,
  };
}

for (const id of Object.keys(INDUSTRY_DATA)) {
  state.industry[id] = freshIndustryEntry();
}

for (const id of Object.keys(RESOURCES)) {
  const meta = RESOURCES[id];
  if (meta.tier > 0 && meta.tier <= 3) {
    state.settings.autoSell[id] = false;
  }
}

export const listeners = new Set();

/* ─────────────────── Kaynak Getter'i ─────────────────── */

export function getResource(resource) {
  return state.resources[resource] || 0;
}

/* ─────────────────── Guclu Getter'i ─────────────────── */

export function getPower() {
  return getResource("power");
}

/* ─────────────────── Altin Getter'i ─────────────────── */

export function getAltin() {
  return getResource("altin");
}

/* ─────────────────── Bina Sayisi Getter'i ─────────────────── */

export function getBuildingCount(id) {
  return state.buildings[id] || 0;
}

/* ─────────────────── Paket Sayisi Getter'i ─────────────────── */

export function getPackCount(id) {
  return state.packs[id] || 0;
}

/* ─────────────────── Mevsim Getter'i ─────────────────── */

export function getSeason() {
  return SEASONS_DATA[state.season.id];
}

/* ─────────────────── Mevsim Zamanlayici Getter'i ─────────────────── */

export function getSeasonTimer() {
  return state.season.timer;
}

/* ─────────────────── Cag Getter'i ─────────────────── */

export function getEra() {
  return state.era.current;
}

/* ─────────────────── Cag Gecis Durumu Getter'i ─────────────────── */

export function isEraTransitioning() {
  return state.era.transitioning;
}

/* ─────────────────── Canli Nufus Hesaplayici ─────────────────── */

export function getPopulationAlive() {
  return Math.floor(state.population.current);
}

/* ─────────────────── Degisiklik Dinleyici Kaydi ─────────────────── */

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          URETIM HESAPLAMALARI                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Cikti Carpani Hesaplayici ─────────────────── */

export function getOutputMultiplier(resource) {
  let sum = 0;

  for (const id of Object.keys(BUILDINGS_DATA)) {
    const building = BUILDINGS_DATA[id];
    if (
      building.type === "bonus" &&
      building.targetResource === resource &&
      building.bonusPerLevel
    ) {
      sum += getBuildingCount(id) * building.bonusPerLevel;
    }
  }

  const meta = RESOURCES[resource];

  for (const id of Object.keys(PACKS_DATA)) {
    const pack = PACKS_DATA[id];
    if (pack.productionBonusPerLevel) {
      sum += getPackCount(id) * pack.productionBonusPerLevel;
    }
    if (resource === "power" && pack.powerBonusPerLevel) {
      sum += getPackCount(id) * pack.powerBonusPerLevel;
    }
    if (
      meta &&
      meta.tier !== 0 &&
      meta.tier !== -1 &&
      pack.productBonusPerLevel
    ) {
      sum += getPackCount(id) * pack.productBonusPerLevel;
    }
  }

  return 1 + sum;
}

/* ─────────────────── Maliyet Indirimi Hesaplayici ─────────────────── */

export function getCostDiscount() {
  let discount = 0;
  for (const id of Object.keys(PACKS_DATA)) {
    const pack = PACKS_DATA[id];
    if (pack.costDiscountPerLevel) {
      discount += getPackCount(id) * pack.costDiscountPerLevel;
    }
  }
  return Math.max(0.5, 1 - discount);
}

/* ─────────────────── Isci Carpani Hesaplayici ─────────────────── */

export function getWorkerMultiplier() {
  let bonus = 0;
  for (const id of Object.keys(PACKS_DATA)) {
    const pack = PACKS_DATA[id];
    if (pack.workerBonusPerLevel) {
      bonus += getPackCount(id) * pack.workerBonusPerLevel;
    }
  }
  return 1 + bonus;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          KAPASITE HESAPLAMALARI                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Kapasitesi Hesaplayici ─────────────────── */

export function getResourceCapacity(resource) {
  const meta = RESOURCES[resource];
  if (!meta) return 0;

  if (meta.baseCapacity === Infinity) return Infinity;

  const depoCount = getBuildingCount("depo");
  const ambarCount = getBuildingCount("ambar");
  const ambarData = STORAGE_DATA.ambar || {};

  const flat =
    depoCount * (meta.storagePerDepo || 0) +
    ambarCount * (meta.storagePerAmbar || 0);

  let storageBonus = 0;
  for (const id of Object.keys(PACKS_DATA)) {
    const pack = PACKS_DATA[id];
    if (pack.storageBonusPerLevel) {
      storageBonus += getPackCount(id) * pack.storageBonusPerLevel;
    }
  }

  const multiplier =
    1 + ambarCount * (ambarData.capacityBonusPerLevel || 0) + storageBonus;

  return (meta.baseCapacity + flat) * multiplier;
}

/* ─────────────────── Kapasite Bonusu Hesaplayici ─────────────────── */

export function getCapacityBonus(id) {
  const building = ALL_BUILDINGS_DATA[id];
  if (!building || building.type !== "capacityBonus") return 0;

  return getBuildingCount(id) * (building.capacityBonusPerLevel || 0) * 100;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          HAM URETIM HESAPLAMASI                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Uretim Hizi Hesaplayici ─────────────────── */

export function getResourceProduction(resource) {
  let base = 0;

  for (const id of Object.keys(BUILDINGS_DATA)) {
    const building = BUILDINGS_DATA[id];
    if (building.type === "producer" && building.outputResource === resource) {
      base += getBuildingCount(id) * building.production;
    }
  }

  if (base === 0) return 0;
  return base * getOutputMultiplier(resource) * getSeasonMultiplier(resource);
}

/* ─────────────────── Mevsim Carpani Hesaplayici ─────────────────── */

export function getSeasonMultiplier(resource) {
  const season = SEASONS_DATA[state.season.id];
  if (!season || !season.modifiers) return 1;
  const value = season.modifiers[resource];
  return typeof value === "number" ? value : 1;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          SANAYI DURUMU                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sanayi Giris Getter'i ─────────────────── */

export function getIndustry(id) {
  return state.industry[id];
}

/* ─────────────────── Sanayi Insaat Durumu ─────────────────── */

export function getIndustryBuilt(id) {
  return state.industry[id].built;
}

/* ─────────────────── Sanayi Isci Sayisi ─────────────────── */

export function getIndustryWorkers(id) {
  return state.industry[id].workers;
}

/* ─────────────────── Sanayi Seviyesi Getter'i ─────────────────── */

export function getIndustryLevel(id) {
  return state.industry[id].level || 1;
}

/* ─────────────────── Sanayi Maksimum Isci Hesaplayici ─────────────────── */

export function getIndustryMaxWorkers(id) {
  const base = INDUSTRY_DATA[id].maxWorkers;
  return base + 3 * (getIndustryLevel(id) - 1);
}

/* ─────────────────── Sanayi Seviye Carpani ─────────────────── */

export function getIndustryLevelMultiplier(id) {
  return Math.pow(1.2, getIndustryLevel(id) - 1);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          SANAYI URETIMI                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sanayi Cikti Hizi Hesaplayici ─────────────────── */

export function getIndustryOutput(resource) {
  let total = 0;

  for (const id of Object.keys(INDUSTRY_DATA)) {
    const industry = INDUSTRY_DATA[id];
    const entry = state.industry[id];
    if (!entry.built || entry.workers <= 0) continue;
    if (industry.output[resource]) {
      total +=
        entry.workers *
        industry.output[resource] *
        getIndustryLevelMultiplier(id);
    }
  }

  if (total === 0) return 0;
  return total * getOutputMultiplier(resource) * getWorkerMultiplier();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TOPLAM URETIM                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Toplam Uretim Hizi Hesaplayici ─────────────────── */

export function getTotalProduction(resource) {
  return getResourceProduction(resource) + getIndustryOutput(resource);
}

/* ─────────────────── Net Uretim Orani Hesaplayici ─────────────────── */

export function getNetRate(resource) {
  return getTotalProduction(resource) - getResourceConsumption(resource);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          KAYNAK TUKETIMI                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Tuketim Hizi Hesaplayici ─────────────────── */

export function getResourceConsumption(resource) {
  let total = 0;

  for (const id of Object.keys(INDUSTRY_DATA)) {
    const industry = INDUSTRY_DATA[id];
    const entry = state.industry[id];
    if (!entry.built || entry.workers <= 0) continue;
    if (industry.input[resource]) {
      total +=
        entry.workers *
        industry.input[resource] *
        getIndustryLevelMultiplier(id);
    }
  }

  const pop = getPopulationAlive();
  if (pop > 0) {
    if (resource === "su") total += pop * POP_SU_RATE;
    if (resource === "yiyecek") total += pop * POP_YIYECEK_RATE;
    if (resource === "ekmek") total += pop * POP_EKMEK_RATE;
    if (resource === "ilac") total += pop * POP_ILAC_RATE;
    if (resource === "kultur") total += pop * POP_KULTUR_RATE;
  }

  return total;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ENERJI BILANCOSU                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Net Guclu Uretimi Hesaplayici ─────────────────── */

export function getPowerProduction() {
  return Math.max(0, getResourceProduction("power"));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          BINA BAZLI URETIM                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Uretim Hizi Hesaplayici ─────────────────── */

export function getBuildingProduction(id) {
  const building = BUILDINGS_DATA[id];
  if (!building || building.type !== "producer") return 0;

  const base = getBuildingCount(id) * building.production;
  if (base === 0) return 0;

  return base * getOutputMultiplier(building.outputResource);
}

/* ─────────────────── Bina Bonus Orani Hesaplayici ─────────────────── */

export function getBuildingBonus(id) {
  const building = BUILDINGS_DATA[id];
  if (!building) return 0;

  if (building.type === "bonus") {
    return getBuildingCount(id) * (building.bonusPerLevel || 0) * 100;
  }
  return 0;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          BILGI URETIMI                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bilgi Uretim Hizi Getter'i ─────────────────── */

export function getInfoProduction() {
  return getResourceProduction("bilgi");
}

/* ─────────────────── Bilgi Uretim Kontrolu ─────────────────── */

export function hasInfoProduction() {
  return getInfoProduction() > 0;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          SATIS ISLEMLERI                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Satis Fiyati Getter'i ─────────────────── */

export function getSellPrice(resource) {
  const meta = RESOURCES[resource];
  return meta && meta.satisFiyati ? meta.satisFiyati : 0;
}

/* ─────────────────── Satilabilirlik Kontrolu ─────────────────── */

export function isSellable(resource) {
  const meta = RESOURCES[resource];
  return !!meta && Number.isFinite(meta.satisFiyati) && meta.satisFiyati > 0;
}

/* ─────────────────── Otomatik Satis Durumu ─────────────────── */

export function getAutoSell(resource) {
  return state.settings.autoSell[resource] === true;
}

/* ─────────────────── Otomatik Satis Degistirici ─────────────────── */

export function toggleAutoSell(resource) {
  if (!isSellable(resource)) return;
  state.settings.autoSell[resource] = !getAutoSell(resource);
}

/* ─────────────────── Tekli Satis ─────────────────── */

export function sellOne(resource) {
  if (!isSellable(resource)) return false;
  if (getResource(resource) < 1) return false;
  state.resources[resource] -= 1;
  state.resources.altin += getSellPrice(resource);
  return true;
}

/* ─────────────────── Toplam Isci Sayisi Hesaplayici ─────────────────── */

export function getWorkerCount() {
  let total = 0;

  for (const id of Object.keys(INDUSTRY_DATA)) {
    if (state.industry[id].built) {
      total += state.industry[id].workers;
    }
  }

  return total;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     KILIT SISTEMI VE SATIN ALMA                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const UNLOCK_STRATEGIES = {
  building: {
    isMet: (unlock) => getBuildingCount(unlock.id) >= unlock.count,
    progress: (unlock) =>
      Math.min(getBuildingCount(unlock.id), unlock.count) + "/" + unlock.count,
    isNear: (unlock) => getBuildingCount(unlock.id) > 0,
    target: (unlock) => getBuildingName(unlock.id),
  },
  pack: {
    isMet: (unlock) => getPackCount(unlock.id) >= unlock.level,
    progress: (unlock) =>
      Math.min(getPackCount(unlock.id), unlock.level) + "/" + unlock.level,
    isNear: (unlock) => getPackCount(unlock.id) > 0,
    target: (unlock) => getPackName(unlock.id),
  },
  resource: {
    isMet: (unlock) => getResource(unlock.id) >= unlock.amount,
    progress: (unlock) =>
      Math.min(getResource(unlock.id), unlock.amount) + "/" + unlock.amount,
    isNear: () => false,
    target: (unlock) => getResourceName(unlock.id),
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

/* ─────────────────── Kilit Durumu Kontrolu ─────────────────── */

export function getUnlock(data) {
  if (!data || !data.unlock) return true;

  const strategy = UNLOCK_STRATEGIES[data.unlock.type];
  return strategy ? strategy.isMet(data.unlock) : true;
}

/* ─────────────────── Kilit Turu Getter'i ─────────────────── */

export function getUnlockType(data) {
  if (!data || !data.unlock) return null;
  return data.unlock.type;
}

/* ─────────────────── Yakin Kilit Kontrolu ─────────────────── */

export function isNearUnlock(data) {
  if (!data || !data.unlock) return true;

  const strategy = UNLOCK_STRATEGIES[data.unlock.type];
  return strategy ? strategy.isNear(data.unlock) : true;
}

/* ─────────────────── Kilit Aciklamasi Dolgulayici ─────────────────── */

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
/*                       MALIYET HESAPLAMALARI                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Maliyeti Hesaplayici ─────────────────── */

export function getBuildingCost(id) {
  const building = ALL_BUILDINGS_DATA[id];
  const multiplier = Math.pow(building.costMultiplier, getBuildingCount(id));
  const cost = {};

  for (const [resource, amount] of Object.entries(building.baseCost)) {
    cost[resource] = Math.ceil(amount * multiplier * getCostDiscount());
  }

  return cost;
}

/* ─────────────────── Paket Maliyeti Hesaplayici ─────────────────── */

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
/*                       SATIN ALMA ISLEMLERI                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Satin Alma Islemcisi ─────────────────── */

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

/* ─────────────────── Paket Satin Alma Islemcisi ─────────────────── */

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
/*                        SANAYI ISLEMLERI                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sanayi Maliyeti Hesaplayici ─────────────────── */

export function getIndustryCost(id) {
  const industry = INDUSTRY_DATA[id];
  const cost = {};

  for (const [resource, amount] of Object.entries(industry.baseCost)) {
    cost[resource] = Math.ceil(amount);
  }

  return cost;
}

/* ─────────────────── Sanayi Insaat Islemcisi ─────────────────── */

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

/* ─────────────────── Sanayi Yukseltme Maliyeti Hesaplayici ─────────────────── */

export function getIndustryUpgradeCost(id) {
  const level = getIndustryLevel(id);
  if (level >= INDUSTRY_MAX_LEVEL) return null;

  const cost = {};
  for (const [resource, amount] of Object.entries(INDUSTRY_DATA[id].baseCost)) {
    cost[resource] = Math.ceil(amount * level);
  }
  return cost;
}

/* ─────────────────── Sanayi Yukseltme Islemcisi ─────────────────── */

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

/* ─────────────────── Isci Maliyeti Hesaplayici ─────────────────── */

const WORKER_BASE_COST = 10;

export function getWorkerCost(id) {
  const entry = state.industry[id];
  if (!entry) return null;
  const currentWorkers = entry.workers;
  const multiplier = Math.pow(currentWorkers + 1, 1.5);
  return { power: Math.floor(WORKER_BASE_COST * multiplier) };
}

/* ─────────────────── Isci Ekleme Islemcisi ─────────────────── */

export function addWorker(id) {
  const entry = state.industry[id];
  if (!entry.built) return false;
  if (entry.workers >= getIndustryMaxWorkers(id)) return false;
  if (getWorkerCount() >= getPopulationAlive()) return false;

  const cost = getWorkerCost(id);
  if (!canAfford(cost, getResource)) return false;

  pay(cost);
  entry.workers++;
  emit();
  return true;
}

/* ─────────────────── Isci Cikarma Islemcisi ─────────────────── */

export function removeWorker(id) {
  const entry = state.industry[id];
  if (entry.workers <= 0) return false;

  entry.workers--;
  emit();
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          OYUN MOTORU                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Turevlenmis Durum ─────────────────── */

function computeDerivedState() {
  const derived = {};

  for (const id of Object.keys(RESOURCES)) {
    const production = getTotalProduction(id);
    const consumption = getResourceConsumption(id);
    derived[id] = {
      production,
      consumption,
      net: production - consumption,
      capacity: getResourceCapacity(id),
    };
  }

  return {
    derived,
    powerProduction: getPowerProduction(),
    population: {
      current: state.population.current,
      capacity: getPopulationCapacity(),
      workers: getWorkerCount(),
      satisfaction: state.population.satisfaction,
      migrants: state.population.migrants,
    },
  };
}

/* ─────────────────── Emit ─────────────────── */

export function emit(snapshot) {
  scheduleSave();

  if (!snapshot) snapshot = computeDerivedState();

  for (const fn of listeners) {
    fn(state, snapshot);
  }
}

/* ─────────────────── Sanayi Urun Listesi ─────────────────── */

const INDUSTRY_PRODUCTS = new Set();
for (const id of Object.keys(INDUSTRY_DATA)) {
  for (const outRes of Object.keys(INDUSTRY_DATA[id].output)) {
    INDUSTRY_PRODUCTS.add(outRes);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ANA OYUN DONGISI                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Uretim Islemcisi ─────────────────── */
export function produce(silent) {
  let changed = false;

  const snapshot = computeDerivedState();

  const powerProduction = snapshot.powerProduction / TICKS_PER_SECOND;
  if (powerProduction > 0) {
    state.resources.power += powerProduction;
    changed = true;
  }

  for (const resource of Object.keys(RESOURCES)) {
    if (resource === "power" || resource === "altin") continue;
    if (INDUSTRY_PRODUCTS.has(resource)) continue;

    const production = snapshot.derived[resource].production / TICKS_PER_SECOND;
    if (production > 0) {
      state.resources[resource] = Math.min(
        snapshot.derived[resource].capacity,
        state.resources[resource] + production,
      );
      changed = true;
    }
  }

  for (const id of Object.keys(INDUSTRY_DATA)) {
    const industry = INDUSTRY_DATA[id];
    const entry = state.industry[id];
    if (!entry.built || entry.workers <= 0) continue;

    let inputsOk = true;
    for (const [resource, rate] of Object.entries(industry.input)) {
      const need = (entry.workers * rate) / TICKS_PER_SECOND;
      if (getResource(resource) < need) {
        inputsOk = false;
        break;
      }
    }

    let outputsOk = true;
    for (const [resource] of Object.entries(industry.output)) {
      const capacity = getResourceCapacity(resource);
      if (Number.isFinite(capacity) && getResource(resource) >= capacity) {
        outputsOk = false;
        break;
      }
    }

    if (!inputsOk) {
      if (!entry.stalled) {
        entry.stalled = true;
        changed = true;
      }
      continue;
    }

    if (!outputsOk) {
      if (!entry.outputFull) {
        entry.outputFull = true;
        changed = true;
      }
      continue;
    }

    if (entry.stalled) {
      entry.stalled = false;
      changed = true;
    }
    if (entry.outputFull) {
      entry.outputFull = false;
      changed = true;
    }

    const levelMult = getIndustryLevelMultiplier(id);

    for (const [resource, rate] of Object.entries(industry.input)) {
      state.resources[resource] -=
        (entry.workers * rate * levelMult) / TICKS_PER_SECOND;
    }

    for (const [resource, rate] of Object.entries(industry.output)) {
      const capacity = getResourceCapacity(resource);
      const produced =
        (entry.workers *
          rate *
          levelMult *
          getOutputMultiplier(resource) *
          getWorkerMultiplier()) /
        TICKS_PER_SECOND;
      state.resources[resource] = Number.isFinite(capacity)
        ? Math.min(capacity, state.resources[resource] + produced)
        : state.resources[resource] + produced;
    }

    changed = true;
  }

  if (consumePopulation()) changed = true;
  if (applyPopulationLifecycle()) changed = true;
  if (autoSellSurplus()) changed = true;

  state.season.timer -= 1 / TICKS_PER_SECOND;
  if (state.season.timer <= 0) {
    const idx = SEASON_ORDER.indexOf(state.season.id);
    state.season.id = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
    state.season.timer = SEASON_DURATION;
    changed = true;
  }

  updateMerchants(1 / TICKS_PER_SECOND);

  if (changed && !silent) {
    emit(snapshot);
    checkEraAdvance();
  }
}

/* ─────────────────── Offline Islemci ─────────────────── */
export function processOfflineProgress() {
  const lastActive = state.lastActive || Date.now();
  const now = Date.now();
  const elapsedMs = now - lastActive;
  const elapsedSeconds = Math.min(Math.floor(elapsedMs / 1000), OFFLINE_MAX_SECONDS);

  if (elapsedSeconds <= 0) return;

  const offlineTicks = elapsedSeconds * TICKS_PER_SECOND;

  setSkipMerchantUpdate(true);
  for (let i = 0; i < offlineTicks; i++) {
    produce(true);
  }
  setSkipMerchantUpdate(false);

  state.lastActive = Date.now();
  emit();
  checkEraAdvance();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          KALICILIK YONETIMI                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function loadNumericMap(target, saved, floor) {
  if (!saved || typeof saved !== "object") return;
  for (const id of Object.keys(target)) {
    if (Number.isFinite(saved[id])) {
      target[id] = floor ? Math.floor(saved[id]) : saved[id];
    }
  }
}

function loadIndustry(saved) {
  if (!saved || typeof saved !== "object") return;
  for (const id of Object.keys(state.industry)) {
    const entry = saved[id];
    if (!entry || typeof entry !== "object") continue;
    if (entry.built === true) state.industry[id].built = true;
    if (Number.isFinite(entry.workers)) {
      state.industry[id].workers = Math.max(0, Math.floor(entry.workers));
    }
    if (entry.stalled === true) state.industry[id].stalled = true;
    if (entry.outputFull === true) state.industry[id].outputFull = true;
    if (Number.isFinite(entry.level)) {
      state.industry[id].level = Math.min(
        INDUSTRY_MAX_LEVEL,
        Math.max(1, Math.floor(entry.level)),
      );
    }
  }
}

function loadPopulation(saved) {
  if (!saved || typeof saved !== "object") return;
  if (Number.isFinite(saved.current))
    state.population.current = Math.max(0, saved.current);
  if (Array.isArray(saved.migrantQueue)) {
    state.population.migrantQueue = saved.migrantQueue
      .filter((m) => m && Number.isFinite(m.remaining))
      .map((m) => ({ remaining: Math.max(0, m.remaining) }));
  } else if (Number.isFinite(saved.migrants) && saved.migrants > 0) {
    const remaining = Number.isFinite(saved.arrivalTimer)
      ? Math.max(0, saved.arrivalTimer)
      : ARRIVAL_DURATION;
    state.population.migrantQueue = Array.from(
      { length: Math.floor(saved.migrants) },
      () => ({ remaining }),
    );
  }
  state.population.migrants = state.population.migrantQueue.length;
  if (Number.isFinite(saved.satisfaction)) {
    state.population.satisfaction = Math.min(
      100,
      Math.max(0, saved.satisfaction),
    );
  }
  if (Number.isFinite(saved.migrationTimer))
    state.population.migrationTimer = saved.migrationTimer;
}

function loadSettings(saved) {
  if (!saved || typeof saved !== "object") return;
  if (saved.autoSell && typeof saved.autoSell === "object") {
    for (const id of Object.keys(state.settings.autoSell)) {
      if (typeof saved.autoSell[id] === "boolean") {
        state.settings.autoSell[id] = saved.autoSell[id];
      }
    }
  }
}

function loadSeason(saved) {
  if (!saved || typeof saved !== "object") return;
  if (SEASONS_DATA[saved.id]) state.season.id = saved.id;
  if (Number.isFinite(saved.timer))
    state.season.timer = Math.max(0, saved.timer);
}

function loadEra(saved) {
  if (!saved || typeof saved !== "object") return;
  if (Number.isFinite(saved.current) && saved.current >= 1 && saved.current <= 3) {
    state.era.current = saved.current;
  }
  if (typeof saved.transitioning === "boolean") {
    state.era.transitioning = saved.transitioning;
  }
}

function loadLastActive(saved) {
  if (Number.isFinite(saved)) {
    state.lastActive = saved;
  } else {
    state.lastActive = Date.now();
  }
}

function loadTrade(saved) {
  if (!saved || typeof saved !== "object") return;

  if (Array.isArray(saved.merchants)) {
    state.trade.merchants = saved.merchants.filter(m =>
      m && typeof m === "object" &&
      m.stock && typeof m.stock === "object" &&
      m.priceModifiers && typeof m.priceModifiers === "object"
    );
  }

  if (Number.isFinite(saved.spawnTimer)) {
    state.trade.spawnTimer = Math.max(0, saved.spawnTimer);
  }
  if (Number.isFinite(saved.nextId)) {
    state.trade.nextId = Math.max(1, saved.nextId);
  }
  if (Number.isFinite(saved.count)) {
    state.trade.count = Math.max(0, Math.floor(saved.count));
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          DURUM YUKLEME                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Durum Yukleyici ─────────────────── */

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      loadNumericMap(state.resources, saved.resources);
      loadNumericMap(state.buildings, saved.buildings, true);
      loadNumericMap(state.packs, saved.packs, true);
      loadIndustry(saved.industry);
      loadPopulation(saved.population);
      loadSeason(saved.season);
      loadEra(saved.era);
      loadTrade(saved.trade);
      loadSettings(saved.settings);
      loadLastActive(saved.lastActive);
      return;
    }

    clearLegacyStorage();
    state.resources.power = 40;
  } catch (err) {
    console.warn("Kayit yuklenemedi:", err);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          DURUM KAYDETME                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

let savePending = false;
let saveTimer = null;
let suppressSave = false;

/* ─────────────────── Durum Kaydedici ─────────────────── */

export function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      resources: state.resources,
      buildings: state.buildings,
      packs: state.packs,
      industry: state.industry,
      population: state.population,
      season: state.season,
      era: state.era,
      trade: {
        merchants: state.trade.merchants,
        spawnTimer: state.trade.spawnTimer,
        nextId: state.trade.nextId,
        count: state.trade.count,
      },
      settings: state.settings,
      lastActive: Date.now(),
    }),
  );
}

/* ─────────────────── Kayit Zamanlayici ─────────────────── */

export function scheduleSave() {
  if (suppressSave) return;
  if (savePending) return;

  savePending = true;
  saveTimer = setTimeout(() => {
    savePending = false;
    saveTimer = null;
    saveState();
  }, 500);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          OYUN SIFIRLAMA                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Oyun Sifirlayici ─────────────────── */

export function resetGame() {
  for (const id of Object.keys(state.resources)) {
    state.resources[id] = 0;
  }

  for (const id of Object.keys(state.buildings)) {
    state.buildings[id] = 0;
  }

  for (const id of Object.keys(state.packs)) {
    state.packs[id] = 0;
  }

  for (const id of Object.keys(INDUSTRY_DATA)) {
    state.industry[id] = freshIndustryEntry();
  }

  state.population = {
    current: 0,
    migrants: 0,
    satisfaction: 50,
    migrationTimer: 0,
    migrantQueue: [],
    deficiency: 0,
    ilacOk: false,
    wagesPaid: true,
  };

  state.season = {
    id: "ilkbahar",
    timer: SEASON_DURATION,
  };

  state.era = {
    current: 1,
    transitioning: false,
  };

  state.trade = {
    merchants: [],
    spawnTimer: Math.random() * (TRADE_MERCHANT_INTERVAL_MAX - TRADE_MERCHANT_INTERVAL_MIN) + TRADE_MERCHANT_INTERVAL_MIN,
    nextId: 1,
    count: 0,
  };

  for (const id of Object.keys(state.settings.autoSell)) {
    state.settings.autoSell[id] = false;
  }

  state.resources.power = 40;

  suppressSave = true;
  emitReset();
  suppressSave = false;
  clearLegacyStorage();
}

function emitReset() {
  for (const fn of listeners) {
    fn(state, null);
  }
  scheduleSave();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ESKI KAYITLARI TEMIZLE                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Eski Kayit Temizleyici ─────────────────── */

export function clearLegacyStorage() {
  const legacyKeys = [
    "plush-clicker:state-v11",
    "plush-clicker:state-v10",
    "plush-clicker:state-v9",
    "plush-clicker:state-v8",
    "plush-clicker:state-v7",
    "plush-clicker:state-v6",
    "plush-clicker:state-v5",
    "plush-clicker:state-v4",
    "plush-clicker:state-v3",
  ];
  for (const key of legacyKeys) {
    localStorage.removeItem(key);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          OTOMATIK KAYIT                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveState();
  });
}
