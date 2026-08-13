import { RESOURCES } from "../js/resources.js";
import { BUILDINGS_DATA } from "../js/buildings.js";
import { PACKS_DATA } from "../js/packs.js";

// ---------------------------------------------------------------------------
// Kural sabitleri (genel aralıklar — mutlak değer değil)
// ---------------------------------------------------------------------------
const RULES = {
    producerChain: { name: "Producer zincir geçiş eşiği", range: "N = 5 (sabit, tek tip)" },
    karmaCostGrowth: { name: "Producer karma tabanı büyümesi (G)", range: "[2.8, 3.2]" },
    producerCostMult: { name: "Producer costMultiplier", range: "[1.12, 1.18] sabit" },
    secondaryCostShare: { name: "İkincil kaynak payı (c_r)", range: "[0.30, 0.45] × karma" },
    productionGrowth: { name: "Üretim zinciri büyümesi (g_p)", range: "[1.7, 2.0]" },
    baseProduction: { name: "İlk üretim P0 (/sn)", range: "[0.4, 1.5]" },
    fillTime: { name: "Dolma süresi T_fill", range: "[480, 900] sn (8–15 dk)" },
    baseCapacityShare: { name: "baseCapacity / capacityPerUnit", range: "[0.10, 0.25]" },
    bonusPerLevel: { name: "Bonus bina bonus oranı (hepsi eşit)", range: "[0.10, 0.20]" },
    bonusCostMult: { name: "Bonus costMultiplier / (1+bonus)", range: "[1.05, 1.15]" },
    bonusBaseShare: { name: "Bonus karma tabanı / producer tabanı (c_b)", range: "[2.5, 4.0]" },
    bonusKarmaShare: { name: "Bonus maliyetinde karma payı (birincil)", range: "[0.50, 0.85]" },
    packCostGrowth: { name: "Pack taban maliyeti büyümesi (H)", range: "[2.5, 3.5]" },
    packSlope: { name: "Pack costMultiplier / (1+efektif bonus)", range: "[1.05, 1.15]" },
    producerPayback: { name: "Producer geri ödeme", range: "[5 sn, 60 dk]; son/ilk < 200" },
    bonusPayback: { name: "Bonus geri ödeme", range: "[15 sn, 4 saat]" },
    clickEarly: { name: "Başlangıçta pasif/tıklama", range: "< 1 (tıklama güçlü)" },
    clickLate: { name: "Geç oyunda pasif/tıklama", range: "> 1 ve < 10 (pasif geçer, aşırı değil)" },
    firstFountain: { name: "İlk çeşme (ortalama tıklama ile)", range: "[3, 120] sn" },
    campaignTime: { name: "Son halkaya ulaşma (temsili oyuncu)", range: "[2, 45] gün" },
};

let failures = 0;
let passes = 0;

function check(name, ok, detail = "") {
    if (ok) {
        passes++;
        console.log("  \u2713 " + name + (detail ? "  →  " + detail : ""));
    } else {
        failures++;
        console.log("  \u2717 " + name + (detail ? "  →  " + detail : ""));
    }
}

function section(title) {
    console.log("\n== " + title + " ==");
}

// ---------------------------------------------------------------------------
// Saf yardımcılar (game-state mantığının veri-düzeyi kopyası)
// ---------------------------------------------------------------------------
function getCost(data, count) {
    const mult = Math.pow(data.costMultiplier, count);
    const cost = {};
    for (const [r, amount] of Object.entries(data.baseCost)) {
        cost[r] = Math.ceil(amount * mult);
    }
    return cost;
}

function getUnlock(data, bld, pck, res) {
    const u = data && data.unlock;
    if (!u) return true;
    if (u.type === "building") return (bld[u.id] || 0) >= u.count;
    if (u.type === "pack") return (pck[u.id] || 0) >= (u.level || 0);
    if (u.type === "resource") return (res[u.id] || 0) >= u.amount;
    return true;
}

function isNearUnlock(data, bld, pck) {
    const u = data && data.unlock;
    if (!u) return true;
    if (u.type === "building") return (bld[u.id] || 0) > 0;
    if (u.type === "pack") return (pck[u.id] || 0) > 0;
    if (u.type === "resource") return false;
    return true;
}

