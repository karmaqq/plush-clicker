/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       MEVSİM CHIP ARAYÜZÜ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  getSeason,
  getSeasonTimer,
  onChange,
} from "./game-state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       MEVSİM ÇİP OLUŞTURUCU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Mevsim Çip Bileşeni ─────────────────── */

export function createSeasonChip() {
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
