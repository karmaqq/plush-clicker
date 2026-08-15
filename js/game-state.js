import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { PACKS_DATA } from "./packs.js";
import { INDUSTRY_DATA } from "./industry.js";
import { canAfford } from "./utils.js";

export const SEASON_DURATION = 45;

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

const SEASON_ORDER = Object.keys(SEASONS_DATA);

export const TRADE_INTERVAL = 45;

const TRADE_PRICES = {
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

const TRADE_AMOUNTS = {
    1: [25, 40],
    2: [10, 20],
    3: [5, 10],
    4: [2, 6],
    5: [1, 3],
};

const state = {
    resources: {},
    buildings: {},
    packs: {},
    industry: {},
    population: {
        current: 0,
        migrants: 0,
        satisfaction: 50,
        migrationTimer: 0,
        arrivalTimer: 0,
        deficiency: 0,
        ilacOk: false,
    },
    prestige: {
        paragon: 0,
        karma: 0,
        resets: 0,
    },
    season: {
        id: "ilkbahar",
        timer: SEASON_DURATION,
    },
    trade: {
        timer: TRADE_INTERVAL,
        current: null,
        count: 0,
    },
    settings: {
        autoSell: {},
    },
};

for (const id of Object.keys(RESOURCES)) {
    state.resources[id] = 0;
}

for (const id of Object.keys(BUILDINGS_DATA)) {
    state.buildings[id] = 0;
}

for (const id of Object.keys(PACKS_DATA)) {
    state.packs[id] = 0;
}

for (const id of Object.keys(INDUSTRY_DATA)) {
    state.industry[id] = { built: false, workers: 0, stalled: false, outputFull: false };
}

for (const id of Object.keys(RESOURCES)) {
    const meta = RESOURCES[id];
    if (meta.tier !== "raw" && meta.tier !== "currency") {
        state.settings.autoSell[id] = false;
    }
}

const listeners = new Set();

const STORAGE_KEY_V9 = "plush-clicker:state-v9";
const STORAGE_KEY_V8 = "plush-clicker:state-v8";
const STORAGE_KEY_V7 = "plush-clicker:state-v7";
const STORAGE_KEY_V6 = "plush-clicker:state-v6";
const STORAGE_KEY_V5 = "plush-clicker:state-v5";
const STORAGE_KEY_V4 = "plush-clicker:state-v4";
const STORAGE_KEY_V3 = "plush-clicker:state-v3";

function loadState() {
    try {
        const rawV9 = localStorage.getItem(STORAGE_KEY_V9);
        if (rawV9) {
            const saved = JSON.parse(rawV9);
            loadResources(saved.resources);
            loadBuildings(saved.buildings);
            loadPacks(saved.packs);
            loadIndustry(saved.industry);
            loadPopulation(saved.population);
            loadPrestige(saved.prestige);
            loadSeason(saved.season);
            loadTrade(saved.trade);
            loadSettings(saved.settings);
            return;
        }

        localStorage.removeItem(STORAGE_KEY_V8);
        localStorage.removeItem(STORAGE_KEY_V7);
        localStorage.removeItem(STORAGE_KEY_V6);
        localStorage.removeItem(STORAGE_KEY_V5);
        localStorage.removeItem(STORAGE_KEY_V4);
        localStorage.removeItem(STORAGE_KEY_V3);

        state.resources.power = 40;
    } catch (err) {
        console.warn("Kayıt yüklenemedi:", err);
    }
}

function loadResources(saved) {
    if (!saved || typeof saved !== "object") return;
    if (saved.power == null && Number.isFinite(saved.karma)) {
        saved.power = saved.karma;
    }
    delete saved.karma;
    for (const id of Object.keys(state.resources)) {
        if (Number.isFinite(saved[id])) {
            state.resources[id] = saved[id];
        }
    }
}

function loadBuildings(saved) {
    if (!saved || typeof saved !== "object") return;
    for (const id of Object.keys(state.buildings)) {
        if (Number.isFinite(saved[id])) {
            state.buildings[id] = Math.floor(saved[id]);
        }
    }
}

function loadPacks(saved) {
    if (!saved || typeof saved !== "object") return;
    if (saved.powerPatronage == null && Number.isFinite(saved.karmaPatronage)) {
        saved.powerPatronage = saved.karmaPatronage;
    }
    delete saved.karmaPatronage;
    for (const id of Object.keys(state.packs)) {
        if (Number.isFinite(saved[id])) {
            state.packs[id] = Math.floor(saved[id]);
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
    }
}

function loadPopulation(saved) {
    if (!saved || typeof saved !== "object") return;
    if (Number.isFinite(saved.current)) state.population.current = Math.max(0, saved.current);
    if (Number.isFinite(saved.migrants)) state.population.migrants = Math.max(0, Math.floor(saved.migrants));
    if (Number.isFinite(saved.satisfaction)) {
        state.population.satisfaction = Math.min(100, Math.max(0, saved.satisfaction));
    }
    if (Number.isFinite(saved.migrationTimer)) state.population.migrationTimer = saved.migrationTimer;
    if (Number.isFinite(saved.arrivalTimer)) state.population.arrivalTimer = saved.arrivalTimer;
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

function loadPrestige(saved) {
    if (!saved || typeof saved !== "object") return;
    if (Number.isFinite(saved.paragon)) state.prestige.paragon = Math.max(0, Math.floor(saved.paragon));
    if (Number.isFinite(saved.karma)) state.prestige.karma = Math.max(0, Math.floor(saved.karma));
    if (Number.isFinite(saved.resets)) state.prestige.resets = Math.max(0, Math.floor(saved.resets));
}

function loadSeason(saved) {
    if (!saved || typeof saved !== "object") return;
    if (SEASONS_DATA[saved.id]) state.season.id = saved.id;
    if (Number.isFinite(saved.timer)) state.season.timer = Math.max(0, saved.timer);
}

function loadTrade(saved) {
    if (!saved || typeof saved !== "object") return;
    if (Number.isFinite(saved.timer)) state.trade.timer = Math.max(0, saved.timer);
    if (saved.current && typeof saved.current === "object") {
        if (
            Number.isFinite(saved.current.cost) &&
            saved.current.get && typeof saved.current.get === "object" &&
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
    if (Number.isFinite(saved.count)) state.trade.count = Math.max(0, Math.floor(saved.count));
}

loadState();

export function getResource(resource) {
    return state.resources[resource] || 0;
}

export function getPower() {
    return getResource("power");
}

export function getAltin() {
    return getResource("altin");
}

export function getBuildingCount(id) {
    return state.buildings[id] || 0;
}

export function getPackCount(id) {
    return state.packs[id] || 0;
}

const UNLOCK_STRATEGIES = {
    building: {
        isMet: (unlock) => getBuildingCount(unlock.id) >= unlock.count,
        progress: (unlock) => Math.min(getBuildingCount(unlock.id), unlock.count) + "/" + unlock.count,
        isNear: (unlock) => getBuildingCount(unlock.id) > 0,
        target: (unlock) => BUILDINGS_DATA[unlock.id].name,
    },
    pack: {
        isMet: (unlock) => getPackCount(unlock.id) >= unlock.level,
        progress: (unlock) => Math.min(getPackCount(unlock.id), unlock.level) + "/" + unlock.level,
        isNear: (unlock) => getPackCount(unlock.id) > 0,
        target: (unlock) => PACKS_DATA[unlock.id].name,
    },
    resource: {
        isMet: (unlock) => getResource(unlock.id) >= unlock.amount,
        progress: (unlock) => Math.min(getResource(unlock.id), unlock.amount) + "/" + unlock.amount,
        isNear: () => false,
        target: (unlock) => RESOURCES[unlock.id].name,
    },
    industry: {
        isMet: (unlock) => getIndustryBuilt(unlock.id),
        progress: (unlock) => (getIndustryBuilt(unlock.id) ? "1/1" : "0/1"),
        isNear: (unlock) => getIndustryBuilt(unlock.id),
        target: (unlock) => INDUSTRY_DATA[unlock.id].name,
    },
    all: {
        isMet: (unlock) => unlock.conditions.every((c) => UNLOCK_STRATEGIES[c.type].isMet(c)),
        progress: (unlock) => unlock.conditions.map((c) => UNLOCK_STRATEGIES[c.type].progress(c)).join(" + "),
        isNear: (unlock) => unlock.conditions.some((c) => UNLOCK_STRATEGIES[c.type].isNear(c)),
        target: (unlock) => unlock.conditions.map((c) => UNLOCK_STRATEGIES[c.type].target(c)).join(" + "),
    },
};

export function getUnlock(data) {
    if (!data || !data.unlock) return true;

    const strategy = UNLOCK_STRATEGIES[data.unlock.type];
    return strategy ? strategy.isMet(data.unlock) : true;
}

function getUnlockProgress(data) {
    if (!data || !data.unlock) return "";

    const strategy = UNLOCK_STRATEGIES[data.unlock.type];
    return strategy ? strategy.progress(data.unlock) : "";
}

export function getUnlockType(data) {
    if (!data || !data.unlock) return null;
    return data.unlock.type;
}

export function isNearUnlock(data) {
    if (!data || !data.unlock) return true;

    const strategy = UNLOCK_STRATEGIES[data.unlock.type];
    return strategy ? strategy.isNear(data.unlock) : true;
}

export function getUnlockText(data) {
    if (!data || !data.unlock) return "";

    const strategy = UNLOCK_STRATEGIES[data.unlock.type];
    if (!strategy) return "";

    return strategy.target(data.unlock) + " (" + getUnlockProgress(data) + ")";
}

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

    for (const id of Object.keys(BUILDINGS_DATA)) {
        const building = BUILDINGS_DATA[id];
        if (
            building.type === "productBonus" &&
            building.productBonusPerLevel &&
            meta &&
            meta.tier !== "raw" &&
            meta.tier !== "currency"
        ) {
            sum += getBuildingCount(id) * building.productBonusPerLevel;
        }
    }

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

    return 1 + sum + getPrestigeProductionBonus();
}

export function getPrestigeProductionBonus() {
    return state.prestige.paragon * 0.005;
}

export function getResourceCapacity(resource) {
    const meta = RESOURCES[resource];
    if (!meta) return 0;

    if (meta.baseCapacity === Infinity) return Infinity;

    const depoCount = getBuildingCount("depo");
    const ambarCount = getBuildingCount("ambar");
    const ambarData = BUILDINGS_DATA.ambar || {};

    const flat =
        depoCount * (meta.storagePerDepo || 0) +
        ambarCount * (meta.storagePerAmbar || 0);

    let storageBonus = 0;
    for (const id of Object.keys(BUILDINGS_DATA)) {
        const building = BUILDINGS_DATA[id];
        if (building.type === "storageBonus" && building.storageBonusPerLevel) {
            storageBonus += getBuildingCount(id) * building.storageBonusPerLevel;
        }
    }

    const multiplier = 1 + ambarCount * (ambarData.capacityBonusPerLevel || 0) + storageBonus;

    return (meta.baseCapacity + flat) * multiplier;
}

export function getCapacityBonus(id) {
    const building = BUILDINGS_DATA[id];
    if (!building || building.type !== "capacityBonus") return 0;

    return getBuildingCount(id) * (building.capacityBonusPerLevel || 0) * 100;
}

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

export function getSeasonMultiplier(resource) {
    const season = SEASONS_DATA[state.season.id];
    if (!season || !season.modifiers) return 1;
    const value = season.modifiers[resource];
    return typeof value === "number" ? value : 1;
}

export function getSeason() {
    return SEASONS_DATA[state.season.id];
}

export function getSeasonTimer() {
    return state.season.timer;
}

export function getIndustryOutput(resource) {
    let total = 0;

    for (const id of Object.keys(INDUSTRY_DATA)) {
        const industry = INDUSTRY_DATA[id];
        const entry = state.industry[id];
        if (!entry.built || entry.workers <= 0) continue;
        if (industry.output[resource]) {
            total += entry.workers * industry.output[resource];
        }
    }

    if (total === 0) return 0;
    return total * getOutputMultiplier(resource) * getWorkerMultiplier();
}

export function getTotalProduction(resource) {
    return getResourceProduction(resource) + getIndustryOutput(resource);
}

export function getNetRate(resource) {
    return getTotalProduction(resource) - getResourceConsumption(resource);
}

const POP_SU_RATE = 0.08;
const POP_YIYECEK_RATE = 0.10;
const POP_EKMEK_RATE = 0.02;
const POP_ILAC_RATE = 0.005;
const POP_GOLD_RATE = 0.004;
const WORKER_WAGE = 0.01;
const LUXURY_ORDER = ["sarap", "konyak", "kumas", "mobilya", "mucevher", "heykel"];
const LUXURY_RATES = { sarap: 0.0005, konyak: 0.00005, kumas: 0.00002, mobilya: 0.001, mucevher: 0.0003, heykel: 0.0003 };
const LUXURY_HAPPINESS = { sarap: 5, konyak: 6, kumas: 7, mobilya: 7, mucevher: 8, heykel: 9 };

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
            total += entry.workers * industry.input[resource];
        }
    }

    const pop = getPopulationAlive();
    if (pop > 0) {
        if (resource === "su") total += pop * POP_SU_RATE;
        if (resource === "yiyecek") total += pop * POP_YIYECEK_RATE;
        if (resource === "ekmek") total += pop * POP_EKMEK_RATE;
        if (resource === "ilac") total += pop * POP_ILAC_RATE;
        if (resource === "altin") total += pop * POP_GOLD_RATE;
        if (resource === "sarap") total += pop * LUXURY_RATES.sarap;
        if (resource === "konyak") total += pop * LUXURY_RATES.konyak;
        if (resource === "kumas") total += pop * LUXURY_RATES.kumas;
        if (resource === "mobilya") total += pop * LUXURY_RATES.mobilya;
        if (resource === "mucevher") total += pop * LUXURY_RATES.mucevher;
        if (resource === "heykel") total += pop * LUXURY_RATES.heykel;
    }

    if (resource === "altin") {
        total += getWorkerCount() * WORKER_WAGE;
    }

    return total;
}

export function getBuildingProduction(id) {
    const building = BUILDINGS_DATA[id];
    if (!building || building.type !== "producer") return 0;

    const base = getBuildingCount(id) * building.production;
    if (base === 0) return 0;

    return base * getOutputMultiplier(building.outputResource);
}

export function getBuildingBonus(id) {
    const building = BUILDINGS_DATA[id];
    if (!building) return 0;

    if (building.type === "bonus") {
        return getBuildingCount(id) * (building.bonusPerLevel || 0) * 100;
    }
    if (building.type === "costBonus") {
        return getBuildingCount(id) * (building.costDiscountPerLevel || 0) * 100;
    }
    if (building.type === "workerBonus") {
        return getBuildingCount(id) * (building.workerBonusPerLevel || 0) * 100;
    }
    if (building.type === "storageBonus") {
        return getBuildingCount(id) * (building.storageBonusPerLevel || 0) * 100;
    }
    if (building.type === "productBonus") {
        return getBuildingCount(id) * (building.productBonusPerLevel || 0) * 100;
    }
    if (building.type === "tradeBonus") {
        return getBuildingCount(id) * (building.tradeBonusPerLevel || 0) * 100;
    }
    return 0;
}

function getCostDiscount() {
    let discount = 0;
    for (const id of Object.keys(BUILDINGS_DATA)) {
        const building = BUILDINGS_DATA[id];
        if (building.type === "costBonus" && building.costDiscountPerLevel) {
            discount += getBuildingCount(id) * building.costDiscountPerLevel;
        }
    }
    for (const id of Object.keys(PACKS_DATA)) {
        const pack = PACKS_DATA[id];
        if (pack.costDiscountPerLevel) {
            discount += getPackCount(id) * pack.costDiscountPerLevel;
        }
    }
    return Math.max(0.5, 1 - discount);
}

export function getWorkerMultiplier() {
    let bonus = 0;
    for (const id of Object.keys(BUILDINGS_DATA)) {
        const building = BUILDINGS_DATA[id];
        if (building.type === "workerBonus" && building.workerBonusPerLevel) {
            bonus += getBuildingCount(id) * building.workerBonusPerLevel;
        }
    }
    return 1 + bonus;
}

export function getPowerProduction() {
    return Math.max(0, getResourceProduction("power") - getPowerMaintenance());
}

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

export function getBuildingCost(id) {
    const building = BUILDINGS_DATA[id];
    const multiplier = Math.pow(building.costMultiplier, getBuildingCount(id));
    const cost = {};

    for (const [resource, amount] of Object.entries(building.baseCost)) {
        cost[resource] = Math.ceil(amount * multiplier * getCostDiscount());
    }

    return cost;
}

export function getPackCost(id) {
    const pack = PACKS_DATA[id];
    const multiplier = Math.pow(pack.costMultiplier, getPackCount(id));
    const cost = {};

    for (const [resource, amount] of Object.entries(pack.baseCost)) {
        cost[resource] = Math.ceil(amount * multiplier);
    }

    return cost;
}

export function getParagon() {
    return state.prestige.paragon;
}

export function getKarma() {
    return state.prestige.karma;
}

export function getPrestigeResets() {
    return state.prestige.resets;
}

export function getTradeInterval() {
    const count = getBuildingCount("tradePost");
    return Math.max(12, TRADE_INTERVAL / (1 + count * 0.5));
}

export function getTradeCurrent() {
    return state.trade.current;
}

export function getTradeTimer() {
    return state.trade.timer;
}

export function getTradeCount() {
    return state.trade.count;
}

function generateTradeOffer() {
    const resources = Object.keys(TRADE_PRICES);
    const resource = resources[Math.floor(Math.random() * resources.length)];
    const meta = RESOURCES[resource];
    const range = TRADE_AMOUNTS[meta.rarity] || TRADE_AMOUNTS[2];
    const amount =
        Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    const postBonus = 1 + getBuildingCount("tradePost") * 0.5;
    const boosted = Math.round(amount * postBonus);

    const cost = Math.max(1, Math.round(boosted * TRADE_PRICES[resource] * 0.6));

    return {
        cost,
        get: { resource, amount: boosted },
    };
}

export function acceptTrade() {
    const offer = state.trade.current;
    if (!offer) return false;
    if (getResource("altin") < offer.cost) return false;

    const capacity = getResourceCapacity(offer.get.resource);
    if (
        Number.isFinite(capacity) &&
        getResource(offer.get.resource) >= capacity
    ) {
        return false;
    }

    state.resources.altin -= offer.cost;
    state.resources[offer.get.resource] = Number.isFinite(capacity)
        ? Math.min(capacity, getResource(offer.get.resource) + offer.get.amount)
        : getResource(offer.get.resource) + offer.get.amount;

    state.trade.current = null;
    state.trade.timer = getTradeInterval();
    state.trade.count++;
    emit();
    return true;
}

function pay(cost) {
    for (const [resource, amount] of Object.entries(cost)) {
        state.resources[resource] -= amount;
    }
}

export function buyBuilding(id) {
    const building = BUILDINGS_DATA[id];
    if (!getUnlock(building)) return false;

    const cost = getBuildingCost(id);

    if (!canAfford(cost, getResource)) return false;

    pay(cost);
    state.buildings[id]++;
    emit();
    return true;
}

export function buyPack(id) {
    const pack = PACKS_DATA[id];
    if (!getUnlock(pack)) return false;

    const cost = getPackCost(id);

    if (!canAfford(cost, getResource)) return false;

    pay(cost);
    state.packs[id]++;
    emit();
    return true;
}

export function addPower(amount) {
    if (amount > 0) {
        state.resources.power += amount;
        emit();
    }
}

export function getIndustry(id) {
    return state.industry[id];
}

export function getIndustryBuilt(id) {
    return state.industry[id].built;
}

export function getIndustryWorkers(id) {
    return state.industry[id].workers;
}

export function getIndustryCost(id) {
    const industry = INDUSTRY_DATA[id];
    const cost = {};

    for (const [resource, amount] of Object.entries(industry.baseCost)) {
        cost[resource] = Math.ceil(amount);
    }

    return cost;
}

export function buildIndustry(id) {
    const industry = INDUSTRY_DATA[id];
    const entry = state.industry[id];
    if (entry.built) return false;
    if (!getUnlock(industry)) return false;

    const cost = getIndustryCost(id);
    if (!canAfford(cost, getResource)) return false;

    pay(cost);
    entry.built = true;
    emit();
    return true;
}

export function getWorkerCount() {
    let total = 0;

    for (const id of Object.keys(INDUSTRY_DATA)) {
        if (state.industry[id].built) {
            total += state.industry[id].workers;
        }
    }

    return total;
}

export function addWorker(id) {
    const entry = state.industry[id];
    if (!entry.built) return false;
    if (entry.workers >= INDUSTRY_DATA[id].maxWorkers) return false;
    if (getWorkerCount() >= getPopulationAlive()) return false;

    entry.workers++;
    emit();
    return true;
}

export function removeWorker(id) {
    const entry = state.industry[id];
    if (entry.workers <= 0) return false;

    entry.workers--;
    emit();
    return true;
}

export function getPopulationCurrent() {
    return state.population.current;
}

export function getPopulationAlive() {
    return Math.floor(state.population.current);
}

export function getPopulationCapacity() {
    let capacity = 0;

    for (const id of Object.keys(BUILDINGS_DATA)) {
        const building = BUILDINGS_DATA[id];
        if (building.type === "housing") {
            capacity += getBuildingCount(id) * building.housingCapacity;
        }
    }

    return capacity;
}

export function getPopulationSatisfaction() {
    return state.population.satisfaction;
}

export function getPopulationDeficiency() {
    return state.population.deficiency;
}

export function getHappinessBreakdown() {
    return computeHappinessBreakdown();
}

export function getHappinessTarget() {
    return computeHappinessBreakdown().target;
}

export function getMigrationInterval() {
    const sat = state.population.satisfaction;
    if (sat >= 70) return 45;
    if (sat >= 50) return 60;
    if (sat >= 30) return 90;
    return 120;
}

export const ARRIVAL_DURATION = 30;

export function getArrivalDuration() {
    return ARRIVAL_DURATION;
}

export function getPopulationMigrants() {
    return state.population.migrants;
}

export function arriveMigrant() {
    if (state.population.migrants <= 0) return;

    const capacity = getPopulationCapacity();
    state.population.migrants--;
    if (state.population.current + state.population.migrants <= capacity) {
        state.population.current++;
    }
    emit();
}

export function getInfoProduction() {
    return getResourceProduction("bilgi");
}

export function hasInfoProduction() {
    return getInfoProduction() > 0;
}

export function getSellPrice(resource) {
    const meta = RESOURCES[resource];
    return meta && meta.satisFiyati ? meta.satisFiyati : 0;
}

export function isSellable(resource) {
    const meta = RESOURCES[resource];
    return !!meta && Number.isFinite(meta.satisFiyati) && meta.satisFiyati > 0;
}

export function getAutoSell(resource) {
    return state.settings.autoSell[resource] === true;
}

export function toggleAutoSell(resource) {
    if (!isSellable(resource)) return;
    state.settings.autoSell[resource] = !getAutoSell(resource);
    emit();
}

export function sellResource(resource, amount) {
    if (!isSellable(resource)) return false;
    const price = getSellPrice(resource);
    const actual = Math.min(getResource(resource), amount);
    if (actual <= 0) return false;

    state.resources[resource] -= actual;
    state.resources.altin += actual * price;
    emit();
    return true;
}

export function sellSurplus(resource) {
    const capacity = getResourceCapacity(resource);
    if (!Number.isFinite(capacity)) return false;

    const threshold = capacity * 0.5;
    const surplus = getResource(resource) - threshold;
    if (surplus <= 0) return false;

    return sellResource(resource, surplus);
}

const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

export function produce() {
    let changed = false;

    const snapshot = computeDerivedState();

    const powerProduction = snapshot.powerProduction / TICKS_PER_SECOND;
    if (powerProduction > 0) {
        state.resources.power += powerProduction;
        changed = true;
    }

    for (const resource of Object.keys(RESOURCES)) {
        if (resource === "power" || resource === "altin") continue;
        if (RESOURCES[resource].tier !== "raw") continue;

        const production = snapshot.derived[resource].production / TICKS_PER_SECOND;
        if (production > 0) {
            state.resources[resource] = Math.min(
                snapshot.derived[resource].capacity,
                state.resources[resource] + production
            );
            changed = true;
        }
    }

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

        for (const [resource, rate] of Object.entries(industry.input)) {
            state.resources[resource] -= (entry.workers * rate) / TICKS_PER_SECOND;
        }

        for (const [resource, rate] of Object.entries(industry.output)) {
            const capacity = getResourceCapacity(resource);
            const produced =
                (entry.workers *
                    rate *
                    getOutputMultiplier(resource) *
                    getWorkerMultiplier()) /
                TICKS_PER_SECOND;
            state.resources[resource] = Number.isFinite(capacity)
                ? Math.min(capacity, state.resources[resource] + produced)
                : state.resources[resource] + produced;
        }

        changed = true;
    }

    if (consumePopulation()) changed = true;
    if (applyPopulationLifecycle()) changed = true;
    if (autoSellSurplus()) changed = true;

    state.season.timer -= 1 / TICKS_PER_SECOND;
    if (state.season.timer <= 0) {
        const idx = SEASON_ORDER.indexOf(state.season.id);
        state.season.id = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
        state.season.timer = SEASON_DURATION;
        changed = true;
    }

    state.trade.timer -= 1 / TICKS_PER_SECOND;
    if (state.trade.timer <= 0) {
        state.trade.timer = getTradeInterval();
        state.trade.current = generateTradeOffer();
        changed = true;
    }

    if (changed) emit(snapshot);
}

