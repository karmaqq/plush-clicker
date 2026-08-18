/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          BİNA VERİLERİ                                     */
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
        unlock: { type: "building", id: "academy", count: 1 },
    },
    stoneAtelier: {
        name: "Taş Atölyesi",
        type: "bonus",
        baseCost: { power: 600, tas: 15 },
        costMultiplier: 1.17,
        targetResource: "tas",
        bonusPerLevel: 0.02,
        unlock: { type: "building", id: "quarry", count: 1 },
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
        unlock: { type: "building", id: "academy", count: 5 },
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
        unlock: { type: "building", id: "academy", count: 5 },
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
        unlock: { type: "building", id: "theatre", count: 3 },
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      ÖZEL BİNA VERİLERİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Nüfus Binaları ─────────────────── */

export const HOUSING_DATA = {
    baraka: {
        name: "Baraka",
        type: "housing",
        baseCost: { power: 90, su: 18 },
        costMultiplier: 1.28,
        housingCapacity: 5,
        unlock: { type: "building", id: "fountain", count: 6 },
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
        unlock: { type: "building", id: "farm", count: 6 },
    },
};

/* ─────────────────── Tüm Binalar (Dahili Kullanım) ─────────────────── */

export const ALL_BUILDINGS_DATA = {
    ...BUILDINGS_DATA,
    ...HOUSING_DATA,
    ...STORAGE_DATA,
};
