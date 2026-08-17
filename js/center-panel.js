/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     MERKEZ PANEL İSKELETİ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { formatCount } from "./utils.js";
import { BUILDINGS_DATA } from "./buildings.js";
import { createBuildingCard } from "./building-card.js";
import { createResourceTile } from "./resource-tile.js";
import {
  getPower,
  onChange,
} from "./game-state.js";

const RAW_TILE_ORDER = ["su", "yiyecek", "odun", "tas", "maden", "bilgi", "inanc", "ipek", "baharat", "sarap", "kultur"];
const PRODUCT_TILE_ORDER = ["ekmek", "kereste", "demir", "kumas", "konyak", "ilac", "celik", "mobilya", "mucevher", "mermer", "heykel"];

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
  const powerSpan = document.createElement("span");
  powerSpan.className = "num-display";
  powerValue.append("🏆 ", powerSpan);

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
  storageRow.appendChild(createBuildingCard("depo", BUILDINGS_DATA.depo));
  storageRow.appendChild(createBuildingCard("ambar", BUILDINGS_DATA.ambar));

  storageSection.append(storageRow);

  function update(snapshot) {
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
