/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          CIP ARAYUZLERI                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  formatCount,
  formatNumber,
  formatDuration,
  strong,
  badge,
  resetResourceClass,
  animateCounter,
  canAfford,
  triggerShake,
} from "./utils.js";
import { createTooltip } from "./tooltip.js";
import {
  RESOURCES,
  BUILDINGS_DATA,
  HOUSING_DATA,
} from "./game-data.js";
import {
  state,
  getResource,
  getResourceCapacity,
  getTotalProduction,
  getResourceConsumption,
  getBuildingCount,
  getBuildingCost,
  getSellPrice,
  isSellable,
  getAutoSell,
  toggleAutoSell,
  sellOne,
  getNetRate,
  getSeasonMultiplier,
  getPower,
  getPackCount,
  getWorkerCount,
  getIndustryOutput,
  getSeason,
  getSeasonTimer,
  getUnlock,
  buyBuilding,
  getAltin,
  getPopulationAlive,
  getEra,
  isEraTransitioning,
  onChange,
} from "./game-core.js";
import {
  getPopulationCurrent,
  getPopulationCapacity,
  getPopulationMigrants,
  getMigrantQueue,
  getArrivalDuration,
  getPopulationSatisfaction,
  getPopulationDeficiency,
  getHappinessBreakdown,
  getMigrationInterval,
} from "./population.js";
import {
  getResourceName as getEraResourceName,
  getResourceEmoji as getEraResourceEmoji,
  getBuildingName as getEraBuildingName,
  ERA_DATA,
  getGoldLabel,
} from "./era.js";
import { buildBuildingTooltip, refreshBuildingTooltip, tooltip as buildingTooltip } from "./ui-cards.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       ALTIN CIP ARAYUZU                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function createGoldChip() {
  const el = document.createElement("div");
  el.className = "gold-chip";
  el.tabIndex = 0;
  const icon = document.createElement("span");
  icon.textContent = "🪙";
  const value = document.createElement("span");
  value.className = "header-stat-value";
  el.append(icon, value);
  const tooltip = document.createElement("div");
  tooltip.className = "gold-tooltip";
  tooltip.hidden = true;
  const title = document.createElement("div");
  title.className = "gold-tooltip-title";
  const industryRow = createGoldRow("Sanayi üretimi");
  const sellRow = createGoldRow("Otomatik satış");
  const divider = document.createElement("div");
  divider.className = "tt-divider";
  const netRow = createGoldRow("Net");
  tooltip.append(title, industryRow.row, sellRow.row, divider, netRow.row);
  el.appendChild(tooltip);
  let active = false;
  el.addEventListener("mouseenter", () => { active = true; refresh(); });
  el.addEventListener("mouseleave", () => { active = false; tooltip.hidden = true; });
  el.addEventListener("focus", () => { active = true; refresh(); });
  el.addEventListener("blur", () => { active = false; tooltip.hidden = true; });
  function refresh() {
    const gold = getAltin();
    const goldLabel = getGoldLabel();
    title.textContent = " " + goldLabel + " " + formatCount(gold);
    const industryGold = getIndustryOutput("altin");
    if (industryGold > 0) {
      industryRow.row.hidden = false;
      industryRow.value.textContent = "+" + formatNumber(industryGold) + "/s";
      industryRow.value.style.color = "#7ee2a8";
    } else { industryRow.row.hidden = true; }
    const netRate = getNetRate("altin");
    let autoSellGold = 0;
    for (const rid of Object.keys(RESOURCES)) {
      if (!isSellable(rid)) continue;
      if (!getAutoSell(rid)) continue;
      const prod = getTotalProduction(rid);
      if (prod > 0) { autoSellGold += prod * getSellPriceCore(rid); }
    }
    if (autoSellGold > 0.001) {
      sellRow.row.hidden = false;
      sellRow.value.textContent = "+" + formatNumber(autoSellGold) + "/s";
      sellRow.value.style.color = "#7ee2a8";
    } else { sellRow.row.hidden = true; }
    divider.hidden = industryRow.row.hidden && sellRow.row.hidden;
    netRow.value.textContent = (netRate >= 0 ? "+" : "") + formatNumber(netRate) + "/s";
    netRow.value.style.color = netRate >= 0 ? "#7ee2a8" : "#ff8a8a";
    tooltip.hidden = false;
  }
  function update() {
    value.textContent = formatCount(getAltin());
    if (active) refresh();
  }
  onChange(update);
  update();
  return { el, update };
}

