/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         PRELOAD KOPRUSU                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("plushUpdater", {
  check: () => ipcRenderer.invoke("updater:check"),
  apply: () => ipcRenderer.invoke("updater:apply"),
  onProgress: (callback) => {
    const handler = (_event, progress) => callback(progress);
    ipcRenderer.on("updater:progress", handler);
    return () => ipcRenderer.removeListener("updater:progress", handler);
  },
});
