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
  isResourceFull,
  getTotalProduction,
  getResourceConsumption,
  getBuildingCount,
  getBuildingCost,
  getSellPrice,
  isSellable,
  sellOne,
  getNetRate,
  getSeasonMultiplier,
  getWorkerCount,
  getIndustryOutput,
  getSeason,
  getSeasonTimer,
  getUnlock,
  buyBuilding,
  getAltin,
  getPopulationAlive,
  getEra,
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
  getWageRate,
  getAutoSellBreakdown,
} from "./population.js";
import {
  getResourceName as getEraResourceName,
  getResourceEmoji as getEraResourceEmoji,
  getBuildingName as getEraBuildingName,
  getGoldLabel,
  ERA_DATA,
  ERA_CHIP_POP_THRESHOLD,
} from "./era.js";
import { buildBuildingTooltip, refreshBuildingTooltip, tooltip as buildingTooltip } from "./ui-cards.js";
import { setManualHighlight, clearManualHighlight } from "./highlight.js";

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
  el.append(icon, value);
  const tooltip = createTooltip("gold-tooltip");
  const title = document.createElement("div");
  title.className = "tt-heading";
  tooltip.element.appendChild(title);
  const sellRow = createGoldRow("Otomatik satış:");
  const sellDetail = document.createElement("div");
  sellDetail.className = "tt-subs";
  const sellDivider = document.createElement("div");
  sellDivider.className = "tt-divider";
  const industryRow = createGoldRow("Darphane:");
  const wageDivider = document.createElement("div");
  wageDivider.className = "tt-divider";
  const wageRow = createGoldRow("İşçi maaşları:");
  const divider = document.createElement("div");
  divider.className = "tt-divider";
  const netRow = createGoldRow("Net:");
  tooltip.element.append(
    title,
    sellRow.row,
    sellDetail,
    sellDivider,
    industryRow.row,
    wageDivider,
    wageRow.row,
    divider,
    netRow.row,
  );
  let active = false;
  el.addEventListener("mouseenter", () => { active = true; refresh(); tooltip.show(el); });
  el.addEventListener("mouseleave", () => { active = false; tooltip.hide(); });
  el.addEventListener("focus", () => { active = true; refresh(); tooltip.show(el); });
  el.addEventListener("blur", () => { active = false; tooltip.hide(); });
  function setRow(row, rate) {
    const visible = Math.abs(rate) > 0.0001;
    row.row.hidden = !visible;
    if (!visible) return;
    row.value.textContent = (rate >= 0 ? "+" : "−") + formatNumber(Math.abs(rate)) + "/s";
    row.value.classList.toggle("tt-pos", rate >= 0);
    row.value.classList.toggle("tt-neg", rate < 0);
  }
  function renderSellDetail(breakdown) {
    sellDetail.textContent = "";
    const ids = Object.keys(breakdown);
    sellDetail.hidden = ids.length === 0;
    for (const rid of ids) {
      const row = document.createElement("div");
      row.className = "tt-subrow";
      const label = document.createElement("span");
      label.textContent = "↳ " + getEraResourceEmoji(rid) + " " + getEraResourceName(rid);
      const value = document.createElement("span");
      value.className = "tt-pos";
      value.textContent = "+" + formatNumber(breakdown[rid]) + "/s";
      row.append(label, value);
      sellDetail.appendChild(row);
    }
  }
  function refresh() {
    title.textContent = getGoldLabel() + " Akışı";
    const industryGold = getIndustryOutput("altin");
    const { breakdown, total: autoSellGold } = getAutoSellBreakdown();
    const wageRate = getWageRate();
    setRow(industryRow, industryGold);
    setRow(sellRow, autoSellGold);
    renderSellDetail(breakdown);
    setRow(wageRow, -wageRate);
    sellDivider.hidden = sellRow.row.hidden && industryRow.row.hidden;
    wageDivider.hidden = industryRow.row.hidden;
    const netRate = industryGold + autoSellGold - wageRate;
    netRow.value.textContent = (netRate >= 0 ? "+" : "−") + formatNumber(Math.abs(netRate)) + "/s";
    netRow.value.classList.toggle("tt-pos", netRate >= 0);
    netRow.value.classList.toggle("tt-neg", netRate < 0);
  }
  function update() {
    value.textContent = formatCount(getAltin());
    if (active) refresh();
  }
  setInterval(update, 1000);
  update();
  return { el, update };
}

