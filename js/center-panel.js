import {
    loadCss,
    getBadgeTier,
    formatCount,
    formatNumber,
    createNumberCounter,
} from "./utils.js";
import { createTooltip } from "./tooltip.js";
import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA } from "./buildings.js";
import {
    getClickValue,
    getKarma,
    getKarmaProduction,
    addKarma,
    getResource,
    getResourceCapacity,
    getResourceProduction,
    getBuildingCount,
    getCritChance,
    CRIT_MULTIPLIER,
    onChange,
} from "./game-state.js";

loadCss("css/center-panel.css");

const tooltip = createTooltip("resource-tooltip");

const RESOURCE_TILE_ORDER = ["su", "yiyecek", "odun", "maden", "bilgi", "inanc", "baharat", "sarap", "ipek"];

export function createCenterPanel() {
    const panel = document.createElement("section");
    panel.className = "panel center-panel";

    const top = document.createElement("div");
    top.className = "panel-section section-top";

    const middle = document.createElement("div");
    middle.className = "panel-section section-middle";

    const bottom = document.createElement("div");
    bottom.className = "panel-section section-bottom";

    const karmaText = document.createElement("span");
    karmaText.className = "karma-label";
    karmaText.textContent = "Karma";

    const karmaValue = document.createElement("span");
    karmaValue.className = "karma-value";
    const karmaCounter = createNumberCounter();
    karmaValue.append("🔅 ", karmaCounter.span);

    onChange(() => karmaCounter.update(getKarma()));
    karmaCounter.update(getKarma());

    const grid = document.createElement("div");
    grid.className = "resource-grid";

    const tileMap = {};
    for (const id of RESOURCE_TILE_ORDER) {
        tileMap[id] = createResourceTile(id);
        grid.appendChild(tileMap[id].element);
    }

    function updateTiles() {
        for (const id of Object.keys(tileMap)) {
            tileMap[id].update();
        }

        refreshResourceTooltip();
    }

    onChange(updateTiles);
    updateTiles();

    top.append(karmaText, karmaValue, grid);

    const button = document.createElement("button");
    button.className = "circle-btn";
    middle.appendChild(button);

    const floats = [];

    button.addEventListener("click", (e) => {
        const clickValue = getClickValue();
        const isCrit = Math.random() < getCritChance();
        const gained = isCrit ? clickValue * CRIT_MULTIPLIER : clickValue;
        addKarma(gained);

        const dx = (Math.random() * 44 - 22).toFixed(1);

        const el = document.createElement("div");
        el.className = isCrit ? "float-count float-crit" : "float-count";
        if (isCrit) el.append("💥 ");
        const floatCounter = createNumberCounter();
        el.append("+", floatCounter.span);
        floatCounter.update(gained);
        el.style.left = e.clientX + "px";
        el.style.top = e.clientY - 12 - Math.random() * 14 + "px";
        el.style.setProperty("--dx", dx + "px");
        el.style.setProperty("--dur", (0.75 + Math.random() * 0.35).toFixed(2) + "s");
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove());

        floats.push(el);
        while (floats.length > 5) {
            const oldest = floats.shift();
            if (!oldest.isConnected) continue;
            oldest.style.transition = "opacity 0.3s ease";
            oldest.style.opacity = "0";
            setTimeout(() => oldest.remove(), 300);
        }
    });

    const productionLabel = document.createElement("span");
    productionLabel.className = "production-label";
    productionLabel.textContent = "Karma üretimi";
    productionLabel.title = "Her saniye kazanılan karma";

    const productionValue = document.createElement("span");
    productionValue.className = "production-value";
    const prodCounter = createNumberCounter();
    productionValue.append("+", prodCounter.span, "/s");

    function updateProduction() {
        const production = getKarmaProduction();
        const active = production > 0;

        if (productionLabel.hidden === active) {
            productionLabel.hidden = !active;
            productionValue.hidden = !active;
        }

        if (active) prodCounter.update(production);
    }

    onChange(updateProduction);
    updateProduction();

    bottom.append(productionLabel, productionValue);

    panel.append(top, middle, bottom);
    return panel;
}

function createResourceTile(id) {
    const meta = RESOURCES[id];

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

    const bar = document.createElement("div");
    bar.className = "resource-bar-track";

    const fill = document.createElement("div");
    fill.className = "resource-bar-fill";

    bar.appendChild(fill);

    head.append(emoji, name, bar);

    const foot = document.createElement("div");
    foot.className = "resource-tile-foot";

    const production = document.createElement("span");
    production.className = "resource-bar-production";

    const capLabel = document.createElement("span");
    capLabel.className = "resource-tile-cap";

    foot.append(production, capLabel);

    element.append(head, foot);

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

    function update() {
        const current = getResource(id);
        const capacity = getResourceCapacity(id);
        const productionValue = getResourceProduction(id);
        const active = productionValue > 0 || capacity > meta.baseCapacity;

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

        const prodText = "+" + formatNumber(productionValue) + "/s";
        if (prodText !== lastProdText) {
            lastProdText = prodText;
            production.textContent = prodText;
        }
    }

    return { element, update };
}

const tooltipLive = { id: null, capEl: null, totalEl: null };

function buildResourceTooltip(id) {
    const meta = RESOURCES[id];

    for (const r of Object.keys(RESOURCES)) {
        tooltip.element.classList.remove("resource-" + r);
    }
    tooltip.element.classList.add("resource-" + id);

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

    tooltipLive.id = id;
    tooltipLive.capEl = capStrong;
    tooltipLive.totalEl = totalStrong;
    refreshResourceTooltip();
}

function refreshResourceTooltip() {
    if (tooltipLive.id == null) return;

    const id = tooltipLive.id;
    const current = getResource(id);
    const capacity = getResourceCapacity(id);

    tooltipLive.capEl.textContent = formatCount(current) + " / " + formatCount(capacity);
    tooltipLive.totalEl.textContent = "+" + formatNumber(getResourceProduction(id)) + "/s";
}

function sectionHeader(text) {
    const h = document.createElement("div");
    h.className = "tt-section";
    h.textContent = text;
    return h;
}

function strong(text) {
    const s = document.createElement("strong");
    s.textContent = text;
    return s;
}

function badge(value) {
    const s = document.createElement("span");
    s.className = "badge tt-badge badge-tier-" + getBadgeTier(value);
    s.textContent = String(value);
    return s;
}

function getBarColor(id, pct) {
    const meta = RESOURCES[id];
    if (pct >= 85) return "linear-gradient(90deg, #8f2d2d, #ff5a5a)";
    return "linear-gradient(90deg, " + meta.colorDark + ", " + meta.colorBright + ")";
}
