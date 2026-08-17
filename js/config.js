/* ═══════════════════════════════════════════════════════════════════════════ */
/*                              YAPILANDIRMA                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const SEASON_DURATION = 45;
export const INDUSTRY_MAX_LEVEL = 5;

export const SEASONS_DATA = {
  ilkbahar: {
    name: "İlkbahar",
    emoji: "🌱",
    modifiers: { su: 1.15, yiyecek: 1.1 },
  },
  yaz: {
    name: "Yaz",
    emoji: "☀️",
    modifiers: { su: 1.25, yiyecek: 1.2, odun: 0.9 },
  },
  sonbahar: {
    name: "Sonbahar",
    emoji: "🍂",
    modifiers: { odun: 1.2, maden: 1.15, yiyecek: 0.95 },
  },
  kis: {
    name: "Kış",
    emoji: "❄️",
    modifiers: { su: 0.65, yiyecek: 0.65, odun: 1.15 },
  },
};

export const SEASON_ORDER = Object.keys(SEASONS_DATA);

export const TRADE_INTERVAL = 45;

export const TRADE_PRICES = {
  odun: 1,
  tas: 1.5,
  maden: 2,
  bilgi: 2,
  inanc: 2,
  baharat: 3,
  ekmek: 1,
  kereste: 2,
  demir: 3,
  ilac: 6,
  kumas: 7,
  konyak: 12,
  celik: 15,
  mermer: 20,
  mobilya: 30,
  mucevher: 50,
  heykel: 60,
};

export const TRADE_AMOUNTS = {
  1: [25, 40],
  2: [10, 20],
  3: [5, 10],
  4: [2, 6],
  5: [1, 3],
};

export const POP_SU_RATE = 0.08;
export const POP_YIYECEK_RATE = 0.1;
export const POP_EKMEK_RATE = 0.02;
export const POP_ILAC_RATE = 0.005;
export const POP_GOLD_RATE = 0.004;
export const WORKER_WAGE_SEASONAL = 5;

export const LUXURY_ORDER = [
  "sarap",
  "konyak",
  "kumas",
  "mobilya",
  "mucevher",
  "heykel",
];

export const LUXURY_RATES = {
  sarap: 0.0005,
  konyak: 0.00005,
  kumas: 0.00002,
  mobilya: 0.001,
  mucevher: 0.0003,
  heykel: 0.0003,
};

export const LUXURY_HAPPINESS = {
  sarap: 5,
  konyak: 6,
  kumas: 7,
  mobilya: 7,
  mucevher: 8,
  heykel: 9,
};

export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

export const ARRIVAL_DURATION = 30;

export const STORAGE_KEY = "plush-clicker:state-v9";