function unlockState(data, bld, pck, res) {
    if (getUnlock(data, bld, pck, res)) return "unlocked";
    if (isNearUnlock(data, bld, pck)) return "locked";
    return "hidden";
}

const PRODUCER_IDS = Object.keys(BUILDINGS_DATA).filter((id) => BUILDINGS_DATA[id].type === "producer");
const BONUS_IDS = Object.keys(BUILDINGS_DATA).filter((id) => BUILDINGS_DATA[id].type === "bonus");

// ---------------------------------------------------------------------------
// C1 — Her kaynak tam 1 producer + 1 bonus
// ---------------------------------------------------------------------------
section("C1: Kaynak → 1 üretici + 1 bonus eşleşmesi");
{
    const producerByResource = {};
    const bonusByResource = {};
    for (const id of PRODUCER_IDS) {
        const r = BUILDINGS_DATA[id].outputResource;
        producerByResource[r] = (producerByResource[r] || 0) + 1;
    }
    for (const id of BONUS_IDS) {
        const r = BUILDINGS_DATA[id].targetResource;
        bonusByResource[r] = (bonusByResource[r] || 0) + 1;
    }
    let allOk = true;
    for (const resource of Object.keys(RESOURCES)) {
        const p = producerByResource[resource] || 0;
        const b = bonusByResource[resource] || 0;
        check("Kaynak '" + resource + "': " + p + " üretici + " + b + " bonus", p === 1 && b === 1);
        if (p !== 1 || b !== 1) allOk = false;
    }
    check("Tüm kaynaklar eşleşti (" + Object.keys(RESOURCES).length + " kaynak)", allOk);
}

// ---------------------------------------------------------------------------
// C2 — Açılış zinciri: lineer, döngü yok
// ---------------------------------------------------------------------------
section("C2: Açılış zinciri (döngü/kilitlenme yok)");
{
    let chainOk = true;
    for (let i = 0; i < PRODUCER_IDS.length; i++) {
        const id = PRODUCER_IDS[i];
        const data = BUILDINGS_DATA[id];
        if (i === 0) {
            const u = data.unlock;
            const ok = u && u.type === "resource" && u.id === "karma" && u.amount > 0;
            check("İlk halka (karma): resource şartlı açılış", !!ok);
            if (!ok) chainOk = false;
        } else {
            const prev = PRODUCER_IDS[i - 1];
            const u = data.unlock;
            const ok = u && u.type === "building" && u.id === prev && u.count === 5;
            check("Halka '" + id + "' → önceki '" + prev + "' (N=5)", !!ok);
            if (!ok) chainOk = false;
        }
    }

    const visited = new Set();
    const stack = new Set();
    let cyclic = false;
    function dfs(id) {
        if (stack.has(id)) {
            cyclic = true;
            return;
        }
        if (visited.has(id)) return;
        stack.add(id);
        visited.add(id);
        const data = BUILDINGS_DATA[id] || PACKS_DATA[id];
        const u = data.unlock;
        if (u && u.type === "building" && BUILDINGS_DATA[u.id]) dfs(u.id);
        stack.delete(id);
    }
    for (const id of Object.keys(BUILDINGS_DATA)) dfs(id);
    for (const id of Object.keys(PACKS_DATA)) dfs(id);
    check("Unlock grafiğinde döngü yok", !cyclic);

    const buildingCount = Object.keys(BUILDINGS_DATA).length;
    const packCount = Object.keys(PACKS_DATA).length;
    check("Unlock grafiği tüm elemanlara erişiyor", visited.size === buildingCount + packCount, visited.size + "/" + (buildingCount + packCount) + " eleman");
    check("Toplam kilitlenme yok (lineer producer zinciri)", chainOk && !cyclic && visited.size === buildingCount + packCount);
}

