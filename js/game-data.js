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
    modifiers: { su: 0.8, yiyecek: 0.6, tas: 0.9, ipek: 0.7, kultur: 1.0 },
  },
};

export const SEASON_ORDER = Object.keys(SEASONS_DATA);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YENİ TİCARET YAPILANDIRMASI                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const TRADE_MERCHANT_STAY_MIN = 45;
export const TRADE_MERCHANT_STAY_MAX = 120;
export const TRADE_MERCHANT_INTERVAL_MIN = 20;
export const TRADE_MERCHANT_INTERVAL_MAX = 60;

/* ─────────────────── Ticaret Ürün Havuzu ─────────────────── */
export const TRADE_ITEM_POOL = {
  su:        { basePrice: 2,   minQty: 200, maxQty: 500, tier: 1 },
  yiyecek:   { basePrice: 2,   minQty: 150, maxQty: 400, tier: 1 },
  ekmek:     { basePrice: 6,   minQty: 80,  maxQty: 200, tier: 1 },
  tas:       { basePrice: 2,   minQty: 100, maxQty: 300, tier: 2 },
  maden:     { basePrice: 4,   minQty: 40,  maxQty: 120, tier: 2 },
  demir:     { basePrice: 10,  minQty: 30,  maxQty: 80,  tier: 2 },
  ipek:      { basePrice: 20,  minQty: 5,   maxQty: 20,  tier: 3 },
  mermer:    { basePrice: 15,  minQty: 10,  maxQty: 30,  tier: 3 },
  celik:     { basePrice: 18,  minQty: 8,   maxQty: 25,  tier: 3 },
  kumas:     { basePrice: 22,  minQty: 5,   maxQty: 15, tier: 3 },
  ilac:      { basePrice: 25,  minQty: 5,   maxQty: 15, tier: 3 },
  mobilya:   { basePrice: 30,  minQty: 3,   maxQty: 10, tier: 3 },
  heykel:    { basePrice: 40,  minQty: 2,   maxQty: 6,  tier: 3 },
  mucevher:  { basePrice: 60,  minQty: 1,   maxQty: 4,  tier: 3 },
};

/* ─────────────────── Ticaret Ürün Sıralaması ─────────────────── */
export const TRADE_ITEMS_ORDER = [
  "su", "yiyecek", "ekmek",
  "tas", "maden", "demir",
  "ipek", "mermer", "celik", "kumas",
  "ilac", "mobilya", "heykel", "mucevher",
];

/* ─────────────────── Tüccar Bütçe Aralığı ─────────────────── */
export const TRADE_MERCHANT_BUDGET_MIN = 800;
export const TRADE_MERCHANT_BUDGET_MAX = 3000;

export const POP_SU_RATE = 0.020;
export const POP_YIYECEK_RATE = 0.030;
export const POP_EKMEK_RATE = 0.010;
export const POP_ILAC_RATE = 0.005;
export const POP_KULTUR_RATE = 0.002;
export const WORKER_WAGE_SEASONAL = 2;

export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

