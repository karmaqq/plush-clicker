/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         KONUT ÇİĞİ ARAYÜZÜ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { formatCount, triggerShake, canAfford } from "./utils.js";
import { HOUSING_DATA } from "./buildings.js";
import {
  getResource,
  getBuildingCount,
  getBuildingCost,
  getUnlock,
  buyBuilding,
  onChange,
} from "./game-state.js";
import { buildBuildingTooltip, refreshBuildingTooltip, tooltip as buildingTooltip } from "./building-card.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       KONUT ÇİPİ OLUŞTURUCU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Konut Çipi Bileşeni ─────────────────── */

export function createHousingChip(id) {
  const data = HOUSING_DATA[id];

  const el = document.createElement("button");
  el.type = "button";
  el.className = "housing-chip";

  const icon = document.createElement("span");
  icon.className = "housing-chip-icon";
  icon.textContent = id === "baraka" ? "🛖" : "🏠";

  const name = document.createElement("span");
  name.className = "housing-chip-name";
  name.textContent = data.name;

  const cap = document.createElement("span");
  cap.className = "housing-chip-cap";

  el.append(icon, name, cap);

  el.addEventListener("click", () => {
    if ((getUnlock(data) || getBuildingCount(id) > 0) && !buyBuilding(id)) {
      triggerShake(el);
    }
  });

  let tooltipActive = false;

  el.addEventListener("mouseenter", () => {
    if (!getUnlock(data) && getBuildingCount(id) === 0) return;
    tooltipActive = true;
    buildBuildingTooltip(id, data);
    buildingTooltip.show(el);
  });

  el.addEventListener("mouseleave", () => {
    tooltipActive = false;
    buildingTooltip.hide();
  });

  function update() {
    const owned = getBuildingCount(id);
    const unlocked = getUnlock(data);

    el.classList.toggle("locked", !unlocked && owned === 0);

    const costObj = getBuildingCost(id);
    el.classList.toggle("affordable", canAfford(costObj, getResource));

    cap.textContent = "+" + formatCount(owned * data.housingCapacity);

    if (tooltipActive) {
      refreshBuildingTooltip();
    }
  }

  onChange(update);
  update();

  return el;
}
