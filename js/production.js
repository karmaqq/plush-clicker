/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ÜRETİM HESAPLAMALARI                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  SEASONS_DATA,
  TICKS_PER_SECOND,
  POP_SU_RATE,
  POP_YIYECEK_RATE,
  POP_EKMEK_RATE,
  POP_ILAC_RATE,
  POP_GOLD_RATE,
  LUXURY_RATES,
} from "./config.js";
import { state, getResource, getBuildingCount, getPackCount, getPopulationAlive } from "./state.js";
import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA, STORAGE_DATA, ALL_BUILDINGS_DATA } from "./buildings.js";
import { PACKS_DATA } from "./packs.js";
import { INDUSTRY_DATA } from "./industry.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         ÇARPAN HESAPLAMALARI                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Çıktı Çarpanı Hesaplayıcı ─────────────────── */

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
      meta.tier !== "raw" &&
      meta.tier !== "currency" &&
      pack.productBonusPerLevel
    ) {
      sum += getPackCount(id) * pack.productBonusPerLevel;
    }
  }

  return 1 + sum;
}

/* ─────────────────── Maliyet İndirimi Hesaplayıcı ─────────────────── */

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

/* ─────────────────── İşçi Çarpanı Hesaplayıcı ─────────────────── */

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
/*                         KAPASİTE HESAPLAMALARI                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Kapasitesi Hesaplayıcı ─────────────────── */

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

/* ─────────────────── Kapasite Bonusu Hesaplayıcı ─────────────────── */