export const ARRIVAL_DURATION = 30;

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
        baseCapacity: 500,
        storagePerDepo: 100,
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
        baseCapacity: 200,
        storagePerDepo: 40,
        storagePerAmbar: 0,
        colorBright: "#f5d0a0",
        colorDark: "#a87840",
    },
    inanc: {
        name: "İnanç",
        emoji: "🕯️",
        tier: 3,
        baseCapacity: 150,
        storagePerDepo: 30,
        storagePerAmbar: 0,
        colorBright: "#e0aaff",
        colorDark: "#8a45b8",
    },
    ipek: {
        name: "İpek",
        emoji: "🧵",
        tier: 3,
        baseCapacity: 100,
        storagePerDepo: 20,
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
        type: "producer",
        baseCost: { power: 10 },
        costMultiplier: 1.13,
        production: 0.500,
        outputResource: "power",
        unlock: { type: "resource", id: "power", amount: 10 },
    },
    mansion: {
        name: "Kumandanlık",
        type: "bonus",
        baseCost: { power: 75 },
        costMultiplier: 1.16,
        targetResource: "power",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "fountain", count: 5 },
    },

    /* Tier 1 — Su & Yiyecek */
    well: {
        name: "Kuyu",
        type: "producer",
        baseCost: { power: 100 },
        costMultiplier: 1.13,
        production: 0.250,
        outputResource: "su",
        unlock: { type: "building", id: "fountain", count: 5 },
    },
    aqueduct: {
        name: "Çeşme",
        type: "bonus",
        baseCost: { power: 250, su: 30 },
        costMultiplier: 1.16,
        targetResource: "su",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "well", count: 5 },
    },
    farm: {
        name: "Tarla",
        type: "producer",
        baseCost: { power: 150, su: 20 },
        costMultiplier: 1.16,
        production: 0.200,
        outputResource: "yiyecek",
        unlock: { type: "building", id: "well", count: 5 },
    },
    mill: {
        name: "Değirmen",
        type: "bonus",
        baseCost: { power: 400, yiyecek: 10 },
        costMultiplier: 1.16,
        targetResource: "yiyecek",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "farm", count: 5 },
    },

    /* Tier 2 — Bilgi, Taş, Mineral */
    academy: {
        name: "Akademi",
        type: "producer",
        baseCost: { power: 500, yiyecek: 80, su: 40 },
        costMultiplier: 1.17,
        production: 0.150,
        outputResource: "bilgi",
        unlock: { type: "building", id: "farm", count: 5 },
    },
    library: {
        name: "Kütüphane",
        type: "bonus",
        baseCost: { power: 2500, bilgi: 40, tas: 20 },
        costMultiplier: 1.20,
        targetResource: "bilgi",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "academy", count: 3 },
    },
    quarry: {
        name: "Taş Ocağı",
        type: "producer",
        baseCost: { power: 200, yiyecek: 30 },
        costMultiplier: 1.17,
        production: 0.100,
        outputResource: "tas",
        unlock: { type: "building", id: "academy", count: 5 },
    },
    stoneAtelier: {
        name: "Taş Atölyesi",
        type: "bonus",
        baseCost: { power: 600, tas: 15 },
        costMultiplier: 1.17,
        targetResource: "tas",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "quarry", count: 3 },
    },
    mine: {
        name: "Maden",
        type: "producer",
        baseCost: { power: 300, yiyecek: 40, tas: 10 },
        costMultiplier: 1.17,
        production: 0.080,
        outputResource: "maden",
        unlock: { type: "building", id: "quarry", count: 3 },
    },
    minerCamp: {
        name: "Madenci Kampı",
        type: "bonus",
        baseCost: { power: 1200, tas: 20, maden: 15 },
        costMultiplier: 1.17,
        targetResource: "maden",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "mine", count: 3 },
    },

    /* Tier 3 — Kültür, İnanç, İpek */
    theatre: {
        name: "Tiyatro",
        type: "producer",
        baseCost: { power: 3000, bilgi: 80, tas: 50 },
        costMultiplier: 1.18,
        production: 0.050,
        outputResource: "kultur",
        unlock: { type: "building", id: "mine", count: 5 },
    },
    amphitheatre: {
        name: "Amfitiyatro",
        type: "bonus",
        baseCost: { power: 15000, kultur: 5, tas: 100 },
        costMultiplier: 1.20,
        targetResource: "kultur",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "theatre", count: 1 },
    },
    temple: {
        name: "Tapınak",
        type: "producer",
        baseCost: { power: 2000, bilgi: 80, maden: 40 },
        costMultiplier: 1.18,
        production: 0.040,
        outputResource: "inanc",
        unlock: { type: "building", id: "theatre", count: 5 },
    },
    altar: {
        name: "Sunak",
        type: "bonus",
        baseCost: { power: 8000, inanc: 10, bilgi: 100 },
        costMultiplier: 1.18,
        targetResource: "inanc",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "temple", count: 5 },
    },
    silkWorkshop: {
        name: "İpek Atölyesi",
        type: "producer",
        baseCost: { power: 20000, bilgi: 100, tas: 80 },
        costMultiplier: 1.18,
        production: 0.030,
        outputResource: "ipek",
        unlock: { type: "building", id: "temple", count: 3 },
    },
    loom: {
        name: "Dokuma Tezgahı",
        type: "bonus",
        baseCost: { power: 40000, ipek: 2, tas: 100 },
        costMultiplier: 1.22,
        targetResource: "ipek",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "silkWorkshop", count: 1 },
    },
};