function consumePopulation() {
    const alive = getPopulationAlive();
    if (alive <= 0) {
        state.population.deficiency = 0;
        state.population.ilacOk = false;
        return false;
    }

    const happiness = computeHappinessBreakdown();
    let changed = false;

    const suNeed = (alive * POP_SU_RATE) / TICKS_PER_SECOND;
    const suUsed = Math.min(getResource("su"), suNeed);
    state.resources.su -= suUsed;
    if (suUsed > 0) changed = true;

    const ekmekNeed = (alive * POP_EKMEK_RATE) / TICKS_PER_SECOND;
    const ekmekUsed = Math.min(getResource("ekmek"), ekmekNeed);
    state.resources.ekmek -= ekmekUsed;
    if (ekmekUsed > 0) changed = true;

    const foodNeed = (alive * POP_YIYECEK_RATE) / TICKS_PER_SECOND;
    const coveredByEkmek = ekmekUsed * 2.5;
    const foodRemain = Math.max(0, foodNeed - coveredByEkmek);
    const foodUsed = Math.min(getResource("yiyecek"), foodRemain);
    state.resources.yiyecek -= foodUsed;
    if (foodUsed > 0) changed = true;

    const ilacNeed = (alive * POP_ILAC_RATE) / TICKS_PER_SECOND;
    const ilacUsed = Math.min(getResource("ilac"), ilacNeed);
    state.resources.ilac -= ilacUsed;
    if (ilacUsed > 0) changed = true;
    state.population.ilacOk = ilacUsed >= ilacNeed * 0.99;

    const goldNeed = (alive * POP_GOLD_RATE + getWorkerCount() * WORKER_WAGE) / TICKS_PER_SECOND;
    const goldUsed = Math.min(getResource("altin"), goldNeed);
    state.resources.altin -= goldUsed;
    if (goldUsed > 0) changed = true;

    for (const luxury of LUXURY_ORDER) {
        const need = (alive * LUXURY_RATES[luxury]) / TICKS_PER_SECOND;
        const used = Math.min(getResource(luxury), need);
        state.resources[luxury] -= used;
        if (used > 0) changed = true;
    }

    const sat = state.population.satisfaction;
    const newSat = sat + (happiness.target - sat) * 0.05;
    if (Math.abs(newSat - sat) > 0.01) {
        state.population.satisfaction = newSat;
        changed = true;
    }

    const suDeficitRatio = suNeed > 0 ? suDeficit(suNeed, suUsed) : 0;
    const foodDeficitRatio = foodNeed > 0 ? foodDeficit(foodNeed, coveredByEkmek, foodUsed) : 0;
    state.population.deficiency = Math.max(suDeficitRatio, foodDeficitRatio);

    return changed;
}

