/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          EVRE YÖNETİMİ                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  state,
  listeners,
  getPopulationAlive,
  getAltin,
  isEraTransitioning,
  getEra,
  freshIndustryEntry,
} from "./game-core.js";
import {
  RESOURCES,
  SEASON_DURATION,
  TRADE_MERCHANT_INTERVAL_MIN,
  TRADE_MERCHANT_INTERVAL_MAX,
  PACKS_DATA,
  ALL_BUILDINGS_DATA,
} from "./game-data.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          EVRE TANIMLARI                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Çağ Çipi Nüfus Eşiği ─────────────────── */

export const ERA_CHIP_POP_THRESHOLD = 20;

export const ERA_DATA = {
  1: {
    name: "Kasaba",
    populationTarget: 250,
    goldTarget: 500000,
    next: 2,
  },
  2: {
    name: "Teknoloji",
    populationTarget: 5000,
    goldTarget: 100000,
    next: 3,
  },
  3: {
    name: "Uzay",
    populationTarget: Infinity,
    goldTarget: Infinity,
    next: null,
  },
};

/* ─────────────────── Geçiş Verileri ─────────────────── */

const TRANSITION_DATA = {
  1: {
    title: "TEKNOLOJİ ÇAĞI BAŞLADI",
    narrative:
      "Kasaban sessizce büyüdü, ama artık daha büyük bir vizyon gerekiyor. Fabrikalar yükseliyor, çarklar dönüyor, veri akıyor.",
    duration: 3000,
    flash: true,
  },
  2: {
    title: "UZAY ÇAĞI AÇILDI",
    narrative:
      "Fabrikalar artık yetmiyor. İnsanlık yıldızlara uzanıyor. Plazma enerjisi, kuantum hesaplama, yapay zeka...",
    duration: 4000,
    flash: true,
  },
  3: {
    title: "KASABA ÇAĞINA DÖNÜŞ",
    narrative:
      "Sonsuzluk yorucu oldu. Yıldızlar söndü, çarklar durdu. Toprağa dönüş, basitliğin gücünü hatırla...",
    duration: 3500,
    flash: false,
  },
  "2_1": {
    title: "KASABA ÇAĞINA DÖNÜŞ",
    narrative: "Teknoloji yükü ağır geldi. Doğaya dönüş, huzurun başlangıcı...",
    duration: 3000,
    flash: false,
  },
  "3_1": {
    title: "KASABA ÇAĞINA DÖNÜŞ",
    narrative:
      "Yıldızlar sönüyor, toprak çağırıyor. Sıfıla dönüş, yeniden başlangıç...",
    duration: 3500,
    flash: false,
  },
  "3_2": {
    title: "SANAYİ ÇAĞINA DÖNÜŞ",
    narrative:
      "Uzayın soğuğundan kaçış. Çarklar tekrar dönüyor, fabrikalar yeniden alevleniyor...",
    duration: 3000,
    flash: true,
  },
};

/* ─────────────────── Kaynak İsim Haritası ─────────────────── */

const RESOURCE_NAMES = {
  1: {
    power: "Güç",
    su: "Su",
    yiyecek: "Yiyecek",
    bilgi: "Bilgi",
    tas: "Taş",
    maden: "Mineral",
    kultur: "Kültür",
    inanc: "İnanç",
    ipek: "İpek",
    altin: "Altın",
    ekmek: "Ekmek",
    demir: "Demir",
    celik: "Çelik",
    mermer: "Mermer",
    kumas: "Kumaş",
    ilac: "İlaç",
    mobilya: "Mobilya",
    heykel: "Heykel",
    mucevher: "Mücevher",
  },
  2: {
    power: "Enerji",
    su: "Arıtılmış Su",
    yiyecek: "Gıda",
    bilgi: "Veri",
    tas: "Çelik",
    maden: "Çip",
    kultur: "Medya",
    inanc: "Spiral",
    ipek: "Grafen",
    altin: "Kredi",
    ekmek: "İşlenmiş Gıda",
    demir: "Alaşım",
    celik: "Süper Alaşım",
    mermer: "Kompozit",
    kumas: "Nano Kumaş",
    ilac: "Biotech İlaç",
    mobilya: "Modüler Mobilya",
    heykel: "3D Heykel",
    mucevher: "Sentetik Mücevher",
  },
  3: {
    power: "Plazma",
    su: "Kuantum Su",
    yiyecek: "Sentez Gıda",
    bilgi: "Yapay Zeka",
    tas: "Karbon Fiber",
    maden: "Kuantum İşlemci",
    kultur: "Holodeck",
    inanc: "Kozmik Enerji",
    ipek: "Nano Fiber",
    altin: "Kredi",
    ekmek: "Sentez Besin",
    demir: "Nano Alaşım",
    celik: "Kuantum Çelik",
    mermer: "Kristal Kompozit",
    kumas: "Akıllı Kumaş",
    ilac: "Nanotıp",
    mobilya: "Holografik Mobilya",
    heykel: "Holodeck Heykel",
    mucevher: "Kuantum Mücevher",
  },
};

