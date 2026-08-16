import { canAfford, formatCount, triggerShake } from "./utils.js";
import { BUILDINGS_DATA } from "./buildings.js";
import {
    getAltin,
    getResource,
    getBuildingCount,
    getBuildingCost,
    getUnlock,
    buyBuilding,
    getPopulationCurrent,
    getPopulationCapacity,
    getPopulationMigrants,
    getMigrantQueue,
    getPopulationSatisfaction,
    getPopulationDeficiency,
    getHappinessBreakdown,
    getMigrationInterval,
    getWorkerCount,
    onChange,
    resetGame,
    getArrivalDuration,
    getSeason,
    getSeasonTimer,
} from "./game-state.js";
import { buildBuildingTooltip, refreshBuildingTooltip, tooltip as buildingTooltip } from "./left-panel.js";

export function createHeaderPanel() {
    const panel = document.createElement("section");
    panel.className = "panel header-panel";

    const strip = createMigrationStrip();

    const popBlock = createPopBlock();

    const right = document.createElement("div");
    right.className = "header-right";

    const happinessChip = createHappinessChip();
    const seasonChip = createSeasonChip();
    const goldStat = createStat("🪙");

    const resetBtn = document.createElement("button");
    resetBtn.className = "reset-btn";
    resetBtn.textContent = "↺";
    resetBtn.title = "Tüm ilerlemeyi sıfırla";

    resetBtn.addEventListener("click", () => {
        if (confirm("Tüm ilerlemeyi sıfırlamak istediğine emin misin?")) {
            resetGame();
        }
    });

    right.append(
        popBlock.el,
        createHousingChip("baraka"),
        createHousingChip("ev"),
        happinessChip.el,
        seasonChip.el,
        goldStat.el,
        resetBtn
    );

    panel.append(strip.el, right);

    function update() {
        const alive = Math.floor(getPopulationCurrent());
        const capacity = getPopulationCapacity();
        const workers = getWorkerCount();
        const migrants = getPopulationMigrants();

        popBlock.update(alive, capacity, workers, Math.max(0, alive - workers), migrants);

        happinessChip.update();
        seasonChip.update();

        goldStat.value.textContent = formatCount(getAltin());
    }

    onChange(update);
    update();

    return panel;
}

function createPopBlock() {
    const el = document.createElement("div");
    el.className = "pop-block";
    el.tabIndex = 0;

    const count = document.createElement("span");
    count.className = "pop-count";
    const current = document.createElement("span");
    current.className = "pop-current";
    const cap = document.createElement("span");
    cap.className = "pop-cap";
    count.append("👥 ", current, " / ", cap);

    const tooltip = document.createElement("div");
    tooltip.className = "pop-tooltip";
    const rows = {};
    const rowDefs = [
        ["Nüfus", "pop", "#ffffff"],
        ["Kapasite", "cap", "#8895a3"],
        ["Çalışan", "workers", "#7fb2e0"],
        ["Boşta", "idle", "#7ee2a8"],
        ["Göçmen", "migrants", "#e8b46a"],
    ];
    for (const [label, key, color] of rowDefs) {
        const row = document.createElement("div");
        row.className = "pop-tooltip-row";
        const labelEl = document.createElement("span");
        labelEl.className = "tt-label";
        labelEl.textContent = label;
        const valueEl = document.createElement("span");
        valueEl.className = "tt-value";
        valueEl.style.color = color;
        row.append(labelEl, valueEl);
        rows[key] = valueEl;
        tooltip.appendChild(row);
    }

    el.append(count, tooltip);

    function update(alive, capacity, workers, idle, migrants) {
        el.classList.toggle("empty", capacity <= 0);

        current.textContent = String(alive);
        cap.textContent = String(capacity);

        rows.pop.textContent = String(alive);
        rows.cap.textContent = String(capacity);
        rows.workers.textContent = String(workers);
        rows.idle.textContent = String(idle);
        rows.migrants.textContent = String(migrants);
    }

    return { el, update };
}

