import {
    getBadgeTier,
    canAfford,
    formatCount,
    formatNumber,
    formatDuration,
    createNumberCounter,
    createLockOverlay,
    triggerShake,
    resetResourceClass,
} from "./utils.js";
import { createTooltip } from "./tooltip.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { RESOURCES } from "./resources.js";
import { PACKS_DATA } from "./packs.js";
import {
    getBuildingCount,
    getBuildingCost,
    getBuildingProduction,
    getBuildingBonus,
    getCapacityBonus,
    getOutputMultiplier,
    getResource,
    getTotalProduction,
    getNetRate,
    getPackCount,
    getPackCost,
    getUnlock,
    getUnlockText,
    getUnlockType,
    isNearUnlock,
    buyBuilding,
    buyPack,
    hasInfoProduction,
    onChange,
} from "./game-state.js";

export const tooltip = createTooltip("building-tooltip");

export function createLeftPanel() {
    const panel = document.createElement("section");
    panel.className = "panel left-panel";

    const tabBar = document.createElement("div");
    tabBar.className = "tab-bar";

    const buildingTab = document.createElement("button");
    buildingTab.type = "button";
    buildingTab.className = "tab-btn active";
    buildingTab.textContent = "Binalar";

    const packTab = document.createElement("button");
    packTab.type = "button";
    packTab.className = "tab-btn";
    packTab.textContent = "Paketler";

    tabBar.append(buildingTab, packTab);

    const buildingGrid = document.createElement("div");
    buildingGrid.className = "building-list";

    for (const [id, data] of Object.entries(BUILDINGS_DATA)) {
        if (data.type === "housing") continue;
        if (id === "depo" || id === "ambar") continue;
        buildingGrid.appendChild(createBuildingCard(id, data));
    }

    const packList = document.createElement("div");
    packList.className = "upgrade-list pack-list";
    packList.hidden = true;

    for (const id of Object.keys(PACKS_DATA)) {
        packList.appendChild(createPackCard(id, PACKS_DATA[id]));
    }

    panel.append(tabBar, buildingGrid, packList);

    let activeTab = "buildings";

    buildingTab.addEventListener("click", () => {
        activeTab = "buildings";
        buildingTab.classList.add("active");
        packTab.classList.remove("active");
        buildingGrid.hidden = false;
        packList.hidden = true;
    });

    packTab.addEventListener("click", () => {
        if (!hasInfoProduction()) {
            triggerShake(packTab);
            return;
        }
        activeTab = "packs";
        packTab.classList.add("active");
        buildingTab.classList.remove("active");
        buildingGrid.hidden = true;
        packList.hidden = false;
    });

    function updateTabs() {
        const infoReady = hasInfoProduction();
        packTab.classList.toggle("locked", !infoReady);
        packTab.textContent = infoReady ? "Paketler" : "🔒 Paketler";
        packTab.title = infoReady ? "" : "Bilgi üretimiyle açılır (ilk Akademi)";

        if (!infoReady && activeTab === "packs") {
            activeTab = "buildings";
            buildingTab.classList.add("active");
            packTab.classList.remove("active");
            buildingGrid.hidden = false;
            packList.hidden = true;
        }
    }

    onChange(updateTabs);
    updateTabs();

    return panel;
}