/* ─────────────────── Kaynak Emoji Haritası ─────────────────── */

const RESOURCE_EMOJIS = {
  1: {
    power: "⚡",
    su: "💧",
    yiyecek: "🌾",
    bilgi: "📜",
    tas: "🪨",
    maden: "⛏️",
    kultur: "🎭",
    inanc: "🕯️",
    ipek: "🧵",
    altin: "🪙",
    ekmek: "🍞",
    demir: "⚒️",
    celik: "🔩",
    mermer: "🗿",
    kumas: "🧶",
    ilac: "⚕️",
    mobilya: "🛋️",
    heykel: "🏛️",
    mucevher: "💍",
  },
  2: {
    power: "⚡",
    su: "💧",
    yiyecek: "🍞",
    bilgi: "💾",
    tas: "🔩",
    maden: "🔌",
    kultur: "📺",
    inanc: "🌀",
    ipek: "🧬",
    altin: "💳",
    ekmek: "🍽️",
    demir: "⚙️",
    celik: "🔗",
    mermer: "🔲",
    kumas: "🧵",
    ilac: "💊",
    mobilya: "🪑",
    heykel: "🗿",
    mucevher: "💎",
  },
  3: {
    power: "⚡",
    su: "💧",
    yiyecek: "🍽️",
    bilgi: "🧠",
    tas: "🔬",
    maden: "💠",
    kultur: "🎮",
    inanc: "🌌",
    ipek: "🧬",
    altin: "💳",
    ekmek: "🧬",
    demir: "⚛️",
    celik: "🔷",
    mermer: "💠",
    kumas: "🪡",
    ilac: "💉",
    mobilya: "🛸",
    heykel: "🔮",
    mucevher: "🌟",
  },
};

/* ─────────────────── Bina İsim Haritası ─────────────────── */

