import { loadCss, getBadgeTier, canAfford, formatCount, formatNumber, createNumberCounter, createLockOverlay, triggerShake } from "./utils.js";
import { createTooltip } from "./tooltip.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { RESOURCES } from "./resources.js";
import {
    getBuildingCount,
    getBuildingCost,
    getBuildingProduction,
    getBuildingBonus,
    getOutputMultiplier,
    getResource,
    getUnlock,
    getUnlockText,
    getUnlockType,
    isNearUnlock,
    buyBuilding,
    onChange,
} from "./game-state.js";

loadCss("css/left-panel.css");

const tooltip = createTooltip("building-tooltip");

export function createLeftPanel() {
    const panel = document.createElement("section");
    panel.className = "panel left-panel";

    const header = document.createElement("div");
    header.className = "list-title";
    header.textContent = "Binalar";

    const grid = document.createElement("div");
    grid.className = "building-list";

    const buildingIds = Object.keys(BUILDINGS_DATA);

    for (const id of buildingIds) {
        grid.appendChild(createBuildingCard(id, BUILDINGS_DATA[id]));
    }

    panel.append(header, grid);
    return panel;
}

function createBuildingCard(id, data) {
    const isBonus = data.type === "bonus";
    const resourceId = data.outputResource || data.targetResource;

    const card = document.createElement("div");
    card.className = "building-card resource-" + resourceId + (isBonus ? " building-bonus" : "");

    card.addEventListener("click", () => {
        if (getUnlock(data) && !buyBuilding(id)) {
            triggerShake(card);
        }
    });

    const lockOverlay = createLockOverlay();

    let tooltipActive = false;

    card.addEventListener("mouseenter", () => {
        if (!getUnlock(data)) return;
        tooltipActive = true;
        buildBuildingTooltip(id, data);
        tooltip.show(card);
    });

    card.addEventListener("mouseleave", () => {
        tooltipActive = false;
        tooltip.hide();
    });

    const name = document.createElement("div");
    name.className = "building-name";
    const nameTextEl = buildingNameText("");
    name.appendChild(nameTextEl);

    const badgeRow = document.createElement("div");
    badgeRow.className = "building-badge-row";

    const badgeEl = document.createElement("span");
    badgeEl.className = "badge building-badge";
    badgeRow.appendChild(badgeEl);

    const rate = document.createElement("div");
    rate.className = "building-rate";
    const rateEmoji = document.createElement("span");
    const rateCounter = createNumberCounter();

    if (isBonus) {
        rateEmoji.textContent = RESOURCES[resourceId].emoji;
        rate.append(rateEmoji, rateCounter.span);
    } else {
        rateEmoji.textContent = RESOURCES[resourceId].emoji + " +";
        const rateSuffix = document.createElement("span");
        rateSuffix.textContent = "/s";
        rate.append(rateEmoji, rateCounter.span, rateSuffix);
    }

    card.append(name, rate, badgeRow, lockOverlay.element);

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
            nameTextEl.textContent = "";
            badgeEl.textContent = "";
            rate.hidden = true;
            lastOwned = null;
            return;
        }

        card.hidden = false;
        rate.hidden = false;

        const owned = getBuildingCount(id);

        if (owned !== lastOwned) {
            lastOwned = owned;
            cost = getBuildingCost(id);
            nameTextEl.textContent = data.name;
            badgeEl.textContent = String(owned);
            badgeEl.className =
                "badge building-badge badge-tier-" +
                getBadgeTier(owned) +
                (owned === 0 ? " badge-empty" : "");
        }

        if (isBonus) {
            const bonusText = "%" + formatCount(getBuildingBonus(id));
            if (rateCounter.span.textContent !== bonusText) {
                rateCounter.span.textContent = bonusText;
            }
        } else {
            rateCounter.update(getBuildingProduction(id));
        }

        card.classList.toggle("affordable", canAfford(cost, getResource));

        if (tooltipActive) {
            refreshBuildingTooltip();
        }
    }

    onChange(update);
    update();

    return card;
}

