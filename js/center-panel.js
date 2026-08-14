import {
    formatCount,
    formatNumber,
    strong,
    badge,
    resetResourceClass,
} from "./utils.js";
import { createTooltip } from "./tooltip.js";
import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { createBuildingCard } from "./left-panel.js";
import {
    getPower,
    getResource,
    getResourceCapacity,
    getTotalProduction,
    getResourceConsumption,
    getBuildingCount,
    getSellPrice,
    isSellable,
    getAutoSell,
    toggleAutoSell,
    onChange,
} from "./game-state.js";

const tooltip = createTooltip("resource-tooltip");
const RAW_TILE_ORDER = ["su", "yiyecek", "odun", "tas", "maden", "bilgi", "inanc", "baharat", "sarap", "ipek"];

const PRODUCT_TILE_ORDER = ["ekmek", "kereste", "demir", "kumas", "konyak", "ilac", "celik", "mobilya", "mucevher", "mermer", "heykel"];

export function createCenterPanel() {
    const panel = document.createElement("section");
    panel.className = "panel center-panel";

    const header = document.createElement("div");
    header.className = "center-header";

    const powerValue = document.createElement("span");
    powerValue.className = "power-value";
    const powerSpan = document.createElement("span");
    powerSpan.className = "num-display";
    powerValue.append("🏆 ", powerSpan);

    header.append(powerValue);

    const resourceArea = document.createElement("div");
    resourceArea.className = "resource-area";

    const rawTitle = sectionTitle("Hammaddeler");
    const rawGrid = document.createElement("div");
    rawGrid.className = "resource-grid raw-grid";

    const productTitle = sectionTitle("Ürünler");
    const productGrid = document.createElement("div");
    productGrid.className = "resource-grid product-grid";

    const tileMap = {};

    for (const id of RAW_TILE_ORDER) {
        tileMap[id] = createResourceTile(id);
        rawGrid.appendChild(tileMap[id].element);
    }

    for (const id of PRODUCT_TILE_ORDER) {
        tileMap[id] = createResourceTile(id);
        productGrid.appendChild(tileMap[id].element);
    }

    resourceArea.append(rawTitle, rawGrid, productTitle, productGrid);

    const storageTitle = sectionTitle("Depolama");
    const storageRow = document.createElement("div");
    storageRow.className = "storage-row";
    storageRow.appendChild(createBuildingCard("depo", BUILDINGS_DATA.depo));
    storageRow.appendChild(createBuildingCard("ambar", BUILDINGS_DATA.ambar));

    const storageSection = document.createElement("div");
    storageSection.className = "storage-section";
    storageSection.append(storageTitle, storageRow);

    function update(snapshot) {
        powerSpan.textContent = formatCount(getPower());

        for (const id of Object.keys(tileMap)) {
            tileMap[id].update(snapshot);
        }

        refreshResourceTooltip(snapshot);
    }

    onChange((state, snapshot) => update(snapshot));
    update();

    panel.append(header, resourceArea, storageSection);
    return panel;
}

function sectionTitle(text) {
    const el = document.createElement("div");
    el.className = "resource-group-title";
    el.textContent = text;
    return el;
}