// ---------------------------------------------------------------------------
// C3 — Kilit ön koşulu mantığı (0 → gizli, ≥1 → kilitli, eşik → açık)
// ---------------------------------------------------------------------------
section("C3: Kilit durum makinesi");
{
    const all = [
        ...Object.entries(BUILDINGS_DATA).map(([id, d]) => ({ kind: "building", id, d })),
        ...Object.entries(PACKS_DATA).map(([id, d]) => ({ kind: "pack", id, d })),
    ];

    const emptyBld = {}, emptyPck = {}, emptyRes = {};
    for (const id of PRODUCER_IDS) emptyBld[id] = 0;
    for (const id of BONUS_IDS) emptyBld[id] = 0;
    for (const id of Object.keys(PACKS_DATA)) emptyPck[id] = 0;
    for (const r of Object.keys(RESOURCES)) emptyRes[r] = 0;

    let scenarioOk = true;
    for (const { kind, id, d } of all) {
        const s = unlockState(d, emptyBld, emptyPck, emptyRes);
        if (s !== "hidden") {
            check("Başlangıçta '" + id + "' gizli", false, "durum=" + s);
            scenarioOk = false;
        }
    }
    if (scenarioOk) check("Başlangıçta tüm elemanlar gizli", true);

    const bld1 = { ...emptyBld, fountain: 1 };
    let nearOk = true;
    for (const { kind, id, d } of all) {
        const u = d.unlock;
        if (u && u.type === "building" && u.id === "fountain") {
            const s = unlockState(d, bld1, emptyPck, emptyRes);
            const expect = u.count === 1 ? "unlocked" : "locked";
            if (s !== expect) {
                check("'" + id + "' önkoşul=1 → " + expect, false, "durum=" + s);
                nearOk = false;
            }
        }
        if (u && u.type === "building" && u.id !== "fountain") {
            const s = unlockState(d, bld1, emptyPck, emptyRes);
            if (s !== "hidden") {
                check("'" + id + "' önkoşul=0 → gizli", false, "durum=" + s);
                nearOk = false;
            }
        }
        if (u && u.type === "resource") {
            const s = unlockState(d, bld1, emptyPck, emptyRes);
            if (s !== "hidden") {
                check("'" + id + "' kaynak şartlı → kaynağa kadar gizli", false, "durum=" + s);
                nearOk = false;
            }
        }
    }
    if (nearOk) check("Ön koşul ≥1 → kilitli, 0 → gizli, resource şartlı → gizli", true);

    const bld5 = { ...emptyBld, fountain: 5 };
    check("well (fountain 5) → açık", unlockState(BUILDINGS_DATA.well, bld5, emptyPck, emptyRes) === "unlocked");
    check("aqueduct (well 0) → gizli", unlockState(BUILDINGS_DATA.aqueduct, bld5, emptyPck, emptyRes) === "hidden");

    let chainNearOk = true;
    for (let i = 1; i < PRODUCER_IDS.length; i++) {
        const prev = PRODUCER_IDS[i - 1];
        const b = { ...emptyBld, [prev]: 1 };
        const s = unlockState(BUILDINGS_DATA[PRODUCER_IDS[i]], b, emptyPck, emptyRes);
        if (s !== "locked") {
            check("'" + PRODUCER_IDS[i] + "' önkoşul(" + prev + ")=1 → kilitli", false, "durum=" + s);
            chainNearOk = false;
        }
    }
    if (chainNearOk) check("Tüm halkalarda ön koşul=1 → kilitli gösterim", true);

    let packOk = true;
    for (const [id, d] of Object.entries(PACKS_DATA)) {
        const u = d.unlock;
        if (u.type !== "building") continue;
        const b = { ...emptyBld, [u.id]: 1 };
        const expect = u.count === 1 ? "unlocked" : "locked";
        const s = unlockState(d, b, emptyPck, emptyRes);
        if (s !== expect) {
            check("pack '" + id + "' önkoşul=1 → " + expect, false, "durum=" + s);
            packOk = false;
        }
    }
    if (packOk) check("Pack kilit ön koşulları çalışıyor", true);
}

