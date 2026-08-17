/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      MUTLULUK CHIP ARAYÜZÜ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { RESOURCES } from "./resources.js";
import {
  getPopulationSatisfaction,
  getPopulationDeficiency,
  getHappinessBreakdown,
  getMigrationInterval,
  getArrivalDuration,
  onChange,
} from "./game-state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     MUTLULUK ÇİP OLUŞTURUCU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Mutluluk Çip Bileşeni ─────────────────── */

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

  const posSec = createHappinessSection("Mutluluğu Artıranlar");
  const negSec = createHappinessSection("Mutluluğu Düşürenler");

  const info = document.createElement("div");
  info.className = "happiness-info";
  const infoText = document.createElement("span");
  info.appendChild(infoText);

  tooltip.append(title, posSec.section, negSec.section, info);
  el.appendChild(tooltip);

  let active = false;

  el.addEventListener("mouseenter", () => {
    active = true;
    refresh();
  });

  el.addEventListener("mouseleave", () => {
    active = false;
    tooltip.hidden = true;
  });

  el.addEventListener("focus", () => {
    active = true;
    refresh();
  });

  el.addEventListener("blur", () => {
    active = false;
    tooltip.hidden = true;
  });

  function refresh() {
    const satisfaction = getPopulationSatisfaction();
    const { items, target } = getHappinessBreakdown();

    title.textContent = "😊 Mutluluk " + Math.round(satisfaction) + " / Hedef " + Math.round(target);

    fillHappinessList(posSec, items.filter((i) => i.delta > 0));
    fillHappinessList(negSec, items.filter((i) => i.delta < 0));

    const deficiency = getPopulationDeficiency();
    const parts = [];
    if (deficiency > 0.05) parts.push("⚠️ Temel ihtiyaç açığı: nüfus risk altında");
    parts.push("🚶 Göç: ~" + getMigrationInterval() + " sn / kişi · Varış ~" + getArrivalDuration() + " sn");
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    MUTLULUK BÖLÜMÜ OLUŞTURUCU                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
    val.textContent = (item.delta >= 0 ? "+" : "−") + Math.abs(item.delta);

    row.append(label, val);
    sec.list.appendChild(row);
  }

  sec.section.hidden = items.length === 0;
}
