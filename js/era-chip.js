/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         ÇAĞ GÖSTERGE ÇİPİ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  formatCount,
} from "./utils.js";
import {
  getPopulationAlive,
  getAltin,
  getEra,
  isEraTransitioning,
  getEraName,
  canAdvanceEra,
  ERA_DATA,
  onChange,
} from "./game-state.js";
import { state } from "./state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       ÇAĞ ÇİP OLUŞTURUCU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Çağ Çip Bileşeni ─────────────────── */

export function createEraChip() {
  const el = document.createElement("div");
  el.className = "era-chip";

  const infoRow = document.createElement("div");
  infoRow.className = "era-chip-info";

  const eraBadge = document.createElement("span");
  eraBadge.className = "era-chip-badge";

  const eraName = document.createElement("span");
  eraName.className = "era-chip-name";

  infoRow.append(eraBadge, eraName);

  const progressArea = document.createElement("div");
  progressArea.className = "era-chip-progress";

  const progressBar = document.createElement("div");
  progressBar.className = "era-chip-bar-track";

  const progressFill = document.createElement("div");
  progressFill.className = "era-chip-bar-fill";

  progressBar.appendChild(progressFill);

  const progressLabel = document.createElement("span");
  progressLabel.className = "era-chip-bar-label";

  progressArea.append(progressBar, progressLabel);

  el.append(infoRow, progressArea);

  /* ─────────────────── Tooltip ─────────────────── */

  const tooltip = document.createElement("div");
  tooltip.className = "era-tooltip";
  tooltip.hidden = true;

  const ttTitle = document.createElement("div");
  ttTitle.className = "era-tooltip-title";

  const ttPopRow = createEraTooltipRow("👥 Nüfus");
  const ttGoldRow = createEraTooltipRow("🪙 Altın");

  const ttDivider = document.createElement("div");
  ttDivider.className = "tt-divider";

  const ttNextRow = document.createElement("div");
  ttNextRow.className = "era-tooltip-next";
  ttNextRow.hidden = true;

  tooltip.append(ttTitle, ttPopRow.row, ttGoldRow.row, ttDivider, ttNextRow);
  el.appendChild(tooltip);

  let tooltipActive = false;

  el.addEventListener("mouseenter", () => {
    tooltipActive = true;
    refreshTooltip();
    tooltip.hidden = false;
  });

  el.addEventListener("mouseleave", () => {
    tooltipActive = false;
    tooltip.hidden = true;
  });

  /* ─────────────────── Güncelleme ─────────────────── */

  function update() {
    const currentEra = getEra();
    const data = ERA_DATA[currentEra];
    const hasTarget = data && data.next !== null;

    eraBadge.textContent = currentEra;
    eraName.textContent = getEraName(currentEra);

    if (hasTarget) {
      progressArea.hidden = false;

      const popTarget = data.populationTarget;
      const goldTarget = data.goldTarget;
      const popCurrent = getPopulationAlive();
      const goldCurrent = getAltin();

      const popPct = Math.min(popCurrent / popTarget, 1);
      const goldPct = Math.min(goldCurrent / goldTarget, 1);
      const overallPct = Math.min((popPct + goldPct) / 2, 1);

      progressFill.style.width = (overallPct * 100) + "%";

      if (overallPct >= 1) {
        progressFill.classList.add("era-bar-ready");
        progressFill.classList.remove("era-bar-fill");
      } else {
        progressFill.classList.remove("era-bar-ready");
        progressFill.classList.add("era-bar-fill");
      }

      if (tooltipActive) refreshTooltip();
    } else {
      progressArea.hidden = true;
    }
  }

  function refreshTooltip() {
    const currentEra = getEra();
    const data = ERA_DATA[currentEra];
    const hasTarget = data && data.next !== null;

    ttTitle.textContent = "Çağ " + currentEra + " — " + getEraName(currentEra);

    if (hasTarget) {
      const popTarget = data.populationTarget;
      const goldTarget = data.goldTarget;
      const popCurrent = getPopulationAlive();
      const goldCurrent = getAltin();

      ttPopRow.value.textContent = formatCount(popCurrent) + " / " + formatCount(popTarget);
      ttPopRow.value.style.color = popCurrent >= popTarget ? "#7ee2a8" : "#d7dde4";

      ttGoldRow.value.textContent = formatCount(goldCurrent) + " / " + formatCount(goldTarget);
      ttGoldRow.value.style.color = goldCurrent >= goldTarget ? "#7ee2a8" : "#d7dde4";

      const nextData = data.next ? ERA_DATA[data.next] : null;
      if (nextData) {
        ttNextRow.hidden = false;
        ttNextRow.textContent = "Sonraki çağ: " + nextData.name;
      } else {
        ttNextRow.hidden = true;
      }
    } else {
      ttPopRow.value.textContent = "Son çağ";
      ttPopRow.value.style.color = "#ffd166";
      ttGoldRow.row.hidden = true;
      ttNextRow.hidden = true;
    }
  }

  onChange(update);
  update();

  return { el, update };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      YARDIMCI FONKSİYONLAR                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tooltip Satırı ─────────────────── */

function createEraTooltipRow(labelText) {
  const row = document.createElement("div");
  row.className = "era-tooltip-row";

  const label = document.createElement("span");
  label.className = "tt-label";
  label.textContent = labelText;

  const value = document.createElement("span");
  value.className = "tt-value";

  row.append(label, value);
  return { row, value };
}