function createGoldRow(labelText) {
  const row = document.createElement("div");
  row.className = "gold-tooltip-row";
  const label = document.createElement("span");
  label.className = "tt-label";
  label.textContent = labelText;
  const value = document.createElement("span");
  value.className = "tt-value";
  row.append(label, value);
  return { row, value };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      MUTLULUK CIP ARAYUZU                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function createHappinessChip() {
  const el = document.createElement("div");
  el.className = "happiness-chip";
  el.tabIndex = 0;
  const icon = document.createElement("span");
  icon.className = "happiness-chip-icon";
  icon.textContent = "🥳";
  const value = document.createElement("span");
  value.className = "header-stat-value";
  el.append(icon, value);
  const tooltip = document.createElement("div");
  tooltip.className = "happiness-tooltip";
  tooltip.hidden = true;
  const title = document.createElement("div");
  title.className = "happiness-title";
  const posSec = createHappinessSection("Memnuniyet Kaynakları");
  const negSec = createHappinessSection("Eksiklikler");
  const info = document.createElement("div");
  info.className = "happiness-info";
  const infoText = document.createElement("span");
  info.appendChild(infoText);
  const divider = document.createElement("div");
  divider.className = "tt-divider";
  tooltip.append(title, posSec.section, negSec.section, divider, info);
  el.appendChild(tooltip);
  let active = false;
  el.addEventListener("mouseenter", () => { active = true; refresh(); });
  el.addEventListener("mouseleave", () => { active = false; tooltip.hidden = true; });
  el.addEventListener("focus", () => { active = true; refresh(); });
  el.addEventListener("blur", () => { active = false; tooltip.hidden = true; });
  function refresh() {
    const satisfaction = getPopulationSatisfaction();
    const { items, target } = getHappinessBreakdown();
    title.textContent = " Mutluluk " + Math.round(satisfaction);
    const deductions = items.filter((i) => !i.met);
    const metItems = items.filter((i) => i.met);
    fillHappinessList(posSec, metItems);
    fillHappinessList(negSec, deductions);
    const deficiency = getPopulationDeficiency();
    const parts = [];
    parts.push(" Göçmen Gelişi: ~" + getMigrationInterval() + " saniye");
    if (deficiency > 0.05) parts.push("⚠️ Temel ihtiyaç açığı");
    infoText.textContent = parts.join("  ·  ");
    tooltip.hidden = false;
  }
  function update() {
    const satisfaction = getPopulationSatisfaction();
    value.textContent = String(Math.round(satisfaction));
    el.classList.toggle("warn", satisfaction < 50);
    if (active) refresh();
  }
  onChange(update);
  update();
  return { el, update };
}

function createHappinessSection(titleText) {
  const section = document.createElement("div");
  section.className = "happiness-sec";
  const heading = document.createElement("div");
  heading.className = "happiness-sec-title";
  heading.textContent = titleText;
  const list = document.createElement("div");
  list.className = "happiness-list";
  section.append(heading, list);
  return { section, list };
}

function fillHappinessList(sec, items) {
  while (sec.list.firstChild) sec.list.removeChild(sec.list.firstChild);
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "happiness-row";
    const label = document.createElement("span");
    label.className = "happiness-row-label";
    label.textContent = item.emoji + " " + item.label;
    const val = document.createElement("span");
    val.className = "happiness-row-value";
    if (item.delta === 0) {
      val.textContent = "✓";
      val.classList.add("happiness-met");
    } else {
      val.textContent = "−" + Math.abs(item.delta);
      val.classList.add("happiness-unmet");
    }
    row.append(label, val);
    sec.list.appendChild(row);
  }
  sec.section.hidden = items.length === 0;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       KONUT CIP ARAYUZU                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
  name.textContent = getEraBuildingName(id);
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
  let lastEra = state.era.current;
  function update() {
    const owned = getBuildingCount(id);
    const unlocked = getUnlock(data);
    const currentEra = state.era.current;
    if (currentEra !== lastEra) {
      lastEra = currentEra;
      name.textContent = getEraBuildingName(id);
    }
    el.classList.toggle("locked", !unlocked && owned === 0);
    const costObj = getBuildingCost(id);
    el.classList.toggle("affordable", canAfford(costObj, getResource));
    cap.textContent = "+" + formatCount(owned * data.housingCapacity);
    if (tooltipActive) { refreshBuildingTooltip(); }
  }
  onChange(update);
  update();
  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         CAG GOSTERGE Cipi                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

  const tooltip = document.createElement("div");
  tooltip.className = "era-tooltip";
  tooltip.hidden = true;
  const ttTitle = document.createElement("div");
  ttTitle.className = "era-tooltip-title";
  const ttPopRow = createEraTooltipRow(" Nüfus");
  const ttGoldRow = createEraTooltipRow(" Altın");
  const ttDivider = document.createElement("div");
  ttDivider.className = "tt-divider";
  const ttNextRow = document.createElement("div");
  ttNextRow.className = "era-tooltip-next";
  ttNextRow.hidden = true;
  tooltip.append(ttTitle, ttPopRow.row, ttGoldRow.row, ttDivider, ttNextRow);
  el.appendChild(tooltip);
  let tooltipActive = false;
  el.addEventListener("mouseenter", () => { tooltipActive = true; refreshTooltip(); tooltip.hidden = false; });
  el.addEventListener("mouseleave", () => { tooltipActive = false; tooltip.hidden = true; });

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
    } else { progressArea.hidden = true; }
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
      } else { ttNextRow.hidden = true; }
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