function computeHappinessBreakdown() {
    const alive = getPopulationAlive();
    const items = [];

    if (alive <= 0) return { items, target: 50 };

    const ticks = TICKS_PER_SECOND;

    const suNeed = (alive * POP_SU_RATE) / ticks;
    const suMet = getResource("su") >= suNeed;
    items.push({ emoji: "💧", label: "Temiz Su", delta: suMet ? 10 : -15, met: suMet });

    const ekmekNeed = (alive * POP_EKMEK_RATE) / ticks;
    const foodNeed = (alive * POP_YIYECEK_RATE) / ticks;
    const foodMet =
        getResource("ekmek") >= ekmekNeed &&
        getResource("yiyecek") >= Math.max(0, foodNeed - ekmekNeed * 2.5);
    items.push({ emoji: "🍞", label: "Ekmek & Yiyecek", delta: foodMet ? 10 : -15, met: foodMet });

    const ilacNeed = (alive * POP_ILAC_RATE) / ticks;
    const ilacMet = getResource("ilac") >= ilacNeed;
    items.push({ emoji: "💊", label: "İlaç", delta: ilacMet ? 5 : -10, met: ilacMet });

    for (const luxury of LUXURY_ORDER) {
        if (getTotalProduction(luxury) <= 0) continue;
        const need = (alive * LUXURY_RATES[luxury]) / ticks;
        const met = getResource(luxury) >= need;
        const value = LUXURY_HAPPINESS[luxury];
        const delta = met ? value : -value;
        items.push({ emoji: RESOURCES[luxury].emoji, label: RESOURCES[luxury].name, delta, met });
    }

    const goldNeed = (alive * POP_GOLD_RATE + getWorkerCount() * WORKER_WAGE) / ticks;
    const goldMet = getResource("altin") >= goldNeed;
    items.push({ emoji: "🥂", label: "Altın Kutlama", delta: goldMet ? 8 : 0, met: goldMet, optional: true });

    const evCap = getBuildingCount("ev") * BUILDINGS_DATA.ev.housingCapacity;
    const barakaCap = getBuildingCount("baraka") * BUILDINGS_DATA.baraka.housingCapacity;
    const totalCap = evCap + barakaCap;
    const evRatio = totalCap > 0 ? evCap / totalCap : 0;
    const housingDelta = Math.round(evRatio * 8);
    if (housingDelta > 0) {
        items.push({ emoji: "🏠", label: "Konut Konforu", delta: housingDelta, met: true });
    }

    let buildingDelta = 0;
    for (const id of Object.keys(BUILDINGS_DATA)) {
        const building = BUILDINGS_DATA[id];
        if (building.happinessPerLevel) {
            buildingDelta += getBuildingCount(id) * building.happinessPerLevel;
        }
    }
    buildingDelta = Math.min(5, buildingDelta);
    if (buildingDelta > 0) {
        items.push({ emoji: "🌿", label: "Rahatlama", delta: buildingDelta, met: true });
    }

    const cultureProd = getTotalProduction("kultur");
    if (cultureProd > 0) {
        const cultureDelta = Math.min(8, getBuildingCount("amphitheatre"));
        if (cultureDelta > 0) {
            items.push({ emoji: "🏛️", label: "Kültür", delta: cultureDelta, met: true });
        }
    }

    let totalJobSlots = 0;
    for (const id of Object.keys(INDUSTRY_DATA)) {
        if (state.industry[id].built) totalJobSlots += INDUSTRY_DATA[id].maxWorkers;
    }
    let idleDelta = 0;
    if (totalJobSlots > 0) {
        const idleRatio = 1 - getWorkerCount() / alive;
        if (idleRatio <= 0.35) idleDelta = 5;
        else if (idleRatio > 0.65) idleDelta = -3;
    }
    if (idleDelta !== 0) {
        items.push({ emoji: "👷", label: "İşgücü Dengesi", delta: idleDelta, met: idleDelta > 0 });
    }

    let target = 0;
    for (const item of items) target += item.delta;
    target = Math.max(0, Math.min(100, target));
    target = Math.min(100, target + getKarma() * 0.25);

    return { items, target };
}