// ---------------------------------------------------------------------------
// C4 — Maliyet geometrisi, oranlar
// ---------------------------------------------------------------------------
section("C4: Maliyet ve üretim geometrisi");
{
    const karmaBase = PRODUCER_IDS.map((id) => BUILDINGS_DATA[id].baseCost.karma);
    let gOk = true;
    for (let i = 1; i < karmaBase.length; i++) {
        const g = karmaBase[i] / karmaBase[i - 1];
        if (g < 2.8 || g > 3.2) gOk = false;
    }
    check("Producer karma tabanı geometrik G", gOk, karmaBase.map((v) => Math.round(v)).join(" → "));

    const prodMults = PRODUCER_IDS.map((id) => BUILDINGS_DATA[id].costMultiplier);
    const uniformMult = prodMults.every((m) => Math.abs(m - prodMults[0]) < 1e-9);
    check(
        "Producer costMultiplier sabit ve [1.12, 1.18]",
        uniformMult && prodMults[0] >= 1.12 && prodMults[0] <= 1.18,
        "x" + prodMults[0]
    );

    let crOk = true;
    for (let i = 2; i < PRODUCER_IDS.length; i++) {
        const id = PRODUCER_IDS[i];
        const d = BUILDINGS_DATA[id];
        const prevRes = BUILDINGS_DATA[PRODUCER_IDS[i - 1]].outputResource;
        const cr = d.baseCost[prevRes] / d.baseCost.karma;
        if (cr < 0.3 || cr > 0.45) crOk = false;
    }
    check("İkincil kaynak payı c_r", crOk, "[0.30, 0.45]");

    const prods = PRODUCER_IDS.map((id) => BUILDINGS_DATA[id].production);
    let gpOk = prods[0] >= 0.4 && prods[0] <= 1.5;
    for (let i = 1; i < prods.length; i++) {
        const gp = prods[i] / prods[i - 1];
        if (gp < 1.7 || gp > 2.0) gpOk = false;
    }
    check("Üretim zinciri g_p ∈ [1.7, 2.0], P0 ∈ [0.4, 1.5]", gpOk, prods.join(" → "));

    let multOk = true;
    for (const [id, d] of Object.entries(BUILDINGS_DATA)) {
        if (!(d.costMultiplier > 1)) {
            check("costMultiplier > 1: " + id, false);
            multOk = false;
        }
        for (const [r, amt] of Object.entries(d.baseCost)) {
            if (!(amt >= 1)) {
                check("baseCost >= 1: " + id + "." + r, false);
                multOk = false;
            }
        }
    }
    for (const [id, d] of Object.entries(PACKS_DATA)) {
        if (!(d.costMultiplier > 1)) {
            check("pack costMultiplier > 1: " + id, false);
            multOk = false;
        }
    }
    if (multOk) check("Tüm maliyetler geometrik (çarpan > 1, taban ≥ 1)", true);
}

// ---------------------------------------------------------------------------
// C5 — Geri ödeme süreleri
// ---------------------------------------------------------------------------
section("C5: Geri ödeme süreleri");
{
    const paybacks = [];
    for (let i = 0; i < PRODUCER_IDS.length; i++) {
        const id = PRODUCER_IDS[i];
        const d = BUILDINGS_DATA[id];
        const r = d.outputResource;
        let component = 0;
        let denom = d.production;
        if (i < PRODUCER_IDS.length - 1) {
            const next = BUILDINGS_DATA[PRODUCER_IDS[i + 1]];
            component = next.baseCost[r] || 0;
        } else {
            component = BUILDINGS_DATA.loom.baseCost[r] || 0;
        }
        const pb = component / denom;
        paybacks.push({ id, pb });
    }
    const inRange = paybacks.every((p) => p.pb >= 5 && p.pb <= 3600);
    const values = paybacks.map((p) => p.id + "=" + Math.round(p.pb) + "sn").join("  ");
    check("Producer payback ∈ [5sn, 60dk]", inRange, values);

    const first = Math.min(...paybacks.map((p) => p.pb));
    const last = Math.max(...paybacks.map((p) => p.pb));
    check("Payback son/ilk oranı < 200", last / first < 200, Math.round(last / first) + "x");

    const bonusPays = [];
    for (const id of BONUS_IDS) {
        const d = BUILDINGS_DATA[id];
        const target = d.targetResource;
        const producer = PRODUCER_IDS.find((pid) => BUILDINGS_DATA[pid].outputResource === target);
        const prod = BUILDINGS_DATA[producer].production;
        const component = d.baseCost[target] || 0;
        const pb = component / (prod * d.bonusPerLevel);
        bonusPays.push({ id, pb });
    }
    const bOk = bonusPays.every((p) => p.pb >= 15 && p.pb <= 14400);
    check(
        "Bonus payback ∈ [15sn, 4 saat]",
        bOk,
        bonusPays.map((p) => p.id + "=" + Math.round(p.pb) + "sn").join("  ")
    );

    const fountainCost = BUILDINGS_DATA.fountain.baseCost.karma;
    const clickValue0 = 1 + 0.05 * 1;
    const tFirst = fountainCost / (2 * clickValue0);
    check("İlk çeşme aktif tıklamayla [3, 120] sn", tFirst >= 3 && tFirst <= 120, Math.round(tFirst) + " sn");
}

