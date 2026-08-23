/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          GAME DATA / VERİ TANIMLARI                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YAPILANDIRMA                                     */
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
    modifiers: { su: 0.8, yiyecek: 0.7, tas: 0.9, ipek: 0.7, kultur: 1.0 },
  },
};

export const SEASON_ORDER = Object.keys(SEASONS_DATA);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YENİ TİCARET YAPILANDIRMASI                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const TRADE_MERCHANT_STAY_MIN = 45;
export const TRADE_MERCHANT_STAY_MAX = 120;
export const TRADE_MERCHANT_INTERVAL_MIN = 120;
export const TRADE_MERCHANT_INTERVAL_MAX = 300;

/* ─────────────────── Ticaret Ürün Havuzu ─────────────────── */
export const TRADE_ITEM_POOL = {
  su:        { basePrice: 1,   minQty: 200, maxQty: 500, tier: 1 },
  yiyecek:   { basePrice: 1,   minQty: 150, maxQty: 400, tier: 1 },
  ekmek:     { basePrice: 3,   minQty: 80,  maxQty: 200, tier: 1 },
  tas:       { basePrice: 1,   minQty: 100, maxQty: 150, tier: 2 },
  maden:     { basePrice: 2,   minQty: 40,  maxQty: 50,  tier: 2 },
  demir:     { basePrice: 6,   minQty: 30,  maxQty: 30,  tier: 2 },
  ipek:      { basePrice: 20,  minQty: 5,   maxQty: 20, tier: 3 },
  mermer:    { basePrice: 15,  minQty: 10,  maxQty: 30, tier: 3 },
  celik:     { basePrice: 14,  minQty: 8,   maxQty: 25, tier: 3 },
  kumas:     { basePrice: 17,  minQty: 5,   maxQty: 15, tier: 3 },
  ilac:      { basePrice: 20,  minQty: 5,   maxQty: 15, tier: 3 },
  mobilya:   { basePrice: 24,  minQty: 3,   maxQty: 10, tier: 3 },
  heykel:    { basePrice: 30,  minQty: 2,   maxQty: 6,  tier: 3 },
  mucevher:  { basePrice: 45,  minQty: 1,   maxQty: 4,  tier: 3 },
};

/* ─────────────────── Ticaret Ürün Sıralaması ─────────────────── */
export const TRADE_ITEMS_ORDER = [
  "su", "yiyecek", "ekmek",
  "tas", "maden", "demir",
  "ipek", "mermer", "celik", "kumas",
  "ilac", "mobilya", "heykel", "mucevher",
];

/* ─────────────────── Tüccar Bütçe Aralığı ─────────────────── */
export const TRADE_MERCHANT_BUDGET_MIN = 200;
export const TRADE_MERCHANT_BUDGET_MAX = 600;

export const POP_SU_RATE = 0.020;
export const POP_YIYECEK_RATE = 0.030;
export const POP_EKMEK_RATE = 0.010;
export const POP_ILAC_RATE = 0.005;
export const POP_KULTUR_RATE = 0.002;
export const WORKER_WAGE_SEASONAL = 2;

export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

export const ARRIVAL_DURATION = 85;