/* ─────────────────── Nüfus Binaları ─────────────────── */

export const HOUSING_DATA = {
    baraka: {
        name: "Baraka",
        type: "housing",
        baseCost: { power: 90, su: 18 },
        costMultiplier: 1.28,
        housingCapacity: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "building", id: "fountain", count: 6 },
                { type: "pack", id: "barinma", level: 1 },
            ],
        },
    },
    ev: {
        name: "Ev",
        type: "housing",
        baseCost: { power: 750, yiyecek: 50, tas: 25 },
        costMultiplier: 2.60,
        housingCapacity: 25,
        unlock: {
            type: "all",
            conditions: [
                { type: "building", id: "baraka", count: 7 },
                { type: "industry", id: "blacksmith" },
            ],
        },
    },
};

/* ─────────────────── Kapasite Binaları ─────────────────── */

export const STORAGE_DATA = {
    depo: {
        name: "Depo",
        type: "storage",
        baseCost: { power: 90, su: 20 },
        costMultiplier: 1.85,
        unlock: { type: "building", id: "farm", count: 3 },
    },
    ambar: {
        name: "Ambar",
        type: "capacityBonus",
        baseCost: { power: 210, yiyecek: 30, tas: 15 },
        costMultiplier: 1.20,
        capacityBonusPerLevel: 0.05,
        unlock: { type: "building", id: "farm", count: 5 },
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
        baseCost: { bilgi: 50 },
    },
    takvim: {
        name: "Takvim",
        emoji: "📆",
        description: "Kaynaklara mevsimsel etkiler uygulanır",
        maxLevel: 1,
        baseCost: { bilgi: 100 },
        unlock: { type: "pack", id: "barinma", level: 1 },
    },
    ticaret: {
        name: "Ticaret",
        emoji: "🏪",
        description: "Kaynaklar ile ticaret yapılabilir",
        maxLevel: 1,
        baseCost: { bilgi: 150 },
        unlock: { type: "pack", id: "takvim", level: 1 },
    },

    /* Yükseltme zinciri — maxLevel: 10, çarpan: 1.20 */
    uretim: {
        name: "Üretim",
        emoji: "🛠️",
        description: "Binaların üretimini %10 artırır",
        maxLevel: 10,
        costMultiplier: 1.20,
        baseCost: { bilgi: 30, power: 15 },
        productionBonusPerLevel: 0.10,
        unlock: { type: "building", id: "academy", count: 1 },
    },
    guc: {
        name: "Güç",
        emoji: "⚡",
        description: "Güç üretimini %10 artırır",
        maxLevel: 10,
        costMultiplier: 1.20,
        baseCost: { bilgi: 70, power: 35 },
        powerBonusPerLevel: 0.10,
        unlock: { type: "pack", id: "uretim", level: 1 },
    },
    sanayi: {
        name: "Sanayi",
        emoji: "🏭",
        description: "Sanayi binalarının üretimini %20 artırır",
        maxLevel: 10,
        costMultiplier: 1.20,
        baseCost: { bilgi: 160, tas: 80 },
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
        costMultiplier: 1.20,
        baseCost: { bilgi: 300, maden: 150 },
        storageBonusPerLevel: 0.10,
        unlock: { type: "pack", id: "sanayi", level: 1 },
    },
    isGucu: {
        name: "İş Gücü",
        emoji: "👷",
        description: "Sanayideki işçilerin üretim gücünü %10 artırır",
        maxLevel: 10,
        costMultiplier: 1.20,
        baseCost: { bilgi: 450, demir: 100 },
        workerBonusPerLevel: 0.10,
        unlock: { type: "pack", id: "depolama", level: 1 },
    },
    otoSatis: {
        name: "Otomatik Satış",
        emoji: "💰",
        description: "Otomatik satış sistemini aktif eder (seviye başına +%10 limit)",
        maxLevel: 10,
        costMultiplier: 1.20,
        baseCost: { bilgi: 600, altin: 200 },
        autoSellPerLevel: 0.10,
        unlock: { type: "pack", id: "isGucu", level: 1 },
    },
    mimari: {
        name: "Mimari",
        emoji: "💸",
        description: "Tüm binaların maliyetini %2 azaltır",
        maxLevel: 10,
        costMultiplier: 1.20,
        baseCost: { bilgi: 800, altin: 150 },
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
        baseCost: { power: 425, su: 17, yiyecek: 42 },
        input: { yiyecek: 0.080, su: 0.020 },
        output: { ekmek: 0.060 },
        maxWorkers: 5,
        unlock: { type: "building", id: "farm", count: 5 },
    },
    blacksmith: {
        name: "Demirci",
        emoji: "⚒️",
        description: "Maden demire işlenir.",
        baseCost: { power: 1700, yiyecek: 100, tas: 30 },
        input: { maden: 0.080 },
        output: { demir: 0.010 },
        maxWorkers: 5,
        unlock: { type: "building", id: "mine", count: 3 },
    },
    celikFirini: {
        name: "Çelik Fırını",
        emoji: "🔥",
        description: "Maden ve demir çeliğe işlenir.",
        baseCost: { power: 51000, tas: 638, yiyecek: 340 },
        input: { maden: 0.020, demir: 0.020 },
        output: { celik: 0.005 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "blacksmith" },
                { type: "pack", id: "sanayi", level: 1 },
            ],
        },
    },
    mermerAtolyesi: {
        name: "Mermer Atölyesi",
        emoji: "🗿",
        description: "Taş mermere işlenir.",
        baseCost: { power: 68000, tas: 850, yiyecek: 255 },
        input: { tas: 0.050 },
        output: { mermer: 0.010 },
        maxWorkers: 5,
        unlock: { type: "building", id: "temple", count: 5 },
    },
    kumasAtolyesi: {
        name: "Kumaş Atölyesi",
        emoji: "🧶",
        description: "İpek kumaşa işlenir.",
        baseCost: { power: 25500, su: 128, yiyecek: 68 },
        input: { ipek: 0.010 },
        output: { kumas: 0.005 },
        maxWorkers: 5,
        unlock: { type: "building", id: "silkWorkshop", count: 3 },
    },
    sifaOcagi: {
        name: "Şifa Ocağı",
        emoji: "⚕️",
        description: "İnanç ve bilgiden ilaç üretilir.",
        baseCost: { power: 6800, bilgi: 180, inanc: 128 },
        input: { inanc: 0.020, bilgi: 0.010 },
        output: { ilac: 0.010 },
        maxWorkers: 5,
        unlock: { type: "building", id: "temple", count: 1 },
    },
    mobilyaAtolyesi: {
        name: "Mobilya Atölyesi",
        emoji: "🛋️",
        description: "Taş ve çelikten mobilya üretilir.",
        baseCost: { power: 85000, yiyecek: 340, maden: 425 },
        input: { tas: 0.010, celik: 0.010 },
        output: { mobilya: 0.005 },
        maxWorkers: 5,
        unlock: { type: "industry", id: "celikFirini" },
    },
    heykelAtolyesi: {
        name: "Heykel Atölyesi",
        emoji: "🏛️",
        description: "Mermer ve çelikten heykel üretilir.",
        baseCost: { power: 127500, tas: 21, yiyecek: 10 },
        input: { mermer: 0.020, celik: 0.010 },
        output: { heykel: 0.005 },
        maxWorkers: 5,
        unlock: { type: "industry", id: "mermerAtolyesi" },
    },
    mucevherAtolyesi: {
        name: "Mücevher Atölyesi",
        emoji: "💍",
        description: "Kumaş, çelik ve mermerden mücevher üretilir.",
        baseCost: { power: 102000, su: 213, yiyecek: 13 },
        input: { kumas: 0.020, celik: 0.010, mermer: 0.010 },
        output: { mucevher: 0.002 },
        maxWorkers: 5,
        unlock: { type: "industry", id: "kumasAtolyesi" },
    },
    darphane: {
        name: "Darphane",
        emoji: "🪙",
        description: "Bilgi ve ipekten altın basılır.",
        baseCost: { power: 51000, bilgi: 17, yiyecek: 7 },
        input: { bilgi: 0.010, ipek: 0.005 },
        output: { altin: 0.015 },
        maxWorkers: 5,
        unlock: {
            type: "all",
            conditions: [
                { type: "industry", id: "kumasAtolyesi" },
                { type: "pack", id: "ticaret", level: 1 },
            ],
        },
    },
};