function createHousingChip(id) {
    const data = BUILDINGS_DATA[id];

    const el = document.createElement("button");
    el.type = "button";
    el.className = "housing-chip";

    const icon = document.createElement("span");
    icon.className = "housing-chip-icon";
    icon.textContent = id === "baraka" ? "🛖" : "🏠";

    const name = document.createElement("span");
    name.className = "housing-chip-name";
    name.textContent = data.name;

    const cap = document.createElement("span");
    cap.className = "housing-chip-cap";

    el.append(icon, name, cap);

    el.addEventListener("click", () => {
        if ((getUnlock(data) || getBuildingCount(id) > 0) && !buyBuilding(id)) {
            triggerShake(el);
        }
    });

    let tooltipActive = false;

    el.addEventListener("mouseenter", () => {
        if (!getUnlock(data) && getBuildingCount(id) === 0) return;
        tooltipActive = true;
        buildBuildingTooltip(id, data);
        buildingTooltip.show(el);
    });

    el.addEventListener("mouseleave", () => {
        tooltipActive = false;
        buildingTooltip.hide();
    });

    function update() {
        const owned = getBuildingCount(id);
        const unlocked = getUnlock(data);

        el.classList.toggle("locked", !unlocked && owned === 0);

        const costObj = getBuildingCost(id);
        el.classList.toggle("affordable", canAfford(costObj, getResource));

        cap.textContent = "+" + formatCount(owned * data.housingCapacity);

        if (tooltipActive) {
            refreshBuildingTooltip();
        }
    }

    onChange(update);
    update();

    return el;
}

function createStat(emoji) {
    const el = document.createElement("span");
    el.className = "header-stat";

    const icon = document.createElement("span");
    icon.textContent = emoji;

    const value = document.createElement("span");
    value.className = "header-stat-value";

    el.append(icon, value);
    return { el, value };
}

function createSeasonChip() {
    const el = document.createElement("div");
    el.className = "season-chip";
    el.tabIndex = 0;

    const icon = document.createElement("span");
    icon.className = "season-chip-icon";

    el.append(icon);

    const tooltip = document.createElement("div");
    tooltip.className = "season-tooltip";
    tooltip.hidden = true;

    const title = document.createElement("div");
    title.className = "season-tooltip-title";

    const list = document.createElement("div");
    list.className = "season-tooltip-list";

    tooltip.append(title, list);
    el.appendChild(tooltip);

    let active = false;

    el.addEventListener("mouseenter", () => {
        active = true;
        refresh();
    });
    el.addEventListener("mouseleave", () => {
        active = false;
        tooltip.hidden = true;
    });
    el.addEventListener("focus", () => {
        active = true;
        refresh();
    });
    el.addEventListener("blur", () => {
        active = false;
        tooltip.hidden = true;
    });

    function refresh() {
        const season = getSeason();
        const timer = getSeasonTimer();

        title.textContent = season.emoji + " " + season.name + "  ·  değişime " + Math.max(0, Math.ceil(timer)) + " sn";

        while (list.firstChild) list.removeChild(list.firstChild);

        const rows = [
            ["💧 Su", season.modifiers.su],
            ["🌾 Yiyecek", season.modifiers.yiyecek],
            ["🪵 Odun", season.modifiers.odun],
            ["💎 Maden", season.modifiers.maden],
        ];

        for (const [label, value] of rows) {
            if (typeof value !== "number" || value === 1) continue;
            const row = document.createElement("div");
            row.className = "season-row";
            const labelEl = document.createElement("span");
            labelEl.className = "tt-label";
            labelEl.textContent = label;
            const valueEl = document.createElement("span");
            valueEl.className = "tt-value";
            valueEl.textContent = (value > 1 ? "+" : "") + (Math.round((value - 1) * 100)) + "%";
            valueEl.style.color = value > 1 ? "#7ee2a8" : "#ff9a5a";
            row.append(labelEl, valueEl);
            list.appendChild(row);
        }

        tooltip.hidden = false;
    }

    function update() {
        const season = getSeason();
        icon.textContent = season.emoji;

        if (active) refresh();
    }

    onChange(update);
    update();

    return { el, update };
}