function suDeficit(need, used) {
    return Math.max(0, need - used) / need;
}

function foodDeficit(need, coveredByEkmek, foodUsed) {
    return Math.max(0, Math.max(0, need - coveredByEkmek) - foodUsed) / need;
}

function applyPopulationLifecycle() {
    let changed = false;

    if (getPopulationAlive() > 0) {
        const sat = state.population.satisfaction;
        let threshold = 0.2;
        if (sat < 30) threshold = 0.12;
        else if (sat >= 50) threshold = 0.28;

        const deficiency = state.population.deficiency || 0;
        if (deficiency > threshold) {
            const excess = Math.min(1, (deficiency - threshold) / (1 - threshold));
            const ilacFactor = state.population.ilacOk ? 0.5 : 1;
            const deathRate = excess * 0.05 * ilacFactor;
            const deathAmount = (state.population.current * deathRate) / TICKS_PER_SECOND;

            if (deathAmount > 0) {
                state.population.current = Math.max(0, state.population.current - deathAmount);
                changed = true;
                if (trimWorkers()) changed = true;
            }
        }
    }

    const capacity = getPopulationCapacity();
    const hasFoodProduction =
        getTotalProduction("su") > 0 || getTotalProduction("yiyecek") > 0;
    if (
        state.population.current + state.population.migrants < capacity &&
        hasFoodProduction
    ) {
        state.population.migrationTimer -= 1 / TICKS_PER_SECOND;
        if (state.population.migrationTimer <= 0) {
            state.population.migrants++;
            state.population.migrationTimer = getMigrationInterval();
            if (state.population.arrivalTimer <= 0) {
                state.population.arrivalTimer = ARRIVAL_DURATION;
            }
            changed = true;
        }
    } else {
        state.population.migrationTimer = 0;
    }

    if (state.population.migrants > 0) {
        state.population.arrivalTimer -= 1 / TICKS_PER_SECOND;
        if (state.population.arrivalTimer <= 0) {
            arriveMigrant();
            state.population.arrivalTimer = ARRIVAL_DURATION;
            changed = true;
        }
    } else if (state.population.arrivalTimer > 0) {
        state.population.arrivalTimer = 0;
    }

    return changed;
}

