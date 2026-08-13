import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { PACKS_DATA } from "./packs.js";
import { canAfford } from "./utils.js";

const state = {
    resources: {},
    buildings: {},
    packs: {},
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

const listeners = new Set();

const STORAGE_KEY = "plush-clicker:state-v3";
const LEGACY_STORAGE_KEY = "plush-clicker:state-v2";

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw);

        if (saved.resources && typeof saved.resources === "object") {
            for (const id of Object.keys(state.resources)) {
                if (Number.isFinite(saved.resources[id])) {
                    state.resources[id] = saved.resources[id];
                }
            }
        }

        if (saved.buildings && typeof saved.buildings === "object") {
            for (const id of Object.keys(state.buildings)) {
                if (Number.isFinite(saved.buildings[id])) {
                    state.buildings[id] = Math.floor(saved.buildings[id]);
                }
            }
        }

        if (saved.packs && typeof saved.packs === "object") {
            for (const id of Object.keys(state.packs)) {
                if (Number.isFinite(saved.packs[id])) {
                    state.packs[id] = Math.floor(saved.packs[id]);
                }
            }
        }
    } catch (err) {
        console.warn("Kayıt yüklenemedi:", err);
    }
}

loadState();

try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
} catch (err) {
    console.warn("Eski kayıt temizlenemedi:", err);
}

export function getResource(resource) {
    return state.resources[resource] || 0;
}

export function getKarma() {
    return getResource("karma");
}

export function getBuildingCount(id) {
    return state.buildings[id] || 0;
}

export function getPackCount(id) {
    return state.packs[id] || 0;
}

export function getUnlock(data) {
    if (!data || !data.unlock) return true;

    const unlock = data.unlock;
    if (unlock.type === "building") {
        return getBuildingCount(unlock.id) >= unlock.count;
    }
    if (unlock.type === "pack") {
        return getPackCount(unlock.id) >= unlock.level;
    }
    if (unlock.type === "resource") {
        return getResource(unlock.id) >= unlock.amount;
    }
    return true;
}

function getUnlockProgress(data) {
    if (!data || !data.unlock) return "";

    const unlock = data.unlock;
    if (unlock.type === "building") {
        return Math.min(getBuildingCount(unlock.id), unlock.count) + "/" + unlock.count;
    }
    if (unlock.type === "pack") {
        return Math.min(getPackCount(unlock.id), unlock.level) + "/" + unlock.level;
    }
    if (unlock.type === "resource") {
        return Math.min(getResource(unlock.id), unlock.amount) + "/" + unlock.amount;
    }
    return "";
}

export function getUnlockType(data) {
    if (!data || !data.unlock) return null;
    return data.unlock.type;
}

export function isNearUnlock(data) {
    if (!data || !data.unlock) return true;

    const unlock = data.unlock;
    if (unlock.type === "building") {
        return getBuildingCount(unlock.id) > 0;
    }
    if (unlock.type === "pack") {
        return getPackCount(unlock.id) > 0;
    }
    if (unlock.type === "resource") {
        return false;
    }
    return true;
}

export function getUnlockText(data) {
    if (!data || !data.unlock) return "";

    const unlock = data.unlock;
    let target = "";
    if (unlock.type === "building") {
        target = BUILDINGS_DATA[unlock.id].name;
    }
    if (unlock.type === "pack") {
        target = PACKS_DATA[unlock.id].name;
    }
    if (unlock.type === "resource") {
        target = RESOURCES[unlock.id].name;
    }

    return target + " (" + getUnlockProgress(data) + ")";
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

    for (const id of Object.keys(PACKS_DATA)) {
        const pack = PACKS_DATA[id];
        if (pack.targetResource === resource && pack.karmaBonusPerLevel) {
            sum += getPackCount(id) * pack.karmaBonusPerLevel;
        }
    }

    return 1 + sum;
}

function getClickMultiplier() {
    let sum = 0;

    for (const id of Object.keys(PACKS_DATA)) {
        const pack = PACKS_DATA[id];
        if (pack.clickBonusPerLevel) {
            sum += getPackCount(id) * pack.clickBonusPerLevel;
        }
    }

    return 1 + sum;
}

export function getCritChance() {
    let sum = 0;

    for (const id of Object.keys(PACKS_DATA)) {
        const pack = PACKS_DATA[id];
        if (pack.critChancePerLevel) {
            sum += getPackCount(id) * pack.critChancePerLevel;
        }
    }

    return Math.min(sum, 1);
}

export const CRIT_MULTIPLIER = 10;

function getAutoClickCount() {
    let sum = 0;

    for (const id of Object.keys(PACKS_DATA)) {
        const pack = PACKS_DATA[id];
        if (pack.autoClickPerLevel) {
            sum += getPackCount(id) * pack.autoClickPerLevel;
        }
    }

    return sum;
}

export function getClickValue() {
    const base = 1 + 0.05 * getBuildingCount("fountain");
    return base * getOutputMultiplier("karma") * getClickMultiplier();
}

export function getResourceCapacity(resource) {
    const meta = RESOURCES[resource];
    if (!meta) return 0;

    let capacity = meta.baseCapacity;

    for (const id of Object.keys(BUILDINGS_DATA)) {
        const building = BUILDINGS_DATA[id];
        if (building.type === "producer" && building.outputResource === resource) {
            capacity += getBuildingCount(id) * building.capacityPerUnit;
        }
    }

    return capacity;
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
    return base * getOutputMultiplier(resource);
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
    if (!building || building.type !== "bonus") return 0;

    return getBuildingCount(id) * (building.bonusPerLevel || 0) * 100;
}

export function getKarmaProduction() {
    return getResourceProduction("karma") + getAutoClickCount() * getClickValue();
}

export function getBuildingCost(id) {
    const building = BUILDINGS_DATA[id];
    const multiplier = Math.pow(building.costMultiplier, getBuildingCount(id));
    const cost = {};

    for (const [resource, amount] of Object.entries(building.baseCost)) {
        cost[resource] = Math.ceil(amount * multiplier);
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

export function addKarma(amount) {
    if (amount > 0) {
        state.resources.karma += amount;
        emit();
    }
}

const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

export function produce() {
    let changed = false;

    const karmaProduction = getKarmaProduction() / TICKS_PER_SECOND;
    if (karmaProduction > 0) {
        state.resources.karma += karmaProduction;
        changed = true;
    }

    for (const resource of Object.keys(RESOURCES)) {
        if (resource === "karma") continue;

        const production = getResourceProduction(resource) / TICKS_PER_SECOND;
        if (production > 0) {
            state.resources[resource] = Math.min(
                getResourceCapacity(resource),
                state.resources[resource] + production
            );
            changed = true;
        }
    }

    if (changed) emit();
}

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

    suppressSave = true;
    emit();
    suppressSave = false;
    localStorage.removeItem(STORAGE_KEY);
}

export function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function emit() {
    scheduleSave();

    for (const fn of listeners) {
        fn(state);
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
        STORAGE_KEY,
        JSON.stringify({
            resources: state.resources,
            buildings: state.buildings,
            packs: state.packs,
        })
    );
}

if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveState();
    });
}