function createHappinessChip() {
    const el = document.createElement("div");
    el.className = "happiness-chip";
    el.tabIndex = 0;

    const icon = document.createElement("span");
    icon.className = "happiness-chip-icon";
    icon.textContent = "🥳";

    const value = document.createElement("span");
    value.className = "header-stat-value";

    el.append(icon, value);

    const tooltip = document.createElement("div");
    tooltip.className = "happiness-tooltip";
    tooltip.hidden = true;

    const title = document.createElement("div");
    title.className = "happiness-title";

    const posSec = createHappinessSection("Mutluluğu Artıranlar");
    const negSec = createHappinessSection("Mutluluğu Düşürenler");

    const info = document.createElement("div");
    info.className = "happiness-info";
    const infoText = document.createElement("span");
    info.appendChild(infoText);

    tooltip.append(title, posSec.section, negSec.section, info);
    el.appendChild(tooltip);

    let active = false;

    el.addEventListener("mouseenter", () => {
        active = true;
        refresh();
    });

    el.addEventListener("mouseleave", () => {
        active = false;
        tooltip.hidden = true;
    });

    el.addEventListener("focus", () => {
        active = true;
        refresh();
    });

    el.addEventListener("blur", () => {
        active = false;
        tooltip.hidden = true;
    });

    function refresh() {
        const satisfaction = getPopulationSatisfaction();
        const { items, target } = getHappinessBreakdown();

        title.textContent = "😊 Mutluluk " + Math.round(satisfaction) + " / Hedef " + Math.round(target);

        fillHappinessList(posSec, items.filter((i) => i.delta > 0));
        fillHappinessList(negSec, items.filter((i) => i.delta < 0));

        const deficiency = getPopulationDeficiency();
        const parts = [];
        if (deficiency > 0.05) parts.push("⚠️ Temel ihtiyaç açığı: nüfus risk altında");
        parts.push("🚶 Göç: ~" + getMigrationInterval() + " sn / kişi · Varış ~" + getArrivalDuration() + " sn");
        infoText.textContent = parts.join("  ·  ");

        tooltip.hidden = false;
    }

    function update() {
        const satisfaction = getPopulationSatisfaction();
        value.textContent = String(Math.round(satisfaction));
        el.classList.toggle("warn", satisfaction < 50);

        if (active) refresh();
    }

    onChange(update);
    update();

    return { el, update };
}

function createHappinessSection(titleText) {
    const section = document.createElement("div");
    section.className = "happiness-sec";

    const heading = document.createElement("div");
    heading.className = "happiness-sec-title";
    heading.textContent = titleText;

    const list = document.createElement("div");
    list.className = "happiness-list";

    section.append(heading, list);
    return { section, list };
}

function fillHappinessList(sec, items) {
    while (sec.list.firstChild) sec.list.removeChild(sec.list.firstChild);

    for (const item of items) {
        const row = document.createElement("div");
        row.className = "happiness-row";

        const label = document.createElement("span");
        label.className = "happiness-row-label";
        label.textContent = item.emoji + " " + item.label;

        const val = document.createElement("span");
        val.className = "happiness-row-value";
        val.textContent = (item.delta >= 0 ? "+" : "−") + Math.abs(item.delta);

        row.append(label, val);
        sec.list.appendChild(row);
    }

    sec.section.hidden = items.length === 0;
}

function createMigrationStrip() {
    const el = document.createElement("div");
    el.className = "migration-strip";

    function sync() {
        const queue = getMigrantQueue();
        const els = el.querySelectorAll(".migrant");
        const diff = queue.length - els.length;

        if (diff > 0) {
            for (let i = els.length; i < queue.length; i++) {
                spawnMigrant(el, queue[i].remaining);
            }
        } else if (diff < 0) {
            const removeCount = -diff;
            for (let i = 0; i < removeCount; i++) {
                els[i].remove();
            }
        }
    }

    onChange(sync);
    sync();

    return { el, sync };
}

function spawnMigrant(strip, remaining) {
    const el = document.createElement("span");
    el.className = "migrant";
    el.textContent = "🚶";

    const startX = strip.querySelectorAll(".migrant").length * 1.4;
    el.style.left = startX + "px";
    strip.appendChild(el);

    const dist = Math.max(strip.clientWidth - startX, 1);
    const flipped = " scaleX(-1)";

    const duration = Math.max(
        0.1,
        Number.isFinite(remaining) ? remaining : getArrivalDuration(),
    );

    el.style.transition = "none";
    el.style.transform = "translateY(-50%)" + flipped;
    void el.offsetWidth;

    el.style.transition = "transform " + duration + "s linear";
    el.style.transform = "translate(" + dist + "px, -50%)" + flipped;

    setTimeout(() => el.remove(), (duration + 0.5) * 1000);
}