// ---------------------------------------------------------------------------
// C6 — Kapasite ve dolma süresi tutarlılığı
// ---------------------------------------------------------------------------
section("C6: Kapasite / dolma süresi");
{
    let fillOk = true;
    const fills = [];
    for (const id of PRODUCER_IDS) {
        if (id === "fountain") continue;
        const d = BUILDINGS_DATA[id];
        const t = d.capacityPerUnit / d.production;
        fills.push({ id, t });
        if (t < 480 || t > 900) fillOk = false;
    }
    check(
        "Dolma süresi T_fill ∈ [480, 900] sn (tutarlı tempo)",
        fillOk,
        fills.map((f) => f.id + "=" + Math.round(f.t) + "sn").join("  ")
    );

    let baseOk = true;
    for (const id of PRODUCER_IDS) {
        if (id === "fountain") continue;
        const r = BUILDINGS_DATA[id].outputResource;
        const ratio = RESOURCES[r].baseCapacity / BUILDINGS_DATA[id].capacityPerUnit;
        if (ratio < 0.1 || ratio > 0.25) baseOk = false;
    }
    check("baseCapacity oranı ∈ [0.10, 0.25]", baseOk);
    check("Karma kapasitesi sınırsız (Infinity)", RESOURCES.karma.baseCapacity === Infinity);
}

// ---------------------------------------------------------------------------
// C7 — Bonus ve pack orantı kuralları
// ---------------------------------------------------------------------------
section("C7: Bonus / pack orantı kuralları");
{
    const bLevels = BONUS_IDS.map((id) => BUILDINGS_DATA[id].bonusPerLevel);
    const uniform = bLevels.every((v) => Math.abs(v - bLevels[0]) < 1e-9);
    const inLevelRange = bLevels[0] >= 0.1 && bLevels[0] <= 0.2;
    check("Bonus oranları hepsinde eşit ve [0.10, 0.20]", uniform && inLevelRange, "%" + Math.round(bLevels[0] * 100));

    let bSlopeOk = true;
    for (const id of BONUS_IDS) {
        const d = BUILDINGS_DATA[id];
        const slope = d.costMultiplier / (1 + d.bonusPerLevel);
        if (slope < 1.05 || slope > 1.15) bSlopeOk = false;
    }
    check("Bonus costMultiplier, bonus etkisinden belirgin hızlı", bSlopeOk);

    const cbs = [];
    let cbOk = true;
    for (let i = 0; i < PRODUCER_IDS.length; i++) {
        const pid = PRODUCER_IDS[i];
        const bonus = BONUS_IDS[i];
        const cb = BUILDINGS_DATA[bonus].baseCost.karma / BUILDINGS_DATA[pid].baseCost.karma;
        cbs.push(cb);
        if (cb < 2.5 || cb > 4.0) cbOk = false;
    }
    check("Bonus karma tabanı / producer tabanı (c_b)", cbOk, cbs.map((v) => v.toFixed(2)).join(", "));

    let karmaShareOk = true;
    for (const id of BONUS_IDS) {
        const d = BUILDINGS_DATA[id];
        const total = Object.values(d.baseCost).reduce((a, b) => a + b, 0);
        const share = d.baseCost.karma / total;
        if (share < 0.5 || share > 0.85) karmaShareOk = false;
    }
    check("Bonus maliyetinde karma birincil (%50–85)", karmaShareOk);

    const packBases = Object.values(PACKS_DATA).map((d) => d.baseCost.bilgi);
    let hOk = true;
    for (let i = 1; i < packBases.length; i++) {
        const h = packBases[i] / packBases[i - 1];
        if (h < 2.5 || h > 3.5) hOk = false;
    }
    check("Pack taban maliyetleri geometrik H", hOk, packBases.join(" → "));

    let packSlopeOk = true;
    const CLICK_RATE = 2;
    for (const [id, d] of Object.entries(PACKS_DATA)) {
        let effective = 1;
        if (d.clickBonusPerLevel) effective = 1 + d.clickBonusPerLevel;
        else if (d.critChancePerLevel) effective = 1 + d.critChancePerLevel * 9;
        else if (d.autoClickPerLevel) effective = 1 + 1 / CLICK_RATE;
        else if (d.karmaBonusPerLevel) effective = 1 + d.karmaBonusPerLevel;
        const slope = d.costMultiplier / effective;
        if (slope < 1.05 || slope > 1.15) packSlopeOk = false;
    }
    check("Pack costMultiplier, efektif bonus etkisinden hızlı", packSlopeOk);
}

