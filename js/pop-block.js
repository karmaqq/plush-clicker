/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         NÜFUS BLOĞU ARAYÜZÜ                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  getPopulationCurrent,
  getPopulationCapacity,
  getWorkerCount,
  getPopulationMigrants,
  onChange,
} from "./game-state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       NÜFUS BLOĞU OLUŞTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Nüfus Bloğu Bileşeni ─────────────────── */

export function createPopBlock() {
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
    ["Kapasite", "cap", "#8895a3"],
    ["Nüfus", "pop", "#ffffff"],
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
