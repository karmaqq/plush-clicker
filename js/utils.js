/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          YARDIMCI FONKSİYONLAR                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { RESOURCES } from "./resources.js";

/* ─────────────────── Kalın Metin Oluşturucu ─────────────────── */
export function strong(text) {
    const s = document.createElement("strong");
    s.textContent = text;
    return s;
}

/* ─────────────────── Rozet Oluşturucu ─────────────────── */
export function badge(value) {
    const s = document.createElement("span");
    s.className = "badge tt-badge badge-tier-" + getBadgeTier(value);
    s.textContent = String(value);
    return s;
}

/* ─────────────────── Kaynak Sınıfı Sıfırlayıcı ─────────────────── */
export function resetResourceClass(tooltipElement, id) {
    for (const r of Object.keys(RESOURCES)) {
        tooltipElement.classList.remove("resource-" + r);
    }
    tooltipElement.classList.add("resource-" + id);
}

/* ─────────────────── Rozet Kategorisi Hesaplayıcı ─────────────────── */
export function getBadgeTier(value) {
    if (value >= 200) return 5;
    if (value >= 100) return 4;
    if (value >= 50) return 3;
    if (value >= 25) return 2;
    if (value >= 10) return 1;
    return 0;
}

/* ─────────────────── Bütçe Kontrolü ─────────────────── */
export function canAfford(cost, getResource) {
    return Object.entries(cost).every(([resource, amount]) => getResource(resource) >= amount);
}

/* ─────────────────── Sayı Biçimleyici ─────────────────── */
export function formatNumber(value) {
    return value.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/* ─────────────────── Tam Sayı Biçimleyici ─────────────────── */
export function formatCount(value) {
    return Math.floor(value).toLocaleString("tr-TR");
}

/* ─────────────────── Süre Biçimleyici ─────────────────── */
export function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 1) return "0s";
    const s = Math.floor(seconds);
    if (s < 60) return s + "s";
    const m = Math.floor(s / 60);
    if (m < 60) {
        const rem = s % 60;
        return rem > 0 ? m + "m" + rem + "s" : m + "m";
    }
    const h = Math.floor(m / 60);
    if (h < 24) {
        const rem = m % 60;
        return rem > 0 ? h + "h" + rem + "m" : h + "h";
    }
    const d = Math.floor(h / 24);
    const rem = h % 24;
    return rem > 0 ? d + "g" + rem + "h" : d + "g";
}

/* ─────────────────── Sayı Sayaç Bileşeni ─────────────────── */
export function createNumberCounter() {
    const span = document.createElement("span");
    span.className = "num-display";

    const wholeEl = document.createElement("span");
    wholeEl.className = "num-whole";
    span.appendChild(wholeEl);

    const fracEl = document.createElement("span");
    fracEl.className = "num-frac";
    span.appendChild(fracEl);

    let lastText = null;

    function update(value) {
        const text = formatNumber(value);
        if (text === lastText) return;
        lastText = text;

        const dot = text.lastIndexOf(",");
        wholeEl.textContent = dot === -1 ? text : text.slice(0, dot);
        fracEl.textContent = dot === -1 ? "" : text.slice(dot);
        fracEl.hidden = dot === -1;
    }

    return { span, update };
}

/* ─────────────────── Sarsılma Tetikleyici ─────────────────── */
export function triggerShake(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
}

/* ─────────────────── Kilit Örtüsü Oluşturucu ─────────────────── */
export function createLockOverlay() {
    const element = document.createElement("div");
    element.className = "lock-overlay";

    const icon = document.createElement("div");
    icon.className = "lock-icon";
    icon.textContent = "🔒";

    const name = document.createElement("div");
    name.className = "lock-name";
    name.textContent = "???";

    const lockDesc = document.createElement("div");
    lockDesc.className = "lock-desc";

    const info = document.createElement("div");
    info.className = "lock-info";
    info.append(name, lockDesc);

    element.append(icon, info);

    return { element, lockDesc, lockName: name };
}