function createResourceTile(id) {
    const meta = RESOURCES[id];
    const sellable = isSellable(id);

    const element = document.createElement("div");
    element.className = "resource-tile resource-" + id;
    element.hidden = true;

    const head = document.createElement("div");
    head.className = "resource-tile-head";

    const emoji = document.createElement("span");
    emoji.className = "resource-tile-emoji";
    emoji.textContent = meta.emoji;

    const name = document.createElement("span");
    name.className = "resource-tile-name";
    name.textContent = meta.name;

    const capLabel = document.createElement("span");
    capLabel.className = "resource-tile-cap";

    head.append(emoji, name, capLabel);

    const bar = document.createElement("div");
    bar.className = "resource-bar-track";

    const fill = document.createElement("div");
    fill.className = "resource-bar-fill";

    bar.appendChild(fill);

    const foot = document.createElement("div");
    foot.className = "resource-tile-foot";

    const production = document.createElement("span");
    production.className = "resource-bar-production";

    foot.append(production);

    let autoSellBtn = null;

    if (sellable) {
        autoSellBtn = document.createElement("button");
        autoSellBtn.type = "button";
        autoSellBtn.className = "auto-sell-btn";
        autoSellBtn.textContent = "⟳";
        autoSellBtn.title = "Otomatik satış";

        autoSellBtn.addEventListener("click", () => toggleAutoSell(id));

        foot.appendChild(autoSellBtn);
    }

    element.append(head, bar, foot);

    element.addEventListener("mouseenter", () => {
        buildResourceTooltip(id);
        tooltip.show(element);
    });

    element.addEventListener("mouseleave", () => {
        tooltipLive.id = null;
        tooltip.hide();
    });

    let lastCapText = null;
    let lastFillPct = null;
    let lastProdText = null;

    function update(snapshot) {
        const current = getResource(id);
        const capacity = snapshot ? snapshot.derived[id].capacity : getResourceCapacity(id);
        const productionValue = snapshot ? snapshot.derived[id].production : getTotalProduction(id);
        const consumptionValue = snapshot ? snapshot.derived[id].consumption : getResourceConsumption(id);
        const net = productionValue - consumptionValue;

        const active = productionValue > 0 || current > 0;

        if (element.hidden === active) {
            element.hidden = !active;
        }
        if (!active) {
            lastCapText = null;
            lastFillPct = null;
            lastProdText = null;
            return;
        }

        const capText = formatCount(current);
        if (capText !== lastCapText) {
            lastCapText = capText;
            capLabel.textContent = capText;
        }

        const pct = capacity > 0 ? (current / capacity) * 100 : 0;
        const pctClamped = Math.min(pct, 100);
        if (pctClamped !== lastFillPct) {
            lastFillPct = pctClamped;
            fill.style.width = pctClamped + "%";
            fill.style.background = getBarColor(id, pctClamped);
        }

        const prodText =
            net > 0
                ? "+" + formatNumber(net) + "/s"
                : net < 0
                  ? "−" + formatNumber(-net) + "/s"
                  : "";
        if (prodText !== lastProdText) {
            lastProdText = prodText;
            production.textContent = prodText;
        }

        if (sellable) {
            autoSellBtn.classList.toggle("auto-on", getAutoSell(id));
            autoSellBtn.title = getAutoSell(id) ? "Otomatik satış: AÇIK" : "Otomatik satış: KAPALI";
        }
    }

    return { element, update };
}

const tooltipLive = { id: null, capEl: null, totalEl: null, consEl: null, sellEl: null, sellRow: null };

