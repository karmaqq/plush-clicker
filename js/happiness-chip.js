/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      MUTLULUK CHIP ARAYÜZÜ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { RESOURCES } from "./resources.js";
import {
  getPopulationSatisfaction,
  getPopulationDeficiency,
  getHappinessBreakdown,
  getMigrationInterval,
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

    title.textContent = "😊 Mutluluk " + Math.round(satisfaction);

    const deductions = items.filter((i) => !i.met);
    const metItems = items.filter((i) => i.met);

    fillHappinessList(posSec, metItems);
    fillHappinessList(negSec, deductions);

    const deficiency = getPopulationDeficiency();
    const parts = [];
    parts.push("🚶 Göçmen Gelişi: ~" + getMigrationInterval() + " saniye");
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
