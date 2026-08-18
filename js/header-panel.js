/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     HEADER PANEL İSKELETİ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  getPopulationCurrent,
  getPopulationCapacity,
  getWorkerCount,
  getPopulationMigrants,
  onChange,
  resetGame,
} from "./game-state.js";
import { createPopBlock } from "./pop-block.js";
import { createHousingChip } from "./housing-chip.js";
import { createHappinessChip } from "./happiness-chip.js";
import { createSeasonChip } from "./season-chip.js";
import { createMigrationStrip } from "./migration-strip.js";
import { createGoldChip } from "./gold-chip.js";
import { createEraChip } from "./era-chip.js";
import { triggerEraTransition } from "./era-transition.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      HEADER PANEL OLUŞTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Header Panel Bileşeni ─────────────────── */

export function createHeaderPanel() {
  const panel = document.createElement("section");
  panel.className = "panel header-panel";

  const strip = createMigrationStrip();

  const center = document.createElement("div");
  center.className = "header-center";

  const popBlock = createPopBlock();
  const happinessChip = createHappinessChip();

  center.append(popBlock.el, happinessChip.el);

  const right = document.createElement("div");
  right.className = "header-right";

  const seasonChip = createSeasonChip();
  const goldChip = createGoldChip();

  const eraChip = createEraChip(() => {
    triggerEraTransition();
  });

  const resetBtn = document.createElement("button");
  resetBtn.className = "reset-btn";
  resetBtn.textContent = "Sıfırla";
  resetBtn.title = "Tüm ilerlemeyi sıfırla";

  resetBtn.addEventListener("click", () => {
    if (confirm("Tüm ilerlemeyi sıfırlamak istediğine emin misin?")) {
      resetGame();
    }
  });

  right.append(
    createHousingChip("baraka"),
    createHousingChip("ev"),
    seasonChip.el,
    goldChip.el,
    eraChip.el,
    resetBtn
  );

  panel.append(strip.el, center, right);

  function update() {
    const alive = Math.floor(getPopulationCurrent());
    const capacity = getPopulationCapacity();
    const workers = getWorkerCount();
    const migrants = getPopulationMigrants();

    popBlock.update(alive, capacity, workers, Math.max(0, alive - workers), migrants);

    happinessChip.update();
    seasonChip.update();
    goldChip.update();
    eraChip.update();
  }

  onChange(update);
  update();

  return panel;
}