export const STORAGE_KEY = "plush-clicker:state";
export const OFFLINE_MAX_SECONDS = 3600;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          KAYNAKLAR                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const RESOURCES = {
    power: {
        name: "Güç",
        emoji: "⚡",
        tier: 0,
        baseCapacity: Infinity,
        storagePerDepo: 0,
        storagePerAmbar: 0,
        colorBright: "#ffe08a",
        colorDark: "#a8862f",
    },
    su: {
        name: "Su",
        emoji: "💧",
        tier: 1,
        baseCapacity: 1000,
        storagePerDepo: 200,
        storagePerAmbar: 0,
        satisFiyati: [1, 2],
        colorBright: "#5bc9ff",
        colorDark: "#1f6fa8",
    },
    yiyecek: {
        name: "Yiyecek",
        emoji: "🌾",
        tier: 1,
        baseCapacity: 1250,
        storagePerDepo: 250,
        storagePerAmbar: 0,
        satisFiyati: [1, 3],
        colorBright: "#ffd68a",
        colorDark: "#b07d2c",
    },
    bilgi: {
        name: "Bilgi",
        emoji: "📜",
        tier: 2,
        baseCapacity: 800,
        storagePerDepo: 150,
        storagePerAmbar: 0,
        colorBright: "#9cc9ff",
        colorDark: "#4e7ea8",
    },
    tas: {
        name: "Taş",
        emoji: "🪨",
        tier: 2,
        baseCapacity: 600,
        storagePerDepo: 120,
        storagePerAmbar: 0,
        satisFiyati: [1, 3],
        colorBright: "#b8b8a8",
        colorDark: "#6e6e5c",
    },
    maden: {
        name: "Mineral",
        emoji: "⛏️",
        tier: 2,
        baseCapacity: 400,
        storagePerDepo: 80,
        storagePerAmbar: 0,
        satisFiyati: [3, 5],
        colorBright: "#bcc7d1",
        colorDark: "#6f7c8c",
    },
    kultur: {
        name: "Kültür",
        emoji: "🎭",
        tier: 3,
        baseCapacity: 400,
        storagePerDepo: 60,
        storagePerAmbar: 0,
        colorBright: "#f5d0a0",
        colorDark: "#a87840",
    },
    inanc: {
        name: "İnanç",
        emoji: "🕯️",
        tier: 3,
        baseCapacity: 400,
        storagePerDepo: 60,
        storagePerAmbar: 0,
        colorBright: "#e0aaff",
        colorDark: "#8a45b8",
    },
    ipek: {
        name: "İpek",
        emoji: "🧵",
        tier: 3,
        baseCapacity: 250,
        storagePerDepo: 40,
        storagePerAmbar: 0,
        satisFiyati: [8, 15],
        colorBright: "#ffd9e8",
        colorDark: "#b06f93",
    },
    altin: {
        name: "Altın",
        emoji: "🪙",
        tier: -1,
        baseCapacity: Infinity,
        storagePerDepo: 0,
        storagePerAmbar: 0,
        colorBright: "#ffe95c",
        colorDark: "#b8860b",
    },
    ekmek: {
        name: "Ekmek",
        emoji: "🍞",
        tier: "product",
        baseCapacity: 500,
        storagePerDepo: 100,
        storagePerAmbar: 0,
        colorBright: "#f2c98a",
        colorDark: "#a86e2f",
    },
    demir: {
        name: "Demir",
        emoji: "⚒️",
        tier: "product",
        baseCapacity: 300,
        storagePerDepo: 60,
        storagePerAmbar: 0,
        colorBright: "#c8d0d8",
        colorDark: "#6e7884",
    },
    celik: {
        name: "Çelik",
        emoji: "🔩",
        tier: "product",
        baseCapacity: 200,
        storagePerDepo: 40,
        storagePerAmbar: 0,
        colorBright: "#b2e0f5",
        colorDark: "#4f7f9d",
    },
    mermer: {
        name: "Mermer",
        emoji: "🗿",
        tier: "product",
        baseCapacity: 300,
        storagePerDepo: 60,
        storagePerAmbar: 0,
        colorBright: "#f0ede6",
        colorDark: "#a8a096",
    },
    kumas: {
        name: "Kumaş",
        emoji: "🧶",
        tier: "product",
        baseCapacity: 200,
        storagePerDepo: 40,
        storagePerAmbar: 0,
        colorBright: "#ecc8e0",
        colorDark: "#90567a",
    },
    ilac: {
        name: "İlaç",
        emoji: "⚕️",
        tier: "product",
        baseCapacity: 300,
        storagePerDepo: 60,
        storagePerAmbar: 0,
        colorBright: "#a8f0c4",
        colorDark: "#3f9d6b",
    },
    mobilya: {
        name: "Mobilya",
        emoji: "🛋️",
        tier: "product",
        baseCapacity: 200,
        storagePerDepo: 40,
        storagePerAmbar: 0,
        colorBright: "#e0bfa4",
        colorDark: "#8a644a",
    },
    heykel: {
        name: "Heykel",
        emoji: "🏛️",
        tier: "product",
        baseCapacity: 200,
        storagePerDepo: 40,
        storagePerAmbar: 0,
        colorBright: "#e8dcc0",
        colorDark: "#8a7a58",
    },
    mucevher: {
        name: "Mücevher",
        emoji: "💍",
        tier: "product",
        baseCapacity: 100,
        storagePerDepo: 20,
        storagePerAmbar: 0,
        colorBright: "#aaf2ed",
        colorDark: "#45a59e",
    },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          BİNALAR                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Üretim & Bonus Binaları ─────────────────── */

export const BUILDINGS_DATA = {
    /* Tier 0 — Güç */
    fountain: {
        name: "Güç Ocağı",
        emoji: "⚡",
        type: "producer",
        baseCost: { power: 10 },
        costMultiplier: 1.12,
        production: 0.900,
        outputResource: "power",
        unlock: { type: "resource", id: "power", amount: 10 },
    },
    mansion: {
        name: "Kumandanlık",
        emoji: "🏛️",
        type: "bonus",
        baseCost: { power: 60 },
        costMultiplier: 1.15,
        targetResource: "power",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "fountain", count: 3 },
    },

    /* Tier 1 — Su & Yiyecek */
    well: {
        name: "Kuyu",
        emoji: "💧",
        type: "producer",
        baseCost: { power: 70 },
        costMultiplier: 1.14,
        production: 0.500,
        outputResource: "su",
        unlock: { type: "building", id: "fountain", count: 3 },
    },
    aqueduct: {
        name: "Çeşme",
        emoji: "🚰",
        type: "bonus",
        baseCost: { power: 200, su: 25 },
        costMultiplier: 1.16,
        targetResource: "su",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "well", count: 3 },
    },
    farm: {
        name: "Tarla",
        emoji: "🌾",
        type: "producer",
        baseCost: { power: 100, su: 12 },
        costMultiplier: 1.15,
        production: 0.450,
        outputResource: "yiyecek",
        unlock: { type: "building", id: "well", count: 3 },
    },
    mill: {
        name: "Değirmen",
        emoji: "🌬️",
        type: "bonus",
        baseCost: { power: 320, yiyecek: 10 },
        costMultiplier: 1.16,
        targetResource: "yiyecek",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "farm", count: 4 },
    },

    /* Tier 2 — Bilgi, Taş, Mineral */
    academy: {
        name: "Akademi",
        emoji: "🎓",
        type: "producer",
        baseCost: { power: 400, yiyecek: 60, su: 30 },
        costMultiplier: 1.17,
        production: 0.300,
        outputResource: "bilgi",
        unlock: { type: "building", id: "farm", count: 4 },
    },
    library: {
        name: "Kütüphane",
        emoji: "📚",
        type: "bonus",
        baseCost: { power: 6000, bilgi: 80, tas: 40 },
        costMultiplier: 1.20,
        targetResource: "bilgi",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "academy", count: 4 },
    },
    quarry: {
        name: "Taş Ocağı",
        emoji: "⛏️",
        type: "producer",
        baseCost: { power: 180, yiyecek: 25 },
        costMultiplier: 1.17,
        production: 0.220,
        outputResource: "tas",
        unlock: { type: "building", id: "academy", count: 4 },
    },
    stoneAtelier: {
        name: "Taş Atölyesi",
        emoji: "🪨",
        type: "bonus",
        baseCost: { power: 700, tas: 20 },
        costMultiplier: 1.17,
        targetResource: "tas",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "quarry", count: 4 },
    },
    mine: {
        name: "Maden",
        emoji: "⚒️",
        type: "producer",
        baseCost: { power: 280, yiyecek: 45, tas: 12 },
        costMultiplier: 1.17,
        production: 0.200,
        outputResource: "maden",
        unlock: { type: "building", id: "quarry", count: 5 },
    },
    minerCamp: {
        name: "Madenci Kampı",
        emoji: "⛑️",
        type: "bonus",
        baseCost: { power: 1600, tas: 30, maden: 20 },
        costMultiplier: 1.17,
        targetResource: "maden",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "mine", count: 5 },
    },

    /* Tier 3 — Kültür, İnanç, İpek */
    theatre: {
        name: "Tiyatro",
        emoji: "🎭",
        type: "producer",
        baseCost: { power: 8000, bilgi: 150, tas: 80 },
        costMultiplier: 1.19,
        production: 0.060,
        outputResource: "kultur",
        unlock: { type: "building", id: "mine", count: 7 },
    },
    amphitheatre: {
        name: "Amfitiyatro",
        emoji: "🏟️",
        type: "bonus",
        baseCost: { power: 35000, kultur: 8, tas: 150 },
        costMultiplier: 1.20,
        targetResource: "kultur",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "theatre", count: 3 },
    },
    temple: {
        name: "Tapınak",
        emoji: "🛕",
        type: "producer",
        baseCost: { power: 7000, bilgi: 120, maden: 60 },
        costMultiplier: 1.19,
        production: 0.050,
        outputResource: "inanc",
        unlock: { type: "building", id: "theatre", count: 6 },
    },
    altar: {
        name: "Sunak",
        emoji: "✨",
        type: "bonus",
        baseCost: { power: 20000, inanc: 15, bilgi: 150 },
        costMultiplier: 1.19,
        targetResource: "inanc",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "temple", count: 5 },
    },
    silkWorkshop: {
        name: "İpek Atölyesi",
        emoji: "🧵",
        type: "producer",
        baseCost: { power: 45000, bilgi: 200, tas: 150 },
        costMultiplier: 1.19,
        production: 0.025,
        outputResource: "ipek",
        unlock: { type: "building", id: "temple", count: 6 },
    },
    loom: {
        name: "Dokuma Tezgahı",
        emoji: "🕸️",
        type: "bonus",
        baseCost: { power: 90000, ipek: 4, tas: 150 },
        costMultiplier: 1.22,
        targetResource: "ipek",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "silkWorkshop", count: 3 },
    },
};

