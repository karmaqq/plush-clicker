/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          OYUN MOTORU                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  SEASON_DURATION,
  SEASON_ORDER,
  TICKS_PER_SECOND,
  TICK_MS,
  OFFLINE_MAX_SECONDS,
} from "./config.js";

export { TICK_MS };
import {
  state,
  getResource,
  getBuildingCount,
  listeners,
} from "./state.js";
import { scheduleSave } from "./persistence.js";
import { checkEraAdvance } from "./era-check.js";
import { RESOURCES } from "./resources.js";
import { INDUSTRY_DATA } from "./industry.js";
import {
  getTotalProduction,
  getResourceConsumption,
  getResourceCapacity,
  getPowerProduction,
  getOutputMultiplier,
  getWorkerMultiplier,
  getIndustryLevelMultiplier,
  getWorkerCount,
} from "./production.js";
import {
  consumePopulation,
  applyPopulationLifecycle,
  autoSellSurplus,
  getPopulationCapacity,
} from "./population.js";
import {
  getTradeInterval,
  generateTradeOffer,
} from "./trade.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TÜREVLENMİŞ DURUM                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          EMİT                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function emit(snapshot) {
  scheduleSave();

  if (!snapshot) snapshot = computeDerivedState();

  for (const fn of listeners) {
    fn(state, snapshot);
  }
}

export { emit };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          SANAYI ÜRÜN LİSTESİ                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const INDUSTRY_PRODUCTS = new Set();
for (const id of Object.keys(INDUSTRY_DATA)) {
  for (const outRes of Object.keys(INDUSTRY_DATA[id].output)) {
    INDUSTRY_PRODUCTS.add(outRes);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ANA OYUN DÖNGÜSÜ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Üretim İşlemcisi ─────────────────── */
export function produce(silent) {
  let changed = false;

  const snapshot = computeDerivedState();

  /* 1) Güç üretimi */
  const powerProduction = snapshot.powerProduction / TICKS_PER_SECOND;
  if (powerProduction > 0) {
    state.resources.power += powerProduction;
    changed = true;
  }

  /* 2) Ham kaynak üretimi */
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

  /* 3) Sanayi girdi/çıktıları */
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

  /* 4) Nüfus tüketimi ve yaşam döngüsü */
  if (consumePopulation()) changed = true;
  if (applyPopulationLifecycle()) changed = true;
  if (autoSellSurplus()) changed = true;

  /* 5) Mevsim geçişi */
  state.season.timer -= 1 / TICKS_PER_SECOND;
  if (state.season.timer <= 0) {
    const idx = SEASON_ORDER.indexOf(state.season.id);
    state.season.id = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
    state.season.timer = SEASON_DURATION;
    changed = true;
  }

  /* 6) Ticaret zamanlayıcısı */
  state.trade.timer -= 1 / TICKS_PER_SECOND;
  if (state.trade.timer <= 0) {
    state.trade.interval = getTradeInterval();
    state.trade.timer = state.trade.interval;
    state.trade.current = generateTradeOffer();
    changed = true;
  }

  if (changed && !silent) {
    emit(snapshot);
    checkEraAdvance();
  }
}

/* ─────────────────── Offline İşlemci ─────────────────── */
export function processOfflineProgress() {
  const lastActive = state.lastActive || Date.now();
  const now = Date.now();
  const elapsedMs = now - lastActive;
  const elapsedSeconds = Math.min(Math.floor(elapsedMs / 1000), OFFLINE_MAX_SECONDS);

  if (elapsedSeconds <= 0) return;

  const offlineTicks = elapsedSeconds * TICKS_PER_SECOND;

  for (let i = 0; i < offlineTicks; i++) {
    produce(true);
  }

  state.lastActive = Date.now();
  emit();
  checkEraAdvance();
}
