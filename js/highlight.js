/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          CAPRAZ PANEL VURGULAMA                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { RESOURCES } from "./game-data.js";
import {
    getResource,
    getBuildingCost,
    getPackCost,
    getIndustryCost,
    getIndustryUpgradeCost,
    getSeason,
} from "./game-core.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ILISKI INDEKSLERI                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const HL_RED = "#ff6b6b";
const HL_GREEN = "#7ee2a8";
const POP_HL_COLOR = "#8fd0ff";
const HOUSING_HL_COLOR = "#d9b98c";

const TRIGGER_SELECTOR =
    "[data-hl-in],[data-hl-out],[data-hl-cost],[data-hl-with-pop],[data-res-id],[data-hl-target-pop],[data-hl-season]";

const COST_RESOLVERS = {
    building: getBuildingCost,
    industry: getIndustryCost,
    industryUpgrade: getIndustryUpgradeCost,
    pack: getPackCost,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          VURGULAMA DURUMU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

let activeTrig = null;
let activeEls = [];

/* ─────────────────── Vurgulama Baslatici ─────────────────── */
export function initHighlight() {
    document.addEventListener("mouseover", (e) => {
        const el = e.target.closest(TRIGGER_SELECTOR);
        if (!el) {
            if (!activeTrig || !activeTrig.manual) clearAll();
            return;
        }
        const trig = readTrigger(el);
        if (!trig) {
            if (!activeTrig || !activeTrig.manual) clearAll();
            return;
        }
        if (sameTrig(activeTrig, trig)) return;
        applyTrig(trig);
    });
}

/* ─────────────────── Vurgulama Yenileyici ─────────────────── */
export function refreshHighlight() {
    if (!activeTrig) return;
    applyTrig(activeTrig);
}

/* ─────────────────── Manuel Vurgu Ayarlayici ─────────────────── */
export function setManualHighlight(resIds) {
    const valid = [];
    for (const rid of resIds) {
        if (rid && RESOURCES[rid]) valid.push(rid);
    }
    if (valid.length === 0) {
        clearManualHighlight();
        return;
    }
    applyTrig({ type: "manual", resIds: [...new Set(valid)], manual: true });
}

/* ─────────────────── Manuel Vurgu Temizleyici ─────────────────── */
export function clearManualHighlight() {
    if (activeTrig && activeTrig.manual) clearAll();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          TETIKLEYICI OKUMA                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function readTrigger(el) {
    if (el.dataset.hlIn !== undefined || el.dataset.hlOut !== undefined) {
        return {
            type: "flow",
            ins: parseRes(el.dataset.hlIn),
            outs: parseRes(el.dataset.hlOut),
            withPop: el.dataset.hlWithPop !== undefined,
        };
    }
    if (el.dataset.hlCost) {
        const sep = el.dataset.hlCost.indexOf(":");
        if (sep < 0) return null;
        const kind = el.dataset.hlCost.slice(0, sep);
        const id = el.dataset.hlCost.slice(sep + 1);
        if (!COST_RESOLVERS[kind] || !id) return null;
        return {
            type: kind === "pack" ? "costPack" : "cost",
            kind,
            id,
            withPop: el.dataset.hlWithPop !== undefined,
        };
    }
    if (el.dataset.resId && RESOURCES[el.dataset.resId]) {
        return el.classList.contains("resource-tile")
            ? { type: "reverse", resId: el.dataset.resId }
            : { type: "full", resId: el.dataset.resId };
    }
    if (el.dataset.hlTargetPop !== undefined) {
        return { type: "housing" };
    }
    if (el.dataset.hlSeason !== undefined) {
        return { type: "season" };
    }
    return null;
}

function parseRes(str) {
    const out = new Set();
    if (!str) return out;
    for (const rid of str.split(/\s+/)) {
        if (rid && RESOURCES[rid]) out.add(rid);
    }
    return out;
}

function eqSet(a, b) {
    if (a.size !== b.size) return false;
    for (const v of a) {
        if (!b.has(v)) return false;
    }
    return true;
}

function sameTrig(a, b) {
    if (a === b) return true;
    if (!a || !b || a.type !== b.type || a.manual !== b.manual) return false;
    switch (a.type) {
        case "flow":
            return eqSet(a.ins, b.ins) && eqSet(a.outs, b.outs) && a.withPop === b.withPop;
        case "cost":
        case "costPack":
            return a.kind === b.kind && a.id === b.id && a.withPop === b.withPop;
        case "full":
        case "reverse":
            return a.resId === b.resId;
        default:
            return true;
    }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          VURGULAMA UYGULAMA                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function applyTrig(trig) {
    clearAll();
    activeTrig = trig;

    switch (trig.type) {
        case "flow":
            for (const rid of trig.ins) paintTiles(rid, HL_RED);
            for (const rid of trig.outs) paintTiles(rid, HL_GREEN);
            if (trig.withPop) paint(document.querySelectorAll("[data-hl-target-pop]"), POP_HL_COLOR);
            break;
        case "cost": {
            const cost = COST_RESOLVERS[trig.kind](trig.id);
            if (cost) {
                for (const [rid, amount] of Object.entries(cost)) {
                    if (getResource(rid) < amount) paintTiles(rid, HL_RED);
                }
            }
            if (trig.withPop) paint(document.querySelectorAll("[data-hl-target-pop]"), POP_HL_COLOR);
            break;
        }
        case "costPack": {
            const cost = COST_RESOLVERS.pack(trig.id);
            if (cost) {
                for (const [rid, amount] of Object.entries(cost)) {
                    const meta = RESOURCES[rid];
                    if (!meta) continue;
                    const color = getResource(rid) >= amount ? meta.colorBright : HL_RED;
                    paintTiles(rid, color);
                }
            }
            break;
        }
        case "full": {
            const meta = RESOURCES[trig.resId];
            paint(document.querySelectorAll('.trade-row[data-res-id="' + trig.resId + '"]'), meta.colorBright);
            paint(document.querySelectorAll('.resource-tile[data-res-id="' + trig.resId + '"]'), meta.colorBright);
            break;
        }
        case "reverse": {
            const meta = RESOURCES[trig.resId];
            paintVisible(document.querySelectorAll('[data-hl-rel~="' + trig.resId + '"]'), meta.colorBright);
            paint(document.querySelectorAll('.trade-row[data-res-id="' + trig.resId + '"]'), meta.colorBright);
            break;
        }
        case "housing":
            paint(document.querySelectorAll("[data-hl-target-housing]"), HOUSING_HL_COLOR);
            break;
        case "season": {
            const mods = getSeason().modifiers;
            for (const [rid, value] of Object.entries(mods)) {
                if (!RESOURCES[rid] || value === 1) continue;
                paintTiles(rid, value > 1 ? HL_GREEN : HL_RED);
            }
            break;
        }
        case "manual":
            for (const rid of trig.resIds) paintTiles(rid, HL_RED);
            break;
    }
}

function clearAll() {
    if (activeEls.length === 0 && !activeTrig) return;
    for (const el of activeEls) {
        el.classList.remove("hl-on");
        el.style.removeProperty("--hl-color");
        el.style.removeProperty("--hl-glow");
    }
    activeEls = [];
    activeTrig = null;
}

function paintTiles(rid, color) {
    paint(document.querySelectorAll('.resource-tile[data-res-id="' + rid + '"]'), color);
}

function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function paintVisible(els, color) {
    for (const el of els) {
        if (isVisible(el)) paint([el], color);
    }
}

function paint(els, color) {
    for (const el of els) {
        el.classList.add("hl-on");
        el.style.setProperty("--hl-color", color);
        el.style.setProperty("--hl-glow", hexToRgba(color, 0.35));
        activeEls.push(el);
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}
