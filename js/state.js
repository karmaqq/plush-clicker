/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           DURUM YÖNETİMİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { SEASON_DURATION, SEASONS_DATA, TRADE_INTERVAL_MIN, TRADE_INTERVAL_MAX } from "./config.js";
import { RESOURCES } from "./resources.js";
import { ALL_BUILDINGS_DATA } from "./buildings.js";
import { PACKS_DATA } from "./packs.js";
import { INDUSTRY_DATA } from "./industry.js";

const initialTradeInterval = Math.random() * (TRADE_INTERVAL_MAX - TRADE_INTERVAL_MIN) + TRADE_INTERVAL_MIN;

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
    timer: initialTradeInterval,
    interval: initialTradeInterval,
    current: null,
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

/* ─────────────────── Sanayi Girişi Oluşturucu ─────────────────── */

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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         BASİT GETTER'LAR                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Getter'ı ─────────────────── */

export function getResource(resource) {
  return state.resources[resource] || 0;
}

/* ─────────────────── Güç Getter'ı ─────────────────── */

export function getPower() {
  return getResource("power");
}

/* ─────────────────── Altın Getter'ı ─────────────────── */

export function getAltin() {
  return getResource("altin");
}

/* ─────────────────── Bina Sayısı Getter'ı ─────────────────── */

export function getBuildingCount(id) {
  return state.buildings[id] || 0;
}

/* ─────────────────── Paket Sayısı Getter'ı ─────────────────── */

export function getPackCount(id) {
  return state.packs[id] || 0;
}

/* ─────────────────── Mevsim Getter'ı ─────────────────── */

export function getSeason() {
  return SEASONS_DATA[state.season.id];
}

/* ─────────────────── Mevsim Zamanlayıcı Getter'ı ─────────────────── */

export function getSeasonTimer() {
  return state.season.timer;
}

/* ─────────────────── Çağ Getter'ı ─────────────────── */

export function getEra() {
  return state.era.current;
}

/* ─────────────────── Çağ Geçiş Durumu Getter'ı ─────────────────── */

export function isEraTransitioning() {
  return state.era.transitioning;
}

/* ─────────────────── Canlı Nüfus Hesaplayıcı ─────────────────── */

export function getPopulationAlive() {
  return Math.floor(state.population.current);
}

/* ─────────────────── Değişiklik Dinleyici Kaydı ─────────────────── */

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