// ---------------------------------------------------------------------------
// C8 — Tıklama dengesi
// ---------------------------------------------------------------------------
section("C8: Tıklama dengesi");
{
    function clickValue(fountain, mansion, karmaPatronage, clickPower, critClick) {
        const mk = 1 + mansion * 0.15 + karmaPatronage * 0.1;
        const mc = 1 + clickPower * 0.1;
        const cv = (1 + 0.05 * fountain) * mk * mc;
        return cv * (1 + critClick * 0.02 * 9);
    }

    const pasifEarly = 1 * 0.4 * (1 + 0 * 0.15);
    const tikEarly = 2 * clickValue(1, 0, 0, 0, 0);
    const ratioEarly = pasifEarly / tikEarly;
    check("Erken oyun: pasif/tıklama < 1", ratioEarly < 1, ratioEarly.toFixed(2));

    const f = 25;
    const pasifLate =
        f * 0.4 * (1 + 10 * 0.15 + 5 * 0.1) +
        10 * clickValue(f, 10, 5, 20, 10);
    const tikLate = 2 * clickValue(f, 10, 5, 20, 10);
    const ratioLate = pasifLate / tikLate;
    check("Geç oyun: pasif > tıklama", ratioLate > 1, ratioLate.toFixed(2));
    check("Geç oyun: pasif aşırı değil (< 10x)", ratioLate < 10, ratioLate.toFixed(2) + "x");
}

// ---------------------------------------------------------------------------
// C9 — Pozitif ve sonlu değerler
// ---------------------------------------------------------------------------
section("C9: Pozitif ve sonlu değerler");
{
    let allFinite = true;
    function finite(v, where) {
        if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
            check("Sonlu pozitif değer: " + where, false, String(v));
            allFinite = false;
        }
    }
    for (const [id, d] of Object.entries(BUILDINGS_DATA)) {
        finite(d.costMultiplier, id + ".costMultiplier");
        if (d.type === "producer") {
            finite(d.production, id + ".production");
            if (d.outputResource !== "karma") finite(d.capacityPerUnit, id + ".capacityPerUnit");
        }
        if (d.type === "bonus") finite(d.bonusPerLevel, id + ".bonusPerLevel");
        for (const [r, amt] of Object.entries(d.baseCost)) finite(amt, id + ".baseCost." + r);
    }
    for (const [id, d] of Object.entries(PACKS_DATA)) {
        finite(d.costMultiplier, id + ".costMultiplier");
        for (const [r, amt] of Object.entries(d.baseCost)) finite(amt, id + ".baseCost." + r);
    }
    for (const [r, m] of Object.entries(RESOURCES)) {
        if (r === "karma") continue;
        finite(m.baseCapacity, r + ".baseCapacity");
    }
    check("Tüm sayısal alanlar pozitif ve sonlu (karma kapasitesi sınırsız)", allFinite);
}