export function getCapacityBonus(id) {
  const building = ALL_BUILDINGS_DATA[id];
  if (!building || building.type !== "capacityBonus") return 0;

  return getBuildingCount(id) * (building.capacityBonusPerLevel || 0) * 100;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         HAM ÜRETİM HESAPLAMASI                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Üretim Hızı Hesaplayıcı ─────────────────── */

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

/* ─────────────────── Mevsim Çarpanı Hesaplayıcı ─────────────────── */

export function getSeasonMultiplier(resource) {
  const season = SEASONS_DATA[state.season.id];
  if (!season || !season.modifiers) return 1;
  const value = season.modifiers[resource];
  return typeof value === "number" ? value : 1;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         SANAYİ DURUMU                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sanayi Girişi Getter'ı ─────────────────── */

export function getIndustry(id) {
  return state.industry[id];
}

/* ─────────────────── Sanayi İnşaat Durumu ─────────────────── */

export function getIndustryBuilt(id) {
  return state.industry[id].built;
}

/* ─────────────────── Sanayi İşçi Sayısı ─────────────────── */

export function getIndustryWorkers(id) {
  return state.industry[id].workers;
}

/* ─────────────────── Sanayi Seviyesi Getter'ı ─────────────────── */

export function getIndustryLevel(id) {
  return state.industry[id].level || 1;
}

/* ─────────────────── Sanayi Maksimum İşçi Hesaplayıcı ─────────────────── */

export function getIndustryMaxWorkers(id) {
  const base = INDUSTRY_DATA[id].maxWorkers;
  return base + 3 * (getIndustryLevel(id) - 1);
}

/* ─────────────────── Sanayi Seviye Çarpanı ─────────────────── */

export function getIndustryLevelMultiplier(id) {
  return Math.pow(1.2, getIndustryLevel(id) - 1);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         SANAYİ ÜRETİMİ                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sanayi Çıktı Hızı Hesaplayıcı ─────────────────── */

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
/*                         TOPLAM ÜRETİM                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Toplam Üretim Hızı Hesaplayıcı ─────────────────── */

export function getTotalProduction(resource) {
  return getResourceProduction(resource) + getIndustryOutput(resource);
}

/* ─────────────────── Net Üretim Oranı Hesaplayıcı ─────────────────── */

export function getNetRate(resource) {
  return getTotalProduction(resource) - getResourceConsumption(resource);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         KAYNAK TÜKETİMİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Tüketim Hızı Hesaplayıcı ─────────────────── */

export function getResourceConsumption(resource) {
  let total = 0;

  if (resource === "power") {
    total += getPowerMaintenance();
  }

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
    if (resource === "sarap") total += pop * LUXURY_RATES.sarap;
    if (resource === "konyak") total += pop * LUXURY_RATES.konyak;
    if (resource === "kumas") total += pop * LUXURY_RATES.kumas;
    if (resource === "mobilya") total += pop * LUXURY_RATES.mobilya;
    if (resource === "mucevher") total += pop * LUXURY_RATES.mucevher;
    if (resource === "heykel") total += pop * LUXURY_RATES.heykel;
  }

  return total;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         ENERJİ BİLANÇOSU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Net Güç Üretimi Hesaplayıcı ─────────────────── */

export function getPowerProduction() {
  return Math.max(0, getResourceProduction("power") - getPowerMaintenance());
}

/* ─────────────────── Güç Bakım Maliyeti Hesaplayıcı ─────────────────── */

export function getPowerMaintenance() {
  let maintenance = 0;

  for (const id of Object.keys(BUILDINGS_DATA)) {
    const building = BUILDINGS_DATA[id];
    if (building.type === "producer") {
      maintenance += getBuildingCount(id) * building.production * 0.05;
    }
  }

  for (const id of Object.keys(INDUSTRY_DATA)) {
    const entry = state.industry[id];
    if (!entry.built || entry.workers <= 0) continue;
    const industry = INDUSTRY_DATA[id];
    for (const rate of Object.values(industry.output)) {
      maintenance += entry.workers * rate * 0.05;
    }
  }

  return maintenance;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         BİNA BAZLI ÜRETİM                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bina Üretim Hızı Hesaplayıcı ─────────────────── */

export function getBuildingProduction(id) {
  const building = BUILDINGS_DATA[id];
  if (!building || building.type !== "producer") return 0;

  const base = getBuildingCount(id) * building.production;
  if (base === 0) return 0;

  return base * getOutputMultiplier(building.outputResource);
}

/* ─────────────────── Bina Bonus Oranı Hesaplayıcı ─────────────────── */

export function getBuildingBonus(id) {
  const building = BUILDINGS_DATA[id];
  if (!building) return 0;

  if (building.type === "bonus") {
    return getBuildingCount(id) * (building.bonusPerLevel || 0) * 100;
  }
  return 0;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         BİLGİ ÜRETİMİ                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Bilgi Üretim Hızı Getter'ı ─────────────────── */

export function getInfoProduction() {
  return getResourceProduction("bilgi");
}

/* ─────────────────── Bilgi Üretim Kontrolü ─────────────────── */

export function hasInfoProduction() {
  return getInfoProduction() > 0;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         SATIŞ İŞLEMLERİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Satış Fiyatı Getter'ı ─────────────────── */

export function getSellPrice(resource) {
  const meta = RESOURCES[resource];
  return meta && meta.satisFiyati ? meta.satisFiyati : 0;
}

/* ─────────────────── Satılabilirlik Kontrolü ─────────────────── */

export function isSellable(resource) {
  const meta = RESOURCES[resource];
  return !!meta && Number.isFinite(meta.satisFiyati) && meta.satisFiyati > 0;
}

/* ─────────────────── Otomatik Satış Durumu ─────────────────── */

export function getAutoSell(resource) {
  return state.settings.autoSell[resource] === true;
}

/* ─────────────────── Otomatik Satış Değiştirici ─────────────────── */

export function toggleAutoSell(resource) {
  if (!isSellable(resource)) return;
  state.settings.autoSell[resource] = !getAutoSell(resource);
}

/* ─────────────────── Tekli Satış ─────────────────── */

export function sellOne(resource) {
  if (!isSellable(resource)) return false;
  if (getResource(resource) < 1) return false;
  state.resources[resource] -= 1;
  state.resources.altin += getSellPrice(resource);
  return true;
}

/* ─────────────────── Toplam İşçi Sayısı Hesaplayıcı ─────────────────── */

export function getWorkerCount() {
  let total = 0;

  for (const id of Object.keys(INDUSTRY_DATA)) {
    if (state.industry[id].built) {
      total += state.industry[id].workers;
    }
  }

  return total;
}