const BUILDING_NAMES = {
  1: {
    fountain: "Güç Ocağı",
    well: "Kuyu",
    farm: "Tarla",
    academy: "Akademi",
    quarry: "Taş Ocağı",
    mine: "Maden",
    theatre: "Tiyatro",
    temple: "Tapınak",
    silkWorkshop: "İpek Atölyesi",
    baraka: "Baraka",
    ev: "Ev",
    depo: "Depo",
    ambar: "Ambar",
    mansion: "Kumandanlık",
    aqueduct: "Çeşme",
    mill: "Değirmen",
    library: "Kütüphane",
    stoneAtelier: "Taş Atölyesi",
    minerCamp: "Madenci Kampı",
    amphitheatre: "Amfitiyatro",
    altar: "Sunak",
    loom: "Dokuma Tezgahı",
  },
  2: {
    fountain: "Enerji Santrali",
    well: "Arıtma Tesisi",
    farm: "Fabrika",
    academy: "Data Merkezi",
    quarry: "Çelik Fabrikası",
    mine: "Chip Fabrikası",
    theatre: "Stüdyo",
    temple: "Spiral Laboratuvarı",
    silkWorkshop: "Grafen Lab",
    baraka: "Blok",
    ev: "Gökdelen",
    depo: "Depo",
    ambar: "Veri Merkezi",
    mansion: "Komuta Merkezi",
    aqueduct: "Su Arıtma",
    mill: "İşlem Fabrikası",
    library: "Veri Bankası",
    stoneAtelier: "Alaşım Atölyesi",
    minerCamp: "Otomasyon Üssü",
    amphitheatre: "Medya Merkezi",
    altar: "Spiral Çekirdek",
    loom: "Nano Dokuma",
  },
  3: {
    fountain: "Yıldız Çekirdeği",
    well: "Kuantum Kuyu",
    farm: "Sentez Fabrikası",
    academy: "Yapay Zeka Çekirdeği",
    quarry: "Karbon Ekstraksiyon",
    mine: "Kuantum Laboratuvarı",
    theatre: "Holodeck Kupası",
    temple: "Kozmik Tapınak",
    silkWorkshop: "Nano Dokuma Tesisi",
    baraka: "Kapsül Ev",
    ev: "Orbital",
    depo: "Kuantum Depo",
    ambar: "Boyut Cebi",
    mansion: "Yıldız Kalesi",
    aqueduct: "Plazma Kanalı",
    mill: "Sentez Merkezi",
    library: "Kuantum Kütüphane",
    stoneAtelier: "Kristal Atölyesi",
    minerCamp: "Nano Madenci Üssü",
    amphitheatre: "Holodeck Arena",
    altar: "Kozmik Odak",
    loom: "Nano Fiber Dokuma",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          EVRE FONKSİYONLARI                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Çağ İsmi Getter'ı ─────────────────── */

export function getEraName(era) {
  return ERA_DATA[era]?.name || "Kasaba";
}

/* ─────────────────── Kaynak İsmi Getter'ı ─────────────────── */

export function getResourceName(resourceId) {
  const era = state.era.current;
  return (
    RESOURCE_NAMES[era]?.[resourceId] ||
    RESOURCE_NAMES[1][resourceId] ||
    RESOURCES[resourceId]?.name ||
    resourceId
  );
}

/* ─────────────────── Kaynak Emoji Getter'ı ─────────────────── */

export function getResourceEmoji(resourceId) {
  const era = state.era.current;
  return (
    RESOURCE_EMOJIS[era]?.[resourceId] ||
    RESOURCE_EMOJIS[1][resourceId] ||
    RESOURCES[resourceId]?.emoji ||
    ""
  );
}

/* ─────────────────── Bina İsmi Getter'ı ─────────────────── */

export function getBuildingName(buildingId) {
  const era = state.era.current;
  return (
    BUILDING_NAMES[era]?.[buildingId] ||
    BUILDING_NAMES[1][buildingId] ||
    buildingId
  );
}

/* ─────────────────── Bina Emoji Getter'ı ─────────────────── */

export function getBuildingEmoji(buildingId) {
  return ALL_BUILDINGS_DATA[buildingId]?.emoji || "";
}

/* ─────────────────── Paket İsmi Getter'ı ─────────────────── */

export function getPackName(packId) {
  return PACKS_DATA[packId]?.name || packId;
}

/* ─────────────────── Altın Etiketi Getter'ı ─────────────────── */

export function getGoldLabel() {
  const era = state.era.current;
  return era >= 2 ? "Kredi" : "Altın";
}

/* ─────────────────── Çağ Hedefleri Kontrolü ─────────────────── */

function canAdvanceEra() {
  const currentEra = state.era.current;
  const eraData = ERA_DATA[currentEra];
  if (!eraData || !eraData.next) return false;

  return (
    getPopulationAlive() >= eraData.populationTarget &&
    getAltin() >= eraData.goldTarget
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        ÇAĞ GEÇİŞ KONTROLÜ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Era Onay Durumu ─────────────────── */
let eraPromptShown = false;

/* ─────────────────── Era Kontrol İşlemcisi ─────────────────── */
export function checkEraAdvance() {
  if (isEraTransitioning()) return;
  if (eraPromptShown) return;
  if (!canAdvanceEra()) {
    eraPromptShown = false;
    return;
  }

  const currentEra = getEra();
  const data = ERA_DATA[currentEra];
  if (!data || !data.next) return;

  eraPromptShown = true;
  showEraAdvanceConfirm(currentEra, data);
}

/* ─────────────────── Era Onay Dialogu ─────────────────── */
function showEraAdvanceConfirm(currentEra, data) {
  const overlay = document.createElement("div");
  overlay.className = "era-confirm-overlay";

  const dialog = document.createElement("div");
  dialog.className = "era-confirm-dialog";

  const title = document.createElement("div");
  title.className = "era-confirm-title";
  title.textContent = "Çağınızı İlerletmeye Hazır Mısınız?";

  const desc = document.createElement("div");
  desc.className = "era-confirm-desc";
  desc.textContent =
    "Çağ " +
    currentEra +
    " (" +
    getEraName(currentEra) +
    ") hedeflerine ulaştınız. Sonraki çağa geçmek istiyor musunuz?";

  const btnRow = document.createElement("div");
  btnRow.className = "era-confirm-btns";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "era-confirm-btn era-confirm-cancel";
  cancelBtn.textContent = "Şimdilik Hayır";

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "era-confirm-btn era-confirm-ok";
  confirmBtn.textContent = "Evet, Geç!";

  cancelBtn.addEventListener("click", () => {
    overlay.remove();
    eraPromptShown = false;
  });

  confirmBtn.addEventListener("click", () => {
    overlay.remove();
    eraPromptShown = false;
    triggerEraTransition();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      eraPromptShown = false;
    }
  });

  btnRow.append(cancelBtn, confirmBtn);
  dialog.append(title, desc, btnRow);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     ÇAĞ GEÇİŞ ANİMASYON AKIŞI                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Geçiş Tetikleyicisi ─────────────────── */

function triggerEraTransition(targetEra) {
  if (state.era.transitioning) return false;

  const currentEra = state.era.current;
  const eraData = ERA_DATA[currentEra];
  if (!eraData) return false;

  const nextEra = targetEra ?? eraData.next;
  if (nextEra === null || nextEra === currentEra) return false;

  const tData =
    TRANSITION_DATA[currentEra + "_" + nextEra] || TRANSITION_DATA[currentEra];
  if (!tData) return false;

  state.era.transitioning = true;

  runTransition(currentEra, nextEra, tData);

  return true;
}

/* ─────────────────── Geçiş Akışı Orkestratörü ─────────────────── */

async function runTransition(fromEra, toEra, tData) {
  showToast("Çağ değişiyor...", "⏳");

  await demolishAllBuildings();
  await demolishAllIndustries();

  const buildingIds = Object.keys(state.buildings);
  for (const id of buildingIds) {
    state.buildings[id] = 0;
  }

  await Promise.all([
    drainAllResources(),
    performThemeTransition(toEra, tData),
  ]);

  resetResources();
  resetIndustryState();
  resetPackState();
  resetPopulationState();
  resetSeasonState();
  resetTradeState();

  state.resources.power = 40;
  state.era.current = toEra;
  state.era.transitioning = false;

  for (const fn of listeners) fn(state);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      GEÇİŞ SONRASI SIFIRLAMA                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kaynak Sıfırlayıcı ─────────────────── */

function resetResources() {
  for (const id of Object.keys(state.resources)) {
    state.resources[id] = 0;
  }
}

/* ─────────────────── Sanayi Sıfırlayıcı ─────────────────── */

function resetIndustryState() {
  for (const id of Object.keys(state.industry)) {
    state.industry[id] = freshIndustryEntry();
  }

  for (const id of Object.keys(state.settings.autoSellPct)) {
    state.settings.autoSellPct[id] = 0;
  }
}

/* ─────────────────── Paket Sıfırlayıcı ─────────────────── */

function resetPackState() {
  for (const id of Object.keys(state.packs)) {
    state.packs[id] = 0;
  }
}

/* ─────────────────── Nüfus Sıfırlayıcı ─────────────────── */

function resetPopulationState() {
  state.population = {
    current: 0,
    migrants: 0,
    satisfaction: 50,
    migrationTimer: 0,
    migrantQueue: [],
    deficiency: 0,
    ilacOk: false,
    wagesPaid: true,
  };
}

/* ─────────────────── Mevsim Sıfırlayıcı ─────────────────── */

function resetSeasonState() {
  state.season = {
    id: "ilkbahar",
    timer: SEASON_DURATION,
  };
}

/* ─────────────────── Ticaret Sıfırlayıcı ─────────────────── */

function resetTradeState() {
  state.trade = {
    merchants: [],
    spawnTimer:
      Math.random() *
        (TRADE_MERCHANT_INTERVAL_MAX - TRADE_MERCHANT_INTERVAL_MIN) +
      TRADE_MERCHANT_INTERVAL_MIN,
    nextId: 1,
    count: 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    FAZE 1: BİNA SÖKÜM ANİMASYONU                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Kart Söküm Animasyonu ─────────────────── */

function runDemolishAnimation(selector) {
  return new Promise((resolve) => {
    const cards = document.querySelectorAll(selector);
    if (cards.length === 0) {
      resolve();
      return;
    }

    let completed = 0;
    const total = cards.length;
    const step = 60;

    cards.forEach((card, i) => {
      setTimeout(() => {
        card.classList.add("demolishing");
        card.addEventListener(
          "animationend",
          () => {
            card.classList.remove("demolishing");
            card.classList.add("demolished");
            completed++;
            if (completed >= total) resolve();
          },
          { once: true },
        );
      }, i * step);
    });

    setTimeout(
      () => {
        if (completed < total) resolve();
      },
      total * step + 500,
    );
  });
}

/* ─────────────────── Toplu Bina Sökümü ─────────────────── */

function demolishAllBuildings() {
  return runDemolishAnimation(
    ".building-card:not(.demolished):not(.locked)",
  );
}

/* ─────────────────── Toplu Sanayi Sökümü ─────────────────── */

function demolishAllIndustries() {
  return runDemolishAnimation(".industry-card.built:not(.demolished)");
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    FAZE 2: KAYNAK DRAIN ANİMASYONU                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Toplu Kaynak Düşürme ─────────────────── */

function drainAllResources() {
  return new Promise((resolve) => {
    const tiles = document.querySelectorAll(".resource-tile:not(.drain-done)");
    if (tiles.length === 0) {
      resolve();
      return;
    }

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
  const resourceIds = [
    "power",
    "su",
    "yiyecek",
    "bilgi",
    "tas",
    "maden",
    "kultur",
    "inanc",
    "ipek",
    "altin",
    "ekmek",
    "demir",
    "celik",
    "mermer",
    "kumas",
    "ilac",
    "mobilya",
    "heykel",
    "mucevher",
  ];
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
  if (tData.flash) {
    createSparkles(toEra, 18);
    await showFlash(toEra, 600);
  }

  setTheme(toEra);

  showBadge(tData.title, toEra);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    TEMA GEÇİŞ YÖNETİCİSİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tema Sınıfı Haritası ─────────────────── */

const THEME_CLASSES = {
  1: "",
  2: "era-theme-tech",
  3: "era-theme-space",
};

const FLASH_CLASSES = {
  2: "era-flash-tech",
  3: "era-flash-space",
};

const BADGE_CLASSES = {
  2: "tech",
  3: "space",
};

/* ─────────────────── Tema Uygulayıcı ─────────────────── */

function setTheme(era) {
  const body = document.body;
  for (const cls of Object.values(THEME_CLASSES)) {
    if (cls) body.classList.remove(cls);
  }
  const next = THEME_CLASSES[era];
  if (next) body.classList.add(next);
}

/* ─────────────────── Flash Gösterici ─────────────────── */

function showFlash(era, duration) {
  return new Promise((resolve) => {
    const flash = document.createElement("div");
    flash.className = "era-flash " + (FLASH_CLASSES[era] || "");
    document.body.appendChild(flash);

    requestAnimationFrame(() => {
      flash.classList.add("era-flash-visible");
    });

    setTimeout(() => {
      flash.classList.remove("era-flash-visible");
      setTimeout(() => {
        flash.remove();
        resolve();
      }, 800);
    }, duration || 600);
  });
}

/* ─────────────────── Çağ Etiketi Gösterici ─────────────────── */

function showBadge(text, era) {
  return new Promise((resolve) => {
    const badge = document.createElement("div");
    badge.className = "era-badge-anim " + (BADGE_CLASSES[era] || "");
    badge.textContent = text;
    document.body.appendChild(badge);

    requestAnimationFrame(() => {
      badge.classList.add("era-badge-anim-enter");
    });

    setTimeout(() => {
      badge.classList.remove("era-badge-anim-enter");
      badge.classList.add("era-badge-anim-exit");
      setTimeout(() => {
        badge.remove();
        resolve();
      }, 500);
    }, 1400);
  });
}

/* ─────────────────── Parçacık Oluşturucu ─────────────────── */

function createSparkles(era, count) {
  const container = document.createElement("div");
  container.className = "era-sparkle-container";
  const themeClass = BADGE_CLASSES[era] || "";

  for (let i = 0; i < (count || 15); i++) {
    const p = document.createElement("div");
    p.className = "era-sparkle " + themeClass;
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = "-5px";
    p.style.animationDelay = Math.random() * 1.5 + "s";
    p.style.animationDuration = 1.2 + Math.random() * 1.8 + "s";
    p.classList.add("era-sparkle-rise");
    container.appendChild(p);
  }

  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 3500);
}

/* ─────────────────── Toast Bildirim Gösterici ─────────────────── */

function showToast(text, icon) {
  return new Promise((resolve) => {
    const toast = document.createElement("div");
    toast.className = "era-toast";

    if (icon) {
      const iconEl = document.createElement("span");
      iconEl.className = "era-toast-icon";
      iconEl.textContent = icon;
      toast.appendChild(iconEl);
    }

    const textNode = document.createTextNode(text);
    toast.appendChild(textNode);

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("era-toast-visible");
    });

    setTimeout(() => {
      toast.classList.remove("era-toast-visible");
      setTimeout(() => {
        toast.remove();
        resolve();
      }, 400);
    }, 2000);
  });
}
