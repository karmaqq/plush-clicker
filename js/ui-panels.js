/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          PANEL ARAYUZLERI                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { formatCount, triggerShake } from "./utils.js";
import {
  BUILDINGS_DATA,
  PACKS_DATA,
  INDUSTRY_DATA,
  STORAGE_DATA,
} from "./game-data.js";
import {
  state,
  getPower,
  getWorkerCount,
  hasInfoProduction,
  resetGame,
  onChange,
} from "./game-core.js";
import {
  getResourceName as getEraResourceName,
  getResourceEmoji as getEraResourceEmoji,
} from "./era.js";
import {
  getPopulationCurrent,
  getPopulationCapacity,
  getPopulationMigrants,
} from "./population.js";
import { createBuildingCard, createPackCard, createIndustryCard } from "./ui-cards.js";
import {
  createResourceTile,
  createPopBlock,
  createHousingChip,
  createHappinessChip,
  createSeasonChip,
  createMigrationStrip,
  createGoldChip,
  createEraChip,
} from "./ui-chips.js";
import { createTradeSection } from "./trade.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      MERKEZ PANEL OLUSTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const RAW_TILE_ORDER = ["su", "yiyecek", "bilgi", "tas", "maden", "kultur", "inanc", "ipek", "altin"];
const PRODUCT_TILE_ORDER = ["ekmek", "demir", "celik", "mermer", "kumas", "ilac", "mobilya", "heykel", "mucevher"];

export function createCenterPanel() {
  const panel = document.createElement("section");
  panel.className = "panel center-panel";
  const header = document.createElement("div");
  header.className = "center-header";
  const powerValue = document.createElement("span");
  powerValue.className = "power-value";
  const powerIcon = document.createElement("span");
  powerIcon.className = "power-icon";
  const powerSpan = document.createElement("span");
  powerSpan.className = "num-display";
  powerValue.append(powerIcon, " ", powerSpan);
  header.append(powerValue);
  const resourceArea = document.createElement("div");
  resourceArea.className = "resource-area";
  const rawGrid = document.createElement("div");
  rawGrid.className = "resource-grid raw-grid";
  const productGrid = document.createElement("div");
  productGrid.className = "resource-grid product-grid";
  const divider = document.createElement("div");
  divider.className = "resource-divider";
  divider.hidden = true;
  const tileMap = {};
  for (const id of RAW_TILE_ORDER) {
    tileMap[id] = createResourceTile(id);
    rawGrid.appendChild(tileMap[id].element);
  }
  for (const id of PRODUCT_TILE_ORDER) {
    tileMap[id] = createResourceTile(id);
    productGrid.appendChild(tileMap[id].element);
  }
  resourceArea.append(rawGrid, divider, productGrid);
  const storageDivider = document.createElement("div");
  storageDivider.className = "resource-divider";
  storageDivider.hidden = true;
  const storageSection = document.createElement("div");
  storageSection.className = "storage-section";
  const storageRow = document.createElement("div");
  storageRow.className = "storage-row";
  const depoCard = createBuildingCard("depo", STORAGE_DATA.depo);
  const ambarCard = createBuildingCard("ambar", STORAGE_DATA.ambar);
  storageRow.appendChild(depoCard.element);
  storageRow.appendChild(ambarCard.element);
  storageSection.append(storageRow);
  function update(snapshot) {
    powerIcon.textContent = getEraResourceEmoji("power");
    powerSpan.textContent = formatCount(getPower());
    for (const id of Object.keys(tileMap)) {
      tileMap[id].update(snapshot);
    }
    const hasActiveProduct = PRODUCT_TILE_ORDER.some((id) => !tileMap[id].element.hidden);
    divider.hidden = !hasActiveProduct;
    const hasVisibleStorage = !depoCard.element.hidden || !ambarCard.element.hidden;
    storageDivider.hidden = !hasVisibleStorage;
  }
  onChange((_state, snapshot) => update(snapshot));
  update();
  panel.append(header, resourceArea, storageDivider, storageSection);
  return panel;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SOL PANEL OLUSTURUCU                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
    buildingGrid.appendChild(createBuildingCard(id, data).element);
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
    if (!hasInfoProduction()) {
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
    const infoReady = hasInfoProduction();
    packTab.classList.toggle("locked", !infoReady);
    packTab.textContent = infoReady ? "Paketler" : " Paketler";
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SAG PANEL OLUSTURUCU                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function createRightPanel() {
  const panel = document.createElement("section");
  panel.className = "panel right-panel";
  const tabBar = document.createElement("div");
  tabBar.className = "tab-bar";
  const industryTab = document.createElement("button");
  industryTab.type = "button";
  industryTab.className = "tab-btn active";
  industryTab.textContent = "Sanayi";
  const tradeTab = document.createElement("button");
  tradeTab.type = "button";
  tradeTab.className = "tab-btn";
  tradeTab.textContent = "Ticaret";
  tabBar.append(industryTab, tradeTab);
  const industryList = document.createElement("div");
  industryList.className = "upgrade-list";
  for (const id of Object.keys(INDUSTRY_DATA)) {
    industryList.appendChild(createIndustryCard(id, INDUSTRY_DATA[id]));
  }
  const tradeSection = createTradeSection();
  panel.append(tabBar, industryList, tradeSection.section);
  let activeTab = "industry";
  function showTab(tab) {
    activeTab = tab;
    industryTab.classList.toggle("active", tab === "industry");
    tradeTab.classList.toggle("active", tab === "trade");
    industryList.hidden = tab !== "industry";
    tradeSection.section.hidden = tab !== "trade";
  }
  industryTab.addEventListener("click", () => showTab("industry"));
  tradeTab.addEventListener("click", () => showTab("trade"));
  return panel;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      HEADER PANEL OLUSTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
  const eraChip = createEraChip();
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