function createGoldRow(labelText) {
  const row = document.createElement("div");
  row.className = "tt-line";
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
  el.append(icon, value);
  const tooltip = createTooltip("happiness-tooltip");
  const title = document.createElement("div");
  title.className = "tt-heading";
  const posSec = createHappinessSection("Memnuniyet Kaynakları");
  const negSec = createHappinessSection("Eksiklikler");
  const info = document.createElement("div");
  info.className = "tt-note";
  const infoText = document.createElement("span");
  info.appendChild(infoText);
  const divider = document.createElement("div");
  divider.className = "tt-divider";
  tooltip.element.append(title, posSec.section, negSec.section, divider, info);
  let active = false;
  function refreshDeficitHighlight() {
    const { items } = getHappinessBreakdown();
    setManualHighlight(items.filter((i) => !i.met && i.resId).map((i) => i.resId));
  }
  el.addEventListener("mouseenter", () => { active = true; refresh(); refreshDeficitHighlight(); tooltip.show(el); });
  el.addEventListener("mouseleave", () => { active = false; tooltip.hide(); clearManualHighlight(); });
  el.addEventListener("focus", () => { active = true; refresh(); refreshDeficitHighlight(); tooltip.show(el); });
  el.addEventListener("blur", () => { active = false; tooltip.hide(); clearManualHighlight(); });
  function refresh() {
    const satisfaction = getPopulationSatisfaction();
    const { items, target } = getHappinessBreakdown();
    title.textContent = "Mutluluk " + Math.round(satisfaction);
    const deductions = items.filter((i) => !i.met);
    const metItems = items.filter((i) => i.met);
    fillHappinessList(posSec, metItems);
    fillHappinessList(negSec, deductions);
    const deficiency = getPopulationDeficiency();
    const parts = [];
    parts.push("Göçmen Gelişi: ~" + getMigrationInterval() + " saniye");
    if (deficiency > 0.05) parts.push("⚠️ Temel ihtiyaç açığı");
    infoText.textContent = parts.join("  ·  ");
  }
  function update() {
    const alive = getPopulationAlive();
    el.hidden = alive <= 0;
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
  list.className = "tt-list";
  section.append(heading, list);
  return { section, list };
}

function fillHappinessList(sec, items) {
  while (sec.list.firstChild) sec.list.removeChild(sec.list.firstChild);
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "tt-line";
    const label = document.createElement("span");
    label.className = "tt-line-label";
    label.textContent = item.emoji + " " + item.label;
    const val = document.createElement("span");
    val.className = "tt-line-value";
    if (item.delta === 0) {
      val.textContent = "✓";
      val.classList.add("tt-met");
    } else {
      val.textContent = "−" + Math.abs(item.delta);
      val.classList.add("tt-unmet");
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
  el.dataset.hlCost = "building:" + id;
  el.dataset.hlWithPop = "1";
  el.dataset.hlTargetHousing = "1";
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
  el.tabIndex = 0;
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

  const tooltip = createTooltip("era-tooltip");
  const ttTitle = document.createElement("div");
  ttTitle.className = "tt-heading";
  const ttPopRow = createEraTooltipRow("Nüfus:");
  const ttGoldRow = createEraTooltipRow("Altın:");
  const ttDivider = document.createElement("div");
  ttDivider.className = "tt-divider";
  const ttNextRow = document.createElement("div");
  ttNextRow.className = "tt-note";
  ttNextRow.hidden = true;
  tooltip.element.append(ttTitle, ttPopRow.row, ttGoldRow.row, ttDivider, ttNextRow);
  let tooltipActive = false;
  el.addEventListener("mouseenter", () => { tooltipActive = true; refreshTooltip(); tooltip.show(el); });
  el.addEventListener("mouseleave", () => { tooltipActive = false; tooltip.hide(); });
  el.addEventListener("focus", () => { tooltipActive = true; refreshTooltip(); tooltip.show(el); });
  el.addEventListener("blur", () => { tooltipActive = false; tooltip.hide(); });

  function update() {
    el.hidden = getPopulationAlive() < ERA_CHIP_POP_THRESHOLD;
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
      } else {
        progressFill.classList.remove("era-bar-ready");
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
      ttPopRow.value.classList.remove("tt-gold");
      ttPopRow.value.classList.toggle("tt-pos", popCurrent >= popTarget);
      ttGoldRow.value.textContent = formatCount(goldCurrent) + " / " + formatCount(goldTarget);
      ttGoldRow.value.classList.toggle("tt-pos", goldCurrent >= goldTarget);
      const nextData = data.next ? ERA_DATA[data.next] : null;
      if (nextData) {
        ttNextRow.hidden = false;
        ttNextRow.textContent = "Sonraki çağ: " + nextData.name;
      } else { ttNextRow.hidden = true; }
    } else {
      ttPopRow.value.textContent = "Son çağ";
      ttPopRow.value.classList.remove("tt-pos");
      ttPopRow.value.classList.add("tt-gold");
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
  row.className = "tt-line";
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
  el.dataset.hlSeason = "1";
  const icon = document.createElement("span");
  icon.className = "season-chip-icon";
  el.append(icon);
  const tooltip = createTooltip("season-tooltip");
  const title = document.createElement("div");
  title.className = "tt-heading";
  const list = document.createElement("div");
  list.className = "tt-list";
  tooltip.element.append(title, list);
  let active = false;
  el.addEventListener("mouseenter", () => { active = true; refresh(); tooltip.show(el); });
  el.addEventListener("mouseleave", () => { active = false; tooltip.hide(); });
  el.addEventListener("focus", () => { active = true; refresh(); tooltip.show(el); });
  el.addEventListener("blur", () => { active = false; tooltip.hide(); });
  function refresh() {
    const season = getSeason();
    const timer = getSeasonTimer();
    title.textContent = season.emoji + " " + season.name + " · değişime " + Math.max(0, Math.ceil(timer)) + " sn";
    while (list.firstChild) list.removeChild(list.firstChild);
    const rows = [
      ["Su", season.modifiers.su],
      ["Yiyecek", season.modifiers.yiyecek],
      ["Taş", season.modifiers.tas],
      ["İpek", season.modifiers.ipek],
      ["Kültür", season.modifiers.kultur],
    ];
    for (const [label, value] of rows) {
      if (typeof value !== "number" || value === 1) continue;
      const row = document.createElement("div");
      row.className = "tt-line";
      const labelEl = document.createElement("span");
      labelEl.className = "tt-label";
      labelEl.textContent = label;
      const valueEl = document.createElement("span");
      valueEl.className = "tt-value";
      valueEl.textContent = (value > 1 ? "+" : "") + (Math.round((value - 1) * 100)) + "%";
      valueEl.classList.toggle("tt-pos", value > 1);
      valueEl.classList.toggle("tt-neg", value <= 1);
      row.append(labelEl, valueEl);
      list.appendChild(row);
    }
    if (!list.firstChild) {
      const empty = document.createElement("div");
      empty.className = "tt-line tt-muted";
      empty.textContent = "Değişim yok";
      list.appendChild(empty);
    }
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
  el.dataset.hlTargetPop = "1";
  const count = document.createElement("span");
  count.className = "pop-count";
  const current = document.createElement("span");
  current.className = "pop-current";
  const cap = document.createElement("span");
  cap.className = "pop-cap";
  count.append("👥 ", current, " / ", cap);
  const tooltip = createTooltip("pop-tooltip");
  const title = document.createElement("div");
  title.className = "tt-heading";
  title.textContent = "Nüfus";
  tooltip.element.appendChild(title);
  const rows = {};
  const rowDefs = [
    ["Kapasite:", "cap", "#8895a3"],
    ["Nüfus:", "pop", "#ffffff"],
    ["Çalışan:", "workers", "#7fb2e0"],
    ["Boşta:", "idle", "#7ee2a8"],
    ["Göçmen:", "migrants", "#e8b46a"],
  ];
  for (const [label, key, color] of rowDefs) {
    const row = document.createElement("div");
    row.className = "tt-line";
    const labelEl = document.createElement("span");
    labelEl.className = "tt-label";
    labelEl.textContent = label;
    const valueEl = document.createElement("span");
    valueEl.className = "tt-value";
    valueEl.style.color = color;
    row.append(labelEl, valueEl);
    rows[key] = valueEl;
    tooltip.element.appendChild(row);
  }
  el.append(count);
  el.addEventListener("mouseenter", () => tooltip.show(el));
  el.addEventListener("mouseleave", () => tooltip.hide());
  el.addEventListener("focus", () => tooltip.show(el));
  el.addEventListener("blur", () => tooltip.hide());
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

export function createResourceTile(id, options = {}) {
  const meta = RESOURCES[id];
  const sellable = isSellable(id);
  const noBar = !!options.noBar;
  const element = document.createElement("div");
  element.className = "resource-tile resource-" + id + (noBar ? " no-bar" : "");
  element.dataset.resId = id;
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
  let sellOneBtn = null;
  if (sellable) {
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
    foot.append(sellOneBtn);
  }
  element.append(head);
  if (!noBar) element.append(bar);
  element.append(foot);
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
    if (active && element.classList.contains("drain-done")) {
      element.classList.remove("drain-done");
    }
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
      sellOneBtn.disabled = getResource(id) < 1;
    }
    if (tooltipLive.id === id) { refreshResourceTooltip(snapshot); }
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
  const sellDivider = document.createElement("div");
  sellDivider.className = "tt-divider";
  resourceTooltip.element.appendChild(sellDivider);
  const sellRow = document.createElement("div");
  sellRow.className = "tt-total";
  const sellLabel = document.createElement("span");
  sellLabel.className = "tt-unsellable";
  sellLabel.textContent = "Satılamaz";
  sellLabel.hidden = true;
  const sellStrong = strong("");
  sellStrong.classList.add("tt-gold");
  sellRow.append(sellLabel, sellStrong);
  resourceTooltip.element.appendChild(sellRow);
  tooltipLive.id = id;
  tooltipLive.capEl = capStrong;
  tooltipLive.timeEl = timeEl;
  tooltipLive.totalEl = totalStrong;
  tooltipLive.consEl = consStrong;
  tooltipLive.sellEl = sellStrong;
  tooltipLive.sellRow = sellRow;
  tooltipLive.sellDivider = sellDivider;
  tooltipLive.sellLabel = sellLabel;
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
  const sellable = isSellable(id);
  tooltipLive.sellLabel.hidden = sellable;
  tooltipLive.sellEl.hidden = !sellable;
  tooltipLive.sellEl.textContent = sellable ? "🪙 " + formatCount(getSellPrice(id)) : "";
  const seasonMult = getSeasonMultiplier(id);
  tooltipLive.seasonRow.hidden = seasonMult === 1;
  if (seasonMult !== 1) {
    const pct = (seasonMult - 1) * 100;
    tooltipLive.seasonEl.textContent = (pct >= 0 ? "+" : "−") + Math.round(Math.abs(pct)) + "%";
    tooltipLive.seasonEl.className = pct >= 0 ? "season-up" : "season-down";
  }
  const net = snapshot ? snapshot.derived[id].net : getNetRate(id);
  const remaining = capacity - current;
  if (!Number.isFinite(capacity)) {
    tooltipLive.timeEl.hidden = true;
  } else if (net > 0.0001) {
    if (isResourceFull(id)) {
      tooltipLive.timeEl.textContent = "Depo Dolu";
    } else {
      tooltipLive.timeEl.textContent = formatDuration(remaining / net);
    }
    tooltipLive.timeEl.hidden = false;
  } else if (net < -0.0001 && current > 0) {
    tooltipLive.timeEl.textContent = formatDuration(current / -net);
    tooltipLive.timeEl.hidden = false;
  } else {
    tooltipLive.timeEl.hidden = true;
  }
}

function getBarColor(id, pct) {
  const meta = RESOURCES[id];
  if (pct >= 85) return "linear-gradient(90deg, #8f2d2d, #ff5a5a)";
  return "linear-gradient(90deg, " + meta.colorDark + ", " + meta.colorBright + ")";
}