/* ─────────────────── Nüfus Binaları ─────────────────── */

export const HOUSING_DATA = {
    baraka: {
        name: "Baraka",
        emoji: "🛖",
        type: "housing",
        baseCost: { power: 200 },
        costMultiplier: 1.68,
        housingCapacity: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "building", id: "fountain", count: 4 },
                { type: "pack", id: "barinma", level: 1 },
            ],
        },
    },
    ev: {
        name: "Ev",
        emoji: "🏠",
        type: "housing",
        baseCost: { power: 5000 },
        costMultiplier: 1.9,
        housingCapacity: 25,
        unlock: {
            type: "all",
            conditions: [
                { type: "building", id: "baraka", count: 14 },
                { type: "industry", id: "blacksmith" },
            ],
        },
    },
};

/* ─────────────────── Kapasite Binaları ─────────────────── */

export const STORAGE_DATA = {
    depo: {
        name: "Depo",
        emoji: "📦",
        type: "storage",
        baseCost: { power: 800 },
        costMultiplier: 1.6,
        unlock: { type: "building", id: "farm", count: 4 },
    },
    ambar: {
        name: "Ambar",
        emoji: "🧺",
        type: "capacityBonus",
        baseCost: { power: 420, yiyecek: 70, tas: 35 },
        costMultiplier: 1.28,
        capacityBonusPerLevel: 0.06,
        unlock: { type: "building", id: "farm", count: 6 },
    },
};

