import { canAfford, formatCount, formatNumber, createLockOverlay, triggerShake } from "./utils.js";
import { INDUSTRY_DATA } from "./industry.js";
import { RESOURCES } from "./resources.js";
import {
    getResource,
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

    tabBar.appendChild(industryTab);

    const list = document.createElement("div");
    list.className = "upgrade-list";

    for (const id of Object.keys(INDUSTRY_DATA)) {
        list.appendChild(createIndustryCard(id, INDUSTRY_DATA[id]));
    }

    panel.append(tabBar, list);
    return panel;
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
    }

    onChange(update);
    update();

    return card;
}
