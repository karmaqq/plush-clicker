/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          EVRE YÖNETİMİ                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { state, getPopulationAlive, getAltin, getResource } from "./state.js";
import { RESOURCES } from "./resources.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          EVRE TANIMLARI                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const ERA_DATA = {
  1: {
    name: "Kasaba",
    populationTarget: 500,
    goldTarget: 10000,
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

export const TRANSITION_DATA = {
  1: {
    title: "SANAYİ ÇAĞI BAŞLADI",
    narrative: "Kasaban sessizce büyüdü, ama artık daha büyük bir vizyon gerekiyor. Fabrikalar yükseliyor, çarklar dönüyor, veri akıyor.",
    duration: 3000,
    themeClass: "era-transition-to-tech",
  },
  2: {
    title: "UZAY ÇAĞI AÇILDI",
    narrative: "Fabrikalar artık yetmiyor. İnsanlık yıldızlara uzanıyor. Plazma enerjisi, kuantum hesaplama, yapay zeka...",
    duration: 4000,
    themeClass: "era-transition-to-space",
  },
  3: {
    title: "KASABA ÇAĞINA DÖNÜŞ",
    narrative: "Sonsuzluk yorucu oldu. Yıldızlar söndü, çarklar durdu. Toprağa dönüş, basitliğin gücünü hatırla...",
    duration: 3500,
    themeClass: "",
  },
  "2_1": {
    title: "KASABA ÇAĞINA DÖNÜŞ",
    narrative: "Teknoloji yükü ağır geldi. Doğaya dönüş, huzurun başlangıcı...",
    duration: 3000,
    themeClass: "",
  },
  "3_1": {
    title: "KASABA ÇAĞINA DÖNÜŞ",
    narrative: "Yıldızlar sönüyor, toprak çağırıyor. Sıfıla dönüş, yeniden başlangıç...",
    duration: 3500,
    themeClass: "",
  },
  "3_2": {
    title: "SANAYİ ÇAĞINA DÖNÜŞ",
    narrative: "Uzayın soğuğundan kaçış. Çarklar tekrar dönüyor, fabrikalar yeniden alevleniyor...",
    duration: 3000,
    themeClass: "era-transition-to-tech",
  },
};

/* ─────────────────── Kaynak İsim Haritası ─────────────────── */

export const RESOURCE_NAMES = {
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

export const RESOURCE_EMOJIS = {
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
    altin: "💰",
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

export const BUILDING_NAMES = {
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

/* ─────────────────── Paket İsim Haritası ─────────────────── */

export const PACK_NAMES = {
  1: {
    clickPower: "Başlangıç Paketi",
    critClick: "Çiftlik Paketi",
    autoClick: "Madenci Paketi",
    powerPatronage: "Bilge Paketi",
    metalIsleme: "Savaşçı Paketi",
    eritme: "Ticaret Paketi",
    yazi: "İnanç Paketi",
    isciBilimi: "İpek Yolu Paketi",
    depoBilimi: "İmparatorluk",
    maliyetBilimi: "Efsane Paketi",
    craftAtolyesi: "Kutsal Paket",
    ticaretBilimi: "Son Paket",
  },
  2: {
    clickPower: "Sanayi Başlangıç",
    critClick: "Enerji Paketi",
    autoClick: "Çip Paketi",
    powerPatronage: "Veri Paketi",
    metalIsleme: "Robot Paketi",
    eritme: "Kripto Paketi",
    yazi: "Nano Paket",
    isciBilimi: "Medya Paketi",
    depoBilimi: "Mega Fabrika",
    maliyetBilimi: "Singülerlik",
    craftAtolyesi: "Transendans",
    ticaretBilimi: "Çağ Geçiş Paketi",
  },
  3: {
    clickPower: "Uzay Başlangıç",
    critClick: "Yıldız Paketi",
    autoClick: "Kuantum Paketi",
    powerPatronage: "Yapay Zeka Paketi",
    metalIsleme: "Nano Paket",
    eritme: "Galaktik Paket",
    yazi: "Holodeck Paketi",
    isciBilimi: "Kozmik Paket",
    depoBilimi: "Yörünge İstasyonu",
    maliyetBilimi: "Sonsuzluk",
    craftAtolyesi: "Evrensel Bilinç",
    ticaretBilimi: "Final Paket",
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
  return RESOURCE_NAMES[era]?.[resourceId] || RESOURCE_NAMES[1][resourceId] || RESOURCES[resourceId]?.name || resourceId;
}

/* ─────────────────── Kaynak Emoji Getter'ı ─────────────────── */

export function getResourceEmoji(resourceId) {
  const era = state.era.current;
  return RESOURCE_EMOJIS[era]?.[resourceId] || RESOURCE_EMOJIS[1][resourceId] || RESOURCES[resourceId]?.emoji || "";
}

/* ─────────────────── Bina İsmi Getter'ı ─────────────────── */

export function getBuildingName(buildingId) {
  const era = state.era.current;
  return BUILDING_NAMES[era]?.[buildingId] || BUILDING_NAMES[1][buildingId] || buildingId;
}

/* ─────────────────── Paket İsmi Getter'ı ─────────────────── */

export function getPackName(packId) {
  const era = state.era.current;
  return PACK_NAMES[era]?.[packId] || PACK_NAMES[1][packId];
}

/* ─────────────────── Altın Etiketi Getter'ı ─────────────────── */

export function getGoldLabel() {
  const era = state.era.current;
  return era >= 2 ? "Kredi" : "Altın";
}

/* ─────────────────── Güç Etiketi Getter'ı ─────────────────── */

export function getPowerLabel() {
  const era = state.era.current;
  const names = RESOURCE_NAMES[era];
  return names?.power || "Güç";
}

/* ─────────────────── Çağ Hedefleri Kontrolü ─────────────────── */

export function canAdvanceEra() {
  const currentEra = state.era.current;
  const eraData = ERA_DATA[currentEra];
  if (!eraData || !eraData.next) return false;

  return (
    getPopulationAlive() >= eraData.populationTarget &&
    getAltin() >= eraData.goldTarget
  );
}

/* ─────────────────── Çağ Geçiş İşlemcisi ─────────────────── */

export function advanceEra() {
  const currentEra = state.era.current;
  const eraData = ERA_DATA[currentEra];
  if (!eraData || !eraData.next) return false;
  if (!canAdvanceEra()) return false;

  state.era.transitioning = true;

  const altinAmount = getResource("altin");
  const korunanAltin = Math.floor(altinAmount * 0.5);

  for (const id of Object.keys(state.buildings)) {
    state.buildings[id] = 0;
  }

  for (const id of Object.keys(state.resources)) {
    state.resources[id] = 0;
  }
  state.resources.altin = korunanAltin;
  state.resources.power = 40;

  state.era.current = eraData.next;
  state.era.transitioning = false;

  return true;
}
