/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        ÇAĞ GEÇİŞ KONTROLÜ                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { canAdvanceEra, getEra, getEraName, ERA_DATA } from "./game-state.js";
import { isEraTransitioning } from "./state.js";
import { triggerEraTransition } from "./era-transition.js";

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
  desc.textContent = "Çağ " + currentEra + " (" + getEraName(currentEra) + ") hedeflerine ulaştınız. Sonraki çağa geçmek istiyor musunuz?";

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

/* ─────────────────── Era Prompt Sıfırlayıcı ─────────────────── */
export function resetEraPrompt() {
  eraPromptShown = false;
}