/* ─────────────────── Tüm Binalar (Dahili Kullanım) ─────────────────── */

export const ALL_BUILDINGS_DATA = {
    ...BUILDINGS_DATA,
    ...HOUSING_DATA,
    ...STORAGE_DATA,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          PAKETLER                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const PACKS_DATA = {
    /* Tek seferlik zincir — maxLevel: 1 */
    barinma: {
        name: "Barınma",
        emoji: "🏠",
        description: "Nüfusun barınma ihtiyacı karşılanır",
        maxLevel: 1,
        baseCost: { bilgi: 40 },
    },
    takvim: {
        name: "Takvim",
        emoji: "📆",
        description: "Kaynaklara mevsimsel etkiler uygulanır",
        maxLevel: 1,
        baseCost: { bilgi: 140 },
        unlock: { type: "pack", id: "barinma", level: 1 },
    },
    ticaret: {
        name: "Ticaret",
        emoji: "🏪",
        description: "Kaynaklar ile ticaret yapılabilir",
        maxLevel: 1,
        baseCost: { bilgi: 350 },
        unlock: { type: "pack", id: "takvim", level: 1 },
    },

    /* Yükseltme zinciri — maxLevel: 10 */
    uretim: {
        name: "Üretim",
        emoji: "🛠️",
        description: "Binaların üretimini %10 artırır",
        maxLevel: 10,
        costMultiplier: 1.45,
        baseCost: { bilgi: 60, power: 25 },
        productionBonusPerLevel: 0.10,
        unlock: { type: "building", id: "academy", count: 1 },
    },
    guc: {
        name: "Güç",
        emoji: "⚡",
        description: "Güç üretimini %10 artırır",
        maxLevel: 10,
        costMultiplier: 1.45,
        baseCost: { bilgi: 180, power: 70 },
        powerBonusPerLevel: 0.10,
        unlock: { type: "pack", id: "uretim", level: 1 },
    },
    sanayi: {
        name: "Sanayi",
        emoji: "🏭",
        description: "Sanayi binalarının üretimini %20 artırır",
        maxLevel: 10,
        costMultiplier: 1.38,
        baseCost: { bilgi: 400, tas: 200 },
        industryBonusPerLevel: 0.20,
        unlock: {
            type: "all",
            conditions: [
                { type: "pack", id: "guc", level: 1 },
                { type: "building", id: "quarry", count: 1 },
            ],
        },
    },
    depolama: {
        name: "Depolama",
        emoji: "📦",
        description: "Depolama kapasitesini %10 artırır",
        maxLevel: 10,
        costMultiplier: 1.30,
        baseCost: { bilgi: 800, maden: 400 },
        storageBonusPerLevel: 0.10,
        unlock: { type: "pack", id: "sanayi", level: 1 },
    },
    isGucu: {
        name: "İş Gücü",
        emoji: "👷",
        description: "Sanayideki işçilerin üretim gücünü %10 artırır",
        maxLevel: 10,
        costMultiplier: 1.30,
        baseCost: { bilgi: 1200, demir: 300 },
        workerBonusPerLevel: 0.10,
        unlock: { type: "pack", id: "depolama", level: 1 },
    },
    otoSatis: {
        name: "Otomatik Satış",
        emoji: "💰",
        description: "Otomatik satış sistemini aktif eder (seviye başına +%10 limit)",
        maxLevel: 10,
        costMultiplier: 1.30,
        baseCost: { bilgi: 900, altin: 350 },
        autoSellPerLevel: 0.10,
        unlock: { type: "pack", id: "isGucu", level: 1 },
    },
    mimari: {
        name: "Mimari",
        emoji: "💸",
        description: "Tüm binaların maliyetini %2 azaltır",
        maxLevel: 10,
        costMultiplier: 1.32,
        baseCost: { bilgi: 1300, altin: 280 },
        costDiscountPerLevel: 0.02,
        unlock: { type: "pack", id: "otoSatis", level: 1 },
    },
};

export const AUTO_SELL_PACK_ID = "otoSatis";
export const AUTO_SELL_STEP_PCT = 10;
export const CALENDAR_PACK_ID = "takvim";
export const HOUSING_PACK_ID = "barinma";
export const TRADE_PACK_ID = "ticaret";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          SANAYİ                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const INDUSTRY_DATA = {
    firin: {
        name: "Fırın",
        emoji: "🍞",
        description: "Fırında ekmek üretilir.",
        baseCost: { power: 380, su: 15, yiyecek: 38 },
        input: { yiyecek: 0.080, su: 0.020 },
        output: { ekmek: 0.055 },
        maxWorkers: 5,
        unlock: { type: "building", id: "farm", count: 6 },
    },
    blacksmith: {
        name: "Demirci",
        emoji: "⚒️",
        description: "Maden demire işlenir.",
        baseCost: { power: 9000, yiyecek: 180, tas: 60 },
        input: { maden: 0.080 },
        output: { demir: 0.008 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "firin" },
                { type: "building", id: "mine", count: 4 },
            ],
        },
    },
    celikFirini: {
        name: "Çelik Fırını",
        emoji: "🔥",
        description: "Maden ve demir çeliğe işlenir.",
        baseCost: { power: 80000, tas: 600, yiyecek: 350 },
        input: { maden: 0.012, demir: 0.012 },
        output: { celik: 0.0035 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "blacksmith" },
                { type: "pack", id: "sanayi", level: 1 },
            ],
        },
    },
    sifaOcagi: {
        name: "Şifa Ocağı",
        emoji: "⚕️",
        description: "İnanç ve bilgiden ilaç üretilir.",
        baseCost: { power: 150000, bilgi: 1600, inanc: 1100 },
        input: { inanc: 0.025, bilgi: 0.015 },
        output: { ilac: 0.007 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "celikFirini" },
                { type: "building", id: "temple", count: 3 },
            ],
        },
    },
    mermerAtolyesi: {
        name: "Mermer Atölyesi",
        emoji: "🗿",
        description: "Taş mermere işlenir.",
        baseCost: { power: 220000, tas: 1100, yiyecek: 330 },
        input: { tas: 0.070 },
        output: { mermer: 0.006 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "sifaOcagi" },
                { type: "building", id: "stoneAtelier", count: 4 },
            ],
        },
    },
    kumasAtolyesi: {
        name: "Kumaş Atölyesi",
        emoji: "🧶",
        description: "İpek kumaşa işlenir.",
        baseCost: { power: 320000, su: 550, yiyecek: 320 },
        input: { ipek: 0.016 },
        output: { kumas: 0.003 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "mermerAtolyesi" },
                { type: "building", id: "silkWorkshop", count: 3 },
            ],
        },
    },
    mobilyaAtolyesi: {
        name: "Mobilya Atölyesi",
        emoji: "🛋️",
        description: "Taş ve çelikten mobilya üretilir.",
        baseCost: { power: 620000, yiyecek: 700, maden: 950 },
        input: { tas: 0.015, celik: 0.014 },
        output: { mobilya: 0.003 },
        maxWorkers: 5,
        unlock: { type: "industry", id: "kumasAtolyesi" },
    },
    heykelAtolyesi: {
        name: "Heykel Atölyesi",
        emoji: "🏛️",
        description: "Mermer, çelik ve kültürden heykel üretilir.",
        baseCost: { power: 900000, tas: 50, yiyecek: 22 },
        input: { mermer: 0.030, celik: 0.015, kultur: 0.015 },
        output: { heykel: 0.0028 },
        maxWorkers: 5,
        unlock: { type: "industry", id: "mobilyaAtolyesi" },
    },
    mucevherAtolyesi: {
        name: "Mücevher Atölyesi",
        emoji: "💍",
        description: "Kumaş, çelik ve mermerden mücevher üretilir.",
        baseCost: { power: 1250000, su: 600, yiyecek: 38 },
        input: { kumas: 0.032, celik: 0.016, mermer: 0.016 },
        output: { mucevher: 0.0012 },
        maxWorkers: 5,
        unlock: { type: "industry", id: "heykelAtolyesi" },
    },
    darphane: {
        name: "Darphane",
        emoji: "🪙",
        description: "Bilgi ve ipekten altın basılır.",
        baseCost: { power: 1800000, bilgi: 220, yiyecek: 85 },
        input: { bilgi: 0.020, ipek: 0.010 },
        output: { altin: 0.010 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "mucevherAtolyesi" },
                { type: "industry", id: "kumasAtolyesi" },
            ],
        },
    },
    sanatGalerisi: {
        name: "Sanat Galerisi",
        emoji: "🖼️",
        description: "Heykeller kültürle sergilenip altına çevrilir.",
        baseCost: { power: 2800000, kultur: 280, bilgi: 440 },
        input: { heykel: 0.016, kultur: 0.030 },
        output: { altin: 0.014 },
        maxWorkers: 5,
        unlock: { type: "industry", id: "darphane" },
    },
};
