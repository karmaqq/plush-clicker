/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     ÇAĞ GEÇİŞ ANİMASYONU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { state, listeners } from "./state.js";
import { ERA_DATA, TRANSITION_DATA, getEraName } from "./era.js";
import { setTheme, showFlash, showBadge, createSparkles, showToast } from "./theme-transition.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    ÇAĞ GEÇİŞ ANİMASYON AKIŞI                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Geçiş Tetikleyicisi ─────────────────── */

export function triggerEraTransition(targetEra) {
  if (state.era.transitioning) return false;

  const currentEra = state.era.current;
  const eraData = ERA_DATA[currentEra];
  if (!eraData) return false;

  const nextEra = targetEra ?? eraData.next;
  if (nextEra === null || nextEra === currentEra) return false;

  const tData = TRANSITION_DATA[currentEra + "_" + nextEra] || TRANSITION_DATA[currentEra];
  if (!tData) return false;

  state.era.transitioning = true;

  const altinAmount = state.resources.altin || 0;
  const korunanAltin = Math.floor(altinAmount * 0.5);

  runTransition(currentEra, nextEra, tData, korunanAltin);

  return true;
}

/* ─────────────────── Geçiş Akışı Orkestratörü ─────────────────── */

async function runTransition(fromEra, toEra, tData, korunanAltin) {
  showToast("Çağ değişiyor...", "⏳");

  await demolishAllBuildings();

  const buildingIds = Object.keys(state.buildings);
  for (const id of buildingIds) {
    state.buildings[id] = 0;
  }

  await Promise.all([
    drainAllResources(),
    performThemeTransition(toEra, tData),
  ]);

  for (const id of Object.keys(state.resources)) {
    state.resources[id] = 0;
  }
  state.resources.altin = korunanAltin;
  state.resources.power = 40;
  state.era.current = toEra;
  state.era.transitioning = false;

  for (const fn of listeners) fn(state);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    FAZE 1: BİNA SÖKÜM ANİMASYONU                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Toplu Bina Sökümü ─────────────────── */

function demolishAllBuildings() {
  return new Promise((resolve) => {
    const cards = document.querySelectorAll(".building-card:not(.demolished):not(.locked)");
    if (cards.length === 0) { resolve(); return; }

    let completed = 0;
    const total = cards.length;
    const step = 60;

    cards.forEach((card, i) => {
      setTimeout(() => {
        card.classList.add("demolishing");
        card.addEventListener("animationend", () => {
          card.classList.remove("demolishing");
          card.classList.add("demolished");
          completed++;
          if (completed >= total) resolve();
        }, { once: true });
      }, i * step);
    });

    setTimeout(() => {
      if (completed < total) resolve();
    }, total * step + 500);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    FAZE 2: KAYNAK DRAIN ANİMASYONU                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Toplu Kaynak Düşürme ─────────────────── */

function drainAllResources() {
  return new Promise((resolve) => {
    const tiles = document.querySelectorAll(".resource-tile:not(.drain-done)");
    if (tiles.length === 0) { resolve(); return; }

    let completed = 0;
    const total = tiles.length;

    tiles.forEach((tile) => {
      const tileObj = findTileObject(tile);
      if (tileObj && tileObj.drain) {
        tileObj.drain(800).then(() => {
          completed++;
          if (completed >= total) resolve();
        });
      } else {
        tile.classList.add("drain-done");
        completed++;
        if (completed >= total) resolve();
      }
    });
  });
}

/* ─────────────────── Tile Objesi Bulucu ─────────────────── */

function findTileObject(element) {
  const resourceIds = ["su", "yiyecek", "bilgi", "tas", "maden", "kultur", "inanc", "ipek", "altin", "ekmek", "demir", "celik", "mermer", "kumas", "ilac", "mobilya", "heykel", "mucevher"];
  for (const rid of resourceIds) {
    if (element.classList.contains("resource-" + rid)) {
      return element.__tileObj || null;
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    FAZE 3: TEMA GEÇİŞ ANİMASYONU                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tema Geçiş Orkestratörü ─────────────────── */

async function performThemeTransition(toEra, tData) {
  if (tData.themeClass) {
    createSparkles(toEra, 18);
    await showFlash(toEra, 600);
  }

  setTheme(toEra);

  showBadge(tData.title, toEra);
}
