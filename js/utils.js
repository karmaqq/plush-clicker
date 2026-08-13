const loaded = new Set();

export function loadCss(href) {
    if (loaded.has(href)) return;
    loaded.add(href);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

export function getBadgeTier(value) {
    if (value >= 200) return 5;
    if (value >= 100) return 4;
    if (value >= 50) return 3;
    if (value >= 25) return 2;
    if (value >= 10) return 1;
    return 0;
}

export function canAfford(cost, getResource) {
    return Object.entries(cost).every(([resource, amount]) => getResource(resource) >= amount);
}

export function formatNumber(value) {
    return value.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function formatCount(value) {
    return Math.floor(value).toLocaleString("tr-TR");
}

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

export function triggerShake(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
}

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