const tooltipLive = { id: null, rows: [] };

function buildBuildingTooltip(id, data) {
    const cost = getBuildingCost(id);
    const isBonus = data.type === "bonus";
    const resourceId = data.outputResource || data.targetResource;
    const output = RESOURCES[resourceId];

    for (const r of Object.keys(RESOURCES)) {
        tooltip.element.classList.remove("resource-" + r);
    }
    tooltip.element.classList.add("resource-" + resourceId);

    tooltip.element.textContent = "";

    const title = document.createElement("div");
    title.className = "tooltip-title";
    title.textContent = data.name;
    tooltip.element.appendChild(title);

    const effect = document.createElement("div");
    effect.className = "tooltip-effect";

    const effectLine = document.createElement("div");
    effectLine.className = "tooltip-effect-line";

    const effectLabel = document.createElement("span");
    effectLabel.className = "effect-label";

    if (isBonus) {
        effectLabel.textContent = output.name + " üretim bonusu:";

        const prodValue = document.createElement("span");
        prodValue.className = "effect-value";
        prodValue.textContent = "%" + Math.round(data.bonusPerLevel * 100);

        effectLine.append(effectLabel, " ", prodValue);
        effect.appendChild(effectLine);
    } else {
        effectLabel.textContent = output.name + " Üretimi:";

        const prodValue = document.createElement("span");
        prodValue.className = "effect-value";
        prodValue.append("+", formatNumber(data.production * getOutputMultiplier(data.outputResource)), "/s");

        effectLine.append(effectLabel, " ", prodValue);
        effect.appendChild(effectLine);

        if (data.capacityPerUnit > 0) {
            const capacityLine = document.createElement("div");
            capacityLine.className = "tooltip-capacity-line";

            const capLabel = document.createElement("span");
            capLabel.className = "effect-label";
            capLabel.textContent = output.name + " Kapasitesi:";

            const capValue = document.createElement("span");
            capValue.className = "effect-value";
            capValue.append("+", formatCount(data.capacityPerUnit));

            capacityLine.append(capLabel, " ", capValue);
            effect.appendChild(capacityLine);
        }
    }

    tooltip.element.appendChild(effect);

    const costs = document.createElement("div");
    costs.className = "tooltip-costs";

    tooltipLive.id = id;
    tooltipLive.rows = [];

    for (const [resource, amount] of Object.entries(cost)) {
        const row = document.createElement("div");
        row.className = "cost-row";

        const label = document.createElement("span");
        label.className = "cost-label";
        label.textContent = RESOURCES[resource].name + ":";

        const value = document.createElement("span");
        value.className = "cost-value";

        const haveEl = document.createElement("span");
        haveEl.className = "cost-have";
        const slashEl = document.createElement("span");
        slashEl.className = "cost-slash";
        slashEl.textContent = "/";
        const needEl = document.createElement("span");
        needEl.className = "cost-need";

        value.append(haveEl, slashEl, needEl);

        row.append(label, value);
        costs.appendChild(row);

        tooltipLive.rows.push({ resource, amount, value, haveEl, needEl, slashEl });
    }

    tooltip.element.appendChild(costs);
    refreshBuildingTooltip();
}

function refreshBuildingTooltip() {
    if (tooltipLive.id == null) return;

    for (const row of tooltipLive.rows) {
        const have = getResource(row.resource);
        const enough = have >= row.amount;
        row.haveEl.textContent = enough ? formatCount(row.amount) : formatCount(have);
        row.needEl.textContent = enough ? "" : formatCount(row.amount);
        row.slashEl.hidden = enough;
        row.value.classList.toggle("cost-missing", !enough);
    }
}

function buildingNameText(name) {
    const span = document.createElement("span");
    span.className = "building-name-text";
    span.textContent = name;
    return span;
}
