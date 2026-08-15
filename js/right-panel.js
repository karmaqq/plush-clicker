import { canAfford, formatCount, formatNumber, formatDuration, createLockOverlay, triggerShake } from "./utils.js";
import { createTooltip } from "./tooltip.js";
import { INDUSTRY_DATA } from "./industry.js";
import { RESOURCES } from "./resources.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { createBuildingCard } from "./left-panel.js";
import {
    getResource,
    getNetRate,
    getUnlock,
    getUnlockText,
    getUnlockType,
    isNearUnlock,
    getIndustry,
    getIndustryBuilt,
    getIndustryWorkers,
    getIndustryCost,
    buildIndustry,
    addWorker,
    removeWorker,
    getWorkerCount,
    getPopulationAlive,
    getTradeCurrent,
    getTradeTimer,
    getTradeCount,
    getTradeInterval,
    acceptTrade,
    onChange,
} from "./game-state.js";

export function createRightPanel() {
    const panel = document.createElement("section");
    panel.className = "panel right-panel";

    const tabBar = document.createElement("div");
    tabBar.className = "tab-bar";

    const industryTab = document.createElement("button");
    industryTab.type = "button";
    industryTab.className = "tab-btn active";
    industryTab.textContent = "Sanayi";

    const tradeTab = document.createElement("button");
    tradeTab.type = "button";
    tradeTab.className = "tab-btn";
    tradeTab.textContent = "Ticaret";

    tabBar.append(industryTab, tradeTab);

    const industryList = document.createElement("div");
    industryList.className = "upgrade-list";

    for (const id of Object.keys(INDUSTRY_DATA)) {
        industryList.appendChild(createIndustryCard(id, INDUSTRY_DATA[id]));
    }

    const tradeSection = createTradeSection();

    panel.append(tabBar, industryList, tradeSection.section);

    let activeTab = "industry";

    function showTab(tab) {
        activeTab = tab;
        industryTab.classList.toggle("active", tab === "industry");
        tradeTab.classList.toggle("active", tab === "trade");
        industryList.hidden = tab !== "industry";
        tradeSection.section.hidden = tab !== "trade";
    }

    industryTab.addEventListener("click", () => showTab("industry"));
    tradeTab.addEventListener("click", () => showTab("trade"));

    return panel;
}

const industryTooltip = createTooltip("industry-tooltip");

const tooltipLive = { id: null, rows: [] };

function createTradeSection() {
    const section = document.createElement("div");
    section.className = "trade-section";
    section.hidden = true;

    const postCard = createBuildingCard("tradePost", BUILDINGS_DATA.tradePost);

    const offerCard = document.createElement("div");
    offerCard.className = "trade-offer";

    const offerHead = document.createElement("div");
    offerHead.className = "trade-offer-head";

    const offerName = document.createElement("div");
    offerName.className = "trade-offer-name";
    offerName.textContent = "Ticaret Teklifi";

    const offerTimer = document.createElement("div");
    offerTimer.className = "trade-offer-timer";

    offerHead.append(offerName, offerTimer);

    const offerBody = document.createElement("div");
    offerBody.className = "trade-offer-body";

    const offerEmpty = document.createElement("div");
    offerEmpty.className = "trade-offer-empty";
    offerEmpty.textContent = "Tüccar yolda…";

    const offerRow = document.createElement("div");
    offerRow.className = "trade-offer-row";
    offerRow.hidden = true;

    const getSpan = document.createElement("span");
    getSpan.className = "trade-offer-get";

    offerRow.append(getSpan);

    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.className = "trade-accept-btn";

    acceptBtn.addEventListener("click", () => {
        if (!acceptTrade()) {
            triggerShake(acceptBtn);
        }
    });

    offerBody.append(offerEmpty, offerRow, acceptBtn);

    const stats = document.createElement("div");
    stats.className = "trade-stats";

    const accepted = document.createElement("div");
    accepted.className = "trade-stat";
    const interval = document.createElement("div");
    interval.className = "trade-stat";

    stats.append(accepted, interval);

    offerCard.append(offerHead, offerBody, stats);

    section.append(postCard, offerCard);

    function update() {
        const current = getTradeCurrent();
        const timer = getTradeTimer();
        const count = getTradeCount();

        const hasOffer = !!current;

        offerEmpty.hidden = hasOffer;
        offerRow.hidden = !hasOffer;
        acceptBtn.hidden = !hasOffer;

        if (hasOffer) {
            const meta = RESOURCES[current.get.resource];
            getSpan.textContent = meta.emoji + " " + formatCount(current.get.amount) + " " + meta.name;
            const affordable = getResource("altin") >= current.cost;
            acceptBtn.classList.toggle("disabled", !affordable);
            acceptBtn.textContent = RESOURCES.altin.emoji + " " + formatCount(current.cost) + " Altın";
        }

        offerTimer.textContent = hasOffer
            ? "Sonraki teklif: " + formatDuration(timer) + " sn"
            : "Yeni teklif: " + formatDuration(timer) + " sn";

        accepted.textContent = "✅ Kabul edilen: " + count;
        interval.textContent = "Tüccar sıklığı: ~" + Math.round(getTradeInterval()) + " sn";
    }

    onChange(update);
    update();

    return { section, update };
}

