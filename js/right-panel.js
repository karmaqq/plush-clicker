import { loadCss, canAfford, formatCount, createLockOverlay, triggerShake } from "./utils.js";
import { PACKS_DATA } from "./packs.js";
import { RESOURCES } from "./resources.js";
import {
    getResource,
    getPackCount,
    getPackCost,
    getUnlock,
    getUnlockText,
    getUnlockType,
    isNearUnlock,
    buyPack,
    onChange,
} from "./game-state.js";

loadCss("css/right-panel.css");

export function createRightPanel() {
    const panel = document.createElement("section");
    panel.className = "panel right-panel";

    const header = document.createElement("div");
    header.className = "list-title";
    header.textContent = "Paketler";

    const list = document.createElement("div");
    list.className = "upgrade-list";

    for (const id of Object.keys(PACKS_DATA)) {
        list.appendChild(createPackCard(id, PACKS_DATA[id]));
    }

    panel.append(header, list);
    return panel;
}

function createPackCard(id, data) {
    const card = document.createElement("div");
    card.className = "upgrade-card resource-" + (data.targetResource || "karma");

    const head = document.createElement("div");
    head.className = "upgrade-head";

    const name = document.createElement("div");
    name.className = "upgrade-name";
    name.textContent = data.emoji + " " + data.name;

    const level = document.createElement("div");
    level.className = "upgrade-level";
    level.textContent = "Seviye 0";

    head.append(name, level);

    const desc = document.createElement("div");
    desc.className = "upgrade-desc";
    desc.textContent = data.description;

    const effect = document.createElement("div");
    effect.className = "upgrade-effect";

    const effectLabel = document.createElement("span");
    effectLabel.className = "upgrade-effect-label";
    effectLabel.textContent = "Etki:";

    const effectValue = document.createElement("span");
    effectValue.className = "upgrade-effect-value";

    effect.append(effectLabel, effectValue);

    const buyBtn = document.createElement("button");
    buyBtn.type = "button";
    buyBtn.className = "upgrade-btn";

    const costSpans = {};
    for (const resource of Object.keys(data.baseCost)) {
        const span = document.createElement("span");
        span.className = "upgrade-cost";
        buyBtn.appendChild(span);
        costSpans[resource] = span;
    }

    buyBtn.addEventListener("click", () => {
        if (getUnlock(data) && !buyPack(id)) {
            triggerShake(buyBtn);
        }
    });

    const lockOverlay = createLockOverlay();

    card.append(head, desc, effect, buyBtn, lockOverlay.element);

    let lastOwned = null;
    let cost = null;

    function update() {
        const unlocked = getUnlock(data);
        card.classList.toggle("locked", !unlocked);

        if (!unlocked) {
            if (!isNearUnlock(data)) {
                if (!card.hidden) card.hidden = true;
                return;
            }
            card.hidden = false;
            lockOverlay.lockName.textContent = data.name;
            const unlockType = getUnlockType(data);
            lockOverlay.lockDesc.textContent = getUnlockText(data);
            lockOverlay.lockDesc.classList.toggle("lock-req-building", unlockType === "building");
            lockOverlay.lockDesc.classList.toggle("lock-req-pack", unlockType === "pack");
            level.textContent = "";
            desc.textContent = "";
            effectValue.textContent = "";
            buyBtn.title = "";
            lastOwned = null;
            return;
        }

        card.hidden = false;

        const owned = getPackCount(id);

        if (owned !== lastOwned) {
            lastOwned = owned;
            cost = getPackCost(id);
            level.textContent = "Seviye " + owned;
            desc.textContent = data.description;
            effectValue.textContent = getPackEffectText(data, owned);
            effectValue.classList.toggle("off", owned === 0);
            buyBtn.title = formatPackCostText(cost) + " ile satın al";
        }

        for (const [resource, span] of Object.entries(costSpans)) {
            const amount = cost[resource];
            const enough = getResource(resource) >= amount;
            span.textContent = RESOURCES[resource].emoji + " " + formatCount(amount);
            span.classList.toggle("cost-ok", enough);
            span.classList.toggle("cost-missing", !enough);
        }

        buyBtn.classList.toggle("disabled", !canAfford(cost, getResource));
    }

    onChange(update);
    update();

    return card;
}

function getPackEffectText(data, owned) {
    if (owned === 0) return "Kapalı";
    if (data.clickBonusPerLevel) return "+%" + formatCount(owned * data.clickBonusPerLevel * 100) + " tık gücü";
    if (data.critChancePerLevel) return "+%" + formatCount(owned * data.critChancePerLevel * 100) + " kritik şans";
    if (data.autoClickPerLevel) return "+" + formatCount(owned * data.autoClickPerLevel) + " tık/sn";
    if (data.karmaBonusPerLevel) return "+%" + formatCount(owned * data.karmaBonusPerLevel * 100) + " üretim";
    return "";
}

function formatPackCostText(cost) {
    return Object.keys(RESOURCES)
        .filter((resource) => resource in cost)
        .map((resource) => RESOURCES[resource].emoji + " " + formatCount(cost[resource]))
        .join("  ");
}
