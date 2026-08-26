/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        GUNCELLEME BUTONU                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Guncelleme Butonu Olusturucu ─────────────────── */
export function createUpdateButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "update-btn";
  button.hidden = true;
  const bridge = typeof window !== "undefined" ? window.plushUpdater : null;
  if (!bridge) return button;
  bridge
    .check()
    .then((status) => {
      if (!status || !status.available) return;
      const cur = status.current ? `v${status.current}` : "v?";
      const nxt = `v${status.version}`;
      button.hidden = false;
      button.textContent = `\u2B07 ${nxt}`;
      button.title = `${cur} \u2192 ${nxt}\nGüncellemek için tıkla`;
    })
    .catch(() => {});
  button.addEventListener("click", async () => {
    if (button.dataset.busy) return;
    button.dataset.busy = "1";
    button.classList.add("busy");
    button.textContent = "İndiriliyor…";
    const stopProgress = bridge.onProgress((progress) => {
      button.textContent = `İndiriliyor ${progress.done}/${progress.total}`;
    });
    try {
      const result = await bridge.apply();
      stopProgress();
      if (result && result.ok) {
        button.textContent = "Yeniden başlatılıyor…";
      }
    } catch (err) {
      stopProgress();
      delete button.dataset.busy;
      button.classList.remove("busy");
      const msg = err?.message || "Bilinmeyen hata";
      button.textContent = `Başarısız: ${msg}`;
      button.title = msg;
      setTimeout(() => {
        button.hidden = true;
        button.textContent = "";
        button.title = "";
      }, 6000);
    }
  });
  return button;
}
