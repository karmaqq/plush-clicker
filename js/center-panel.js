/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     MERKEZ PANEL İSKELETİ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { formatCount } from "./utils.js";
import { STORAGE_DATA } from "./buildings.js";
import { createBuildingCard } from "./building-card.js";
import { createResourceTile } from "./resource-tile.js";
import {
  getPower,
  getResourceName,
  getResourceEmoji,
  onChange,
} from "./game-state.js";

const RAW_TILE_ORDER = ["su", "yiyecek", "bilgi", "tas", "maden", "kultur", "inanc", "ipek", "altin"];
const PRODUCT_TILE_ORDER = ["ekmek", "demir", "celik", "mermer", "kumas", "ilac", "mobilya", "heykel", "mucevher"];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      MERKEZ PANEL OLUŞTURUCU                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Merkez Panel Bileşeni ─────────────────── */

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

  const tileMap = {};

  for (const id of RAW_TILE_ORDER) {
    tileMap[id] = createResourceTile(id);
    rawGrid.appendChild(tileMap[id].element);
  }

  for (const id of PRODUCT_TILE_ORDER) {
    tileMap[id] = createResourceTile(id);
    productGrid.appendChild(tileMap[id].element);
  }

  resourceArea.append(rawGrid, productGrid);

  const storageSection = document.createElement("div");
  storageSection.className = "storage-section";
  const storageRow = document.createElement("div");
  storageRow.className = "storage-row";
  storageRow.appendChild(createBuildingCard("depo", STORAGE_DATA.depo).element);
  storageRow.appendChild(createBuildingCard("ambar", STORAGE_DATA.ambar).element);

  storageSection.append(storageRow);

  function update(snapshot) {
    powerIcon.textContent = getResourceEmoji("power");
    powerSpan.textContent = formatCount(getPower());

    for (const id of Object.keys(tileMap)) {
      tileMap[id].update(snapshot);
    }
  }

  onChange((_state, snapshot) => update(snapshot));
  update();

  panel.append(header, resourceArea, storageSection);
  return panel;
}
