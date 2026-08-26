/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       DELTA GUNCELLEME MOTORU                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const { app, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");

const BUNDLED_ROOT = path.join(__dirname, "..");
const UPDATE_URL =
  process.env.PLUSH_UPDATE_URL || "https://karmaqq.github.io/plush-clicker/";
const VERSION_PATTERN = /^[A-Za-z0-9._-]+$/;
const FETCH_TIMEOUT_MS = 20000;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           YARDIMCI FONKSIYONLAR                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getUpdatesRoot() {
  return path.join(app.getPath("userData"), "hotupdate");
}

function safeJoin(root, rel) {
  const abs = path.resolve(root, rel);
  const normalizedRoot = path.resolve(root);
  if (abs !== normalizedRoot && !abs.startsWith(normalizedRoot + path.sep)) {
    return null;
  }
  return abs;
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

/* ─────────────────── Sha256 Hesaplayici ─────────────────── */
function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/* ─────────────────── Dosya Sha256 Hesaplayici ─────────────────── */
function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

/* ─────────────────── Etkin Dosya Bulucu ─────────────────── */
async function locateEffectiveFile(rel) {
  const version = getActiveVersion();
  if (version) {
    const overridePath = safeJoin(path.join(getUpdatesRoot(), version), rel);
    if (overridePath && fs.existsSync(overridePath)) return overridePath;
  }
  const bundledPath = safeJoin(BUNDLED_ROOT, rel);
  if (bundledPath && fs.existsSync(bundledPath)) return bundledPath;
  return null;
}

/* ─────────────────── Etkin Dosya Hash'i ─────────────────── */
async function hashEffectiveFile(rel) {
  const filePath = await locateEffectiveFile(rel);
  if (!filePath) return null;
  return sha256File(filePath);
}

/* ─────────────────── Guvenli Indirici ─────────────────── */
function isValidRelativePath(rel) {
  if (typeof rel !== "string" || rel.length === 0) return false;
  if (rel.includes("\\") || path.isAbsolute(rel)) return false;
  const normalized = path.posix.normalize(rel);
  return normalized !== ".." && !normalized.startsWith("../");
}

async function fetchBuffer(url, { retries = 2, retryDelayMs = 1000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`Indirme basarisiz (${res.status}): ${url}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        SURUM YONETIMI VE GERI ALMA                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getPointerPath() {
  return path.join(getUpdatesRoot(), "active.json");
}

function getMetaPath() {
  return path.join(getUpdatesRoot(), "meta.json");
}

/* ─────────────────── Aktif Surum Okuyucu ─────────────────── */
function getActiveVersion() {
  const pointer = readJsonFile(getPointerPath(), null);
  if (!pointer || typeof pointer.version !== "string") return null;
  if (!VERSION_PATTERN.test(pointer.version)) return null;
  const dir = path.join(getUpdatesRoot(), pointer.version);
  if (!fs.existsSync(dir)) return null;
  return pointer.version;
}

/* ─────────────────── Meta Okuyucu ─────────────────── */
function readMeta() {
  const meta = readJsonFile(getMetaPath(), null);
  if (meta && typeof meta === "object") {
    return {
      lastGood: typeof meta.lastGood === "string" ? meta.lastGood : null,
      launchesOnActive:
        typeof meta.launchesOnActive === "number" ? meta.launchesOnActive : 0,
    };
  }
  return { lastGood: null, launchesOnActive: 0 };
}

/* ─────────────────── Meta Yazici ─────────────────── */
function writeMeta(meta) {
  writeJsonFile(getMetaPath(), meta);
}

/* ─────────────────── Bundled'a Donus ─────────────────── */
function revertToBundled() {
  try {
    fs.rmSync(getPointerPath(), { force: true });
  } catch {}
}

/* ─────────────────── Kararlilik Bekcisi ─────────────────── */
function initStabilityGuard({ maxUnstableLaunches = 3, settleMs = 30000 } = {}) {
  const markSettled = () => {
    const active = getActiveVersion();
    if (!active) return;
    const meta = readMeta();
    if (meta.lastGood !== active || meta.launchesOnActive !== 0) {
      meta.lastGood = active;
      meta.launchesOnActive = 0;
      writeMeta(meta);
    }
  };
  const active = getActiveVersion();
  if (active) {
    const meta = readMeta();
    if (meta.lastGood !== active) {
      meta.launchesOnActive += 1;
      writeMeta(meta);
      if (meta.launchesOnActive > maxUnstableLaunches) {
        revertToBundled();
        meta.lastGood = null;
        meta.launchesOnActive = 0;
        writeMeta(meta);
      }
    }
    const timer = setTimeout(markSettled, settleMs);
    timer.unref?.();
  } else {
    markSettled();
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        GUNCELLEME ISLEMLERI                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Manifest Getirici ─────────────────── */
async function fetchRemoteManifest() {
  const url = `${UPDATE_URL.replace(/\/+$/, "")}/manifest.json`;
  const buffer = await fetchBuffer(`${url}?t=${Date.now()}`);
  let manifest;
  try {
    manifest = JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new Error("Manifest JSON olarak ayrıştırılamadı");
  }
  if (!manifest || typeof manifest.version !== "string") {
    throw new Error("Geçersiz manifest: sürüm alanı eksik");
  }
  if (!manifest.files || typeof manifest.files !== "object") {
    throw new Error("Geçersiz manifest: dosya listesi eksik");
  }
  for (const [rel, hash] of Object.entries(manifest.files)) {
    if (!isValidRelativePath(rel) || typeof hash !== "string") {
      throw new Error(`Geçersiz manifest girdisi: ${rel}`);
    }
  }
  console.log(`[update] remote manifest: v${manifest.version}, ${Object.keys(manifest.files).length} dosya`);
  return manifest;
}

/* ─────────────────── Guncelleme Denetleyici ─────────────────── */
async function checkForUpdate() {
  const remote = await fetchRemoteManifest();
  const currentVersion = getActiveVersion();
  const changedFiles = [];
  for (const [rel, hash] of Object.entries(remote.files)) {
    const localHash = await hashEffectiveFile(rel);
    if (localHash !== hash) changedFiles.push(rel);
  }
  const versionMismatch = currentVersion !== remote.version;
  const available = changedFiles.length > 0 || versionMismatch;
  if (changedFiles.length > 0) {
    console.log(`[update] ${changedFiles.length} dosya degisti:`, changedFiles.join(", "));
  }
  return {
    available,
    version: remote.version,
    current: currentVersion,
    changedFiles,
  };
}

/* ─────────────────── Guncelleme Uygulayici ─────────────────── */
async function applyUpdate(onProgress) {
  const report = (payload) => {
    if (typeof onProgress === "function") onProgress(payload);
  };
  const remote = await fetchRemoteManifest();
  if (!VERSION_PATTERN.test(remote.version)) {
    throw new Error(`Gecersiz surum: ${remote.version}`);
  }
  const changedFiles = [];
  for (const [rel, hash] of Object.entries(remote.files)) {
    const localHash = await hashEffectiveFile(rel);
    if (localHash !== hash) changedFiles.push(rel);
  }
  if (changedFiles.length === 0) {
    console.log("[update] degisiklik yok, atlaniyor");
    return { ok: true, version: remote.version, files: 0, skipped: true };
  }
  console.log(`[update] ${changedFiles.length} dosya indirilecek:`, changedFiles.join(", "));
  const updatesRoot = getUpdatesRoot();
  const stagingDir = path.join(updatesRoot, ".staging");
  let stagingCreated = false;
  try {
    await fsp.rm(stagingDir, { recursive: true, force: true });
    await fsp.mkdir(stagingDir, { recursive: true });
    stagingCreated = true;
    let done = 0;
    for (const rel of changedFiles) {
      const expectedHash = remote.files[rel];
      const url = `${UPDATE_URL.replace(/\/+$/, "")}/${rel.split("/").map(encodeURIComponent).join("/")}`;
      const startTime = Date.now();
      const buffer = await fetchBuffer(url);
      const elapsed = Date.now() - startTime;
      const actualHash = sha256Buffer(buffer);
      if (actualHash !== expectedHash) {
        throw new Error(`Hash dogrulamasi basarisiz: ${rel}`);
      }
      console.log(`[update] ${rel} indirildi (${buffer.length} bayt, ${elapsed}ms)`);
      const destPath = safeJoin(stagingDir, rel);
      if (!destPath) throw new Error(`Gecersiz hedef yolu: ${rel}`);
      await fsp.mkdir(path.dirname(destPath), { recursive: true });
      await fsp.writeFile(destPath, buffer);
      done += 1;
      report({ done, total: changedFiles.length, file: rel });
    }
    const targetDir = path.join(updatesRoot, remote.version);
    await fsp.rm(targetDir, { recursive: true, force: true });
    await fsp.rename(stagingDir, targetDir);
    stagingCreated = false;
    writeJsonFile(getPointerPath(), { version: remote.version });
    const meta = readMeta();
    meta.lastGood = null;
    meta.launchesOnActive = 0;
    writeMeta(meta);
    cleanupOldVersions(2);
    console.log(`[update] v${remote.version} basariyla uygulandi (${changedFiles.length} dosya)`);
    return { ok: true, version: remote.version, files: changedFiles.length };
  } catch (err) {
    console.error(`[update] hata: ${err.message}`);
    if (stagingCreated) {
      try { await fsp.rm(stagingDir, { recursive: true, force: true }); } catch {}
    }
    throw err;
  }
}

/* ─────────────────── Eski Surum Temizleyici ─────────────────── */
function cleanupOldVersions(keepLatest = 2) {
  const root = getUpdatesRoot();
  let entries;
  try { entries = fs.readdirSync(root); } catch { return; }
  const versions = entries
    .filter((d) => /^[0-9]+\.[0-9]+\.[0-9]+/.test(d))
    .sort()
    .reverse();
  const active = getActiveVersion();
  const toDelete = versions.filter((v) => v !== active).slice(keepLatest);
  for (const v of toDelete) {
    try { fs.rmSync(path.join(root, v), { recursive: true, force: true }); } catch {}
  }
}

/* ─────────────────── IPC Kaydedici ─────────────────── */
let isApplying = false;

function registerUpdaterIpc({ onApplySuccess }) {
  ipcMain.handle("updater:check", () => checkForUpdate());
  ipcMain.handle("updater:apply", async (event) => {
    if (isApplying) {
      throw new Error("Guncelleme zaten devam ediyor");
    }
    isApplying = true;
    try {
      const result = await applyUpdate((progress) => {
        event.sender.send("updater:progress", progress);
      });
      if (typeof onApplySuccess === "function") onApplySuccess(result);
      return result;
    } finally {
      isApplying = false;
    }
  });
}

module.exports = {
  BUNDLED_ROOT,
  UPDATE_URL,
  getUpdatesRoot,
  getActiveVersion,
  readMeta,
  writeMeta,
  revertToBundled,
  initStabilityGuard,
  checkForUpdate,
  applyUpdate,
  registerUpdaterIpc,
};
