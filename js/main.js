/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          ANA GIRIS NOKTASI                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { createHeaderPanel, createLeftPanel, createCenterPanel, createRightPanel } from "./ui-panels.js";
import { produce, processOfflineProgress, TICK_MS, loadState } from "./game-core.js";
import { initHighlight } from "./highlight.js";

/* ─────────────────── Layout Olusturucu ─────────────────── */
function createLayout({ header, left, center, right }) {
  const shell = document.createElement("div");
  shell.className = "app-shell";
  const headerRow = document.createElement("div");
  headerRow.className = "row app-header-row";
  headerRow.appendChild(header);
  const mainRow = document.createElement("div");
  mainRow.className = "row";
  mainRow.append(left, center, right);
  shell.append(headerRow, mainRow);
  return shell;
}

loadState();

const layout = createLayout({
    header: createHeaderPanel(),
    left: createLeftPanel(),
    center: createCenterPanel(),
    right: createRightPanel(),
});

document.body.appendChild(layout);

initHighlight();

/* ─────────────────── Oyun Dongusu ─────────────────── */
let gameLoop = window.setInterval(produce, TICK_MS);

/* ─────────────────── VisibilityChange Dinleyicisi ─────────────────── */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    if (gameLoop) {
      clearInterval(gameLoop);
      gameLoop = null;
    }
  } else {
    processOfflineProgress();
    if (!gameLoop) {
      gameLoop = window.setInterval(produce, TICK_MS);
    }
  }
});