export function createBuildingCard(id, data) {
    const isHousing = data.type === "housing";
    const isStorage = data.type === "storage";
    const isCapacityBonus = data.type === "capacityBonus";
    const isBonus =
        data.type === "bonus" ||
        data.type === "costBonus" ||
        data.type === "workerBonus" ||
        data.type === "storageBonus" ||
        data.type === "productBonus" ||
        data.type === "tradeBonus";
    const resourceId =
        isHousing || isStorage || isCapacityBonus || isBonus
            ? null
            : data.outputResource || data.targetResource;

    const card = document.createElement("div");
    card.className =
        "building-card " +
        (isHousing
            ? "building-housing"
            : isStorage
              ? "building-storage"
              : isCapacityBonus
                ? "building-capacity-bonus"
                : isBonus
                  ? "building-special-bonus"
                  : "resource-" + resourceId) +
        (isBonus || isCapacityBonus ? " building-bonus" : "");

    card.addEventListener("click", () => {
        if ((getUnlock(data) || getBuildingCount(id) > 0) && !buyBuilding(id)) {
            triggerShake(card);
        }
    });

    const lockOverlay = createLockOverlay();

    let tooltipActive = false;

    card.addEventListener("mouseenter", () => {
        if (!getUnlock(data) && getBuildingCount(id) === 0) return;
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
    const emojiEl = document.createElement("span");
    emojiEl.className = "building-card-emoji";
    if (isHousing) emojiEl.textContent = "👥";
    else if (isStorage) emojiEl.textContent = "📦";
    else if (isCapacityBonus) emojiEl.textContent = "📦";
    else if (isBonus) emojiEl.textContent = bonusEmoji(data.type);
    else emojiEl.textContent = RESOURCES[resourceId].emoji;
    const nameTextEl = buildingNameText("");
    name.append(emojiEl, nameTextEl);

    const badgeRow = document.createElement("div");
    badgeRow.className = "building-badge-row";

    const badgeEl = document.createElement("span");
    badgeEl.className = "badge building-badge";
    badgeRow.appendChild(badgeEl);

    const rate = document.createElement("div");
    rate.className = "building-rate";
    const rateCounter = createNumberCounter();

    if (isHousing) {
        rate.append(rateCounter.span);
    } else if (isStorage) {
        const rateLabel = document.createElement("span");
        rateLabel.className = "num-display";
        rateLabel.textContent = "Kapasite";
        rate.append(rateLabel);
    } else if (isCapacityBonus) {
        rate.append(rateCounter.span);
    } else if (isBonus) {
        rate.append(rateCounter.span);
    } else {
        const plus = document.createElement("span");
        plus.className = "building-rate-plus";
        plus.textContent = "+";
        const rateSuffix = document.createElement("span");
        rateSuffix.className = "building-rate-suffix";
        rateSuffix.textContent = "/s";
        rateCounter.span.classList.add("rate-producer");
        rate.append(plus, rateCounter.span, rateSuffix);
    }

    card.append(name, rate, badgeRow, lockOverlay.element);

    let lastOwned = null;
    let cost = null;

    function update() {
        const ownedAny = getBuildingCount(id) > 0;
        const unlocked = getUnlock(data);
        card.classList.toggle("locked", !unlocked && !ownedAny);

        if (!unlocked && !ownedAny) {
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

        if (isHousing) {
            const housingText = "+" + formatCount(data.housingCapacity);
            if (rateCounter.span.textContent !== housingText) {
                rateCounter.span.textContent = housingText;
            }
        } else if (isCapacityBonus) {
            const capBonusText = "%" + formatCount(getCapacityBonus(id));
            if (rateCounter.span.textContent !== capBonusText) {
                rateCounter.span.textContent = capBonusText;
            }
        } else if (isBonus) {
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

const tooltipLive = { id: null, rows: [], effectValue: null };

export function buildBuildingTooltip(id, data) {
    const cost = getBuildingCost(id);
    const isStorage = data.type === "storage";
    const isCapacityBonus = data.type === "capacityBonus";
    const isBonus =
        data.type === "bonus" ||
        data.type === "costBonus" ||
        data.type === "workerBonus" ||
        data.type === "storageBonus" ||
        data.type === "productBonus" ||
        data.type === "tradeBonus";
    const isHousing = data.type === "housing";
    const resourceId =
        isHousing || isStorage || isCapacityBonus || isBonus
            ? null
            : data.outputResource || data.targetResource;
    const output = isHousing || isBonus ? null : RESOURCES[resourceId];

    resetResourceClass(tooltip.element, isHousing || isStorage || isCapacityBonus || isBonus ? "power" : resourceId);

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

    if (isHousing) {
        effectLabel.textContent = "Nüfus Kapasitesi:";

        const value = document.createElement("span");
        value.className = "effect-value";
        value.append("+", String(data.housingCapacity), " 👥");

        effectLine.append(effectLabel, " ", value);
        effect.appendChild(effectLine);
    } else if (isStorage) {
        effectLabel.textContent = "Kapasite Katkısı:";

        const value = document.createElement("span");
        value.className = "effect-value";
        value.textContent = "Tüm kaynaklara";

        effectLine.append(effectLabel, " ", value);
        effect.appendChild(effectLine);

        const capGrid = document.createElement("div");
        capGrid.className = "storage-cap-grid";

        for (const rid of Object.keys(RESOURCES)) {
            const per = RESOURCES[rid].storagePerDepo;
            if (!per) continue;
            if (getTotalProduction(rid) <= 0) continue;
            const item = document.createElement("span");
            item.className = "storage-cap-item";
            item.textContent = RESOURCES[rid].emoji + " +" + per;
            capGrid.appendChild(item);
        }

        effect.appendChild(capGrid);
    } else if (isCapacityBonus) {
        effectLabel.textContent = "Kapasite bonusu:";

        const value = document.createElement("span");
        value.className = "effect-value";
        value.textContent = "+%" + Math.round(data.capacityBonusPerLevel * 100) + " / seviye";

        effectLine.append(effectLabel, " ", value);
        effect.appendChild(effectLine);

        const capGrid = document.createElement("div");
        capGrid.className = "storage-cap-grid";

        for (const rid of Object.keys(RESOURCES)) {
            const per = RESOURCES[rid].storagePerAmbar;
            if (!per) continue;
            if (getTotalProduction(rid) <= 0) continue;
            const item = document.createElement("span");
            item.className = "storage-cap-item";
            item.textContent = RESOURCES[rid].emoji + " +" + per;
            capGrid.appendChild(item);
        }

        effect.appendChild(capGrid);
    } else if (isBonus) {
        const bonusInfo = getBonusEffectInfo(data);
        effectLabel.textContent = bonusInfo.label;

        const prodValue = document.createElement("span");
        prodValue.className = "effect-value";
        prodValue.textContent = bonusInfo.value;

        effectLine.append(effectLabel, " ", prodValue);
        effect.appendChild(effectLine);
    } else {
        effectLabel.textContent = output.name + " Üretimi:";

        const prodValue = document.createElement("span");
        prodValue.className = "effect-value";
        prodValue.append("+", formatNumber(data.production * getOutputMultiplier(data.outputResource)), "/s");

        effectLine.append(effectLabel, " ", prodValue);
        effect.appendChild(effectLine);

        tooltipLive.effectValue = prodValue;
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

        const timeEl = document.createElement("span");
        timeEl.className = "cost-time";
        timeEl.hidden = true;

        row.append(label, timeEl, value);
        costs.appendChild(row);

        tooltipLive.rows.push({ resource, amount, value, haveEl, needEl, slashEl, timeEl });
    }

    tooltip.element.appendChild(costs);
    refreshBuildingTooltip();
}

export function refreshBuildingTooltip() {
    if (tooltipLive.id == null) return;

    const id = tooltipLive.id;
    const data = BUILDINGS_DATA[id];
    const cost = getBuildingCost(id);

    if (tooltipLive.effectValue) {
        tooltipLive.effectValue.textContent = "";
        tooltipLive.effectValue.append(
            "+",
            formatNumber(data.production * getOutputMultiplier(data.outputResource)),
            "/s"
        );
    }

    for (const row of tooltipLive.rows) {
        row.amount = cost[row.resource] || 0;
        const have = getResource(row.resource);
        const enough = have >= row.amount;
        row.haveEl.textContent = enough ? formatCount(row.amount) : formatCount(have);
        row.needEl.textContent = enough ? "" : formatCount(row.amount);
        row.slashEl.hidden = enough;
        row.value.classList.toggle("cost-missing", !enough);

        const missing = row.amount - have;
        const net = getNetRate(row.resource);
        if (!enough && missing > 0 && net > 0) {
            row.timeEl.textContent = formatDuration(missing / net);
            row.timeEl.hidden = false;
        } else {
            row.timeEl.hidden = true;
        }
    }
}

function createPackCard(id, data) {
    const resourceId = data.targetResource || "power";

    const card = document.createElement("div");
    card.className = "upgrade-card resource-" + resourceId;

    const lockOverlay = createLockOverlay();

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

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "upgrade-btn";

    btn.addEventListener("click", () => {
        if (!buyPack(id)) {
            triggerShake(btn);
        }
    });

    card.append(head, desc, effect, btn, lockOverlay.element);

    const costSpans = {};
    for (const resource of Object.keys(data.baseCost)) {
        const span = document.createElement("span");
        span.className = "upgrade-cost";
        span.resource = resource;
        btn.appendChild(span);
        costSpans[resource] = span;
    }

    const btnText = document.createElement("span");
    btnText.textContent = "Satın Al";
    btn.appendChild(btnText);

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
            lockOverlay.lockDesc.textContent = getUnlockText(data);
            lockOverlay.lockDesc.classList.toggle("lock-req-building", getUnlockType(data) === "building");
            lockOverlay.lockDesc.classList.toggle("lock-req-pack", getUnlockType(data) === "pack");
            return;
        }

        card.hidden = false;

        const count = getPackCount(id);
        level.textContent = "Seviye " + count;

        let effectText = "";
        if (data.productionBonusPerLevel) {
            effectText = "Tüm üretim: +%" + Math.round(count * data.productionBonusPerLevel * 100);
        } else if (data.powerBonusPerLevel) {
            effectText = "Güç üretimi: +%" + Math.round(count * data.powerBonusPerLevel * 100);
        } else if (data.costDiscountPerLevel) {
            effectText = "Bina maliyeti: −%" + Math.round(count * data.costDiscountPerLevel * 100);
        } else if (data.productBonusPerLevel) {
            effectText = "Ürün üretimi: +%" + Math.round(count * data.productBonusPerLevel * 100);
        }
        effect.textContent = effectText;

        const cost = getPackCost(id);
        let affordable = true;
        for (const [resource, amount] of Object.entries(cost)) {
            const span = costSpans[resource];
            const ok = getResource(resource) >= amount;
            span.textContent = RESOURCES[resource].emoji + " " + formatCount(amount);
            span.classList.toggle("cost-ok", ok);
            span.classList.toggle("cost-missing", !ok);
            if (!ok) affordable = false;
        }
        btn.classList.toggle("disabled", !affordable);
    }

    onChange(update);
    update();

    return card;
}

function buildingNameText(name) {
    const span = document.createElement("span");
    span.className = "building-name-text";
    span.textContent = name;
    return span;
}

function bonusEmoji(type) {
    if (type === "costBonus") return "🛠️";
    if (type === "workerBonus") return "⚙️";
    if (type === "storageBonus") return "📦";
    if (type === "productBonus") return "🔨";
    if (type === "tradeBonus") return "🛒";
    return "";
}

function getBonusEffectInfo(data) {
    if (data.type === "costBonus") {
        return {
            label: "Bina maliyeti indirimi:",
            value: "%" + Math.round(data.costDiscountPerLevel * 100) + " / seviye",
        };
    }
    if (data.type === "workerBonus") {
        return {
            label: "İşçi verimliliği:",
            value: "%" + Math.round(data.workerBonusPerLevel * 100) + " / seviye",
        };
    }
    if (data.type === "storageBonus") {
        return {
            label: "Kapasite bonusu:",
            value: "%" + Math.round(data.storageBonusPerLevel * 100) + " / seviye",
        };
    }
    if (data.type === "productBonus") {
        return {
            label: "İşlenmiş/craft üretimi:",
            value: "%" + Math.round(data.productBonusPerLevel * 100) + " / seviye",
        };
    }
    if (data.type === "tradeBonus") {
        return {
            label: "Tüccar sıklığı ve teklif boyutu:",
            value: "+%0" + Math.round(data.tradeBonusPerLevel * 100) + " / seviye",
        };
    }
    return {
        label: "Üretim bonusu:",
        value: "%" + Math.round(data.bonusPerLevel * 100),
    };
}
