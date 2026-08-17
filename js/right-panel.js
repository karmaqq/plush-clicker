/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      SAĞ PANEL İSKELETİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { INDUSTRY_DATA } from "./industry.js";
import { createIndustryCard } from "./industry-card.js";
import { createTradeSection } from "./trade-section.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       SAĞ PANEL OLUŞTURUCU                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Sağ Panel Bileşeni ─────────────────── */

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
