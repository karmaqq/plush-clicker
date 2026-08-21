/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ARAÇ İPUCU                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { formatCount, formatDuration } from "./utils.js";
import { getResourceName, getResourceEmoji } from "./era.js";

/* ─────────────────── Tooltip Oluşturucu ─────────────────── */
export function createTooltip(extraClass) {
    const element = document.createElement("div");
    element.className = "tooltip" + (extraClass ? " " + extraClass : "");
    document.body.appendChild(element);

    return {
        element,
        show(anchor) {
            positionTooltip(element, anchor);
            element.classList.add("visible");
        },
        hide() {
            element.classList.remove("visible");
        },
    };
}

/* ─────────────────── Maliyet Satırları Oluşturucu ─────────────────── */
export function createCostRows(container, cost) {
    const rows = [];
    const costs = document.createElement("div");
    costs.className = "tooltip-costs";

    for (const [resource, amount] of Object.entries(cost)) {
        const row = document.createElement("div");
        row.className = "cost-row";

        const label = document.createElement("span");
        label.className = "cost-label";
        label.textContent = getResourceName(resource) + ":";

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

        rows.push({ resource, amount, value, haveEl, needEl, slashEl, timeEl });
    }

    container.appendChild(costs);
    return rows;
}

/* ─────────────────── Maliyet Satırları Güncelleyici ─────────────────── */
export function refreshCostRows(rows, cost, getResource, getNetRate) {
    for (const row of rows) {
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

function positionTooltip(tooltip, anchor) {
    const margin = 8;
    const gap = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = anchor.getBoundingClientRect();

    tooltip.style.maxHeight = "";
    const w = tooltip.offsetWidth;
    let h = tooltip.offsetHeight;

    const spaceAbove = rect.top - margin;
    const spaceBelow = vh - rect.bottom - margin;

    let above;
    if (h <= spaceAbove && h <= spaceBelow) {
        above = spaceAbove >= spaceBelow;
    } else if (h <= spaceAbove) {
        above = true;
    } else if (h <= spaceBelow) {
        above = false;
    } else {
        above = spaceAbove >= spaceBelow;
        tooltip.style.maxHeight = Math.max(120, (above ? spaceAbove : spaceBelow) - gap) + "px";
        h = tooltip.offsetHeight;
    }

    let top = above ? rect.top - h - gap : rect.bottom + gap;
    top = Math.min(Math.max(margin, top), vh - h - margin);

    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.min(Math.max(margin, left), vw - w - margin);

    tooltip.style.left = Math.round(left) + "px";
    tooltip.style.top = Math.round(top) + "px";
}