function trimWorkers() {
    const alive = getPopulationAlive();
    let total = getWorkerCount();
    if (total <= alive) return false;

    let changed = false;
    const ids = Object.keys(INDUSTRY_DATA).reverse();

    for (const id of ids) {
        if (total <= alive) break;
        const entry = state.industry[id];
        const remove = Math.min(entry.workers, total - alive);
        if (remove > 0) {
            entry.workers -= remove;
            total -= remove;
            changed = true;
        }
    }

    return changed;
}

function autoSellSurplus() {
    let changed = false;

    for (const id of Object.keys(RESOURCES)) {
        if (!isSellable(id)) continue;
        if (!getAutoSell(id)) continue;

        const capacity = getResourceCapacity(id);
        if (!Number.isFinite(capacity)) continue;

        const threshold = capacity * 0.5;
        const current = getResource(id);
        if (current > threshold) {
            const surplus = current - threshold;
            state.resources[id] = threshold;
            state.resources.altin += surplus * getSellPrice(id);
            changed = true;
        }
    }

    return changed;
}

export function resetGame() {
    const alive = getPopulationAlive();
    const sat = state.population.satisfaction;

    if (alive > 0) {
        state.prestige.paragon += Math.floor(alive / 10);
        state.prestige.karma += Math.floor((alive * sat) / 1000);
        state.prestige.resets++;
    }

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
        state.industry[id] = { built: false, workers: 0, stalled: false, outputFull: false };
    }

    state.population = {
        current: 0,
        migrants: 0,
        satisfaction: 50,
        migrationTimer: 0,
        arrivalTimer: 0,
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
    emit();
    suppressSave = false;
    localStorage.removeItem(STORAGE_KEY_V8);
    localStorage.removeItem(STORAGE_KEY_V7);
    localStorage.removeItem(STORAGE_KEY_V6);
    localStorage.removeItem(STORAGE_KEY_V5);
    localStorage.removeItem(STORAGE_KEY_V4);
    localStorage.removeItem(STORAGE_KEY_V3);
}

export function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

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

function emit(snapshot) {
    scheduleSave();

    if (!snapshot) snapshot = computeDerivedState();

    for (const fn of listeners) {
        fn(state, snapshot);
    }
}

let savePending = false;
let saveTimer = null;
let suppressSave = false;

function scheduleSave() {
    if (suppressSave) return;
    if (savePending) return;

    savePending = true;
    saveTimer = setTimeout(() => {
        savePending = false;
        saveTimer = null;
        saveState();
    }, 500);
}

function saveState() {
    localStorage.setItem(
        STORAGE_KEY_V9,
        JSON.stringify({
            resources: state.resources,
            buildings: state.buildings,
            packs: state.packs,
            industry: state.industry,
            population: state.population,
            prestige: state.prestige,
            season: state.season,
            trade: state.trade,
            settings: state.settings,
        })
    );
}

if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveState();
    });
}