function buildResourceTooltip(id) {
    const meta = RESOURCES[id];
    const sellable = isSellable(id);

    resetResourceClass(tooltip.element, id);

    tooltip.element.textContent = "";

    const title = document.createElement("div");
    title.className = "tt-title";
    title.append(meta.emoji + " ", meta.name);
    tooltip.element.appendChild(title);

    const buildingRows = [];
    for (const bid of Object.keys(BUILDINGS_DATA)) {
        const b = BUILDINGS_DATA[bid];
        if (b.type !== "producer" || b.outputResource !== id) continue;

        const count = getBuildingCount(bid);
        if (count <= 0) continue;

        buildingRows.push({
            b,
            count,
            total: count * b.production,
        });
    }

    if (buildingRows.length) {
        tooltip.element.appendChild(sectionHeader(" Üretim Binaları"));

        for (const r of buildingRows) {
            const row = document.createElement("div");
            row.className = "tt-row";

            row.append(badge(r.count), r.b.name + ":", strong("+" + formatNumber(r.total) + "/s"));

            tooltip.element.appendChild(row);
        }
    }

    const bonusRows = [];
    for (const bid of Object.keys(BUILDINGS_DATA)) {
        const b = BUILDINGS_DATA[bid];
        if (b.type === "capacityBonus") {
            const count = getBuildingCount(bid);
            if (count <= 0) continue;

            bonusRows.push({
                b,
                count,
                info: "%" + Math.round(count * b.capacityBonusPerLevel * 100),
            });
            continue;
        }
        if (b.type === "storageBonus") {
            const count = getBuildingCount(bid);
            if (count <= 0) continue;

            bonusRows.push({
                b,
                count,
                info: "%" + Math.round(count * b.storageBonusPerLevel * 100),
            });
            continue;
        }
        if (b.type !== "bonus" || b.targetResource !== id) continue;

        const count = getBuildingCount(bid);
        if (count <= 0) continue;

        bonusRows.push({
            b,
            count,
            info: "%" + Math.round(count * b.bonusPerLevel * 100),
        });
    }

    if (bonusRows.length) {
        tooltip.element.appendChild(sectionHeader("Bonus Binaları"));

        for (const r of bonusRows) {
            const row = document.createElement("div");
            row.className = "tt-row";

            row.append(badge(r.count), r.b.name + " ", strong(r.info));

            tooltip.element.appendChild(row);
        }
    }

    const cap = document.createElement("div");
    cap.className = "tt-cap";
    const capStrong = strong("");
    cap.append("🗄️ Depo: ", capStrong);
    tooltip.element.appendChild(cap);

    const totalRow = document.createElement("div");
    totalRow.className = "tt-total";
    const totalStrong = strong("");
    totalRow.append("Toplam ", meta.name, " Üretimi: ", totalStrong);
    tooltip.element.appendChild(totalRow);

    const consRow = document.createElement("div");
    consRow.className = "tt-total";
    const consStrong = strong("");
    consRow.append("Tüketim: ", consStrong);
    tooltip.element.appendChild(consRow);

    const sellRow = document.createElement("div");
    sellRow.className = "tt-total";
    const sellStrong = strong("");
    sellRow.append("Satış Fiyatı: ", sellStrong);
    sellRow.hidden = !sellable;
    tooltip.element.appendChild(sellRow);

    tooltipLive.id = id;
    tooltipLive.capEl = capStrong;
    tooltipLive.totalEl = totalStrong;
    tooltipLive.consEl = consStrong;
    tooltipLive.sellEl = sellStrong;
    tooltipLive.sellRow = sellRow;
    refreshResourceTooltip();
}

function refreshResourceTooltip(snapshot) {
    if (tooltipLive.id == null) return;

    const id = tooltipLive.id;
    const current = getResource(id);
    const capacity = snapshot ? snapshot.derived[id].capacity : getResourceCapacity(id);
    const productionValue = snapshot ? snapshot.derived[id].production : getTotalProduction(id);
    const consumptionValue = snapshot ? snapshot.derived[id].consumption : getResourceConsumption(id);

    tooltipLive.capEl.textContent = formatCount(current) + " / " + formatCount(capacity);
    tooltipLive.totalEl.textContent = "+" + formatNumber(productionValue) + "/s";
    tooltipLive.consEl.textContent = consumptionValue > 0 ? "−" + formatNumber(consumptionValue) + "/s" : "−";
    tooltipLive.sellRow.hidden = !isSellable(id);
    tooltipLive.sellEl.textContent = formatCount(getSellPrice(id)) + " 🪙";
}

function sectionHeader(text) {
    const h = document.createElement("div");
    h.className = "tt-section";
    h.textContent = text;
    return h;
}

function getBarColor(id, pct) {
    const meta = RESOURCES[id];
    if (pct >= 85) return "linear-gradient(90deg, #8f2d2d, #ff5a5a)";
    return "linear-gradient(90deg, " + meta.colorDark + ", " + meta.colorBright + ")";
}