// ---------------------------------------------------------------------------
// C10 — Zaman simülasyonu (hedef odaklı temsili oyuncu, kısa oturumlar)
// ---------------------------------------------------------------------------
section("C10: Zaman simülasyonu — son halkaya ulaşma");
{
    // Temsili oyuncu varsayımları:
    // - Oturum: günde 2 saat aktif tıklama (2 tık/sn) → ortalama tıklama 1/6 tık/sn
    // - Üreticiler zincir eşiğine kadar (N=5, son halka 1), bonuslar 3 seviye, paketler 3 seviye
    const AVG_CLICK = 2 * (2 / 24);
    const BONUS_CAP = 3;
    const PACK_CAP = 1;

    const bld = {};
    const pck = {};
    const res = {};
    for (const id of PRODUCER_IDS) bld[id] = 0;
    for (const id of BONUS_IDS) bld[id] = 0;
    for (const id of Object.keys(PACKS_DATA)) pck[id] = 0;
    for (const r of Object.keys(RESOURCES)) res[r] = 0;

    const producerCap = {};
    for (const id of PRODUCER_IDS) producerCap[id] = id === "silkWorkshop" ? 1 : 5;

    function outputMultiplier(r) {
        let sum = 1;
        for (const id of BONUS_IDS) {
            const d = BUILDINGS_DATA[id];
            if (d.targetResource === r) sum += bld[id] * d.bonusPerLevel;
        }
        for (const [id, d] of Object.entries(PACKS_DATA)) {
            if (d.targetResource === r && d.karmaBonusPerLevel) sum += pck[id] * d.karmaBonusPerLevel;
        }
        return sum;
    }

    function clickValue() {
        const mk = outputMultiplier("karma");
        const mc = 1 + pck.clickPower * 0.1;
        const cv = (1 + 0.05 * bld.fountain) * mk * mc;
        return cv * (1 + pck.critClick * 0.02 * 9);
    }

    function karmaRate() {
        const cv = clickValue();
        return AVG_CLICK * cv + bld.fountain * 0.4 * outputMultiplier("karma") + pck.autoClick * cv;
    }

    function getCapacity(r) {
        if (r === "karma") return Infinity;
        let cap = RESOURCES[r].baseCapacity;
        for (const id of PRODUCER_IDS) {
            const d = BUILDINGS_DATA[id];
            if (d.outputResource === r) cap += bld[id] * d.capacityPerUnit;
        }
        return cap;
    }

    function resourceRate(r) {
        if (r === "karma") return karmaRate();
        let base = 0;
        for (const id of PRODUCER_IDS) {
            const d = BUILDINGS_DATA[id];
            if (d.outputResource === r) base += bld[id] * d.production;
        }
        if (base === 0) return 0;
        const rate = base * outputMultiplier(r);
        if (res[r] >= getCapacity(r)) return 0;
        return rate;
    }

    function advance(dt) {
        for (const r of Object.keys(RESOURCES)) {
            const rate = resourceRate(r);
            if (rate <= 0) continue;
            if (r === "karma") res[r] += rate * dt;
            else res[r] = Math.min(getCapacity(r), res[r] + rate * dt);
        }
    }

    function timeToAfford(d, count) {
        const cost = getCost(d, count);
        let t = 0;
        for (const [r, need] of Object.entries(cost)) {
            const have = res[r];
            if (have >= need) continue;
            const rate = resourceRate(r);
            if (rate <= 0) return Infinity;
            t = Math.max(t, (need - have) / rate);
        }
        return t;
    }

    function buyBuilding(id) {
        const d = BUILDINGS_DATA[id];
        const cost = getCost(d, bld[id]);
        for (const [r, amt] of Object.entries(cost)) res[r] -= amt;
        bld[id]++;
    }

    function buyPack(id) {
        const d = PACKS_DATA[id];
        const cost = getCost(d, pck[id]);
        for (const [r, amt] of Object.entries(cost)) res[r] -= amt;
        pck[id]++;
    }

    const allItems = [
        ...BONUS_IDS.map((id) => ({ kind: "bonus", id, d: BUILDINGS_DATA[id] })),
        ...Object.keys(PACKS_DATA).map((id) => ({ kind: "pack", id, d: PACKS_DATA[id] })),
    ];

    function canBuyImmediate(it) {
        if (it.kind === "bonus" && bld[it.id] >= BONUS_CAP) return false;
        if (it.kind === "pack" && pck[it.id] >= PACK_CAP) return false;
        if (!getUnlock(it.d, bld, pck, res)) return false;
        const count = it.kind === "pack" ? pck[it.id] : bld[it.id];
        const cost = getCost(it.d, count);
        return Object.entries(cost).every(([r, amt]) => res[r] >= amt);
    }

    function getPrimaryTarget() {
        // Zincir başından itibaren ilk doldurulmamış üreticiyi hedefler:
        // önceki halkalar cap'e (N=5) ulaşmadan sonraki kilitli/erişilemez kalır.
        for (let i = 0; i < PRODUCER_IDS.length; i++) {
            const id = PRODUCER_IDS[i];
            if (bld[id] < producerCap[id]) return id;
        }
        return null;
    }

    function resourceUnlockWait() {
        const waits = [];
        for (const it of allItems) {
            const u = it.d.unlock;
            if (!u || u.type !== "resource") continue;
            const rate = resourceRate(u.id);
            if (rate <= 0) continue;
            const w = Math.max(0, (u.amount - res[u.id]) / rate);
            waits.push(w);
        }
        return waits.length ? Math.min(...waits) : Infinity;
    }

    function buySupportBatch() {
        let bought = true;
        while (bought) {
            bought = false;
            const item = allItems.find(canBuyImmediate);
            if (!item) break;
            if (item.kind === "pack") buyPack(item.id);
            else buyBuilding(item.id);
            buyCount[item.id] = (buyCount[item.id] || 0) + 1;
            bought = true;
        }
    }

    let t = 0;
    let steps = 0;
    let obstructed = false;
    const milestones = {};
    const buyCount = {};

    while (bld.silkWorkshop < 1 && steps < 2000000) {
        steps++;

        buySupportBatch();

        const target = getPrimaryTarget();
        if (!target) {
            obstructed = true;
            break;
        }
        const w = timeToAfford(BUILDINGS_DATA[target], bld[target]);
        if (!Number.isFinite(w)) {
            // Resource şartlı kilit yeniden tetiklenene kadar bekle (örn. çeşme)
            const wait = resourceUnlockWait();
            if (!Number.isFinite(wait) || wait <= 0) {
                obstructed = true;
                break;
            }
            advance(wait);
            t += wait;
            continue;
        }
        advance(w + 1e-9);
        t += w + 1e-9;

        buySupportBatch();

        // Hedef hâlâ karşılanıyorsa al (destekler hedefi geciktirebilir)
        const targetCost = getCost(BUILDINGS_DATA[target], bld[target]);
        const affordable = Object.entries(targetCost).every(([r, amt]) => res[r] >= amt);
        if (affordable) {
            buyBuilding(target);
            buyCount[target] = (buyCount[target] || 0) + 1;
            if (bld[target] === 1 && !milestones[target]) {
                milestones[target] = t;
            }
        }
        if (bld.silkWorkshop >= 1) break;
    }

    console.log("  Varsayımlar: günde 2 saat aktif tıklama (2/sn), üretici=5 (son halka 1), bonus=3, paket=1");
    console.log("  Milestone'lar (ilk üretici zamanı):");
    for (const id of PRODUCER_IDS) {
        console.log(
            "    " + id.padEnd(14) + (milestones[id] ? Math.round(milestones[id]) + " sn  (" + Math.round((milestones[id] / 86400) * 10) / 10 + " gün)" : "-")
        );
    }
    console.log("  Satın alım dağılımı: " + JSON.stringify(buyCount));

    if (obstructed) {
        check("Tıkanma yok (her adımda uygulanabilir hedef)", false, "adım " + steps + ", t=" + Math.round(t) + "sn");
    } else {
        check("Tıkanma yok (her adımda uygulanabilir hedef)", true, steps + " satın alım adımı");
    }

    const reached = bld.silkWorkshop >= 1;
    const tDays = t / 86400;
    check("İpek Atölyesi'ne ulaşıldı", reached, reached ? Math.round(tDays * 10) / 10 + " gün" : "ulaşılamadı");
    if (reached) {
        check("Son halkaya ulaşma süresi [2, 45] gün", tDays >= 2 && tDays <= 45, Math.round(tDays * 10) / 10 + " gün");
    } else {
        check("Son halkaya ulaşma süresi [2, 45] gün", false, "ulaşılamadı");
    }
}

// ---------------------------------------------------------------------------
// Özet rapor
// ---------------------------------------------------------------------------
section("Kural tablosu (genel aralıklar)");
{
    for (const [key, rule] of Object.entries(RULES)) {
        console.log("  - " + rule.name + ": " + rule.range);
    }
}

console.log("\n========================================");
console.log("SONUÇ: " + passes + " PASS, " + failures + " FAIL");
console.log("========================================");

if (failures > 0) {
    process.exitCode = 1;
}