function getEraName(era) {
  const data = ERA_DATA[era];
  return data ? data.name : "Bilinmiyor";
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       MEVSIM CIP ARAYUZU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function createSeasonChip() {
  const el = document.createElement("div");
  el.className = "season-chip";
  el.tabIndex = 0;
  const icon = document.createElement("span");
  icon.className = "season-chip-icon";
  el.append(icon);
  const tooltip = document.createElement("div");
  tooltip.className = "season-tooltip";
  tooltip.hidden = true;
  const title = document.createElement("div");
  title.className = "season-tooltip-title";
  const list = document.createElement("div");
  list.className = "season-tooltip-list";
  tooltip.append(title, list);
  el.appendChild(tooltip);
  let active = false;
  el.addEventListener("mouseenter", () => { active = true; refresh(); });
  el.addEventListener("mouseleave", () => { active = false; tooltip.hidden = true; });
  el.addEventListener("focus", () => { active = true; refresh(); });
  el.addEventListener("blur", () => { active = false; tooltip.hidden = true; });
  function refresh() {
    const season = getSeason();
    const timer = getSeasonTimer();
    title.textContent = season.emoji + " " + season.name + "  · değişime " + Math.max(0, Math.ceil(timer)) + " sn";
    while (list.firstChild) list.removeChild(list.firstChild);
    const rows = [
      [" Su", season.modifiers.su],
      [" Yiyecek", season.modifiers.yiyecek],
      [" Taş", season.modifiers.tas],
      [" İpek", season.modifiers.ipek],
      [" Kültür", season.modifiers.kultur],
    ];
    for (const [label, value] of rows) {
      if (typeof value !== "number" || value === 1) continue;
      const row = document.createElement("div");
      row.className = "season-row";
      const labelEl = document.createElement("span");
      labelEl.className = "tt-label";
      labelEl.textContent = label;
      const valueEl = document.createElement("span");
      valueEl.className = "tt-value";
      valueEl.textContent = (value > 1 ? "+" : "") + (Math.round((value - 1) * 100)) + "%";
      valueEl.style.color = value > 1 ? "#7ee2a8" : "#ff9a5a";
      row.append(labelEl, valueEl);
      list.appendChild(row);
    }
    if (!list.firstChild) {
      const empty = document.createElement("div");
      empty.className = "season-row";
      empty.textContent = "Değişim yok";
      empty.style.color = "#667";
      list.appendChild(empty);
    }
    tooltip.hidden = false;
  }
  function update() {
    const season = getSeason();
    icon.textContent = season.emoji;
    if (active) refresh();
  }
  onChange(update);
  update();
  return { el, update };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       GOC SERIDI ARAYUZU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function createMigrationStrip() {
  const el = document.createElement("div");
  el.className = "migration-strip";
  function sync() {
    const queue = getMigrantQueue();
    const els = el.querySelectorAll(".migrant");
    const diff = queue.length - els.length;
    if (diff > 0) {
      for (let i = els.length; i < queue.length; i++) { spawnMigrant(el, queue[i].remaining); }
    } else if (diff < 0) {
      const removeCount = -diff;
      for (let i = 0; i < removeCount; i++) { els[i].remove(); }
    }
  }
  onChange(sync);
  sync();
  return { el, sync };
}

function spawnMigrant(strip, remaining) {
  const el = document.createElement("span");
  el.className = "migrant";
  el.textContent = "🚶";
  const startX = strip.querySelectorAll(".migrant").length * 1.4;
  el.style.left = startX + "px";
  strip.appendChild(el);
  const dist = Math.max(strip.clientWidth - startX, 1);
  const flipped = " scaleX(-1)";
  const duration = Math.max(0.1, Number.isFinite(remaining) ? remaining : getArrivalDuration());
  el.style.transition = "none";
  el.style.transform = "translateY(-50%)" + flipped;
  void el.offsetWidth;
  el.style.transition = "transform " + duration + "s linear";
  el.style.transform = "translate(" + dist + "px, -50%)" + flipped;
  setTimeout(() => el.remove(), (duration + 0.5) * 1000);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         NUFUS BLOGU ARAYUZU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       KAYNAK KAROSU ARAYUZU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

const resourceTooltip = createTooltip("resource-tooltip");
const tooltipLive = { id: null, capEl: null, timeEl: null, totalEl: null, consEl: null, sellEl: null, sellRow: null, seasonRow: null, seasonEl: null };

export function createResourceTile(id) {
  const meta = RESOURCES[id];
  const sellable = isSellable(id);
  const element = document.createElement("div");
  element.className = "resource-tile resource-" + id;
  element.hidden = true;
  const head = document.createElement("div");
  head.className = "resource-tile-head";
  const emoji = document.createElement("span");
  emoji.className = "resource-tile-emoji";
  emoji.textContent = getEraResourceEmoji(id);
  const name = document.createElement("span");
  name.className = "resource-tile-name";
  name.textContent = getEraResourceName(id);
  const production = document.createElement("span");
  production.className = "resource-bar-production";
  head.append(emoji, name, production);
  const bar = document.createElement("div");
  bar.className = "resource-bar-track";
  const fill = document.createElement("div");
  fill.className = "resource-bar-fill";
  bar.appendChild(fill);
  const foot = document.createElement("div");
  foot.className = "resource-tile-foot";
  const capLabel = document.createElement("span");
  capLabel.className = "resource-tile-cap";
  foot.append(capLabel);
  let autoSellBtn = null;
  let sellOneBtn = null;
  if (sellable) {
    autoSellBtn = document.createElement("button");
    autoSellBtn.type = "button";
    autoSellBtn.className = "auto-sell-btn";
    autoSellBtn.textContent = "⟳";
    autoSellBtn.title = "Otomatik satış";
    autoSellBtn.addEventListener("click", () => toggleAutoSell(id));
    sellOneBtn = document.createElement("button");
    sellOneBtn.type = "button";
    sellOneBtn.className = "sell-one-btn";
    sellOneBtn.textContent = "1";
    sellOneBtn.title = "1 birim sat";
    sellOneBtn.addEventListener("click", () => {
      if (sellOne(id)) {
        sellOneBtn.classList.add("sold-flash");
        setTimeout(() => sellOneBtn.classList.remove("sold-flash"), 300);
      }
    });
    foot.append(autoSellBtn, sellOneBtn);
  }
  element.append(head, bar, foot);
  element.addEventListener("mouseenter", () => { buildResourceTooltip(id); resourceTooltip.show(element); });
  element.addEventListener("mouseleave", () => { tooltipLive.id = null; resourceTooltip.hide(); });
  let lastCapText = null;
  let lastFillPct = null;
  let lastProdText = null;
  let lastNetNegative = null;
  function update(snapshot) {
    const current = getResource(id);
    const capacity = snapshot ? snapshot.derived[id].capacity : getResourceCapacity(id);
    const productionValue = snapshot ? snapshot.derived[id].production : getTotalProduction(id);
    const consumptionValue = snapshot ? snapshot.derived[id].consumption : getResourceConsumption(id);
    const net = productionValue - consumptionValue;
    emoji.textContent = getEraResourceEmoji(id);
    name.textContent = getEraResourceName(id);
    const active = productionValue > 0 || current > 0;
    if (element.hidden === active) { element.hidden = !active; }
    if (!active) {
      lastCapText = null; lastFillPct = null; lastProdText = null; lastNetNegative = null;
      return;
    }
    const netNegative = consumptionValue > productionValue && (productionValue > 0 || current > 0);
    if (netNegative !== lastNetNegative) { lastNetNegative = netNegative; element.classList.toggle("net-negative", netNegative); }
    const capText = formatCount(current);
    if (capText !== lastCapText) { lastCapText = capText; capLabel.textContent = capText; }
    const pct = capacity > 0 ? (current / capacity) * 100 : 0;
    const pctClamped = Math.min(pct, 100);
    if (pctClamped !== lastFillPct) { lastFillPct = pctClamped; fill.style.width = pctClamped + "%"; fill.style.background = getBarColor(id, pctClamped); }
    const prodText = net > 0 ? "+" + formatNumber(net) + "/s" : net < 0 ? "−" + formatNumber(-net) + "/s" : "";
    if (prodText !== lastProdText) { lastProdText = prodText; production.textContent = prodText; }
    if (sellable) {
      autoSellBtn.classList.toggle("auto-on", getAutoSell(id));
      autoSellBtn.title = getAutoSell(id) ? "Otomatik satış: AÇIK" : "Otomatik satış: KAPALI";
    }
  }
  function drain(duration) {
    return new Promise((resolve) => {
      const fromVal = getResource(id);
      if (fromVal <= 0) { capLabel.textContent = "0"; fill.style.width = "0%"; element.classList.add("drain-done"); resolve(); return; }
      element.classList.add("draining");
      animateCounter(fromVal, 0, duration || 800, (v) => {
        capLabel.textContent = formatCount(v);
        const capacity = getResourceCapacity(id);
        const pct = capacity > 0 ? Math.min((v / capacity) * 100, 100) : 0;
        fill.style.width = pct + "%";
      }).then(() => {
        element.classList.remove("draining");
        element.classList.add("drain-done");
        resolve();
      });
    });
  }
  element.__tileObj = { element, update, drain };
  return { element, update, drain };
}

function buildResourceTooltip(id) {
  const meta = RESOURCES[id];
  const sellable = isSellable(id);
  resetResourceClass(resourceTooltip.element, id);
  resourceTooltip.element.textContent = "";
  const title = document.createElement("div");
  title.className = "tt-title";
  title.append(getEraResourceEmoji(id) + " ", getEraResourceName(id));
  resourceTooltip.element.appendChild(title);
  const cap = document.createElement("div");
  cap.className = "tt-cap";
  const capStrong = strong("");
  const timeEl = document.createElement("span");
  timeEl.className = "tt-time";
  timeEl.hidden = true;
  cap.append("Depo: ", capStrong, " ", timeEl);
  resourceTooltip.element.appendChild(cap);
  const capDivider = document.createElement("div");
  capDivider.className = "tt-divider";
  resourceTooltip.element.appendChild(capDivider);
  const seasonRow = document.createElement("div");
  seasonRow.className = "tt-row tt-season";
  seasonRow.hidden = true;
  const seasonEl = document.createElement("strong");
  seasonEl.className = "season-up";
  seasonRow.append("Mevsim: ", seasonEl);
  resourceTooltip.element.appendChild(seasonRow);
  const buildingRows = [];
  for (const bid of Object.keys(BUILDINGS_DATA)) {
    const b = BUILDINGS_DATA[bid];
    if (b.type !== "producer" || b.outputResource !== id) continue;
    const count = getBuildingCount(bid);
    if (count <= 0) continue;
    buildingRows.push({ bid, b, count, total: count * b.production });
  }
  if (buildingRows.length) {
    for (const r of buildingRows) {
      const row = document.createElement("div");
      row.className = "tt-row";
      row.append(badge(r.count), getEraBuildingName(r.bid) + ":", strong("+" + formatNumber(r.total) + "/s"));
      resourceTooltip.element.appendChild(row);
    }
  }
  const bonusRows = [];
  for (const bid of Object.keys(BUILDINGS_DATA)) {
    const b = BUILDINGS_DATA[bid];
    if (b.type !== "bonus" || b.targetResource !== id) continue;
    const count = getBuildingCount(bid);
    if (count <= 0) continue;
    bonusRows.push({ bid, b, count, info: "%" + Math.round(count * b.bonusPerLevel * 100) });
  }
  if (bonusRows.length) {
    for (const r of bonusRows) {
      const row = document.createElement("div");
      row.className = "tt-row";
      row.append(badge(r.count), getEraBuildingName(r.bid) + " ", strong(r.info));
      resourceTooltip.element.appendChild(row);
    }
  }
  const hasBuildingRows = buildingRows.length > 0 || bonusRows.length > 0;
  const seasonMult = getSeasonMultiplier(id);
  const hasSeasonRow = seasonMult !== 1;
  capDivider.hidden = false;
  const divider = document.createElement("div");
  divider.className = "tt-divider";
  divider.hidden = !hasBuildingRows;
  resourceTooltip.element.appendChild(divider);
  const sellRow = document.createElement("div");
  sellRow.className = "tt-total";
  const sellStrong = strong("");
  sellRow.append("Satış Fiyatı: ", sellStrong);
  sellRow.hidden = !sellable;
  resourceTooltip.element.appendChild(sellRow);
  const totalRow = document.createElement("div");
  totalRow.className = "tt-total";
  const totalStrong = strong("");
  totalRow.append("Üretim: ", totalStrong);
  resourceTooltip.element.appendChild(totalRow);
  const consRow = document.createElement("div");
  consRow.className = "tt-total";
  const consStrong = strong("");
  consRow.append("Tüketim: ", consStrong);
  resourceTooltip.element.appendChild(consRow);
  tooltipLive.id = id;
  tooltipLive.capEl = capStrong;
  tooltipLive.timeEl = timeEl;
  tooltipLive.totalEl = totalStrong;
  tooltipLive.consEl = consStrong;
  tooltipLive.sellEl = sellStrong;
  tooltipLive.sellRow = sellRow;
  tooltipLive.seasonRow = seasonRow;
  tooltipLive.seasonEl = seasonEl;
  refreshResourceTooltip();
}

function refreshResourceTooltip(snapshot) {
  if (tooltipLive.id == null) return;
  const id = tooltipLive.id;
  const current = getResource(id);
  const capacity = snapshot ? snapshot.derived[id].capacity : getResourceCapacity(id);
  const productionValue = snapshot ? snapshot.derived[id].production : getTotalProduction(id);
  const consumptionValue = snapshot ? snapshot.derived[id].consumption : getResourceConsumption(id);
  tooltipLive.capEl.textContent = formatCount(current) + " / " + formatCount(capacity);
  tooltipLive.totalEl.textContent = "+" + formatNumber(productionValue) + "/s";
  tooltipLive.consEl.textContent = consumptionValue > 0 ? "−" + formatNumber(consumptionValue) + "/s" : "−";
  tooltipLive.sellRow.hidden = !isSellable(id);
  tooltipLive.sellEl.textContent = formatCount(getSellPrice(id)) + " ";
  const seasonMult = getSeasonMultiplier(id);
  tooltipLive.seasonRow.hidden = seasonMult === 1;
  if (seasonMult !== 1) {
    const pct = (seasonMult - 1) * 100;
    tooltipLive.seasonEl.textContent = (pct >= 0 ? "+" : "−") + Math.round(Math.abs(pct)) + "%";
    tooltipLive.seasonEl.className = pct >= 0 ? "season-up" : "season-down";
  }
  const net = snapshot ? snapshot.derived[id].net : getNetRate(id);
  const remaining = capacity - current;
  if (Number.isFinite(capacity) && remaining > 0.5 && net > 0.0001) {
    tooltipLive.timeEl.textContent = formatDuration(remaining / net);
    tooltipLive.timeEl.hidden = false;
  } else { tooltipLive.timeEl.hidden = true; }
}

function getBarColor(id, pct) {
  const meta = RESOURCES[id];
  if (pct >= 85) return "linear-gradient(90deg, #8f2d2d, #ff5a5a)";
  return "linear-gradient(90deg, " + meta.colorDark + ", " + meta.colorBright + ")";
}