function createIndustryCard(id, data) {
    const outputResource = Object.keys(data.output)[0];

    const card = document.createElement("div");
    card.className = "industry-card resource-" + outputResource;

    const lockOverlay = createLockOverlay();

    const head = document.createElement("div");
    head.className = "upgrade-head";

    const name = document.createElement("div");
    name.className = "upgrade-name";
    name.textContent = data.emoji + " " + data.name;

    const workersLabel = document.createElement("div");
    workersLabel.className = "industry-workers";
    workersLabel.textContent = "👷 0/" + data.maxWorkers;

    head.append(name, workersLabel);

    const desc = document.createElement("div");
    desc.className = "upgrade-desc";
    desc.textContent = data.description;

    const flow = document.createElement("div");
    flow.className = "industry-flow";

    const inputRow = document.createElement("div");
    inputRow.className = "industry-flow-row";
    const inputLabel = document.createElement("span");
    inputLabel.className = "industry-flow-label";
    inputLabel.textContent = "Girdi:";
    const inputValue = document.createElement("span");
    inputValue.className = "industry-flow-value input-value";
    inputRow.append(inputLabel, inputValue);

    const outputRow = document.createElement("div");
    outputRow.className = "industry-flow-row";
    const outputLabel = document.createElement("span");
    outputLabel.className = "industry-flow-label";
    outputLabel.textContent = "Çıktı:";
    const outputValue = document.createElement("span");
    outputValue.className = "industry-flow-value output-value";
    outputRow.append(outputLabel, outputValue);

    flow.append(inputRow, outputRow);

    const warning = document.createElement("div");
    warning.className = "industry-warning";
    warning.hidden = true;

    const buildBtn = document.createElement("button");
    buildBtn.type = "button";
    buildBtn.className = "industry-build-btn";

    const costSpans = {};
    for (const resource of Object.keys(data.baseCost)) {
        const span = document.createElement("span");
        span.className = "industry-cost";
        buildBtn.appendChild(span);
        costSpans[resource] = span;
    }

    const buildText = document.createElement("span");
    buildText.className = "industry-build-text";
    buildText.textContent = "İnşa Et";
    buildBtn.appendChild(buildText);

    buildBtn.addEventListener("click", () => {
        if (getUnlock(data) && !buildIndustry(id)) {
            triggerShake(buildBtn);
        }
    });

    const controls = document.createElement("div");
    controls.className = "industry-controls";

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "worker-btn worker-minus";
    minusBtn.textContent = "−";

    const workerCount = document.createElement("span");
    workerCount.className = "worker-count";
    workerCount.textContent = "0";

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "worker-btn worker-plus";
    plusBtn.textContent = "+";

    minusBtn.addEventListener("click", () => removeWorker(id));

    plusBtn.addEventListener("click", () => {
        if (!addWorker(id)) {
            triggerShake(plusBtn);
        }
    });

    controls.append(minusBtn, workerCount, plusBtn);

    card.append(head, desc, flow, warning, buildBtn, controls, lockOverlay.element);

    let tooltipActive = false;

    card.addEventListener("mouseenter", () => {
        if (!getUnlock(data)) return;
        tooltipActive = true;
        buildIndustryTooltip(id);
        industryTooltip.show(card);
    });

    card.addEventListener("mouseleave", () => {
        tooltipActive = false;
        industryTooltip.hide();
    });

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
            lockOverlay.lockDesc.classList.toggle("lock-req-industry", unlockType === "industry");
            buildBtn.hidden = true;
            controls.hidden = true;
            flow.hidden = true;
            warning.hidden = true;
            return;
        }

        card.hidden = false;
        const built = getIndustryBuilt(id);
        card.classList.toggle("built", built);

        const workers = getIndustryWorkers(id);
        const entry = getIndustry(id);

        if (!built) {
            const cost = getIndustryCost(id);

            for (const [resource, span] of Object.entries(costSpans)) {
                const amount = cost[resource];
                const enough = getResource(resource) >= amount;
                span.textContent = RESOURCES[resource].emoji + " " + formatCount(amount);
                span.classList.toggle("cost-ok", enough);
                span.classList.toggle("cost-missing", !enough);
            }

            workersLabel.textContent = "👷 0/" + data.maxWorkers;
            buildBtn.hidden = false;
            buildBtn.classList.toggle("disabled", !canAfford(cost, getResource));
            controls.hidden = true;
            flow.hidden = true;
            warning.hidden = true;

            if (tooltipActive) refreshIndustryTooltip();
            return;
        }

        buildBtn.hidden = true;
        controls.hidden = false;
        flow.hidden = false;

        workersLabel.textContent = "👷 " + workers + "/" + data.maxWorkers;
        workerCount.textContent = String(workers);

        const inputParts = [];
        for (const [resource, rate] of Object.entries(data.input)) {
            const amount = workers * rate;
            inputParts.push(RESOURCES[resource].emoji + " -" + formatNumber(amount) + "/s");
        }
        inputValue.textContent = inputParts.join("  ");
        inputValue.classList.toggle("idle", workers === 0);

        const outputParts = [];
        for (const [resource, rate] of Object.entries(data.output)) {
            const amount = workers * rate;
            outputParts.push(RESOURCES[resource].emoji + " +" + formatNumber(amount) + "/s");
        }
        outputValue.textContent = outputParts.join("  ");
        outputValue.classList.toggle("idle", workers === 0);

        if (entry.stalled) {
            warning.textContent = "⚠️ Yetersiz girdi";
            warning.hidden = false;
        } else if (entry.outputFull) {
            warning.textContent = "⚠️ Depo dolu";
            warning.hidden = false;
        } else {
            warning.hidden = true;
        }

        minusBtn.disabled = workers <= 0;
        plusBtn.disabled = workers >= data.maxWorkers || getWorkerCount() >= getPopulationAlive();

        if (tooltipActive) {
            tooltipActive = false;
            industryTooltip.hide();
        }
    }

    onChange(update);
    update();

    return card;
}

