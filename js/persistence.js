/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         KALICILIK YÖNETİMİ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { SEASON_DURATION, SEASONS_DATA, TRADE_INTERVAL, INDUSTRY_MAX_LEVEL, TRADE_PRICES, ARRIVAL_DURATION, STORAGE_KEY } from "./config.js";
import { state, freshIndustryEntry, listeners } from "./state.js";
import { RESOURCES } from "./resources.js";
import { PACKS_DATA } from "./packs.js";
import { INDUSTRY_DATA } from "./industry.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YARDIMCI FONKSİYONLAR                            */
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

function loadTrade(saved) {
  if (!saved || typeof saved !== "object") return;
  if (Number.isFinite(saved.timer))
    state.trade.timer = Math.max(0, saved.timer);
  if (saved.current && typeof saved.current === "object") {
    if (
      Number.isFinite(saved.current.cost) &&
      saved.current.get &&
      typeof saved.current.get === "object" &&
      Number.isFinite(saved.current.get.amount) &&
      TRADE_PRICES[saved.current.get.resource]
    ) {
      state.trade.current = {
        cost: saved.current.cost,
        get: {
          resource: saved.current.get.resource,
          amount: saved.current.get.amount,
        },
      };
    }
  }
  if (Number.isFinite(saved.count))
    state.trade.count = Math.max(0, Math.floor(saved.count));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         DURUM YÜKLEME                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Durum Yükleyici ─────────────────── */

export function loadState() {
  try {
    const rawV9 = localStorage.getItem(STORAGE_KEY);
    if (rawV9) {
      const saved = JSON.parse(rawV9);
      loadNumericMap(state.resources, saved.resources);
      loadNumericMap(state.buildings, saved.buildings, true);
      loadNumericMap(state.packs, saved.packs, true);
      loadIndustry(saved.industry);
      loadPopulation(saved.population);
      loadSeason(saved.season);
      loadTrade(saved.trade);
      loadSettings(saved.settings);
      return;
    }

    clearLegacyStorage();
    state.resources.power = 40;
  } catch (err) {
    console.warn("Kayıt yüklenemedi:", err);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         DURUM KAYDETME                                    */
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
      trade: state.trade,
      settings: state.settings,
    }),
  );
}

/* ─────────────────── Kayıt Zamanlayıcı ─────────────────── */

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
/*                         OYUN SIFIRLAMA                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Oyun Sıfırlayıcı ─────────────────── */

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
  };

  state.season = {
    id: "ilkbahar",
    timer: SEASON_DURATION,
  };

  state.trade = {
    timer: TRADE_INTERVAL,
    current: null,
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
/*                          ESKİ KAYITLARI TEMİZLE                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Eski Kayıt Temizleyici ─────────────────── */

export function clearLegacyStorage() {
  const legacyKeys = [
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
/*                          OTOMATİK KAYIT                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveState();
  });
}
