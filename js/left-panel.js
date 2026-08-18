/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SOL PANEL İSKELETİ                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { triggerShake } from "./utils.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { PACKS_DATA } from "./packs.js";
import { createBuildingCard } from "./building-card.js";
import { createPackCard } from "./pack-card.js";
import { hasInfoProduction as hasInfoProd } from "./production.js";
import { onChange } from "./state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SOL PANEL OLUŞTURUCU                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sol Panel Bileşeni ─────────────────── */

export function createLeftPanel() {
  const panel = document.createElement("section");
  panel.className = "panel left-panel";

  const tabBar = document.createElement("div");
  tabBar.className = "tab-bar";

  const buildingTab = document.createElement("button");
  buildingTab.type = "button";
  buildingTab.className = "tab-btn active";
  buildingTab.textContent = "Binalar";

  const packTab = document.createElement("button");
  packTab.type = "button";
  packTab.className = "tab-btn";
  packTab.textContent = "Paketler";

  tabBar.append(buildingTab, packTab);

  const buildingGrid = document.createElement("div");
  buildingGrid.className = "building-list";

  for (const [id, data] of Object.entries(BUILDINGS_DATA)) {
    buildingGrid.appendChild(createBuildingCard(id, data));
  }

  const packList = document.createElement("div");
  packList.className = "upgrade-list pack-list";
  packList.hidden = true;

  for (const id of Object.keys(PACKS_DATA)) {
    packList.appendChild(createPackCard(id, PACKS_DATA[id]));
  }

  panel.append(tabBar, buildingGrid, packList);

  let activeTab = "buildings";

  buildingTab.addEventListener("click", () => {
    activeTab = "buildings";
    buildingTab.classList.add("active");
    packTab.classList.remove("active");
    buildingGrid.hidden = false;
    packList.hidden = true;
  });

  packTab.addEventListener("click", () => {
    if (!hasInfoProd()) {
      triggerShake(packTab);
      return;
    }
    activeTab = "packs";
    packTab.classList.add("active");
    buildingTab.classList.remove("active");
    buildingGrid.hidden = true;
    packList.hidden = false;
  });

  function updateTabs() {
    const infoReady = hasInfoProd();
    packTab.classList.toggle("locked", !infoReady);
    packTab.textContent = infoReady ? "Paketler" : "🔒 Paketler";
    packTab.title = infoReady ? "" : "Bilgi üretimiyle açılır (ilk Akademi)";

    if (!infoReady && activeTab === "packs") {
      activeTab = "buildings";
      buildingTab.classList.add("active");
      packTab.classList.remove("active");
      buildingGrid.hidden = false;
      packList.hidden = true;
    }
  }

  onChange(updateTabs);
  updateTabs();

  return panel;
}
