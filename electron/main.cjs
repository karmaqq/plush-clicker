/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         ELEKTRON ANA SUREC                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const { app, BrowserWindow, Menu, protocol, net } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const updater = require("./updater.cjs");

const APP_ORIGIN = "app://bundle";
const BUNDLED_ROOT = updater.BUNDLED_ROOT;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

let mainWindow = null;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        APP PROTOCOL SERVISI                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Guvenli Yol Cozumleyici ─────────────────── */
function resolveWithin(rootDir, rel) {
  const abs = path.resolve(rootDir, rel);
  const normalizedRoot = path.resolve(rootDir);
  if (abs !== normalizedRoot && !abs.startsWith(normalizedRoot + path.sep)) {
    return null;
  }
  return fs.existsSync(abs) ? abs : null;
}

/* ─────────────────── Protokol Isleyici ─────────────────── */
function registerAppProtocol() {
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      pathname = url.pathname;
    }
    if (!pathname || pathname === "/" || pathname === "") {
      pathname = "/index.html";
    }
    const rel = pathname.replace(/^\/+/, "");
    const activeVersion = updater.getActiveVersion();
    let filePath = null;
    if (activeVersion) {
      filePath = resolveWithin(path.join(updater.getUpdatesRoot(), activeVersion), rel);
    }
    if (!filePath) {
      filePath = resolveWithin(BUNDLED_ROOT, rel);
    }
    if (!filePath) {
      return new Response("Not Found", { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          PENCERE YONETIMI                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Pencere Olusturucu ─────────────────── */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: "#141a21",
    title: "Plush Clicker",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.once("did-finish-load", () => {
    runDevHooks();
  });
  mainWindow.loadURL(`${APP_ORIGIN}/index.html`);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       GELISTIRICI/E2E KANCAALARI                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── E2E Kanca Calistirici ─────────────────── */
async function runDevHooks() {
  if (process.env.PLUSH_E2E !== "1" || !mainWindow) return;
  try {
    if (process.env.PLUSH_E2E_APPLY === "1") {
      const status = await updater.checkForUpdate();
      console.log("[e2e] check sonucu:", JSON.stringify(status));
      if (status && status.available) {
        const result = await updater.applyUpdate((p) => {
          console.log(`[e2e] indirildi ${p.done}/${p.total}: ${p.file}`);
        });
        console.log("[e2e] uygulandi:", JSON.stringify(result));
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 500);
        return;
      }
    }
    const marker = await mainWindow.webContents.executeJavaScript(
      "window.__PLUSH_PATCH_TEST === true"
    );
    console.log("[e2e] yama isareti:", marker);
    setTimeout(() => app.exit(0), 300);
  } catch (err) {
    console.error("[e2e] hata:", err.message);
    setTimeout(() => app.exit(1), 300);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            UYGULAMA BASLANGICI                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

app.whenReady().then(() => {
  app.setAppUserModelId("com.karmaqq.plushclicker");
  Menu.setApplicationMenu(null);
  registerAppProtocol();
  updater.initStabilityGuard();
  updater.registerUpdaterIpc({
    onApplySuccess: () => {
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 1200);
    },
  });
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
