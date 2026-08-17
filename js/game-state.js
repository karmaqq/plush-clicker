/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      ANA BİDON DOSYASI (ESKİ IMPORT'LAR İÇİN)             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export { state, getResource, getPower, getAltin, getBuildingCount, getPackCount, getSeason, getSeasonTimer, onChange, listeners } from "./state.js";
export { loadState, saveState, scheduleSave, resetGame, clearLegacyStorage } from "./persistence.js";
export {
  getOutputMultiplier,
  getCostDiscount,
  getWorkerMultiplier,
  getResourceCapacity,
  getCapacityBonus,
  getResourceProduction,
  getSeasonMultiplier,
  getIndustry,
  getIndustryBuilt,
  getIndustryWorkers,
  getIndustryLevel,
  getIndustryMaxWorkers,
  getIndustryLevelMultiplier,
  getIndustryOutput,
  getTotalProduction,
  getNetRate,
  getResourceConsumption,
  getPowerProduction,
  getPowerMaintenance,
  getBuildingProduction,
  getBuildingBonus,
  getInfoProduction,
  hasInfoProduction,
  getSellPrice,
  isSellable,
  getAutoSell,
  toggleAutoSell,
  sellOne,
  getWorkerCount,
} from "./production.js";
export {
  getPopulationCurrent,
  getPopulationAlive,
  getPopulationCapacity,
  getPopulationSatisfaction,
  getPopulationDeficiency,
  getHappinessBreakdown,
  getMigrationInterval,
  getArrivalDuration,
  getPopulationMigrants,
  getMigrantQueue,
  consumePopulation,
  applyPopulationLifecycle,
  autoSellSurplus,
} from "./population.js";
export {
  getTradeInterval,
  getTradeCurrent,
  getTradeTimer,
  getTradeCount,
  acceptTrade,
} from "./trade.js";
export {
  getUnlock,
  getUnlockType,
  isNearUnlock,
  fillUnlockDesc,
  getBuildingCost,
  getPackCost,
  buyBuilding,
  buyPack,
  getIndustryCost,
  buildIndustry,
  getIndustryUpgradeCost,
  upgradeIndustry,
  addWorker,
  removeWorker,
} from "./unlock.js";
export { produce, emit } from "./engine.js";
export { TICK_MS } from "./config.js";
