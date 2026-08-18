/* ═══════════════════════════════════════════════════════════════════════════ */
/*                              YAPILANDIRMA                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const SEASON_DURATION = 90;
export const INDUSTRY_MAX_LEVEL = 5;

export const SEASONS_DATA = {
  ilkbahar: {
    name: "İlkbahar",
    emoji: "🌱",
    modifiers: { su: 1.0, yiyecek: 1.0, tas: 1.0, ipek: 1.0, kultur: 1.0 },
  },
  yaz: {
    name: "Yaz",
    emoji: "☀️",
    modifiers: { su: 0.8, yiyecek: 1.2, tas: 1.0, ipek: 1.1, kultur: 1.2 },
  },
  sonbahar: {
    name: "Sonbahar",
    emoji: "🍂",
    modifiers: { su: 1.0, yiyecek: 1.0, tas: 0.9, ipek: 1.0, kultur: 1.0 },
  },
  kis: {
    name: "Kış",
    emoji: "❄️",
    modifiers: { su: 0.8, yiyecek: 0.6, tas: 0.9, ipek: 0.7, kultur: 1.0 },
  },
};

export const SEASON_ORDER = Object.keys(SEASONS_DATA);

export const TRADE_INTERVAL_MIN = 300;
export const TRADE_INTERVAL_MAX = 600;

export const TRADE_PRICES = {
  su: { buy: [2, 4], sell: [1, 2] },
  yiyecek: { buy: [3, 5], sell: [1, 3] },
  bilgi: { buy: [5, 8], sell: [2, 4] },
  tas: { buy: [3, 5], sell: [1, 3] },
  maden: { buy: [6, 10], sell: [3, 5] },
  kultur: { buy: [10, 15], sell: [5, 8] },
  inanc: { buy: [12, 18], sell: [6, 10] },
  ipek: { buy: [15, 25], sell: [8, 15] },
};

export const POP_SU_RATE = 0.020;
export const POP_YIYECEK_RATE = 0.030;
export const POP_EKMEK_RATE = 0.010;
export const POP_ILAC_RATE = 0.005;
export const POP_KULTUR_RATE = 0.002;
export const POP_GOLD_RATE = 0;
export const WORKER_WAGE_SEASONAL = 0;

export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

export const ARRIVAL_DURATION = 30;

export const DEV_START_ERA = 1;

export const STORAGE_KEY = "plush-clicker:state-v10";