function buildIndustryTooltip(id) {
    const data = INDUSTRY_DATA[id];
    const cost = getIndustryCost(id);

    resetIndustryTooltipClass(id);

    industryTooltip.element.textContent = "";

    const title = document.createElement("div");
    title.className = "tooltip-title";
    title.textContent = data.emoji + " " + data.name;
    industryTooltip.element.appendChild(title);

    const effect = document.createElement("div");
    effect.className = "tooltip-effect";

    const effectLine = document.createElement("div");
    effectLine.className = "tooltip-effect-line";

    const effectLabel = document.createElement("span");
    effectLabel.className = "effect-label";
    effectLabel.textContent = "Üretim:";

    const effectValue = document.createElement("span");
    effectValue.className = "effect-value";
    effectValue.textContent = Object.entries(data.output)
        .map(([r, rate]) => RESOURCES[r].emoji + " +" + formatNumber(rate) + "/s · işçi")
        .join("  ");

    effectLine.append(effectLabel, " ", effectValue);
    effect.appendChild(effectLine);
    industryTooltip.element.appendChild(effect);

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

    industryTooltip.element.appendChild(costs);
    refreshIndustryTooltip();
}

function refreshIndustryTooltip() {
    if (tooltipLive.id == null) return;

    const id = tooltipLive.id;
    const cost = getIndustryCost(id);

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

function resetIndustryTooltipClass(id) {
    const outId = Object.keys(INDUSTRY_DATA[id].output)[0];
    industryTooltip.element.className = "tooltip industry-tooltip resource-" + outId;
}
